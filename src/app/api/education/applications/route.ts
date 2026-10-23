import { NextResponse } from "next/server";
import { and, desc, eq } from "drizzle-orm";
import { z } from "zod";
import { auth } from "@/lib/auth/server";
import { getDb } from "@/lib/db";
import { sendWelcomeEmail } from "@/lib/email";
import { ensureProfile, requireProfile } from "@/lib/profile";
import { profiles, schoolApplications } from "@/lib/schema";
import { syncSchoolFromApplication } from "@/lib/schools";

export const runtime = "edge";

const schoolSubmitSchema = z.object({
  kind: z.literal("school"),
  schoolName: z.string().trim().min(2).max(200),
  contactName: z.string().trim().min(2).max(120),
  contactEmail: z.string().trim().email().max(254),
  contactRole: z.string().trim().min(2).max(120),
  studentCountEstimate: z.string().trim().min(1).max(64),
  intendedUse: z.string().trim().min(10).max(4000),
  /** Required when the applicant is not already signed in. */
  password: z.string().min(8).max(200).optional(),
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

const AUTH_BASE = () =>
  process.env.NEON_AUTH_BASE_URL?.trim() ||
  "https://invalid.neonauth.local/auth";

/**
 * Create Neon Auth user via HTTP (Origin required by Neon Auth), then
 * establish a Guide session cookie with the SDK sign-in helper.
 */
async function neonAuthSignUpThenSession(opts: {
  email: string;
  password: string;
  name: string;
  origin: string;
}): Promise<{ authUserId: string; createdAccount: boolean }> {
  const origin =
    opts.origin ||
    process.env.NEXT_PUBLIC_GUIDE_URL?.trim() ||
    "https://guidelearning.org";

  const signUpRes = await fetch(`${AUTH_BASE()}/sign-up/email`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Origin: origin,
    },
    body: JSON.stringify({
      email: opts.email,
      password: opts.password,
      name: opts.name,
    }),
  });
  const signUpData = (await signUpRes.json().catch(() => ({}))) as {
    user?: { id?: string };
    message?: string;
    error?: string;
    code?: string;
  };

  let authUserId = signUpData.user?.id;
  let createdAccount = Boolean(authUserId);

  if (!authUserId) {
    // Account may already exist — sign in to resolve id + set cookies.
    const { data: session, error: signInError } = await auth.signIn.email({
      email: opts.email,
      password: opts.password,
    });
    authUserId = session?.user?.id;
    createdAccount = false;
    if (!authUserId) {
      const msg =
        signUpData.message ||
        signUpData.error ||
        signInError?.message ||
        "";
      throw new AccountError(
        msg && msg !== "<none>"
          ? msg
          : "Could not create account. If you already have Guide, log in and apply from your account.",
        400,
      );
    }
    return { authUserId, createdAccount };
  }

  // New account — establish session cookies for the browser.
  const { error: signInError } = await auth.signIn.email({
    email: opts.email,
    password: opts.password,
  });
  if (signInError) {
    // Account exists; client can still log in manually.
    console.error("school apply sign-in after signup:", signInError.message);
  }

  return { authUserId, createdAccount };
}

/**
 * Ensure the school applicant has a Guide account + rebbe profile, then
 * return profile id. Creates Neon Auth account when password is provided.
 */
async function ensureSchoolApplicantProfile(opts: {
  contactName: string;
  contactEmail: string;
  password?: string;
  existingProfileId?: string | null;
  origin: string;
}): Promise<{ profileId: string; createdAccount: boolean }> {
  const db = getDb();
  const email = opts.contactEmail.toLowerCase();

  if (opts.existingProfileId) {
    const [profile] = await db
      .select()
      .from(profiles)
      .where(eq(profiles.id, opts.existingProfileId))
      .limit(1);
    if (profile) {
      if (profile.role === "customer") {
        await db
          .update(profiles)
          .set({
            role: "rebbe",
            displayName: opts.contactName || profile.displayName,
            loginEmail: email,
            updatedAt: new Date(),
          })
          .where(eq(profiles.id, profile.id));
      } else if (opts.contactName && profile.displayName !== opts.contactName) {
        await db
          .update(profiles)
          .set({
            displayName: opts.contactName,
            loginEmail: profile.loginEmail ?? email,
            updatedAt: new Date(),
          })
          .where(eq(profiles.id, profile.id));
      }
      return { profileId: profile.id, createdAccount: false };
    }
  }

  if (!opts.password || opts.password.length < 8) {
    throw new AccountError(
      "Create a password of at least 8 characters to finish applying.",
      400,
    );
  }

  const { authUserId, createdAccount } = await neonAuthSignUpThenSession({
    email,
    password: opts.password,
    name: opts.contactName,
    origin: opts.origin,
  });

  const existing = await db
    .select()
    .from(profiles)
    .where(eq(profiles.authUserId, authUserId))
    .limit(1);

  let profileId: string;
  if (existing[0]) {
    const [updated] = await db
      .update(profiles)
      .set({
        role:
          existing[0].role === "admin" || existing[0].role === "moderator"
            ? existing[0].role
            : "rebbe",
        displayName: opts.contactName || existing[0].displayName,
        loginEmail: email,
        updatedAt: new Date(),
      })
      .where(eq(profiles.id, existing[0].id))
      .returning();
    profileId = updated.id;
  } else {
    const [created] = await db
      .insert(profiles)
      .values({
        authUserId,
        displayName: opts.contactName,
        role: "rebbe",
        loginEmail: email,
      })
      .returning();
    profileId = created.id;
  }

  return { profileId, createdAccount };
}

class AccountError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
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
              "You already have a pending application. Open your portal to check status.",
            application: { id: existing.id, status: existing.status },
            redirectTo: "/education/panel",
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

      return NextResponse.json(
        { application, redirectTo: "/education/panel" },
        { status: 201 },
      );
    }

    // School / district apply — create account immediately when needed.
    const origin =
      request.headers.get("origin") ||
      process.env.NEXT_PUBLIC_GUIDE_URL?.trim() ||
      "https://guidelearning.org";
    const { profileId, createdAccount } = await ensureSchoolApplicantProfile({
      contactName: body.contactName,
      contactEmail: body.contactEmail,
      password: body.password,
      existingProfileId: session?.profile.id ?? null,
      origin,
    });

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
        applicantProfileId: profileId,
      })
      .returning({
        id: schoolApplications.id,
        status: schoolApplications.status,
        kind: schoolApplications.kind,
        schoolName: schoolApplications.schoolName,
      });

    if (createdAccount) {
      void sendWelcomeEmail({
        to: body.contactEmail,
        name: body.contactName,
      });
    }

    return NextResponse.json(
      { application, redirectTo: "/education/panel", createdAccount },
      { status: 201 },
    );
  } catch (error) {
    console.error(error);
    if (error instanceof AccountError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status },
      );
    }
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
