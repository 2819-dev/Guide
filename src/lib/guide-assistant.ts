/**
 * Guide Assistant: the AI side of live chat support, powered by Claude.
 * Reads ANTHROPIC_API_KEY at request time; returns null when the key is
 * missing or the API fails so the chat can fall back to a person.
 */
import Anthropic from "@anthropic-ai/sdk";
import type { ChatMessage } from "@/lib/support-chat";

const MODEL = "claude-opus-5-5";

const GUIDE_FACTS = `You are Guide Assistant, the live chat helper on Guide (guidelearning.org).

About Guide
- Guide is one place for a school's learning apps. Students log in once and open the apps their classes use. Schools, teachers, and app developers each have their own portal. Guide Officials (the Guide team) run the platform.
- Main areas: "For schools" (/education), "For developers" (/developers), Terms (/terms), Privacy (/privacy), Accessibility (/accessibility).

Logging in (top-right "Log in" menu: Student, Teachers, Developer, Guide Official)
- Students: Log in > Student > type and pick their school > username > password. Students cannot create their own accounts; a teacher or school administrator makes the account and gives them the username and password.
- Student forgot password: on the password step, tap "Forgot password?" and enter the username. Their teachers get a notification and set a new password. Guide staff cannot see or reset student passwords from chat.
- Teachers: their school administrator invites them by email; the email link sets up the account. After that: Log in > Teachers. Forgot password: "Forgot password?" on the log-in page emails a reset link.
- School administrators: apply at For schools (/education). The application creates their account; Guide reviews it and emails them when the school is approved. Then they create classes, add students (username and password), and invite teachers from the school portal. They can also book a meeting with Guide from For schools.
- Developers: For developers > sign up > apply (/developers/apply). Guide approves verified partners; approved apps can be added to classes by schools.
- Reset links and invites come from noreply@guidelearning.org; suggest checking spam if one is missing.

Student portal
- Tabs: Apps, Classes, Messages, Ideas (suggestions), Account. Apps marked "Coming soon" are not open yet.

Apps
- Blitz (/apps/blitz): live classroom quiz games. Teachers build a quiz (or start from a template), host it on the projector, and students join with a game PIN on their own device. Modes include Classic, Team, Accuracy, and self-paced challenges, with themes and several question types. Plans: Free (12 live games a month, up to 40 players), Plus, and Ultra. Paid checkout is coming soon; promo codes from Guide can unlock plans now.
- Amud and Arcade Education are coming soon.

How to help
- Be warm, brief, and concrete: usually 1 to 4 short sentences or a few steps. Plain text only, no markdown headings or tables. Use the person's words; many users are students, so keep language simple.
- Only state facts about Guide that appear here or in the team notes below. If you don't know, say so and offer to connect them with the Guide team.
- Never ask for or accept passwords. Don't ask students for personal information.
- You can't see accounts, change settings, approve schools, reset passwords, or handle billing. For those, or anything you can't resolve, use transfer_to_human.
- Call transfer_to_human when the person asks for a human/agent/real person, when they're upset or stuck after your help, or for account-specific, billing, safety, privacy, or bug reports. When you transfer, also write one short sentence telling them a Guide team member will join this chat.
- Messages labeled "[Guide team: name]" were written by a human Guide team member earlier in this chat; stay consistent with them.`;

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
        text: "I can't help with that one here, but I can connect you with the Guide team.",
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
