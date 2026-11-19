import { NextResponse } from "next/server";
import { and, desc, eq } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "@/lib/db";
import { hasEducationAccess } from "@/lib/education-access";
import { makeInviteCode } from "@/lib/invite";
import { requireProfile } from "@/lib/profile";
import { usernamesForStudents } from "@/lib/student-accounts";
import {
  classroomMembers,
  classrooms,
  profiles,
} from "@/lib/schema";

export const runtime = 'edge';

export async function GET() {
  const authz = await requireProfile(["rebbe", "admin"]);
  if (!authz) {
    return NextResponse.json({ error: "Log in with your teacher account to continue." }, { status: 403 });
  }
  if (!(await hasEducationAccess(authz.profile))) {
    return NextResponse.json(
      { error: "This is available after your school is approved." },
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
    const usernames = await usernamesForStudents(studentIds);
    result.push({
      ...room,
      students: members.map((m) => ({
        id: m.studentId,
        displayName: m.displayName,
        username: usernames.get(m.studentId) ?? null,
        joinedAt: m.joinedAt,
      })),
    });
  }

  return NextResponse.json({ classrooms: result });
}

export async function POST(request: Request) {
  const authz = await requireProfile(["rebbe", "admin"]);
  if (!authz) {
    return NextResponse.json({ error: "Log in with your teacher account to continue." }, { status: 403 });
  }
  if (!(await hasEducationAccess(authz.profile))) {
    return NextResponse.json(
      { error: "This is available after your school is approved." },
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
    return NextResponse.json({ error: "The class wasn’t created. Try again." }, { status: 400 });
  }
}

export async function PUT(request: Request) {
  /** Student joins a class with invite code */
  const authz = await requireProfile(["customer", "rebbe"]);
  if (!authz) {
    return NextResponse.json({ error: "Log in to continue." }, { status: 401 });
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
      return NextResponse.json({ error: "No class matches that code. Check it with your teacher and try again." }, { status: 404 });
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
    return NextResponse.json({ error: "We couldn’t add you to that class. Try again." }, { status: 400 });
  }
}
