"use server";

import {
  isOfficialAdminEmail,
  officialRequiresInitialPasswordChange,
} from "@/lib/official-emails";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth/server";
import { getDb } from "@/lib/db";
import { parseLoginAs } from "@/lib/login-roles";
import { isRole, type Role } from "@/lib/roles";
import { profiles } from "@/lib/schema";
import { publicAmudLearnBase } from "@/lib/site";

export async function signUpWithEmail(
  _prev: { error: string } | null,
  formData: FormData,
) {
  const email = String(formData.get("email") ?? "").trim();
  const name = String(formData.get("name") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const as = parseLoginAs(String(formData.get("as") ?? "student"));
  const roleRaw = String(formData.get("role") ?? "customer");
  const schoolId = String(formData.get("schoolId") ?? "").trim() || null;

  // Public signup never creates admin/rebbe. Officials are staff-provisioned.
  // Educator path stays customer until school approval promotes to rebbe.
  let role: Role = "customer";
  if (roleRaw === "moderator" && as === "official") {
    role = "moderator";
  } else if (isRole(roleRaw) && roleRaw !== "admin" && roleRaw !== "rebbe") {
    role = roleRaw;
  }

  if (!email || !password || password.length < 8) {
    return { error: "Enter a valid email and a password of at least 8 characters." };
  }

  if (as === "official") {
    return {
      error: "Please log in with your Guide Official account.",
    };
  }

  // Teachers = login only via school invite. School admins use /education apply.
  if (as === "educator") {
    return {
      error:
        "Teacher accounts come from a school invite. School administrators can apply for their school from the For schools page.",
    };
  }

  if (as === "student") {
    return { error: "Student accounts are created by teachers. Ask your teacher for your username and password." };
  }

  const { data: signUpData, error } = await auth.signUp.email({
    email,
    name: name || "Learner",
    password,
  });

  if (error) {
    return {
      error: /exist|already/i.test(error.message ?? "")
        ? "An account with this email already exists. Log in instead."
        : "We couldn’t create your account. Check your details and try again.",
    };
  }

  // Use the user from signUp: getSession() would read this request's cookies,
  // which do not carry the session that was just created.
  const authUserId: string | undefined =
    signUpData?.user?.id ?? (await auth.getSession()).data?.user?.id;
  if (authUserId) {
    const db = getDb();
    let finalRole: Role = role;
    const emailLower = email.toLowerCase();
    const isOfficial = isOfficialAdminEmail(emailLower);
    if (isOfficial) {
      finalRole = "admin";
    }
    const forcePasswordChange =
      officialRequiresInitialPasswordChange(emailLower);
    const existing = await db
      .select()
      .from(profiles)
      .where(eq(profiles.authUserId, authUserId))
      .limit(1);

    if (existing[0]) {
      await db
        .update(profiles)
        .set({
          role: finalRole,
          displayName: name || existing[0].displayName,
          loginEmail: emailLower,
          schoolId: schoolId ?? existing[0].schoolId,
          ...(forcePasswordChange ? { mustChangePassword: true } : {}),
          updatedAt: new Date(),
        })
        .where(eq(profiles.id, existing[0].id));
    } else {
      await db
        .insert(profiles)
        .values({
          authUserId,
          displayName: name || (isOfficial ? "Guide Official" : "Learner"),
          role: finalRole,
          loginEmail: emailLower,
          schoolId,
          mustChangePassword: forcePasswordChange,
        });
    }

  }

  if (as === "developer") redirect("/developers/apply");
  if (as === "learner") redirect(publicAmudLearnBase());
  redirect("/apps");
}
