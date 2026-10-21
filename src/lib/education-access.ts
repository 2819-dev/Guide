import { and, eq } from "drizzle-orm";
import { getDb } from "@/lib/db";
import type { Profile } from "@/lib/profile";
import { schoolApplications } from "@/lib/schema";
import type { Role } from "@/lib/roles";

export type SchoolApplicationStatus =
  | "none"
  | "pending"
  | "approved"
  | "rejected";

/**
 * Teacher / School Administrator tools unlock only after an approved school
 * application. Guide Official (admin) stays unlocked. Students never use this.
 */
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

  return Boolean(approved);
}

export async function getApplicantEducationStatus(profileId: string): Promise<{
  status: SchoolApplicationStatus;
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
