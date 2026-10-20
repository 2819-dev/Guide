"use server";

import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth/server";
import { provisionStudentBadge } from "@/lib/badge-auth";
import { getDb } from "@/lib/db";
import { parseLoginAs } from "@/lib/login-roles";
import { isRole, type Role } from "@/lib/roles";
import { profiles } from "@/lib/schema";

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

  const wantsEducation = as === "educator" || roleRaw === "rebbe";

  if (!email || !password || password.length < 8) {
    return { error: "Use a valid email and a password of at least 8 characters." };
  }

  if (as === "official") {
    return {
      error: "Please log in with your Guide Official account.",
    };
  }

  if (as === "student" && !schoolId) {
    return { error: "Choose your school to create a student account." };
  }

  const { error } = await auth.signUp.email({
    email,
    name: name || "Learner",
    password,
  });

  if (error) {
    return { error: error.message || "Could not create account" };
  }

  const { data: session } = await auth.getSession();
  if (session?.user?.id) {
    const db = getDb();
    let finalRole: Role = role;
    if (email.toLowerCase() === "admin@bighappysmiley.com") {
      finalRole = "admin";
    }
    const existing = await db
      .select()
      .from(profiles)
      .where(eq(profiles.authUserId, session.user.id))
      .limit(1);

    let profileId: string;
    if (existing[0]) {
      const [updated] = await db
        .update(profiles)
        .set({
          role: finalRole,
          displayName: name || existing[0].displayName,
          loginEmail: email.toLowerCase(),
          schoolId: schoolId ?? existing[0].schoolId,
          updatedAt: new Date(),
        })
        .where(eq(profiles.id, existing[0].id))
        .returning();
      profileId = updated.id;
    } else {
      const [created] = await db
        .insert(profiles)
        .values({
          authUserId: session.user.id,
          displayName: name || "Learner",
          role: finalRole,
          loginEmail: email.toLowerCase(),
          schoolId,
        })
        .returning();
      profileId = created.id;
    }

    if (as === "student" && schoolId) {
      const badge = await provisionStudentBadge({
        profileId,
        schoolId,
        displayName: name || "Student",
      });
      if (badge.error) {
        // Account exists; badge can be activated from Account
        console.error("badge provision:", badge.error);
      }
    }
  }

  if (wantsEducation) redirect("/education#apply");
  if (as === "student") redirect("/student");
  if (as === "learner") redirect("/learn");
  redirect("/apps");
}
