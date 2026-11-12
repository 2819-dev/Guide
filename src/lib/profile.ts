import { eq, or } from "drizzle-orm";
import { auth } from "@/lib/auth/server";
import { getDb } from "@/lib/db";
import {
  isOfficialAdminEmail,
  officialRequiresInitialPasswordChange,
} from "@/lib/official-emails";
import { isRole, type Role } from "@/lib/roles";
import { profiles } from "@/lib/schema";

export type Profile = typeof profiles.$inferSelect;

export async function getSessionUser() {
  const { data: session } = await auth.getSession();
  return session?.user ?? null;
}

export async function ensureProfile(opts?: {
  preferredRole?: Role;
  schoolId?: string | null;
  badgeCode?: string | null;
  loginEmail?: string | null;
  badgeAuthUserId?: string | null;
}): Promise<{
  user: NonNullable<Awaited<ReturnType<typeof getSessionUser>>>;
  profile: Profile;
} | null> {
  const user = await getSessionUser();
  if (!user?.id) return null;

  const db = getDb();
  const existing = await db
    .select()
    .from(profiles)
    .where(
      or(
        eq(profiles.authUserId, user.id),
        eq(profiles.badgeAuthUserId, user.id),
      ),
    )
    .limit(1);

  if (existing[0]) {
    const patch: Partial<Profile> = {};

    // Promote product Official emails to admin if needed
    if (isOfficialAdminEmail(user.email) && existing[0].role !== "admin") {
      patch.role = "admin";
      if (officialRequiresInitialPasswordChange(user.email)) {
        // Cleared after successful change-password; not re-set every login.
        patch.mustChangePassword = true;
      }
    }

    if (opts?.schoolId && !existing[0].schoolId) {
      patch.schoolId = opts.schoolId;
    }
    if (opts?.badgeCode && !existing[0].badgeCode) {
      patch.badgeCode = opts.badgeCode;
    }
    if (opts?.loginEmail && !existing[0].loginEmail) {
      patch.loginEmail = opts.loginEmail;
    } else if (user.email && !existing[0].loginEmail) {
      patch.loginEmail = user.email.toLowerCase();
    }
    if (opts?.badgeAuthUserId && !existing[0].badgeAuthUserId) {
      patch.badgeAuthUserId = opts.badgeAuthUserId;
    }
    if (Object.keys(patch).length > 0) {
      const [updated] = await db
        .update(profiles)
        .set({ ...patch, updatedAt: new Date() })
        .where(eq(profiles.id, existing[0].id))
        .returning();
      return { user, profile: updated };
    }
    return { user, profile: existing[0] };
  }

  let role: Role = opts?.preferredRole ?? "customer";
  if (isOfficialAdminEmail(user.email)) {
    role = "admin";
  } else if (opts?.preferredRole && isRole(opts.preferredRole)) {
    role = opts.preferredRole;
  }

  const [created] = await db
    .insert(profiles)
    .values({
      authUserId: user.id,
      displayName: user.name?.trim() || (isOfficialAdminEmail(user.email) ? "Guide Official" : "Learner"),
      role,
      schoolId: opts?.schoolId ?? null,
      badgeCode: opts?.badgeCode ?? null,
      loginEmail: opts?.loginEmail ?? user.email?.toLowerCase() ?? null,
      badgeAuthUserId: opts?.badgeAuthUserId ?? null,
      mustChangePassword: officialRequiresInitialPasswordChange(user.email),
    })
    .returning();

  return { user, profile: created };
}

export async function requireProfile(roles?: Role[]) {
  const result = await ensureProfile();
  if (!result) return null;
  if (roles && !roles.includes(result.profile.role as Role)) return null;
  return result;
}

export async function clearMustChangePassword(profileId: string) {
  const db = getDb();
  await db
    .update(profiles)
    .set({ mustChangePassword: false, updatedAt: new Date() })
    .where(eq(profiles.id, profileId));
}
