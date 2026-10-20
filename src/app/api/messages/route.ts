import { NextResponse } from "next/server";
import { and, desc, eq, inArray, or } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "@/lib/db";
import { requireProfile } from "@/lib/profile";
import {
  classroomMembers,
  classrooms,
  messageThreads,
  messages,
  profiles,
} from "@/lib/schema";

const startSchema = z.object({
  teacherId: z.string().uuid(),
  body: z.string().trim().min(1).max(4000),
  subject: z.string().trim().max(200).optional(),
});

const replySchema = z.object({
  threadId: z.string().uuid(),
  body: z.string().trim().min(1).max(4000),
});

/** Teachers available to the student (Rebbeim of classes they joined). */
async function teachersForStudent(studentId: string) {
  const db = getDb();
  const rows = await db
    .select({
      teacherId: profiles.id,
      teacherName: profiles.displayName,
      classroomId: classrooms.id,
      classroomName: classrooms.name,
    })
    .from(classroomMembers)
    .innerJoin(classrooms, eq(classroomMembers.classroomId, classrooms.id))
    .innerJoin(profiles, eq(classrooms.rebbeId, profiles.id))
    .where(eq(classroomMembers.studentId, studentId));

  const byTeacher = new Map<
    string,
    { id: string; name: string; classrooms: { id: string; name: string }[] }
  >();
  for (const r of rows) {
    const existing = byTeacher.get(r.teacherId);
    if (existing) {
      if (!existing.classrooms.some((c) => c.id === r.classroomId)) {
        existing.classrooms.push({ id: r.classroomId, name: r.classroomName });
      }
    } else {
      byTeacher.set(r.teacherId, {
        id: r.teacherId,
        name: r.teacherName,
        classrooms: [{ id: r.classroomId, name: r.classroomName }],
      });
    }
  }
  return [...byTeacher.values()];
}

export async function GET(request: Request) {
  const authz = await requireProfile();
  if (!authz) {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const threadId = searchParams.get("threadId");
  const db = getDb();
  const me = authz.profile.id;

  if (threadId) {
    const [thread] = await db
      .select()
      .from(messageThreads)
      .where(eq(messageThreads.id, threadId))
      .limit(1);
    if (!thread || (thread.studentId !== me && thread.teacherId !== me)) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    const msgs = await db
      .select({
        id: messages.id,
        body: messages.body,
        senderId: messages.senderId,
        createdAt: messages.createdAt,
        senderName: profiles.displayName,
      })
      .from(messages)
      .innerJoin(profiles, eq(messages.senderId, profiles.id))
      .where(eq(messages.threadId, threadId))
      .orderBy(messages.createdAt);

    const [other] = await db
      .select({ id: profiles.id, displayName: profiles.displayName })
      .from(profiles)
      .where(
        eq(
          profiles.id,
          thread.studentId === me ? thread.teacherId : thread.studentId,
        ),
      )
      .limit(1);

    return NextResponse.json({
      thread: {
        id: thread.id,
        subject: thread.subject,
        otherParty: other,
      },
      messages: msgs,
    });
  }

  const threads = await db
    .select()
    .from(messageThreads)
    .where(or(eq(messageThreads.studentId, me), eq(messageThreads.teacherId, me)))
    .orderBy(desc(messageThreads.updatedAt));

  const otherIds = threads.map((t) =>
    t.studentId === me ? t.teacherId : t.studentId,
  );
  const others =
    otherIds.length === 0
      ? []
      : await db
          .select({ id: profiles.id, displayName: profiles.displayName })
          .from(profiles)
          .where(inArray(profiles.id, otherIds));
  const otherMap = new Map(others.map((o) => [o.id, o.displayName]));

  const teachers =
    authz.profile.role === "customer" || authz.profile.schoolId
      ? await teachersForStudent(me)
      : [];

  return NextResponse.json({
    threads: threads.map((t) => ({
      id: t.id,
      subject: t.subject,
      updatedAt: t.updatedAt,
      otherName:
        otherMap.get(t.studentId === me ? t.teacherId : t.studentId) ??
        "Teacher",
      isStudent: t.studentId === me,
    })),
    teachers,
  });
}

export async function POST(request: Request) {
  const authz = await requireProfile();
  if (!authz) {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }

  const db = getDb();
  const me = authz.profile.id;
  const json = await request.json();

  try {
    if ("threadId" in json) {
      const body = replySchema.parse(json);
      const [thread] = await db
        .select()
        .from(messageThreads)
        .where(eq(messageThreads.id, body.threadId))
        .limit(1);
      if (!thread || (thread.studentId !== me && thread.teacherId !== me)) {
        return NextResponse.json({ error: "Not found" }, { status: 404 });
      }
      const [msg] = await db
        .insert(messages)
        .values({
          threadId: thread.id,
          senderId: me,
          body: body.body,
        })
        .returning();
      await db
        .update(messageThreads)
        .set({ updatedAt: new Date() })
        .where(eq(messageThreads.id, thread.id));
      return NextResponse.json({ message: msg }, { status: 201 });
    }

    const body = startSchema.parse(json);
    const teachers = await teachersForStudent(me);
    const teacher = teachers.find((t) => t.id === body.teacherId);
    if (!teacher) {
      return NextResponse.json(
        {
          error:
            "Join a class first — you can message the Rebbe who invited you.",
        },
        { status: 400 },
      );
    }

    const [existing] = await db
      .select()
      .from(messageThreads)
      .where(
        and(
          eq(messageThreads.studentId, me),
          eq(messageThreads.teacherId, body.teacherId),
        ),
      )
      .limit(1);

    let threadId = existing?.id;
    if (!threadId) {
      const [created] = await db
        .insert(messageThreads)
        .values({
          studentId: me,
          teacherId: body.teacherId,
          classroomId: teacher.classrooms[0]?.id ?? null,
          subject: body.subject?.trim() || `Message to ${teacher.name}`,
        })
        .returning();
      threadId = created.id;
    }

    const [msg] = await db
      .insert(messages)
      .values({
        threadId,
        senderId: me,
        body: body.body,
      })
      .returning();

    await db
      .update(messageThreads)
      .set({ updatedAt: new Date() })
      .where(eq(messageThreads.id, threadId));

    return NextResponse.json({ threadId, message: msg }, { status: 201 });
  } catch (error) {
    console.error(error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid message" }, { status: 400 });
    }
    return NextResponse.json({ error: "Could not send message" }, { status: 500 });
  }
}
