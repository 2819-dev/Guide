import { and, eq, inArray, isNull, or } from "drizzle-orm";
import { getDb } from "@/lib/db";
import {
  classroomMembers,
  classrooms,
  suggestionBlocks,
} from "@/lib/schema";

/** True if any of the student's classes (or the student) is blocked from Suggestions. */
export async function isStudentSuggestionsBlocked(
  studentProfileId: string,
): Promise<{ blocked: boolean; reason: string | null }> {
  const db = getDb();
  const memberships = await db
    .select({
      classroomId: classroomMembers.classroomId,
      classroomName: classrooms.name,
    })
    .from(classroomMembers)
    .innerJoin(classrooms, eq(classroomMembers.classroomId, classrooms.id))
    .where(eq(classroomMembers.studentId, studentProfileId));

  if (memberships.length === 0) {
    return { blocked: false, reason: null };
  }

  const classroomIds = memberships.map((m) => m.classroomId);
  const blocks = await db
    .select()
    .from(suggestionBlocks)
    .where(
      and(
        inArray(suggestionBlocks.classroomId, classroomIds),
        or(
          isNull(suggestionBlocks.studentId),
          eq(suggestionBlocks.studentId, studentProfileId),
        ),
      ),
    );

  if (blocks.length === 0) {
    return { blocked: false, reason: null };
  }

  const classWide = blocks.find((b) => b.studentId == null);
  if (classWide) {
    const name =
      memberships.find((m) => m.classroomId === classWide.classroomId)
        ?.classroomName ?? "your class";
    return {
      blocked: true,
      reason: `Suggestions are paused for ${name}. Ask your teacher if you need access.`,
    };
  }

  return {
    blocked: true,
    reason:
      "Suggestions are paused for your account. Ask your teacher if you need access.",
  };
}
