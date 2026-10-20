"use server";

import { redirect } from "next/navigation";
import { and, eq } from "drizzle-orm";
import { auth } from "@/lib/auth/server";
import { badgeAuthEmail, normalizeBadgeCode } from "@/lib/badge";
import { getDb } from "@/lib/db";
import { hasEducationAccess } from "@/lib/education-access";
import { parseLoginAs, type LoginAs } from "@/lib/login-roles";
import { ensureProfile } from "@/lib/profile";
import type { Role } from "@/lib/roles";
import { profiles, schools } from "@/lib/schema";

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
      return "/student";
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
  const schoolId = String(formData.get("schoolId") ?? "").trim() || null;

  const { error } = await auth.signIn.email({
    email: String(formData.get("email") ?? ""),
    password: String(formData.get("password") ?? ""),
  });

  if (error) {
    return { error: error.message || "Could not sign in" };
  }

  const session = await ensureProfile(
    schoolId ? { schoolId } : undefined,
  );
  if (!session) redirect("/study");

  if (schoolId && session.profile.schoolId !== schoolId) {
    const db = getDb();
    await db
      .update(profiles)
      .set({ schoolId, updatedAt: new Date() })
      .where(eq(profiles.id, session.profile.id));
  }

  const role = session.profile.role as Role;
  const educationOk = await hasEducationAccess(session.profile);
  redirect(destinationFor(as, role, educationOk));
}

export async function signInStudentBadge(
  _prev: { error: string } | null,
  formData: FormData,
) {
  const schoolId = String(formData.get("schoolId") ?? "").trim();
  const badgeCode = normalizeBadgeCode(String(formData.get("badgeCode") ?? ""));

  if (!schoolId || !badgeCode) {
    return { error: "Choose your school and enter a badge code." };
  }

  const db = getDb();
  const [school] = await db
    .select()
    .from(schools)
    .where(eq(schools.id, schoolId))
    .limit(1);
  if (!school) {
    return { error: "School not found." };
  }

  const [profile] = await db
    .select()
    .from(profiles)
    .where(
      and(eq(profiles.schoolId, schoolId), eq(profiles.badgeCode, badgeCode)),
    )
    .limit(1);

  if (!profile || !profile.badgeAuthUserId) {
    return {
      error:
        "We couldn’t find that badge for this school. Check the code or ask your Rebbe.",
    };
  }

  const email = badgeAuthEmail(school.slug, badgeCode);
  const { error } = await auth.signIn.email({
    email,
    password: badgeCode,
  });

  if (error) {
    return {
      error:
        error.message ||
        "Badge login didn’t work. Try again or use username and password.",
    };
  }

  const session = await ensureProfile();
  if (!session) redirect("/account");
  redirect("/account");
}
