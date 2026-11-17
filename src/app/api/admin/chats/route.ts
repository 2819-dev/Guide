import { NextResponse } from "next/server";
import { z } from "zod";
import { assistantConfigured } from "@/lib/guide-assistant";
import { requireProfile } from "@/lib/profile";
import {
  addMessage,
  deleteChat,
  getChat,
  getChatSettings,
  listChats,
  listMessages,
  saveChatSettings,
  updateChat,
} from "@/lib/support-chat";

export const runtime = "edge";

async function official() {
  try {
    return await requireProfile(["admin", "moderator"]);
  } catch {
    return null;
  }
}

const forbidden = () =>
  NextResponse.json({ error: "Guide Official access required" }, { status: 403 });

/** GET → chat list + settings; GET ?id → one conversation (marks it seen). */
export async function GET(request: Request) {
  const authz = await official();
  if (!authz) return forbidden();
  const id = new URL(request.url).searchParams.get("id");
  if (id) {
    const chat = await getChat(id);
    if (!chat) return NextResponse.json({ error: "Chat not found" }, { status: 404 });
    await updateChat(id, { agentSeen: true });
    const { token: _token, ...safe } = chat;
    void _token;
    return NextResponse.json({ chat: safe, messages: await listMessages(id) });
  }
  const [chats, settings] = await Promise.all([listChats(), getChatSettings()]);
  return NextResponse.json({
    chats,
    settings,
    aiConfigured: assistantConfigured(),
    canEditSettings: authz.profile.role === "admin",
  });
}

const actionSchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("reply"),
    chatId: z.string(),
    body: z.string().trim().min(1).max(4000),
  }),
  z.object({
    action: z.literal("status"),
    chatId: z.string(),
    status: z.enum(["ai", "agent", "closed"]),
  }),
]);

export async function POST(request: Request) {
  const authz = await official();
  if (!authz) return forbidden();
  let input: z.infer<typeof actionSchema>;
  try {
    input = actionSchema.parse(await request.json());
  } catch {
    return NextResponse.json({ error: "Type a reply first." }, { status: 400 });
  }
  const chat = await getChat(input.chatId);
  if (!chat) return NextResponse.json({ error: "Chat not found" }, { status: 404 });
  const first = (authz.profile.displayName ?? "").trim().split(/\s+/)[0] ?? "";
  const agentName = first && first.toLowerCase() !== "guide" ? first : "Guide team";

  if (input.action === "reply") {
    if (chat.status !== "agent") {
      await updateChat(chat.id, { status: "agent", agentName });
      await addMessage(chat.id, "system", `${agentName} joined the chat.`);
    }
    await addMessage(chat.id, "agent", input.body, agentName);
    await updateChat(chat.id, { agentSeen: true });
  } else if (input.status === "agent") {
    await updateChat(chat.id, { status: "agent", agentName });
    await addMessage(chat.id, "system", `${agentName} joined the chat.`);
  } else if (input.status === "ai") {
    await updateChat(chat.id, { status: "ai" });
    await addMessage(chat.id, "system", "Guide Assistant is back to help. Ask for a person any time.");
  } else {
    await updateChat(chat.id, { status: "closed" });
    await addMessage(chat.id, "system", "This chat was closed. Send a message to start again.");
  }
  return NextResponse.json({ ok: true });
}

const settingsSchema = z.object({
  aiEnabled: z.boolean(),
  greeting: z.string().trim().max(500),
  knowledge: z.string().max(8000),
  notifyEmails: z.string().max(500),
  offlineMessage: z.string().trim().max(500),
});

export async function PUT(request: Request) {
  const authz = await official();
  if (!authz || authz.profile.role !== "admin") return forbidden();
  try {
    const s = settingsSchema.parse(await request.json());
    await saveChatSettings(s);
    return NextResponse.json({ ok: true, settings: await getChatSettings() });
  } catch {
    return NextResponse.json({ error: "Check the settings and try again." }, { status: 400 });
  }
}

export async function DELETE(request: Request) {
  const authz = await official();
  if (!authz) return forbidden();
  const id = new URL(request.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
  await deleteChat(id);
  return NextResponse.json({ ok: true });
}
