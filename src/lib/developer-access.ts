import { and, eq } from "drizzle-orm";
import { getDb } from "@/lib/db";
import type { Profile } from "@/lib/profile";
import { developerApplications, developerApps } from "@/lib/schema";
import type { Role } from "@/lib/roles";

export type DeveloperAccessStatus =
  | "none"
  | "pending"
  | "approved"
  | "rejected";

/** Approved developer partners can open the developer portal. Official always can. */
export async function hasDeveloperAccess(profile: Profile): Promise<boolean> {
  const role = profile.role as Role;
  if (role === "admin" || role === "moderator") return true;

  const db = getDb();
  const [approved] = await db
    .select({ id: developerApplications.id })
    .from(developerApplications)
    .where(
      and(
        eq(developerApplications.applicantProfileId, profile.id),
        eq(developerApplications.status, "approved"),
      ),
    )
    .limit(1);

  return Boolean(approved);
}

export async function getDeveloperStatus(profileId: string): Promise<{
  status: DeveloperAccessStatus;
  appName?: string;
  organization?: string;
}> {
  const db = getDb();
  const rows = await db
    .select()
    .from(developerApplications)
    .where(eq(developerApplications.applicantProfileId, profileId));

  if (!rows.length) return { status: "none" };
  const approved = rows.find((r) => r.status === "approved");
  if (approved) {
    return {
      status: "approved",
      appName: approved.appName,
      organization: approved.organization,
    };
  }
  const pending = rows.find((r) => r.status === "pending");
  if (pending) {
    return {
      status: "pending",
      appName: pending.appName,
      organization: pending.organization,
    };
  }
  const rejected = rows.find((r) => r.status === "rejected");
  return {
    status: "rejected",
    appName: rejected?.appName,
    organization: rejected?.organization,
  };
}

export async function listDeveloperOwnedApps(profileId: string) {
  const db = getDb();
  return db
    .select()
    .from(developerApps)
    .where(eq(developerApps.ownerProfileId, profileId));
}
