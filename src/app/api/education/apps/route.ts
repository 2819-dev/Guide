import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { APP_CATALOG, isKnownAppSlug } from "@/lib/apps";
import {
  listInstallsForClassroom,
  listInstallsForTeacher,
  setClassroomAppInstall,
} from "@/lib/app-installs";
import { getDb } from "@/lib/db";
import { hasEducationAccess } from "@/lib/education-access";
import { requireProfile } from "@/lib/profile";
import { classrooms } from "@/lib/schema";

export const runtime = 'edge';

/** Catalog + per-class installs for the signed-in teacher. */
export async function GET() {
  const authz = await requireProfile(["rebbe", "admin"]);
  if (!authz) {
    return NextResponse.json({ error: "Access required" }, { status: 403 });
  }
  if (!(await hasEducationAccess(authz.profile))) {
    return NextResponse.json({ error: "School access required" }, { status: 403 });
  }

  const db = getDb();
  const rooms = await db
    .select({ id: classrooms.id, name: classrooms.name })
    .from(classrooms)
    .where(eq(classrooms.rebbeId, authz.profile.id));

  const installsByClassroom: Record<string, string[]> = {};
  for (const room of rooms) {
    const installs = await listInstallsForClassroom(room.id);
    installsByClassroom[room.id] = installs.map((i) => i.appSlug);
  }

  const teacherInstalls = await listInstallsForTeacher(authz.profile.id);

  return NextResponse.json({
    catalog: APP_CATALOG,
    classrooms: rooms,
    installsByClassroom,
    installs: teacherInstalls.map((i) => ({
      id: i.id,
      classroomId: i.classroomId,
      classroomName: i.classroomName,
      appSlug: i.appSlug,
    })),
  });
}

/** Add or remove an app on a class. */
export async function POST(request: Request) {
  const authz = await requireProfile(["rebbe", "admin"]);
  if (!authz) {
    return NextResponse.json({ error: "Access required" }, { status: 403 });
  }
  if (!(await hasEducationAccess(authz.profile))) {
    return NextResponse.json({ error: "School access required" }, { status: 403 });
  }

  try {
    const body = z
      .object({
        classroomId: z.string().uuid(),
        appSlug: z.string().min(1).max(64),
        install: z.boolean(),
      })
      .parse(await request.json());

    if (!isKnownAppSlug(body.appSlug)) {
      return NextResponse.json({ error: "Unknown app" }, { status: 400 });
    }

    const result = await setClassroomAppInstall({
      classroomId: body.classroomId,
      appSlug: body.appSlug,
      install: body.install,
      teacherProfileId: authz.profile.id,
    });

    if ("error" in result) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error(error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }
    return NextResponse.json({ error: "Could not update apps" }, { status: 500 });
  }
}
