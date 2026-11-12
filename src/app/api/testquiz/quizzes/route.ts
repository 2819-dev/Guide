import { NextResponse } from "next/server";
import { z } from "zod";
import { hasEducationAccess } from "@/lib/education-access";
import { requireProfile } from "@/lib/profile";
import { createQuiz, listQuizzesForOwner } from "@/lib/testquiz/store";

export const runtime = "edge";

async function requireTeacher() {
  const authz = await requireProfile(["rebbe", "admin"]);
  if (!authz) return null;
  if (!(await hasEducationAccess(authz.profile))) return null;
  return authz;
}

export async function GET() {
  const authz = await requireTeacher();
  if (!authz) {
    return NextResponse.json({ error: "Teachers only" }, { status: 403 });
  }
  const quizzes = await listQuizzesForOwner(authz.profile.id);
  return NextResponse.json({ quizzes });
}

export async function POST(request: Request) {
  const authz = await requireTeacher();
  if (!authz) {
    return NextResponse.json({ error: "Teachers only" }, { status: 403 });
  }
  try {
    const body = z
      .object({
        title: z.string().min(1).max(200).optional(),
        description: z.string().max(2000).optional(),
        classroomId: z.string().uuid().nullable().optional(),
        questions: z.array(z.unknown()).optional(),
      })
      .parse(await request.json());

    const quiz = await createQuiz({
      ownerProfileId: authz.profile.id,
      title: body.title ?? "Untitled quiz",
      description: body.description,
      classroomId: body.classroomId,
      questions: (body.questions as never) ?? [],
    });
    return NextResponse.json({ quiz });
  } catch (error) {
    console.error(error);
    const message = error instanceof Error ? error.message : "Could not create quiz";
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
