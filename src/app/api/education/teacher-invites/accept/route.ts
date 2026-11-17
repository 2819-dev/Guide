import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { auth } from "@/lib/auth/server";
import { getDb } from "@/lib/db";
import { sendWelcomeEmail } from "@/lib/email";
import { profiles, schoolApplications, teacherInvites } from "@/lib/schema";

export const runtime = "edge";

const schema = z.object({
  token: z.string().trim().min(16, "This invite link is incomplete.").max(128),
  name: z.string().trim().min(2, "Enter your full name.").max(120),
  password: z
    .string()
    .min(8, "Your password needs at least 8 characters.")
    .max(200, "Use a shorter password."),
});

export async function POST(request: Request) {
  try {
    const body = schema.parse(await request.json());
    const db = getDb();
    const [invite] = await db
      .select()
      .from(teacherInvites)
      .where(eq(teacherInvites.token, body.token))
      .limit(1);

    if (!invite) {
      return NextResponse.json({ error: "This invite couldn’t be found. Ask your school administrator for a new one." }, { status: 404 });
    }
    if (invite.status === "accepted") {
      return NextResponse.json(
        { error: "This invite was already used. Log in with your email and password." },
        { status: 409 },
      );
    }
    if (invite.expiresAt.getTime() < Date.now()) {
      return NextResponse.json(
        { error: "This invite has expired. Ask your school administrator for a new one." },
        { status: 410 },
      );
    }

    let authUserId: string | undefined;
    const { data: signUpData, error } = await auth.signUp.email({
      email: invite.email,
      name: body.name,
      password: body.password,
    });

    if (error) {
      // Account may already exist — try sign-in then promote.
      const signIn = await auth.signIn.email({
        email: invite.email,
        password: body.password,
      });
      authUserId = signIn.data?.user?.id;
      if (signIn.error) {
        return NextResponse.json(
          {
            error:
              "An account with this email already exists. Log in instead.",
          },
          { status: 400 },
        );
      }
    }

    // Use the user from signUp/signIn: getSession() reads this request's
    // cookies, which do not carry the session that was just created.
    authUserId ??= signUpData?.user?.id;
    if (!authUserId) {
      return NextResponse.json(
        { error: "Your account was created. Log in to continue." },
        { status: 500 },
      );
    }

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
          role: "rebbe",
          displayName: body.name,
          loginEmail: invite.email.toLowerCase(),
          schoolId: invite.schoolId ?? existing[0].schoolId,
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
          displayName: body.name,
          role: "rebbe",
          loginEmail: invite.email.toLowerCase(),
          schoolId: invite.schoolId,
        })
        .returning();
      profileId = created.id;
    }

    await db
      .update(teacherInvites)
      .set({
        status: "accepted",
        acceptedProfileId: profileId,
      })
      .where(
        and(
          eq(teacherInvites.id, invite.id),
          eq(teacherInvites.status, "pending"),
        ),
      );

    // Approved application row unlocks teacher portal (hasEducationAccess).
    const [existingApp] = await db
      .select({ id: schoolApplications.id })
      .from(schoolApplications)
      .where(
        and(
          eq(schoolApplications.applicantProfileId, profileId),
          eq(schoolApplications.status, "approved"),
        ),
      )
      .limit(1);

    if (!existingApp) {
      await db.insert(schoolApplications).values({
        kind: "school",
        schoolName: invite.schoolName,
        contactName: body.name,
        contactEmail: invite.email.toLowerCase(),
        contactRole: "Teacher",
        studentCountEstimate: "invited",
        intendedUse: `Teacher invited by school administrator for ${invite.schoolName}.`,
        status: "approved",
        applicantProfileId: profileId,
        reviewedAt: new Date(),
      });
    }

    void sendWelcomeEmail({ to: invite.email, name: body.name });

    return NextResponse.json({ ok: true, profileId });
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json(
        { error: e.issues[0]?.message ?? "That request wasn’t valid. Refresh the page and try again." },
        { status: 400 },
      );
    }
    console.error(e);
    return NextResponse.json({ error: "Your account wasn’t created. Try again in a moment." }, { status: 500 });
  }
}
