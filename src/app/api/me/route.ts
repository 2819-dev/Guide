import { NextResponse } from "next/server";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { hasDeveloperAccess } from "@/lib/developer-access";
import {
  getApplicantEducationStatus,
  hasEducationAccess,
} from "@/lib/education-access";
import { ensureProfile, requireProfile } from "@/lib/profile";
import { isRole } from "@/lib/roles";
import { profiles } from "@/lib/schema";

export const runtime = "edge";

export async function GET() {
  const result = await ensureProfile();
  if (!result) {
    return NextResponse.json({
      user: null,
      profile: null,
      educationOk: false,
      developerOk: false,
      schoolApplicationStatus: "none",
    });
  }
  const educationOk = await hasEducationAccess(result.profile);
  const developerOk = await hasDeveloperAccess(result.profile);
  const appStatus = await getApplicantEducationStatus(result.profile.id);
  return NextResponse.json({
    user: {
      id: result.user.id,
      name: result.user.name,
      email: result.user.email,
    },
    profile: {
      id: result.profile.id,
      role: result.profile.role,
      displayName: result.profile.displayName,
      schoolId: result.profile.schoolId,
      badgeCode: result.profile.badgeCode,
    },
    educationOk,
    developerOk,
    schoolApplicationStatus: appStatus.status,
  });
}

export async function PATCH(request: Request) {
  const authz = await requireProfile();
  if (!authz) {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }

  try {
    const body = z
      .object({
        displayName: z.string().min(1).max(120).optional(),
      })
      .parse(await request.json());

    const db = getDb();
    const patch: Partial<typeof profiles.$inferInsert> = {
      updatedAt: new Date(),
    };
    if (body.displayName) patch.displayName = body.displayName;

    const [updated] = await db
      .update(profiles)
      .set(patch)
      .where(eq(profiles.id, authz.profile.id))
      .returning();

    return NextResponse.json({
      profile: {
        id: updated.id,
        role: updated.role,
        displayName: updated.displayName,
      },
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Could not update profile" }, { status: 400 });
  }
}

/** Guide Official: set a profile role. */
export async function PUT(request: Request) {
  const authz = await requireProfile(["admin"]);
  if (!authz) {
    return NextResponse.json({ error: "Admin only" }, { status: 403 });
  }
  try {
    const body = z
      .object({
        profileId: z.string().uuid(),
        role: z.string(),
      })
      .parse(await request.json());
    if (!isRole(body.role)) {
      return NextResponse.json({ error: "Invalid role" }, { status: 400 });
    }
    const db = getDb();
    const [updated] = await db
      .update(profiles)
      .set({ role: body.role, updatedAt: new Date() })
      .where(eq(profiles.id, body.profileId))
      .returning({
        id: profiles.id,
        role: profiles.role,
        displayName: profiles.displayName,
      });
    return NextResponse.json({ profile: updated });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Could not set role" }, { status: 400 });
  }
}
