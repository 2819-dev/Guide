"use server";

import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/server";
import { hasEducationAccess } from "@/lib/education-access";
import { parseLoginAs, type LoginAs } from "@/lib/login-roles";
import { ensureProfile } from "@/lib/profile";
import type { Role } from "@/lib/roles";

function destinationFor(as: LoginAs, role: Role, educationOk: boolean): string {
  switch (as) {
    case "educator":
      if (role === "rebbe" && educationOk) return "/education/panel";
      if (role === "admin") return "/education/panel";
      return "/education";
    case "official":
      if (role === "admin" || role === "moderator") return "/admin";
      return "/account";
    case "student":
      // School students study + join class from Account
      return "/account";
    case "family":
    default:
      if (role === "admin") return "/admin";
      if (role === "rebbe" && educationOk) return "/education/panel";
      return "/study";
  }
}

export async function signInWithEmail(
  _prev: { error: string } | null,
  formData: FormData,
) {
  const as = parseLoginAs(String(formData.get("as") ?? "family"));

  const { error } = await auth.signIn.email({
    email: String(formData.get("email") ?? ""),
    password: String(formData.get("password") ?? ""),
  });

  if (error) {
    return { error: error.message || "Could not sign in" };
  }

  const session = await ensureProfile();
  if (!session) redirect("/study");

  const role = session.profile.role as Role;
  const educationOk = await hasEducationAccess(session.profile);
  redirect(destinationFor(as, role, educationOk));
}
