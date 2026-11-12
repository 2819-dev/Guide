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
    return { error: "Use at least 8 characters for your new password." };
  }
  if (newPassword !== confirmPassword) {
    return { error: "New password and confirmation do not match." };
  }
  if (newPassword === currentPassword) {
    return { error: "Choose a new password that is different from the current one." };
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
      error: error.message || "Could not update password. Check your current password.",
    };
  }

  await clearMustChangePassword(session.profile.id);

  if (session.profile.role === "admin" || session.profile.role === "moderator") {
    redirect("/official");
  }
  redirect("/account");
}
