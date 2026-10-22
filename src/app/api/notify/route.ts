import { NextResponse } from "next/server";
import { z } from "zod";
import { HOME_HERO_RELEASE_DATE } from "@/lib/brand";
import { sendReleaseNotifyEmail } from "@/lib/email";

export const runtime = "edge";

const schema = z.object({
  email: z.string().trim().email().max(254),
});

export async function POST(request: Request) {
  try {
    const body = schema.parse(await request.json());
    const email = body.email.toLowerCase();
    const result = await sendReleaseNotifyEmail({
      to: email,
      releaseDate: HOME_HERO_RELEASE_DATE,
    });
    if (!result.ok) {
      const msg = result.error || "Could not send";
      const clientIssue = /invalid|email|to field/i.test(msg);
      return NextResponse.json(
        {
          error: clientIssue
            ? "Enter a valid school or work email."
            : msg,
        },
        { status: clientIssue ? 400 : 502 },
      );
    }
    return NextResponse.json({
      ok: true,
      stubbed: Boolean(result.stubbed),
    });
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json(
        { error: e.issues[0]?.message ?? "Enter a valid email" },
        { status: 400 },
      );
    }
    return NextResponse.json({ error: "Could not subscribe" }, { status: 500 });
  }
}
