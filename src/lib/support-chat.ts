/**
 * Live chat support: conversations between visitors, the Guide Assistant
 * (Claude), and Guide Officials. Tables are created at runtime like the other
 * newer Guide features (see drizzle/0017_support_chat.sql for the record).
 */
import { sql } from "drizzle-orm";
import { getDb } from "@/lib/db";

export type ChatStatus = "ai" | "waiting" | "agent" | "closed";
export type ChatSender = "user" | "assistant" | "agent" | "system";

export type ChatMessage = {
  id: number;
  sender: ChatSender;
  authorName: string | null;
  body: string;
  createdAt: string;
};

export type ChatSummary = {
  id: string;
  status: ChatStatus;
  visitorName: string | null;
  visitorRole: string | null;
  contactEmail: string | null;
  page: string | null;
  agentName: string | null;
  handoffReason: string | null;
  createdAt: string;
  lastMessageAt: string;
  lastMessage: string | null;
  unread: boolean;
};

export type ChatSettings = {
  aiEnabled: boolean;
  greeting: string;
  knowledge: string;
  notifyEmails: string;
  offlineMessage: string;
};

export const DEFAULT_CHAT_SETTINGS: ChatSettings = {
  aiEnabled: true,
  greeting:
    "Hi! I'm Guide Assistant. Ask me anything about Guide, logging in, classes, or Blitz. I can also get you a person from the Guide team.",
  knowledge: "",
  notifyEmails: "",
  offlineMessage:
    "Thanks! A Guide team member will reply here as soon as they can. You can close this window; your chat stays open on this device.",
};

let schemaReady: Promise<void> | null = null;

export function ensureSupportChatSchema(): Promise<void> {
  schemaReady ??= (async () => {
    const db = getDb();
    await db.execute(sql`CREATE TABLE IF NOT EXISTS support_chats (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      visitor_token varchar(64) NOT NULL,
      profile_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
      visitor_name varchar(120),
      visitor_role varchar(32),
      contact_email varchar(200),
      page varchar(300),
      status varchar(16) NOT NULL DEFAULT 'ai',
      agent_name varchar(120),
      handoff_reason varchar(500),
      ai_replies integer NOT NULL DEFAULT 0,
      agent_seen_at timestamptz,
      created_at timestamptz NOT NULL DEFAULT now(),
      last_message_at timestamptz NOT NULL DEFAULT now()
    )`);
    await db.execute(
      sql`CREATE INDEX IF NOT EXISTS support_chats_status_idx ON support_chats (status, last_message_at DESC)`,
    );
    await db.execute(sql`CREATE TABLE IF NOT EXISTS support_chat_messages (
      id bigserial PRIMARY KEY,
      chat_id uuid NOT NULL REFERENCES support_chats(id) ON DELETE CASCADE,
      sender varchar(16) NOT NULL,
      author_name varchar(120),
      body text NOT NULL,
      created_at timestamptz NOT NULL DEFAULT now()
    )`);
    await db.execute(
      sql`CREATE INDEX IF NOT EXISTS support_chat_messages_chat_idx ON support_chat_messages (chat_id, id)`,
    );
    await db.execute(sql`CREATE TABLE IF NOT EXISTS support_chat_settings (
      id integer PRIMARY KEY DEFAULT 1,
      ai_enabled boolean NOT NULL DEFAULT true,
      greeting text,
      knowledge text,
      notify_emails text,
      offline_message text,
      updated_at timestamptz NOT NULL DEFAULT now()
    )`);
  })().catch((e) => {
    schemaReady = null;
    throw e;
  });
  return schemaReady;
}

type Row = Record<string, unknown>;
function rows(result: unknown): Row[] {
  const r = result as { rows?: Row[] } | Row[];
  return Array.isArray(r) ? r : (r.rows ?? []);
}
const iso = (v: unknown) => (v instanceof Date ? v.toISOString() : String(v));

/* ---------- settings ---------- */

export async function getChatSettings(): Promise<ChatSettings> {
  await ensureSupportChatSchema();
  const [row] = rows(
    await getDb().execute(sql`SELECT * FROM support_chat_settings WHERE id = 1`),
  );
  if (!row) return { ...DEFAULT_CHAT_SETTINGS };
  return {
    aiEnabled: row.ai_enabled !== false,
    greeting: (row.greeting as string) || DEFAULT_CHAT_SETTINGS.greeting,
    knowledge: (row.knowledge as string) ?? "",
    notifyEmails: (row.notify_emails as string) ?? "",
    offlineMessage:
      (row.offline_message as string) || DEFAULT_CHAT_SETTINGS.offlineMessage,
  };
}

export async function saveChatSettings(s: ChatSettings): Promise<void> {
  await ensureSupportChatSchema();
  await getDb().execute(sql`
    INSERT INTO support_chat_settings (id, ai_enabled, greeting, knowledge, notify_emails, offline_message, updated_at)
    VALUES (1, ${s.aiEnabled}, ${s.greeting}, ${s.knowledge}, ${s.notifyEmails}, ${s.offlineMessage}, now())
    ON CONFLICT (id) DO UPDATE SET
      ai_enabled = EXCLUDED.ai_enabled,
      greeting = EXCLUDED.greeting,
      knowledge = EXCLUDED.knowledge,
      notify_emails = EXCLUDED.notify_emails,
      offline_message = EXCLUDED.offline_message,
      updated_at = now()`);
}

/* ---------- conversations ---------- */

export async function createChat(opts: {
  token: string;
  profileId: string | null;
  visitorName: string | null;
  visitorRole: string | null;
  page: string | null;
}): Promise<string> {
  await ensureSupportChatSchema();
  const [row] = rows(
    await getDb().execute(sql`
      INSERT INTO support_chats (visitor_token, profile_id, visitor_name, visitor_role, page)
      VALUES (${opts.token}, ${opts.profileId}, ${opts.visitorName}, ${opts.visitorRole}, ${opts.page})
      RETURNING id`),
  );
  return String(row.id);
}

