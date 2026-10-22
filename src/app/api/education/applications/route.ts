import { NextResponse } from "next/server";
import { and, desc, eq } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "@/lib/db";
import { ensureProfile, requireProfile } from "@/lib/profile";
import { profiles, schoolApplications } from "@/lib/schema";
import { syncSchoolFromApplication } from "@/lib/schools";

export const runtime = 'edge';

const schoolSubmitSchema = z.object({
  kind: z.literal("school"),
  schoolName: z.string().trim().min(2).max(200),
  contactName: z.string().trim().min(2).max(120),
  contactEmail: z.string().trim().email().max(254),
  contactRole: z.string().trim().min(2).max(120),
  studentCountEstimate: z.string().trim().min(1).max(64),
  intendedUse: z.string().trim().min(10).max(4000),
});

const teacherSubmitSchema = z.object({
  kind: z.literal("teacher"),
  contactName: z.string().trim().min(2).max(120),
  contactEmail: z.string().trim().email().max(254),
  className: z.string().trim().min(2).max(160),
  schoolName: z.string().trim().max(200).optional().default(""),
  note: z.string().trim().max(2000).optional().default(""),
});

const submitSchema = z.discriminatedUnion("kind", [
  schoolSubmitSchema,
  teacherSubmitSchema,
]);

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
              "You already have a pending application. We will email you when it is reviewed.",
            application: { id: existing.id, status: existing.status },
          },
          { status: 409 },
        );
      }
    }

    if (body.kind === "teacher") {
      const schoolLabel = body.schoolName.trim() || "Teacher class";
      const note = body.note.trim();
      const [application] = await db
        .insert(schoolApplications)
        .values({
          kind: "teacher",
          schoolName: schoolLabel,
          className: body.className.trim(),
          contactName: body.contactName,
          contactEmail: body.contactEmail.toLowerCase(),
          contactRole: "Teacher",
          studentCountEstimate: "class",
          intendedUse: note
            ? `Teacher class: ${body.className.trim()}. ${note}`
            : `Teacher class application for “${body.className.trim()}”.`,
          status: "pending",
          applicantProfileId: session?.profile.id ?? null,
        })
        .returning({
          id: schoolApplications.id,
          status: schoolApplications.status,
          kind: schoolApplications.kind,
          schoolName: schoolApplications.schoolName,
          className: schoolApplications.className,
        });

      return NextResponse.json({ application }, { status: 201 });
    }

    const [application] = await db
      .insert(schoolApplications)
      .values({
        kind: "school",
        schoolName: body.schoolName,
        className: null,
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
        kind: schoolApplications.kind,
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

    if (body.status === "approved") {
      // School/district apply creates a school row. Teacher-class apply only
      // when a real school name was provided (not the placeholder).
      const shouldSyncSchool =
        updated.kind === "school" ||
        (updated.kind === "teacher" &&
          updated.schoolName.trim().length > 0 &&
          updated.schoolName !== "Teacher class");
      if (shouldSyncSchool) {
        await syncSchoolFromApplication(updated.id);
      }
      if (updated.applicantProfileId) {
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
