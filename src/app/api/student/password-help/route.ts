import { NextResponse } from "next/server";
import { z } from "zod";
import { sendPasswordHelpEmail } from "@/lib/email";
import { requestPasswordHelp } from "@/lib/student-accounts";

export const runtime = "edge";

const body = z.object({
  schoolId: z.string().uuid(),
  username: z.string().trim().min(1).max(254),
});

/**
 * Student "forgot password": records a request for the student's teachers
 * and emails them. Always answers the same way, so it can't be used to
 * check which usernames exist.
 */
export async function POST(request: Request) {
  const parsed = body.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Enter your username." }, { status: 400 });
  }
  try {
    const result = await requestPasswordHelp(parsed.data.schoolId, parsed.data.username);
    if (result.created && result.student) {
      await Promise.allSettled(
        result.teachers
          .filter((t) => t.loginEmail && t.loginEmail.includes("@"))
          .map((t) =>
            sendPasswordHelpEmail({
              to: t.loginEmail!,
              teacherName: t.displayName,
              studentName: result.student!.displayName,
              username: parsed.data.username.trim().toLowerCase(),
            }),
          ),
      );
    }
  } catch (e) {
    console.error("password-help", e);
  }
  return NextResponse.json({ ok: true });
}
