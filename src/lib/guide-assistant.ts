/**
 * Guide Assistant: the AI side of live chat support, powered by Claude.
 * Reads ANTHROPIC_API_KEY at request time; returns null when the key is
 * missing or the API fails so the chat can fall back to a person.
 */
import Anthropic from "@anthropic-ai/sdk";
import { APP_CATALOG, isAppAvailable } from "@/lib/apps";
import type { ChatMessage } from "@/lib/support-chat";

const MODEL = "claude-opus-5-5";

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
- You cannot view accounts, change settings, approve applications, reset passwords, or handle billing. For those, or anything you cannot resolve, use transfer_to_human.
- Call transfer_to_human when the person asks for a person or agent, is frustrated or still stuck after your help, or raises an account-specific, billing, safety, privacy, or bug issue. When you transfer, also write one short sentence saying a member of the Guide team will join this chat.
- Messages labeled "[Guide team: name]" were written earlier in this chat by a member of the Guide team; stay consistent with them.`;

const TRANSFER_TOOL: Anthropic.Beta.BetaTool = {
  name: "transfer_to_human",
  description:
    "Hand this chat to a human on the Guide team. Use when the person asks for a person, when the issue needs account access, billing, approvals, or a bug investigation, or when you cannot resolve it. The AI stops replying after this.",
  strict: true,
  input_schema: {
    type: "object",
    properties: {
      reason: {
        type: "string",
        description: "One sentence for the Guide team: what the person needs.",
      },
    },
    required: ["reason"],
    additionalProperties: false,
  },
};

export type AssistantReply = {
  text: string;
  transfer: { reason: string } | null;
};

export function assistantConfigured(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY?.trim());
}

/** Map stored chat history to Messages API turns (must start and end with the user). */
function toTurns(history: ChatMessage[]): Anthropic.Beta.BetaMessageParam[] {
  const turns: Anthropic.Beta.BetaMessageParam[] = [];
  for (const m of history) {
    if (m.sender === "system") continue;
    if (m.sender === "user") {
      turns.push({ role: "user", content: m.body });
    } else if (m.sender === "assistant") {
      turns.push({ role: "assistant", content: m.body });
    } else if (m.sender === "agent") {
      turns.push({
        role: "assistant",
        content: `[Guide team: ${m.authorName ?? "Guide team"}] ${m.body}`,
      });
    }
  }
  while (turns.length && turns[0].role !== "user") turns.shift();
  // Keep the request small: the last 30 turns are plenty for support chat.
  const recent = turns.slice(-30);
  while (recent.length && recent[0].role !== "user") recent.shift();
  return recent;
}

export async function askGuideAssistant(opts: {
  history: ChatMessage[];
  knowledge: string;
  visitor: { name: string | null; role: string | null; page: string | null };
}): Promise<AssistantReply | null> {
  const apiKey = process.env.ANTHROPIC_API_KEY?.trim();
  if (!apiKey) return null;

  const messages = toTurns(opts.history);
  if (!messages.length || messages[messages.length - 1].role !== "user") {
    return null;
  }

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

  const client = new Anthropic({ apiKey, maxRetries: 1, timeout: 45_000 });

  try {
    const response = await client.beta.messages.create({
      model: MODEL,
      max_tokens: 4000,
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
      output_config: { effort: "low" },
      // Stable facts first (cacheable), per-chat context after.
      system: [
        { type: "text", text: GUIDE_FACTS, cache_control: { type: "ephemeral" } },
        { type: "text", text: context },
      ],
      tools: [TRANSFER_TOOL],
      tool_choice: { type: "auto" },
      messages,
    });

    if (response.stop_reason === "refusal") {
      return {
        text: "I can't help with that here, but I can connect you with a member of the Guide team.",
        transfer: null,
      };
    }

    let text = "";
    let transfer: AssistantReply["transfer"] = null;
    for (const block of response.content) {
      if (block.type === "text") {
        text += block.text;
      } else if (block.type === "tool_use" && block.name === "transfer_to_human") {
        const input = block.input as { reason?: unknown };
        transfer = {
          reason:
            typeof input?.reason === "string" && input.reason.trim()
              ? input.reason.trim().slice(0, 480)
              : "Asked for a person",
        };
      }
    }
    text = text.trim();
    if (!text && !transfer) return null;
    return { text, transfer };
  } catch (error) {
    if (error instanceof Anthropic.AuthenticationError) {
      console.error("[guide-assistant] ANTHROPIC_API_KEY was rejected");
    } else if (error instanceof Anthropic.RateLimitError) {
      console.error("[guide-assistant] rate limited");
    } else if (error instanceof Anthropic.APIError) {
      console.error("[guide-assistant] API error", error.status, error.message);
    } else {
      console.error("[guide-assistant] request failed", error);
    }
    return null;
  }
}
