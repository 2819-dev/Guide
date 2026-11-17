"use server";

import { headers } from "next/headers";
import { auth } from "@/lib/auth/server";
import { parseLoginAs } from "@/lib/login-roles";
import { isStudentSyntheticEmail } from "@/lib/student-accounts";

async function siteOrigin(): Promise<string> {
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host");
  const proto = h.get("x-forwarded-proto") ?? (host?.startsWith("localhost") ? "http" : "https");
  if (host) return `${proto}://${host}`;
  return process.env.NEXT_PUBLIC_GUIDE_URL?.trim() || "https://guidelearning.org";
}

/**
 * Emails a password reset link (teachers, school administrators,
 * developers, Guide Official). Always answers the same way so the form
 * can't be used to find out which emails have accounts.
 */
export async function requestPasswordResetAction(
  _prev: { sent: boolean; error?: string } | null,
  formData: FormData,
): Promise<{ sent: boolean; error?: string }> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const as = parseLoginAs(String(formData.get("as") ?? "educator"));
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { sent: false, error: "Enter a valid email address." };
  }
  // Student logins are private usernames; their teachers reset them.
  if (isStudentSyntheticEmail(email)) return { sent: true };

  const redirectTo = `${await siteOrigin()}/auth/reset-password?as=${as}&email=${encodeURIComponent(email)}`;
  try {
    const { error } = await auth.requestPasswordReset({ email, redirectTo });
    if (error) console.error("request-password-reset:", error.message);
  } catch (e) {
    console.error("request-password-reset failed", e);
  }
  return { sent: true };
}
