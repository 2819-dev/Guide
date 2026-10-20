import { and, eq } from "drizzle-orm";
import { getDb } from "@/lib/db";
import type { Profile } from "@/lib/profile";
import { schoolApplications } from "@/lib/schema";
import type { Role } from "@/lib/roles";

/** Admins always have Education access. Rebbeim need an approved school application. */
export async function hasEducationAccess(profile: Profile): Promise<boolean> {
  const role = profile.role as Role;
  if (role === "admin") return true;
  if (role !== "rebbe") return false;

  const db = getDb();
  const [approved] = await db
    .select({ id: schoolApplications.id })
    .from(schoolApplications)
    .where(
      and(
        eq(schoolApplications.applicantProfileId, profile.id),
        eq(schoolApplications.status, "approved"),
      ),
    )
    .limit(1);

  if (approved) return true;

  // Legacy rebbe accounts created before the school-approval gate
  const [anyApp] = await db
    .select({ id: schoolApplications.id })
    .from(schoolApplications)
    .where(eq(schoolApplications.applicantProfileId, profile.id))
    .limit(1);

  return !anyApp;
}

export async function getApplicantEducationStatus(profileId: string): Promise<{
  status: "none" | "pending" | "approved" | "rejected";
  schoolName?: string;
}> {
  const db = getDb();
  const rows = await db
    .select()
    .from(schoolApplications)
    .where(eq(schoolApplications.applicantProfileId, profileId));

  if (!rows.length) return { status: "none" };

  const approved = rows.find((r) => r.status === "approved");
  if (approved) {
    return { status: "approved", schoolName: approved.schoolName };
  }
  const pending = rows.find((r) => r.status === "pending");
  if (pending) {
    return { status: "pending", schoolName: pending.schoolName };
  }
  const rejected = rows.find((r) => r.status === "rejected");
  return {
    status: "rejected",
    schoolName: rejected?.schoolName,
  };
}
