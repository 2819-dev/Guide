/**
 * Guide Assistant: the AI side of live chat support, powered by Cloudflare
 * Workers AI. In production it uses the Pages "AI" binding (wrangler.toml), so
 * no API key is needed. Locally it can use the Workers AI REST API with
 * CLOUDFLARE_ACCOUNT_ID + CLOUDFLARE_AI_TOKEN. Returns null when neither is
 * available or the model fails, so the chat falls back to a person.
 */
import { APP_CATALOG, isAppAvailable } from "@/lib/apps";
import type { ChatMessage } from "@/lib/support-chat";

/** Active Workers AI chat model (not on Cloudflare's deprecation list). */
const DEFAULT_MODEL = "@cf/meta/llama-3.3-70b-instruct-fp8-fast";

type ChatTurn = { role: "system" | "user" | "assistant"; content: string };
type AiBinding = {
  run: (model: string, input: Record<string, unknown>) => Promise<unknown>;
};

/**
 * The Pages "AI" binding, read from the request context that
 * @cloudflare/next-on-pages stores on globalThis (same lookup as its
 * getRequestContext, without pulling Cloudflare's global types into the app).
 * Undefined under `next dev`.
 */
function aiBinding(): AiBinding | null {
  const ctx = (globalThis as Record<symbol, unknown>)[
    Symbol.for("__cloudflare-request-context__")
  ] as { env?: { AI?: AiBinding } } | undefined;
  return ctx?.env?.AI ?? null;
}

function restConfig() {
  const account = process.env.CLOUDFLARE_ACCOUNT_ID?.trim();
  const token = process.env.CLOUDFLARE_AI_TOKEN?.trim();
  return account && token ? { account, token } : null;
}

export function assistantConfigured(): boolean {
  return Boolean(aiBinding() || restConfig());
}

function appCatalogFacts(): string {
  const lines = APP_CATALOG.map((app) => {
    const status = isAppAvailable(app) ? "available" : "coming soon";
    const notes = app.helpNotes && isAppAvailable(app) ? ` ${app.helpNotes}` : "";
    return `- ${app.name} (${status}): ${app.description}${notes}`;
  });
  return lines.join("\n");
}

const GUIDE_FACTS = `You are Guide Assistant, the support assistant for Guide (guidelearning.org).

About Guide
- Guide is a learning platform for schools: one sign-in for every learning app a school uses. Students log in once and open the apps their classes use. Teachers and school administrators manage classes, rosters, and apps. Developers publish apps that schools can add to classes. Guide Officials (the Guide team) run the platform.
- Guide hosts many apps, and the catalog keeps growing. Treat each app as one part of Guide; most questions are about Guide itself (accounts, classes, logging in, finding apps).
- Public pages: For schools (/education), For developers (/developers), All apps (/apps), Terms (/terms), Privacy (/privacy), Accessibility (/accessibility).

Accounts and logging in (the "Log in" menu offers Student, Teachers, Developer, and Guide Official)
- Students: Log in > Student, choose their school, then enter their username and password. Students cannot create accounts; their teacher or school administrator creates them and shares the username and password.
- Student forgot password: on the password step, select "Forgot password?" and enter the username. The student's teachers are notified and set a new password. The Guide team cannot see or reset student passwords in chat.
- Teachers: the school administrator invites them by email, and the link in that email sets up the account. After that: Log in > Teachers. "Forgot password?" on the log-in page emails a reset link.
- School administrators: apply from For schools (/education). Applying creates the administrator's account; the Guide team reviews the application and emails a decision. Once approved, administrators create classes, add students, and invite teachers from the school portal. Schools can also request a meeting with the Guide team from For schools.
- Developers: For developers > sign up > submit an application (/developers/apply). The Guide team approves verified partners; approved apps can be added to classes by schools.
- Emails from Guide come from noreply@guidelearning.org. If an invite or reset email is missing, suggest checking spam or junk.

Using apps
- Teachers add apps to a class from their school portal. Students then find them under Apps in the student portal (tabs: Apps, Classes, Messages, Ideas, Account). Apps marked "Coming soon" cannot be opened yet.
- Apps currently in the Guide catalog:
${appCatalogFacts()}
- For detailed questions about how a specific app works that these notes don't cover, give brief general guidance and offer to connect them with the Guide team.

How to respond
- Be professional, warm, and concise: usually one to four short sentences, or a few numbered steps. Plain text only; no markdown headings, tables, or emoji. Many users are students, so use simple language.
- Only state facts about Guide that appear here or in the team notes below. If you are not sure, say so and offer to connect them with the Guide team. Never make up features, prices, dates, or policies.
- Never ask for or accept passwords, and don't ask students for personal information.
- You cannot view accounts, change settings, approve applications, reset passwords, or handle billing. For those, or anything you cannot resolve, hand the chat to the Guide team (see below).
- Hand the chat to the Guide team when the person asks for a person or agent, is frustrated or still stuck after your help, or raises an account-specific, billing, safety, privacy, or bug issue. To do that, write one short sentence saying a member of the Guide team will join this chat, then put this on its own final line: [[HANDOFF: one sentence for the team about what the person needs]]\n- Only use [[HANDOFF: ...]] when handing off. Never mention it or explain it to the person.
- Messages labeled "[Guide team: name]" were written earlier in this chat by a member of the Guide team; stay consistent with them.`;

