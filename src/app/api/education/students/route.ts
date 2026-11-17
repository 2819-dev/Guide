import { NextResponse } from "next/server";
import { z } from "zod";
import { hasEducationAccess } from "@/lib/education-access";
import { requireProfile } from "@/lib/profile";
import {
  createStudentAccount,
  pendingRequestsForTeacher,
  resetStudentPassword,
  schoolIdForEducator,
  teacherOwnsClassroom,
  teacherTeachesStudent,
} from "@/lib/student-accounts";

export const runtime = "edge";

async function teacher() {
  const authz = await requireProfile(["rebbe", "admin"]);
  if (!authz || !(await hasEducationAccess(authz.profile))) return null;
  return authz.profile;
}

function originOf(request: Request) {
  return (
    request.headers.get("origin") ||
    process.env.NEXT_PUBLIC_GUIDE_URL?.trim() ||
    "https://guidelearning.org"
  );
}

/** Pending password-help requests for this teacher's students. */
export async function GET() {
  const me = await teacher();
  if (!me) return NextResponse.json({ error: "You don’t have access to this. Log in with the correct account." }, { status: 403 });
  const requests = await pendingRequestsForTeacher(me.id);
  return NextResponse.json({ requests });
}

const createBody = z.object({
  action: z.literal("create"),
  classroomId: z.string().uuid(),
  displayName: z.string().trim().min(1, "Enter the student’s name.").max(120),
  username: z
    .string()
    .trim()
    .min(1, "Enter a username.")
    .max(40, "Usernames can be up to 40 characters."),
  password: z.string().min(8, "Passwords need at least 8 characters.").max(128),
});

const resetBody = z.object({
  action: z.literal("reset"),
  studentId: z.string().uuid(),
  password: z.string().min(8, "Passwords need at least 8 characters.").max(128),
});

/** Create a student account in a class, or set a student's new password. */
export async function POST(request: Request) {
  const me = await teacher();
  if (!me) return NextResponse.json({ error: "You don’t have access to this. Log in with the correct account." }, { status: 403 });

  const raw = await request.json().catch(() => null);
  const parsed = z.discriminatedUnion("action", [createBody, resetBody]).safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Check the form and try again." },
      { status: 400 },
    );
  }
  const body = parsed.data;

  if (body.action === "create") {
    if (!(await teacherOwnsClassroom(me.id, body.classroomId))) {
      return NextResponse.json({ error: "That class couldn’t be found. Refresh the page and try again." }, { status: 404 });
    }
    const schoolId = await schoolIdForEducator(me);
    if (!schoolId) {
      return NextResponse.json(
        { error: "Your account isn’t linked to a school yet. Use Get help on your account page to contact the Guide team." },
        { status: 400 },
      );
    }
    const result = await createStudentAccount({
      schoolId,
      classroomId: body.classroomId,
      displayName: body.displayName,
      username: body.username,
      password: body.password,
      origin: originOf(request),
    });
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: 400 });
    return NextResponse.json({ ok: true, studentId: result.studentId }, { status: 201 });
  }

  if (!(await teacherTeachesStudent(me.id, body.studentId))) {
    return NextResponse.json({ error: "That student isn’t in any of your classes." }, { status: 404 });
  }
  const result = await resetStudentPassword({
    studentId: body.studentId,
    password: body.password,
    resolvedBy: me.id,
    origin: originOf(request),
  });
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 400 });
  return NextResponse.json({ ok: true });
}
