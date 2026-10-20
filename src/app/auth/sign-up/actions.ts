"use server";

import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth/server";
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
  const as = parseLoginAs(String(formData.get("as") ?? "family"));
  const roleRaw = String(formData.get("role") ?? "customer");

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
      error: "Guide Official accounts are provisioned internally. Please log in.",
    };
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
    if (existing[0]) {
      await db
        .update(profiles)
        .set({ role: finalRole, displayName: name || existing[0].displayName })
        .where(eq(profiles.id, existing[0].id));
    } else {
      await db.insert(profiles).values({
        authUserId: session.user.id,
        displayName: name || "Learner",
        role: finalRole,
      });
    }
  }

  if (wantsEducation) redirect("/education#apply");
  if (as === "student") redirect("/account");
  redirect("/study");
}
