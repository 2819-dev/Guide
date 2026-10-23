"use server";

import { redirect } from "next/navigation";
import { and, eq } from "drizzle-orm";
import { auth } from "@/lib/auth/server";
import { badgeAuthEmail, normalizeBadgeCode } from "@/lib/badge";
import { getDb } from "@/lib/db";
import { hasDeveloperAccess } from "@/lib/developer-access";
import { hasEducationAccess } from "@/lib/education-access";
import { parseLoginAs, type LoginAs } from "@/lib/login-roles";
import { portalFor } from "@/lib/portals";
import { ensureProfile } from "@/lib/profile";
import type { Role } from "@/lib/roles";
import { isAmudSite, publicAmudLearnBase } from "@/lib/site";
import { profiles, schools } from "@/lib/schema";

function destinationFor(
  as: LoginAs,
  role: Role,
  educationOk: boolean,
  schoolId: string | null,
  badgeCode: string | null,
  developerOk: boolean,
): string {
  if (as === "learner" || isAmudSite()) {
    return publicAmudLearnBase();
  }
  if (as === "educator") {
    if (role === "admin") return "/official";
    // Approved = full tools; pending/declined = limited portal (same route).
    if (role === "rebbe" || educationOk) return "/teacher";
    return "/education";
  }
  if (as === "developer") {
    if (developerOk) return "/developer";
    return "/developers/apply";
  }
  const portal = portalFor({
    as,
    role,
    schoolId,
    badgeCode,
    educationOk,
    developerOk,
  });
  if (portal) return portal.href;
  if (role === "rebbe") return "/education";
  return "/apps";
}

export async function signInWithEmail(
  _prev: { error: string } | null,
  formData: FormData,
) {
  const as = parseLoginAs(String(formData.get("as") ?? "student"));
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
  if (!session) redirect(isAmudSite() ? publicAmudLearnBase() : "/apps");

  if (schoolId && session.profile.schoolId !== schoolId) {
    const db = getDb();
    await db
      .update(profiles)
      .set({ schoolId, updatedAt: new Date() })
      .where(eq(profiles.id, session.profile.id));
  }

  const role = session.profile.role as Role;
  const educationOk = await hasEducationAccess(session.profile);
  const developerOk = await hasDeveloperAccess(session.profile);
  redirect(
    destinationFor(
      as,
      role,
      educationOk,
      schoolId ?? session.profile.schoolId,
      session.profile.badgeCode,
      developerOk,
    ),
  );
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
        "We couldn’t find that badge for this school. Check the code or ask your teacher.",
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

  await ensureProfile();
  redirect("/student");
}
