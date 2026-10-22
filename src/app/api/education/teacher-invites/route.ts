import { NextResponse } from "next/server";
import { desc, eq } from "drizzle-orm";
import { z } from "zod";
import { sendTeacherInviteEmail, resendConfigured } from "@/lib/email";
import { hasEducationAccess } from "@/lib/education-access";
import { getDb } from "@/lib/db";
import { requireProfile } from "@/lib/profile";
import { schoolApplications, teacherInvites } from "@/lib/schema";
import { guidePublicUrl } from "@/lib/site";
import { randomBytes } from "@/lib/edge-crypto";

export const runtime = "edge";

const postSchema = z.object({
  emails: z.array(z.string().trim().email().max(254)).min(1).max(40),
  schoolName: z.string().trim().min(2).max(200).optional(),
});

function parseEmailList(raw: unknown): string[] {
  if (Array.isArray(raw)) {
    return raw.map(String);
  }
  if (typeof raw === "string") {
    return raw
      .split(/[\n,;]+/)
      .map((s) => s.trim())
      .filter(Boolean);
  }
  return [];
}

export async function GET() {
  const authz = await requireProfile(["rebbe", "admin"]);
  if (!authz) {
    return NextResponse.json({ error: "Access required" }, { status: 403 });
  }
  const allowed = await hasEducationAccess(authz.profile);
  if (!allowed) {
    return NextResponse.json({ error: "Portal locked" }, { status: 403 });
  }

  const db = getDb();
  const rows = await db
    .select()
    .from(teacherInvites)
    .where(eq(teacherInvites.invitedByProfileId, authz.profile.id))
    .orderBy(desc(teacherInvites.createdAt))
    .limit(100);

  return NextResponse.json({
    invites: rows,
    emailConfigured: resendConfigured(),
  });
}

export async function POST(request: Request) {
  const authz = await requireProfile(["rebbe", "admin"]);
  if (!authz) {
    return NextResponse.json({ error: "Access required" }, { status: 403 });
  }
  const allowed = await hasEducationAccess(authz.profile);
  if (!allowed) {
    return NextResponse.json({ error: "Portal locked" }, { status: 403 });
  }

  try {
    const json = await request.json();
    const emails = parseEmailList(json.emails ?? json.emailText);
    const body = postSchema.parse({
      emails,
      schoolName: json.schoolName,
    });

    const db = getDb();
    let schoolName = body.schoolName?.trim() || "";
    if (!schoolName) {
      const [app] = await db
        .select()
        .from(schoolApplications)
        .where(eq(schoolApplications.applicantProfileId, authz.profile.id))
        .orderBy(desc(schoolApplications.createdAt))
        .limit(1);
      schoolName = app?.schoolName || "Your school";
    }

    const expiresAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);
    const created: Array<{
      id: string;
      email: string;
      token: string;
      stubbed?: boolean;
    }> = [];

    for (const email of body.emails) {
      const token = Array.from(randomBytes(24))
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");
      const [invite] = await db
        .insert(teacherInvites)
        .values({
          email: email.toLowerCase(),
          schoolName,
          invitedByProfileId: authz.profile.id,
          token,
          status: "pending",
          expiresAt,
        })
        .returning();

      const inviteUrl = `${guidePublicUrl()}/invite/teacher/${invite.token}`;
      const sent = await sendTeacherInviteEmail({
        to: invite.email,
        schoolName,
        inviteUrl,
      });

      if (sent.ok) {
        await db
          .update(teacherInvites)
          .set({ sentAt: new Date() })
          .where(eq(teacherInvites.id, invite.id));
      }

      created.push({
        id: invite.id,
        email: invite.email,
        token: invite.token,
        stubbed: sent.stubbed,
      });
    }

    return NextResponse.json({
      invites: created,
      emailConfigured: resendConfigured(),
      message: resendConfigured()
        ? "Invites sent."
        : "Invites saved. Add RESEND_API_KEY to send email automatically.",
    });
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json(
        { error: e.issues[0]?.message ?? "Invalid emails" },
        { status: 400 },
      );
    }
    return NextResponse.json({ error: "Could not invite" }, { status: 500 });
  }
}
