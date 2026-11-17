import { NextResponse } from "next/server";
import { z } from "zod";
import { askGuideAssistant } from "@/lib/guide-assistant";
import { sendChatHandoffEmail } from "@/lib/email";
import { OFFICIAL_ADMIN_EMAILS } from "@/lib/official-emails";
import { ensureProfile } from "@/lib/profile";
import { isRole, roleLabel } from "@/lib/roles";
import {
  addMessage,
  createChat,
  getChatForVisitor,
  getChatSettings,
  listMessages,
  newVisitorToken,
  updateChat,
  type ChatRecord,
  type ChatSettings,
} from "@/lib/support-chat";

export const runtime = "edge";

/** After this many AI answers in one chat, a person takes over. */
const MAX_AI_REPLIES = 25;
const MAX_USER_MESSAGES = 80;

const NO_AI_REPLY =
  "I'm unable to answer right now, so I've connected you with the Guide team.";

async function visitorInfo() {
  try {
    const result = await ensureProfile();
    if (!result) return { profileId: null, name: null, role: null };
    const role = result.profile.role;
    return {
      profileId: result.profile.id,
      name: result.profile.displayName ?? null,
      role: isRole(role) ? roleLabel(role) : null,
    };
  } catch {
    return { profileId: null, name: null, role: null };
  }
}

async function handOff(
  chat: ChatRecord,
  settings: ChatSettings,
  reason: string,
  preview: string,
) {
  if (chat.status === "waiting" || chat.status === "agent") return;
  await updateChat(chat.id, { status: "waiting", handoffReason: reason });
  await addMessage(chat.id, "system", settings.offlineMessage);
  const to = (
    settings.notifyEmails.trim()
      ? settings.notifyEmails.split(/[\s,;]+/)
      : OFFICIAL_ADMIN_EMAILS.filter((e) => e.endsWith("@guidelearning.org"))
  )
    .map((e) => e.trim())
    .filter((e) => /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(e));
  if (to.length) {
    await sendChatHandoffEmail({
      to,
      visitor: chat.visitorName ?? "A visitor",
      reason,
      preview: preview.slice(0, 280),
    }).catch((e) => console.error("[chat] handoff email", e));
  }
}

async function snapshot(chat: ChatRecord, after = 0) {
  const fresh = (await getChatForVisitor(chat.id, chat.token)) ?? chat;
  return {
    chatId: fresh.id,
    token: fresh.token,
    status: fresh.status,
    agentName: fresh.agentName,
    messages: await listMessages(fresh.id, after),
  };
}

/** GET ?chatId&token&after → new messages; GET alone → widget config. */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const chatId = url.searchParams.get("chatId");
  const token = url.searchParams.get("token") ?? "";
  try {
    if (!chatId) {
      const s = await getChatSettings();
      return NextResponse.json({ greeting: s.greeting, aiEnabled: s.aiEnabled });
    }
    const chat = await getChatForVisitor(chatId, token);
    if (!chat) return NextResponse.json({ error: "Chat not found" }, { status: 404 });
    const after = Number(url.searchParams.get("after") ?? 0) || 0;
    return NextResponse.json(await snapshot(chat, after));
  } catch (error) {
    console.error("[chat] GET", error);
    return NextResponse.json({ error: "Chat is temporarily unavailable" }, { status: 500 });
  }
}

const bodySchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("send"),
    chatId: z.string().optional(),
    token: z.string().optional(),
    body: z.string().trim().min(1).max(2000),
    page: z.string().max(300).optional(),
    after: z.number().int().min(0).optional(),
  }),
  z.object({
    action: z.literal("human"),
    chatId: z.string(),
    token: z.string(),
    after: z.number().int().min(0).optional(),
  }),
  z.object({
    action: z.literal("email"),
    chatId: z.string(),
    token: z.string(),
    email: z.string().trim().email().max(200),
  }),
]);

export async function POST(request: Request) {
  let input: z.infer<typeof bodySchema>;
  try {
    input = bodySchema.parse(await request.json());
  } catch {
    return NextResponse.json({ error: "Enter a message to send." }, { status: 400 });
  }

  try {
    const settings = await getChatSettings();

    if (input.action === "email") {
      const chat = await getChatForVisitor(input.chatId, input.token);
      if (!chat) return NextResponse.json({ error: "Chat not found" }, { status: 404 });
      await updateChat(chat.id, { contactEmail: input.email });
      return NextResponse.json({ ok: true });
    }

    if (input.action === "human") {
      const chat = await getChatForVisitor(input.chatId, input.token);
      if (!chat) return NextResponse.json({ error: "Chat not found" }, { status: 404 });
      const history = await listMessages(chat.id);
      const lastUser = [...history].reverse().find((m) => m.sender === "user");
      await handOff(chat, settings, "Asked to talk to a person.", lastUser?.body ?? "");
      return NextResponse.json(await snapshot(chat, input.after ?? 0));
    }

    // send
    let chat: ChatRecord | null = null;
    if (input.chatId && input.token) {
      chat = await getChatForVisitor(input.chatId, input.token);
    }
    if (!chat) {
      const who = await visitorInfo();
      const token = newVisitorToken();
      const id = await createChat({
        token,
        profileId: who.profileId,
        visitorName: who.name,
        visitorRole: who.role,
        page: input.page ?? null,
      });
      chat = (await getChatForVisitor(id, token))!;
    }

    const history = await listMessages(chat.id);
    if (history.filter((m) => m.sender === "user").length >= MAX_USER_MESSAGES) {
      return NextResponse.json(
        { error: "This conversation has reached its limit. Please start a new chat." },
        { status: 429 },
      );
    }

    if (chat.status === "closed") {
      await updateChat(chat.id, { status: settings.aiEnabled ? "ai" : "waiting" });
      chat = { ...chat, status: settings.aiEnabled ? "ai" : "waiting" };
    }
    await addMessage(chat.id, "user", input.body);

    if (chat.status === "ai") {
      if (!settings.aiEnabled) {
        await handOff(chat, settings, "Guide Assistant is off; needs a person.", input.body);
      } else if (chat.aiReplies >= MAX_AI_REPLIES) {
        await handOff(chat, settings, "Long chat; Guide Assistant handed off.", input.body);
      } else {
        const reply = await askGuideAssistant({
          history: await listMessages(chat.id),
          knowledge: settings.knowledge,
          visitor: { name: chat.visitorName, role: chat.visitorRole, page: chat.page },
        });
        if (!reply) {
          await addMessage(chat.id, "assistant", NO_AI_REPLY, "Guide Assistant");
          await handOff(chat, settings, "Guide Assistant was unavailable.", input.body);
        } else {
          if (reply.text) {
            await addMessage(chat.id, "assistant", reply.text, "Guide Assistant");
          }
          if (reply.transfer) {
            await handOff(chat, settings, reply.transfer.reason, input.body);
          }
        }
      }
    }

    return NextResponse.json(await snapshot(chat, input.after ?? 0));
  } catch (error) {
    console.error("[chat] POST", error);
    return NextResponse.json(
      { error: "Chat is temporarily unavailable. Please try again in a moment." },
      { status: 500 },
    );
  }
}
