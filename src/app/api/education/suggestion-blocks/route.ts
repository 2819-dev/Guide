import { NextResponse } from "next/server";
import { and, eq, isNull } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "@/lib/db";
import { hasEducationAccess } from "@/lib/education-access";
import { requireProfile } from "@/lib/profile";
import {
  classroomMembers,
  classrooms,
  profiles,
  suggestionBlocks,
} from "@/lib/schema";

const upsertSchema = z.object({
  classroomId: z.string().uuid(),
  studentId: z.string().uuid().nullable(),
  blocked: z.boolean(),
});

async function assertOwnsClassroom(
  rebbeId: string,
  classroomId: string,
  role: string,
) {
  const db = getDb();
  if (role === "admin") {
    const [room] = await db
      .select()
      .from(classrooms)
      .where(eq(classrooms.id, classroomId))
      .limit(1);
    return room ?? null;
  }
  const [room] = await db
    .select()
    .from(classrooms)
    .where(and(eq(classrooms.id, classroomId), eq(classrooms.rebbeId, rebbeId)))
    .limit(1);
  return room ?? null;
}

/** List blocks for the teacher's classrooms (with student names). */
export async function GET() {
  const authz = await requireProfile(["rebbe", "admin"]);
  if (!authz) {
    return NextResponse.json({ error: "Access required" }, { status: 403 });
  }
  if (!(await hasEducationAccess(authz.profile))) {
    return NextResponse.json({ error: "School approval required" }, { status: 403 });
  }

  const db = getDb();
  const rooms =
    authz.profile.role === "admin"
      ? await db.select().from(classrooms)
      : await db
          .select()
          .from(classrooms)
          .where(eq(classrooms.rebbeId, authz.profile.id));

  const result = [];
  for (const room of rooms) {
    const members = await db
      .select({
        studentId: profiles.id,
        displayName: profiles.displayName,
      })
      .from(classroomMembers)
      .innerJoin(profiles, eq(classroomMembers.studentId, profiles.id))
      .where(eq(classroomMembers.classroomId, room.id));

    const blocks = await db
      .select()
      .from(suggestionBlocks)
      .where(eq(suggestionBlocks.classroomId, room.id));

    const classBlocked = blocks.some((b) => b.studentId == null);
    const blockedStudentIds = new Set(
      blocks.filter((b) => b.studentId).map((b) => b.studentId as string),
    );

    result.push({
      classroomId: room.id,
      classroomName: room.name,
      classBlocked,
      students: members.map((m) => ({
        id: m.studentId,
        displayName: m.displayName,
        blocked: classBlocked || blockedStudentIds.has(m.studentId),
        individuallyBlocked: blockedStudentIds.has(m.studentId),
      })),
    });
  }

  return NextResponse.json({ classrooms: result });
}

/** Toggle class-wide or per-student Suggestions block. */
export async function POST(request: Request) {
  const authz = await requireProfile(["rebbe", "admin"]);
  if (!authz) {
    return NextResponse.json({ error: "Access required" }, { status: 403 });
  }
  if (!(await hasEducationAccess(authz.profile))) {
    return NextResponse.json({ error: "School approval required" }, { status: 403 });
  }

  try {
    const body = upsertSchema.parse(await request.json());
    const room = await assertOwnsClassroom(
      authz.profile.id,
      body.classroomId,
      authz.profile.role,
    );
    if (!room) {
      return NextResponse.json({ error: "Class not found" }, { status: 404 });
    }

    const db = getDb();

    if (body.studentId) {
      const [member] = await db
        .select()
        .from(classroomMembers)
        .where(
          and(
            eq(classroomMembers.classroomId, body.classroomId),
            eq(classroomMembers.studentId, body.studentId),
          ),
        )
        .limit(1);
      if (!member) {
        return NextResponse.json(
          { error: "Student is not in this class" },
          { status: 400 },
        );
      }
    }

    if (body.blocked) {
      if (body.studentId == null) {
        const [existing] = await db
          .select()
          .from(suggestionBlocks)
          .where(
            and(
              eq(suggestionBlocks.classroomId, body.classroomId),
              isNull(suggestionBlocks.studentId),
            ),
          )
          .limit(1);
        if (!existing) {
          await db.insert(suggestionBlocks).values({
            classroomId: body.classroomId,
            studentId: null,
            blockedByProfileId: authz.profile.id,
          });
        }
      } else {
        const [existing] = await db
          .select()
          .from(suggestionBlocks)
          .where(
            and(
              eq(suggestionBlocks.classroomId, body.classroomId),
              eq(suggestionBlocks.studentId, body.studentId),
            ),
          )
          .limit(1);
        if (!existing) {
          await db.insert(suggestionBlocks).values({
            classroomId: body.classroomId,
            studentId: body.studentId,
            blockedByProfileId: authz.profile.id,
          });
        }
      }
    } else if (body.studentId == null) {
      await db
        .delete(suggestionBlocks)
        .where(
          and(
            eq(suggestionBlocks.classroomId, body.classroomId),
            isNull(suggestionBlocks.studentId),
          ),
        );
    } else {
      await db
        .delete(suggestionBlocks)
        .where(
          and(
            eq(suggestionBlocks.classroomId, body.classroomId),
            eq(suggestionBlocks.studentId, body.studentId),
          ),
        );
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error(error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }
    return NextResponse.json({ error: "Could not update access" }, { status: 500 });
  }
}
