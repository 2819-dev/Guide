import { NextResponse } from "next/server";
import { z } from "zod";
import { hasEducationAccess } from "@/lib/education-access";
import { requireProfile, type Profile } from "@/lib/profile";
import {
  createChallenge,
  listStudentChallenges,
  listTeacherChallenges,
} from "@/lib/blitz/challenge";

export const runtime = "edge";

async function isTeacher(profile: Profile) {
  return (
    (profile.role === "rebbe" || profile.role === "admin") &&
    (await hasEducationAccess(profile))
  );
}

/** Teachers: challenges they assigned. Students: challenges for their classes. */
export async function GET() {
  const authz = await requireProfile();
  if (!authz) {
    return NextResponse.json({ error: "Sign in to continue." }, { status: 401 });
  }
  try {
    if (await isTeacher(authz.profile)) {
      const challenges = await listTeacherChallenges(authz.profile.id);
      return NextResponse.json({ role: "teacher", challenges });
    }
    const challenges = await listStudentChallenges(authz.profile.id);
    return NextResponse.json({ role: "student", challenges });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Could not load challenges. Try again." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const authz = await requireProfile(["rebbe", "admin"]);
  if (!authz || !(await hasEducationAccess(authz.profile))) {
    return NextResponse.json({ error: "This is only available to teachers." }, { status: 403 });
  }
  try {
    const body = z
      .object({
        quizId: z.string().uuid(),
        classroomId: z.string().uuid(),
        dueAt: z.string().datetime({ offset: true }).nullable().optional(),
        mode: z.enum(["classic", "accuracy"]).optional(),
        theme: z.enum(["night", "arcade", "ocean", "sunset", "space"]).optional(),
      })
      .parse(await request.json());
    const challenge = await createChallenge({
      ownerProfileId: authz.profile.id,
      quizId: body.quizId,
      classroomId: body.classroomId,
      dueAt: body.dueAt ? new Date(body.dueAt) : null,
      mode: body.mode ?? "classic",
      theme: body.theme ?? "night",
    });
    return NextResponse.json({ challenge });
  } catch (error) {
    console.error(error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "That request wasn’t valid. Refresh the page and try again." }, { status: 400 });
    }
    const message = error instanceof Error ? error.message : "Could not assign the challenge.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
