import { NextResponse } from "next/server";
import { and, desc, eq } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "@/lib/db";
import { ensureProfile, requireProfile } from "@/lib/profile";
import { profiles, schoolApplications } from "@/lib/schema";

const submitSchema = z.object({
  schoolName: z.string().trim().min(2).max(200),
  contactName: z.string().trim().min(2).max(120),
  contactEmail: z.string().trim().email().max(254),
  contactRole: z.string().trim().min(2).max(120),
  studentCountEstimate: z.string().trim().min(1).max(64),
  intendedUse: z.string().trim().min(10).max(4000),
});

const reviewSchema = z.object({
  applicationId: z.string().uuid(),
  status: z.enum(["approved", "rejected"]),
  reviewNote: z.string().trim().max(2000).optional(),
});

export async function GET() {
  const authz = await requireProfile(["admin", "moderator"]);
  if (!authz) {
    return NextResponse.json({ error: "Access required" }, { status: 403 });
  }

  const db = getDb();
  const rows = await db
    .select()
    .from(schoolApplications)
    .orderBy(desc(schoolApplications.createdAt));

  return NextResponse.json({ applications: rows });
}

export async function POST(request: Request) {
  try {
    const body = submitSchema.parse(await request.json());
    const session = await ensureProfile().catch(() => null);
    const db = getDb();

    if (session?.profile.id) {
      const [existing] = await db
        .select()
        .from(schoolApplications)
        .where(
          and(
            eq(schoolApplications.applicantProfileId, session.profile.id),
            eq(schoolApplications.status, "pending"),
          ),
        )
        .limit(1);
      if (existing) {
        return NextResponse.json(
          {
            error:
              "You already have a pending school application. We will email you when it is reviewed.",
            application: { id: existing.id, status: existing.status },
          },
          { status: 409 },
        );
      }
    }

    const [application] = await db
      .insert(schoolApplications)
      .values({
        schoolName: body.schoolName,
        contactName: body.contactName,
        contactEmail: body.contactEmail.toLowerCase(),
        contactRole: body.contactRole,
        studentCountEstimate: body.studentCountEstimate,
        intendedUse: body.intendedUse,
        status: "pending",
        applicantProfileId: session?.profile.id ?? null,
      })
      .returning({
        id: schoolApplications.id,
        status: schoolApplications.status,
        schoolName: schoolApplications.schoolName,
      });

    return NextResponse.json({ application }, { status: 201 });
  } catch (error) {
    console.error(error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Please complete all required fields." },
        { status: 400 },
      );
    }
    return NextResponse.json(
      { error: "Could not submit application" },
      { status: 500 },
    );
  }
}

export async function PATCH(request: Request) {
  const authz = await requireProfile(["admin", "moderator"]);
  if (!authz) {
    return NextResponse.json({ error: "Access required" }, { status: 403 });
  }

  try {
    const body = reviewSchema.parse(await request.json());
    const db = getDb();
    const [existing] = await db
      .select()
      .from(schoolApplications)
      .where(eq(schoolApplications.id, body.applicationId))
      .limit(1);
    if (!existing) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const [updated] = await db
      .update(schoolApplications)
      .set({
        status: body.status,
        reviewNote: body.reviewNote ?? existing.reviewNote,
        reviewedByProfileId: authz.profile.id,
        reviewedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(schoolApplications.id, body.applicationId))
      .returning();

    if (body.status === "approved" && updated.applicantProfileId) {
      const [profile] = await db
        .select()
        .from(profiles)
        .where(eq(profiles.id, updated.applicantProfileId))
        .limit(1);
      if (profile && profile.role === "customer") {
        await db
          .update(profiles)
          .set({ role: "rebbe", updatedAt: new Date() })
          .where(eq(profiles.id, profile.id));
      }
    }

    return NextResponse.json({ application: updated });
  } catch (error) {
    console.error(error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid review" }, { status: 400 });
    }
    return NextResponse.json({ error: "Could not review" }, { status: 500 });
  }
}