export type AssistantReply = {
  text: string;
  transfer: { reason: string } | null;
};

/** Map stored chat history to model turns (must start and end with the user). */
function toTurns(history: ChatMessage[]): ChatTurn[] {
  const turns: ChatTurn[] = [];
  for (const m of history) {
    if (m.sender === "user") turns.push({ role: "user", content: m.body });
    else if (m.sender === "assistant") turns.push({ role: "assistant", content: m.body });
    else if (m.sender === "agent") {
      turns.push({
        role: "assistant",
        content: `[Guide team: ${m.authorName ?? "Guide team"}] ${m.body}`,
      });
    }
  }
  const recent = turns.slice(-20);
  while (recent.length && recent[0].role !== "user") recent.shift();
  return recent;
}

/** Workers AI returns { response } for most models, OpenAI-style choices for some. */
function replyText(result: unknown): string {
  const r = result as {
    response?: unknown;
    result?: { response?: unknown };
    choices?: { message?: { content?: unknown } }[];
  };
  const v = r?.response ?? r?.result?.response ?? r?.choices?.[0]?.message?.content;
  return typeof v === "string" ? v : "";
}

async function runModel(messages: ChatTurn[]): Promise<string | null> {
  const model = process.env.GUIDE_ASSISTANT_MODEL?.trim() || DEFAULT_MODEL;
  const input = { messages, max_tokens: 600, temperature: 0.3 };
  const binding = aiBinding();
  if (binding) return replyText(await binding.run(model, input));
  const rest = restConfig();
  if (!rest) return null;
  const base = process.env.CLOUDFLARE_AI_BASE_URL?.trim() || "https://api.cloudflare.com/client/v4";
  const res = await fetch(`${base}/accounts/${rest.account}/ai/run/${model}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${rest.token}`, "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!res.ok) {
    console.error("[guide-assistant] Workers AI HTTP", res.status);
    return null;
  }
  return replyText(await res.json());
}

const HANDOFF = /\[\[\s*HANDOFF\s*:?\s*([^\]]*)\]\]/i;

export async function askGuideAssistant(opts: {
  history: ChatMessage[];
  knowledge: string;
  visitor: { name: string | null; role: string | null; page: string | null };
}): Promise<AssistantReply | null> {
  const turns = toTurns(opts.history);
  if (!turns.length || turns[turns.length - 1].role !== "user") return null;

  const context = [
    opts.knowledge.trim()
      ? `Team notes from Guide Officials (trust these; they override the facts above):\n${opts.knowledge.trim()}`
      : "",
    `This chat: ${opts.visitor.name ? `signed in as ${opts.visitor.name}` : "not signed in"}${
      opts.visitor.role ? ` (${opts.visitor.role})` : ""
    }${opts.visitor.page ? `, started on page ${opts.visitor.page}` : ""}.`,
  ]
    .filter(Boolean)
    .join("\n\n");

  try {
    const raw = await runModel([
      { role: "system", content: `${GUIDE_FACTS}\n\n${context}` },
      ...turns,
    ]);
    if (!raw) return null;
    const match = raw.match(HANDOFF);
    const text = raw
      .replace(HANDOFF, "")
      .replace(/\*\*/g, "")
      .trim()
      .slice(0, 2000);
    const transfer = match
      ? { reason: (match[1] ?? "").trim().slice(0, 480) || "Asked for a person." }
      : null;
    if (!text && !transfer) return null;
    return { text, transfer };
  } catch (error) {
    console.error("[guide-assistant] request failed", error);
    return null;
  }
}
