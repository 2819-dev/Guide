import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth/server";
import { getDb } from "@/lib/db";
import { isRole, type Role } from "@/lib/roles";
import { profiles } from "@/lib/schema";

export type Profile = typeof profiles.$inferSelect;

const OWNER_ADMIN_EMAIL = "admin@bighappysmiley.com";

export async function getSessionUser() {
  const { data: session } = await auth.getSession();
  return session?.user ?? null;
}

export async function ensureProfile(opts?: {
  preferredRole?: Role;
}): Promise<{ user: NonNullable<Awaited<ReturnType<typeof getSessionUser>>>; profile: Profile } | null> {
  const user = await getSessionUser();
  if (!user?.id) return null;

  const db = getDb();
  const existing = await db
    .select()
    .from(profiles)
    .where(eq(profiles.authUserId, user.id))
    .limit(1);

  if (existing[0]) {
    // Promote product owner to admin if needed
    if (
      user.email?.toLowerCase() === OWNER_ADMIN_EMAIL &&
      existing[0].role !== "admin"
    ) {
      const [updated] = await db
        .update(profiles)
        .set({ role: "admin", updatedAt: new Date() })
        .where(eq(profiles.id, existing[0].id))
        .returning();
      return { user, profile: updated };
    }
    return { user, profile: existing[0] };
  }

  let role: Role = opts?.preferredRole ?? "customer";
  if (user.email?.toLowerCase() === OWNER_ADMIN_EMAIL) {
    role = "admin";
  } else if (opts?.preferredRole && isRole(opts.preferredRole)) {
    role = opts.preferredRole;
  }

  const [created] = await db
    .insert(profiles)
    .values({
      authUserId: user.id,
      displayName: user.name?.trim() || "Learner",
      role,
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
