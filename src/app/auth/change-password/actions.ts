"use server";

import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/server";
import {
  clearMustChangePassword,
  ensureProfile,
} from "@/lib/profile";

export async function changePasswordAction(
  _prev: { error: string } | null,
  formData: FormData,
) {
  const currentPassword = String(formData.get("currentPassword") ?? "");
  const newPassword = String(formData.get("newPassword") ?? "");
  const confirmPassword = String(formData.get("confirmPassword") ?? "");

  if (newPassword.length < 8) {
    return { error: "Your new password needs at least 8 characters." };
  }
  if (newPassword !== confirmPassword) {
    return { error: "The new passwords don’t match. Enter them again." };
  }
  if (newPassword === currentPassword) {
    return { error: "Choose a new password that is different from your current one." };
  }

  const session = await ensureProfile();
  if (!session) {
    redirect("/auth/sign-in?as=official");
  }

  const { error } = await auth.changePassword({
    currentPassword,
    newPassword,
    revokeOtherSessions: true,
  });

  if (error) {
    return {
      error: /invalid|incorrect|password/i.test(error.message ?? "")
        ? "Your current password is incorrect. Check it and try again."
        : "We couldn’t update your password. Try again in a moment.",
    };
  }

  await clearMustChangePassword(session.profile.id);

  if (session.profile.role === "admin" || session.profile.role === "moderator") {
    redirect("/official");
  }
  redirect("/account");
}
