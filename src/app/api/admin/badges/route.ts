import { NextResponse } from "next/server";
import { asc, desc, eq, isNotNull } from "drizzle-orm";
import { z } from "zod";
import { provisionStudentBadge } from "@/lib/badge-auth";
import { getDb } from "@/lib/db";
import { requireProfile } from "@/lib/profile";
import { profiles, schools } from "@/lib/schema";

const createSchema = z.object({
  displayName: z.string().trim().min(2).max(120),
  schoolId: z.string().uuid(),
  profileId: z.string().uuid().optional(),
  email: z.string().trim().email().max(254).optional(),
  password: z.string().min(8).max(128).optional(),
});

const AUTH_BASE = () => process.env.NEON_AUTH_BASE_URL!;

/** List schools + recent badges for Official form. */
export async function GET() {
  const authz = await requireProfile(["admin", "moderator"]);
  if (!authz) {
    return NextResponse.json({ error: "Access required" }, { status: 403 });
  }

  const db = getDb();
  const schoolRows = await db
    .select({ id: schools.id, name: schools.name, slug: schools.slug })
    .from(schools)
    .orderBy(asc(schools.name));

  const badgeHolders = await db
    .select({
      id: profiles.id,
      displayName: profiles.displayName,
      badgeCode: profiles.badgeCode,
      schoolId: profiles.schoolId,
      loginEmail: profiles.loginEmail,
      badgeAuthUserId: profiles.badgeAuthUserId,
    })
    .from(profiles)
    .where(isNotNull(profiles.badgeCode))
    .orderBy(desc(profiles.updatedAt))
    .limit(40);

  return NextResponse.json({
    schools: schoolRows,
    badges: badgeHolders,
  });
}

/**
 * Guide Official issues a Clever-style badge without touching the Official session.
 * Uses Neon Auth HTTP for new accounts (not auth.signUp cookie path).
 */
export async function POST(request: Request) {
  const authz = await requireProfile(["admin", "moderator"]);
  if (!authz) {
    return NextResponse.json({ error: "Access required" }, { status: 403 });
  }

  try {
    const body = createSchema.parse(await request.json());
    const db = getDb();
    const [school] = await db
      .select()
      .from(schools)
      .where(eq(schools.id, body.schoolId))
      .limit(1);
    if (!school) {
      return NextResponse.json({ error: "School not found" }, { status: 404 });
    }

    let profileId = body.profileId;

    if (!profileId) {
      if (!body.email || !body.password) {
        return NextResponse.json(
          {
            error:
              "Provide an email and password for a new student, or choose an existing profile.",
          },
          { status: 400 },
        );
      }

      const email = body.email.toLowerCase();
      const signUpRes = await fetch(`${AUTH_BASE()}/sign-up/email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          password: body.password,
          name: body.displayName,
        }),
      });
      const signUpData = (await signUpRes.json().catch(() => ({}))) as {
        user?: { id?: string };
        message?: string;
        error?: string;
      };

      let authUserId = signUpData.user?.id;
      if (!authUserId) {
        const signInRes = await fetch(`${AUTH_BASE()}/sign-in/email`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password: body.password }),
        });
        const signInData = (await signInRes.json().catch(() => ({}))) as {
          user?: { id?: string };
        };
        authUserId = signInData.user?.id;
      }

      if (!authUserId) {
        const msg = signUpData.message || signUpData.error || "";
        return NextResponse.json(
          {
            error:
              msg ||
              "Could not create or find the student account. Check email/password.",
          },
          { status: 400 },
        );
      }

      const [existingAuth] = await db
        .select()
        .from(profiles)
        .where(eq(profiles.authUserId, authUserId))
        .limit(1);

      if (existingAuth) {
        profileId = existingAuth.id;
        await db
          .update(profiles)
          .set({
            displayName: body.displayName,
            schoolId: body.schoolId,
            loginEmail: email,
            updatedAt: new Date(),
          })
          .where(eq(profiles.id, existingAuth.id));
      } else {
        const [created] = await db
          .insert(profiles)
          .values({
            authUserId,
            displayName: body.displayName,
            role: "customer",
            schoolId: body.schoolId,
            loginEmail: email,
          })
          .returning();
        profileId = created.id;
      }
    } else {
      const [existing] = await db
        .select()
        .from(profiles)
        .where(eq(profiles.id, profileId))
        .limit(1);
      if (!existing) {
        return NextResponse.json({ error: "Profile not found" }, { status: 404 });
      }
      await db
        .update(profiles)
        .set({
          displayName: body.displayName || existing.displayName,
          schoolId: body.schoolId,
          updatedAt: new Date(),
        })
        .where(eq(profiles.id, profileId));
    }

    const badge = await provisionStudentBadge({
      profileId: profileId!,
      schoolId: body.schoolId,
      displayName: body.displayName,
    });

    if (badge.error) {
      return NextResponse.json({ error: badge.error }, { status: 500 });
    }

    return NextResponse.json(
      {
        badge: {
          profileId,
          badgeCode: badge.badgeCode,
          schoolName: school.name,
          schoolSlug: school.slug,
          displayName: body.displayName,
        },
      },
      { status: 201 },
    );
  } catch (error) {
    console.error(error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid badge request" }, { status: 400 });
    }
    return NextResponse.json({ error: "Could not create badge" }, { status: 500 });
  }
}
