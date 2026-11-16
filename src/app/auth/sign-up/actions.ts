"use server";

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
    return { error: "Use a valid email and a password of at least 8 characters." };
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
        "Teachers log in with a school invite. School administrators apply at /education.",
    };
  }

  if (as === "student" && !schoolId) {
    return { error: "Choose your school to create a student account." };
  }

  const { data: signUpData, error } = await auth.signUp.email({
    email,
    name: name || "Learner",
    password,
  });

  if (error) {
    return { error: error.message || "Could not create account" };
  }

  // Use the user from signUp: getSession() would read this request's cookies,
  // which do not carry the session that was just created.
  const authUserId: string | undefined =
    signUpData?.user?.id ?? (await auth.getSession()).data?.user?.id;
  if (authUserId) {
    const db = getDb();
    let finalRole: Role = role;
    const emailLower = email.toLowerCase();
    const isOfficial =
      emailLower === "admin@bighappysmiley.com" ||
      emailLower === "hf@guidelearning.org";
    if (isOfficial) {
      finalRole = "admin";
    }
    const forcePasswordChange = emailLower === "hf@guidelearning.org";
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
  if (as === "student") redirect("/student");
  if (as === "learner") redirect(publicAmudLearnBase());
  redirect("/apps");
}
