"use server";

import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth/server";
import { getDb } from "@/lib/db";
import { hasDeveloperAccess } from "@/lib/developer-access";
import { hasEducationAccess } from "@/lib/education-access";
import { parseLoginAs, type LoginAs } from "@/lib/login-roles";
import { portalFor } from "@/lib/portals";
import { ensureProfile } from "@/lib/profile";
import type { Role } from "@/lib/roles";
import { isAmudSite, publicAmudLearnBase } from "@/lib/site";
import { profiles } from "@/lib/schema";

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

  const { data, error } = await auth.signIn.email({
    email: String(formData.get("email") ?? ""),
    password: String(formData.get("password") ?? ""),
  });

  if (error) {
    return { error: friendlyAuthError(error.message) };
  }

  const session = await ensureProfile({
    user: data?.user ?? null,
    schoolId,
  });
  if (!session) redirect(isAmudSite() ? publicAmudLearnBase() : "/apps");

  if (schoolId && session.profile.schoolId !== schoolId) {
    const db = getDb();
    await db
      .update(profiles)
      .set({ schoolId, updatedAt: new Date() })
      .where(eq(profiles.id, session.profile.id));
  }

  if (session.profile.mustChangePassword) {
    redirect("/auth/change-password");
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


function friendlyAuthError(message?: string): string {
  if (!message) return "Could not log in. Please try again.";
  if (/invalid (email|password)|credentials/i.test(message)) {
    return "That email and password don’t match. Check them and try again.";
  }
  return message;
}
