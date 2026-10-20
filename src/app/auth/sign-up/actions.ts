"use server";

import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth/server";
import { getDb } from "@/lib/db";
import { isRole, type Role } from "@/lib/roles";
import { profiles } from "@/lib/schema";

export async function signUpWithEmail(
  _prev: { error: string } | null,
  formData: FormData,
) {
  const email = String(formData.get("email") ?? "").trim();
  const name = String(formData.get("name") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const roleRaw = String(formData.get("role") ?? "customer");
  // Rebbe access requires an approved school application — signup stays customer.
  const role: Role = roleRaw === "moderator" ? "moderator" : "customer";
  const wantsEducation = roleRaw === "rebbe";

  if (!email || !password || password.length < 8) {
    return { error: "Use a valid email and a password of at least 8 characters." };
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
    let finalRole: Role = isRole(role) ? role : "customer";
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
  redirect("/study");
}
