import { NextResponse } from "next/server";
import { and, desc, eq, inArray } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "@/lib/db";
import { hasEducationAccess } from "@/lib/education-access";
import { makeInviteCode } from "@/lib/invite";
import { requireProfile } from "@/lib/profile";
import {
  classroomMembers,
  classrooms,
  progress,
  quizSessions,
  studyNotes,
  profiles,
} from "@/lib/schema";

export async function GET() {
  const authz = await requireProfile(["rebbe", "admin"]);
  if (!authz) {
    return NextResponse.json({ error: "Rebbe access required" }, { status: 403 });
  }
  if (!(await hasEducationAccess(authz.profile))) {
    return NextResponse.json(
      { error: "School approval required" },
      { status: 403 },
    );
  }

  const db = getDb();
  const rooms = await db
    .select()
    .from(classrooms)
    .where(eq(classrooms.rebbeId, authz.profile.id))
    .orderBy(desc(classrooms.createdAt));

  const result = [];
  for (const room of rooms) {
    const members = await db
      .select({
        memberId: classroomMembers.id,
        studentId: profiles.id,
        displayName: profiles.displayName,
        joinedAt: classroomMembers.joinedAt,
      })
      .from(classroomMembers)
      .innerJoin(profiles, eq(classroomMembers.studentId, profiles.id))
      .where(eq(classroomMembers.classroomId, room.id));

    const studentIds = members.map((m) => m.studentId);
    let progressRows: (typeof progress.$inferSelect)[] = [];
    let quizRows: { profileId: string; score: number | null; dafId: string; completedAt: Date | null }[] = [];
    let noteCounts: { profileId: string; count: number }[] = [];

    if (studentIds.length) {
      progressRows = await db
        .select()
        .from(progress)
        .where(inArray(progress.profileId, studentIds));
      quizRows = await db
        .select({
          profileId: quizSessions.profileId,
          score: quizSessions.score,
          dafId: quizSessions.dafId,
          completedAt: quizSessions.completedAt,
        })
        .from(quizSessions)
        .where(inArray(quizSessions.profileId, studentIds));
      const notes = await db
        .select({ profileId: studyNotes.profileId })
        .from(studyNotes)
        .where(inArray(studyNotes.profileId, studentIds));
      const map = new Map<string, number>();
      for (const n of notes) {
        map.set(n.profileId, (map.get(n.profileId) ?? 0) + 1);
      }
      noteCounts = [...map.entries()].map(([profileId, count]) => ({
        profileId,
        count,
      }));
    }

    result.push({
      ...room,
      students: members.map((m) => {
        const pRows = progressRows.filter((p) => p.profileId === m.studentId);
        const qRows = quizRows.filter((q) => q.profileId === m.studentId && q.score != null);
        const notesSubmitted = noteCounts.find((n) => n.profileId === m.studentId)?.count ?? 0;
        const avgScore = qRows.length
          ? Math.round(
              qRows.reduce((s, q) => s + (q.score ?? 0), 0) / qRows.length,
            )
          : null;
        return {
          id: m.studentId,
          displayName: m.displayName,
          joinedAt: m.joinedAt,
          dapimStudied: pRows.filter((p) => p.visited).length,
          quizAttempts: pRows.reduce((s, p) => s + p.quizAttempts, 0),
          bestScore: pRows.reduce<number | null>(
            (best, p) =>
              p.bestScore == null
                ? best
                : best == null
                  ? p.bestScore
                  : Math.max(best, p.bestScore),
            null,
          ),
          averageQuizScore: avgScore,
          notesSubmitted,
          recentDafim: pRows
            .sort(
              (a, b) =>
                b.lastVisitedAt.getTime() - a.lastVisitedAt.getTime(),
            )
            .slice(0, 5)
            .map((p) =>
              p.tractateSlug === "bava-metzia"
                ? p.dafId
                : `${p.tractateSlug} ${p.dafId}`,
            ),
        };
      }),
    });
  }

  return NextResponse.json({ classrooms: result });
}

export async function POST(request: Request) {
  const authz = await requireProfile(["rebbe", "admin"]);
  if (!authz) {
    return NextResponse.json({ error: "Rebbe access required" }, { status: 403 });
  }
  if (!(await hasEducationAccess(authz.profile))) {
    return NextResponse.json(
      { error: "School approval required" },
      { status: 403 },
    );
  }

  try {
    const body = z
      .object({ name: z.string().min(2).max(160) })
      .parse(await request.json());
    const db = getDb();
    const [room] = await db
      .insert(classrooms)
      .values({
        rebbeId: authz.profile.id,
        name: body.name,
        inviteCode: makeInviteCode(),
      })
      .returning();
    return NextResponse.json({ classroom: room }, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Could not create class" }, { status: 400 });
  }
}

export async function PUT(request: Request) {
  /** Student joins a class with invite code */
  const authz = await requireProfile(["customer", "rebbe"]);
  if (!authz) {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }
  try {
    const body = z
      .object({ inviteCode: z.string().min(4).max(16) })
      .parse(await request.json());
    const db = getDb();
    const [room] = await db
      .select()
      .from(classrooms)
      .where(eq(classrooms.inviteCode, body.inviteCode.trim().toUpperCase()))
      .limit(1);
    if (!room) {
      return NextResponse.json({ error: "Invite code not found" }, { status: 404 });
    }
    const existing = await db
      .select()
      .from(classroomMembers)
      .where(
        and(
          eq(classroomMembers.classroomId, room.id),
          eq(classroomMembers.studentId, authz.profile.id),
        ),
      )
      .limit(1);
    if (!existing[0]) {
      await db.insert(classroomMembers).values({
        classroomId: room.id,
        studentId: authz.profile.id,
      });
    }
    return NextResponse.json({ classroom: { id: room.id, name: room.name } });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Could not join class" }, { status: 400 });
  }
}
