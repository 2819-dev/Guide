import { and, eq, inArray } from "drizzle-orm";
import { APP_CATALOG, getApp, type GuideApp } from "@/lib/apps";
import { getDb } from "@/lib/db";
import {
  classroomAppInstalls,
  classroomMembers,
  classrooms,
} from "@/lib/schema";

export type ClassroomInstall = {
  id: string;
  classroomId: string;
  classroomName: string;
  appSlug: string;
  app: GuideApp | null;
  createdAt: Date;
};

/** Apps a teacher installed on any of their classes. */
export async function listInstallsForTeacher(
  teacherProfileId: string,
): Promise<ClassroomInstall[]> {
  const db = getDb();
  const rows = await db
    .select({
      id: classroomAppInstalls.id,
      classroomId: classroomAppInstalls.classroomId,
      classroomName: classrooms.name,
      appSlug: classroomAppInstalls.appSlug,
      createdAt: classroomAppInstalls.createdAt,
    })
    .from(classroomAppInstalls)
    .innerJoin(
      classrooms,
      eq(classroomAppInstalls.classroomId, classrooms.id),
    )
    .where(eq(classrooms.rebbeId, teacherProfileId));

  return rows.map((r) => ({
    ...r,
    app: getApp(r.appSlug) ?? null,
  }));
}

/** Apps installed on classes a student joined (Clever-style My apps). */
export async function listAppsForStudent(
  studentProfileId: string,
): Promise<GuideApp[]> {
  const db = getDb();
  const memberships = await db
    .select({ classroomId: classroomMembers.classroomId })
    .from(classroomMembers)
    .where(eq(classroomMembers.studentId, studentProfileId));

  if (memberships.length === 0) return [];

  const classroomIds = memberships.map((m) => m.classroomId);
  const installs = await db
    .select({ appSlug: classroomAppInstalls.appSlug })
    .from(classroomAppInstalls)
    .where(inArray(classroomAppInstalls.classroomId, classroomIds));

  const slugs = new Set(installs.map((i) => i.appSlug));
  return APP_CATALOG.filter((a) => slugs.has(a.slug));
}

/** Installs for one classroom (teacher panel). */
export async function listInstallsForClassroom(
  classroomId: string,
): Promise<{ appSlug: string; id: string }[]> {
  const db = getDb();
  return db
    .select({
      id: classroomAppInstalls.id,
      appSlug: classroomAppInstalls.appSlug,
    })
    .from(classroomAppInstalls)
    .where(eq(classroomAppInstalls.classroomId, classroomId));
}

export async function setClassroomAppInstall(opts: {
  classroomId: string;
  appSlug: string;
  install: boolean;
  teacherProfileId: string;
}): Promise<{ ok: true } | { error: string }> {
  if (!getApp(opts.appSlug)) {
    return { error: "Unknown app" };
  }

  const db = getDb();
  const [room] = await db
    .select()
    .from(classrooms)
    .where(
      and(
        eq(classrooms.id, opts.classroomId),
        eq(classrooms.rebbeId, opts.teacherProfileId),
      ),
    )
    .limit(1);

  if (!room) {
    return { error: "Class not found" };
  }

  if (opts.install) {
    const [existing] = await db
      .select({ id: classroomAppInstalls.id })
      .from(classroomAppInstalls)
      .where(
        and(
          eq(classroomAppInstalls.classroomId, opts.classroomId),
          eq(classroomAppInstalls.appSlug, opts.appSlug),
        ),
      )
      .limit(1);
    if (!existing) {
      await db.insert(classroomAppInstalls).values({
        classroomId: opts.classroomId,
        appSlug: opts.appSlug,
        installedByProfileId: opts.teacherProfileId,
      });
    }
  } else {
    await db
      .delete(classroomAppInstalls)
      .where(
        and(
          eq(classroomAppInstalls.classroomId, opts.classroomId),
          eq(classroomAppInstalls.appSlug, opts.appSlug),
        ),
      );
  }

  return { ok: true };
}
