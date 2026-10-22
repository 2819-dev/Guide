import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { provisionStudentBadge } from "@/lib/badge-auth";
import { getDb } from "@/lib/db";
import { requireProfile } from "@/lib/profile";
import { schools } from "@/lib/schema";

export const runtime = 'edge';

/** Activate or refresh Clever-style badge login for the current student. */
export async function POST() {
  const authz = await requireProfile();
  if (!authz) {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }

  const schoolId = authz.profile.schoolId;
  if (!schoolId) {
    return NextResponse.json(
      {
        error:
          "Choose your school first — log in as Student and select your school, or ask your teacher.",
      },
      { status: 400 },
    );
  }

  const result = await provisionStudentBadge({
    profileId: authz.profile.id,
    schoolId,
    displayName: authz.profile.displayName,
    existingBadgeCode: authz.profile.badgeCode,
  });

  if (result.error) {
    return NextResponse.json({ error: result.error }, { status: 500 });
  }

  const db = getDb();
  const [school] = await db
    .select({ name: schools.name })
    .from(schools)
    .where(eq(schools.id, schoolId))
    .limit(1);

  return NextResponse.json({
    badgeCode: result.badgeCode,
    schoolName: school?.name ?? null,
    ready: true,
  });
}
