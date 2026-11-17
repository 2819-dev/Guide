"use server";

import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/server";
import { clearMustChangePassword, ensureProfile } from "@/lib/profile";

/**
 * Sets the new password from an emailed reset link, then signs the person
 * in. Signing in with the new password proves they own the account, so
 * the "must change password" gate is cleared — no second change needed.
 */
export async function resetPasswordAction(
  _prev: { error: string } | null,
  formData: FormData,
): Promise<{ error: string }> {
  const token = String(formData.get("token") ?? "");
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const as = String(formData.get("as") ?? "educator");
  const newPassword = String(formData.get("newPassword") ?? "");
  const confirm = String(formData.get("confirmPassword") ?? "");

  if (!token) {
    return { error: "This reset link is incomplete. Request a new link." };
  }
  if (newPassword.length < 8) {
    return { error: "Your new password needs at least 8 characters." };
  }
  if (newPassword !== confirm) {
    return { error: "The passwords don’t match. Enter them again." };
  }

  const { error } = await auth.resetPassword({ newPassword, token });
  if (error) {
    return /token|expired|invalid/i.test(error.message ?? "")
      ? { error: "This reset link has expired or was already used. Request a new one." }
      : { error: "We couldn’t reset your password. Request a new link and try again." };
  }

  let destination = `/auth/sign-in?as=${encodeURIComponent(as)}&reset=1`;
  if (email) {
    const signedIn = await auth.signIn.email({ email, password: newPassword });
    if (!signedIn.error) {
      const session = await ensureProfile({ user: signedIn.data?.user ?? null });
      if (session) {
        if (session.profile.mustChangePassword) {
          await clearMustChangePassword(session.profile.id);
        }
        const role = session.profile.role;
        destination =
          role === "admin" || role === "moderator"
            ? "/official"
            : role === "rebbe"
              ? "/education/panel"
              : as === "developer"
                ? "/developer"
                : "/";
      }
    }
  }
  redirect(destination);
}