export type ChatRecord = {
  id: string;
  token: string;
  status: ChatStatus;
  aiReplies: number;
  visitorName: string | null;
  visitorRole: string | null;
  contactEmail: string | null;
  page: string | null;
  agentName: string | null;
  handoffReason: string | null;
  createdAt: string;
};

function toRecord(row: Row): ChatRecord {
  return {
    id: String(row.id),
    token: String(row.visitor_token),
    status: row.status as ChatStatus,
    aiReplies: Number(row.ai_replies ?? 0),
    visitorName: (row.visitor_name as string) ?? null,
    visitorRole: (row.visitor_role as string) ?? null,
    contactEmail: (row.contact_email as string) ?? null,
    page: (row.page as string) ?? null,
    agentName: (row.agent_name as string) ?? null,
    handoffReason: (row.handoff_reason as string) ?? null,
    createdAt: iso(row.created_at),
  };
}

export async function getChat(id: string): Promise<ChatRecord | null> {
  await ensureSupportChatSchema();
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
  const [row] = rows(
    await getDb().execute(sql`SELECT * FROM support_chats WHERE id = ${id}`),
  );
  return row ? toRecord(row) : null;
}

/** Visitor access: the chat id plus the secret token kept in their browser. */
export async function getChatForVisitor(
  id: string,
  token: string,
): Promise<ChatRecord | null> {
  const chat = await getChat(id);
  if (!chat || !token || chat.token !== token) return null;
  return chat;
}

export async function listMessages(
  chatId: string,
  afterId = 0,
): Promise<ChatMessage[]> {
  await ensureSupportChatSchema();
  return rows(
    await getDb().execute(sql`
      SELECT id, sender, author_name, body, created_at FROM support_chat_messages
      WHERE chat_id = ${chatId} AND id > ${afterId}
      ORDER BY id ASC LIMIT 500`),
  ).map((r) => ({
    id: Number(r.id),
    sender: r.sender as ChatSender,
    authorName: (r.author_name as string) ?? null,
    body: String(r.body),
    createdAt: iso(r.created_at),
  }));
}

export async function addMessage(
  chatId: string,
  sender: ChatSender,
  body: string,
  authorName: string | null = null,
): Promise<void> {
  await ensureSupportChatSchema();
  const db = getDb();
  await db.execute(sql`
    INSERT INTO support_chat_messages (chat_id, sender, author_name, body)
    VALUES (${chatId}, ${sender}, ${authorName}, ${body})`);
  await db.execute(sql`
    UPDATE support_chats SET last_message_at = now(),
      ai_replies = ai_replies + ${sender === "assistant" ? 1 : 0}
    WHERE id = ${chatId}`);
}

export async function updateChat(
  chatId: string,
  patch: {
    status?: ChatStatus;
    agentName?: string | null;
    handoffReason?: string | null;
    contactEmail?: string | null;
    agentSeen?: boolean;
  },
): Promise<void> {
  await ensureSupportChatSchema();
  const db = getDb();
  if (patch.status !== undefined) {
    await db.execute(sql`UPDATE support_chats SET status = ${patch.status} WHERE id = ${chatId}`);
  }
  if (patch.agentName !== undefined) {
    await db.execute(sql`UPDATE support_chats SET agent_name = ${patch.agentName} WHERE id = ${chatId}`);
  }
  if (patch.handoffReason !== undefined) {
    await db.execute(sql`UPDATE support_chats SET handoff_reason = ${patch.handoffReason} WHERE id = ${chatId}`);
  }
  if (patch.contactEmail !== undefined) {
    await db.execute(sql`UPDATE support_chats SET contact_email = ${patch.contactEmail} WHERE id = ${chatId}`);
  }
  if (patch.agentSeen) {
    await db.execute(sql`UPDATE support_chats SET agent_seen_at = now() WHERE id = ${chatId}`);
  }
}

export async function deleteChat(chatId: string): Promise<void> {
  await ensureSupportChatSchema();
  await getDb().execute(sql`DELETE FROM support_chats WHERE id = ${chatId}`);
}

/** Official list view: newest activity first, with the last message preview. */
export async function listChats(): Promise<ChatSummary[]> {
  await ensureSupportChatSchema();
  return rows(
    await getDb().execute(sql`
      SELECT c.*, (
        SELECT body FROM support_chat_messages m
        WHERE m.chat_id = c.id AND m.sender = 'user' ORDER BY m.id DESC LIMIT 1
      ) AS last_message,
      EXISTS (
        SELECT 1 FROM support_chat_messages m
        WHERE m.chat_id = c.id AND m.sender = 'user'
          AND (c.agent_seen_at IS NULL OR m.created_at > c.agent_seen_at)
      ) AS unread
      FROM support_chats c
      WHERE c.last_message_at > now() - interval '60 days'
        AND EXISTS (SELECT 1 FROM support_chat_messages m WHERE m.chat_id = c.id AND m.sender = 'user')
      ORDER BY CASE c.status WHEN 'waiting' THEN 0 WHEN 'agent' THEN 1 WHEN 'ai' THEN 2 ELSE 3 END,
        c.last_message_at DESC
      LIMIT 200`),
  ).map((r) => ({
    ...toRecord(r),
    lastMessageAt: iso(r.last_message_at),
    lastMessage: (r.last_message as string) ?? null,
    unread: Boolean(r.unread),
  }));
}

export function newVisitorToken(): string {
  const bytes = new Uint8Array(24);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}
