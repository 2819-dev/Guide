import { NextResponse } from "next/server";
import { z } from "zod";
import { hasEducationAccess } from "@/lib/education-access";
import { requireProfile } from "@/lib/profile";
import {
  deleteQuiz,
  getQuiz,
  setQuizPublic,
  updateQuiz,
} from "@/lib/testquiz/store";

export const runtime = "edge";

type Ctx = { params: Promise<{ id: string }> };

async function requireTeacher() {
  const authz = await requireProfile(["rebbe", "admin"]);
  if (!authz) return null;
  if (!(await hasEducationAccess(authz.profile))) return null;
  return authz;
}

export async function GET(_req: Request, ctx: Ctx) {
  const authz = await requireProfile();
  if (!authz) {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }
  const { id } = await ctx.params;
  const quiz = await getQuiz(id);
  if (!quiz) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (quiz.ownerProfileId !== authz.profile.id && authz.profile.role !== "admin") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json({ quiz });
}

export async function PATCH(request: Request, ctx: Ctx) {
  const authz = await requireTeacher();
  if (!authz) {
    return NextResponse.json({ error: "Teachers only" }, { status: 403 });
  }
  const { id } = await ctx.params;
  try {
    const body = z
      .object({
        title: z.string().min(1).max(200).optional(),
        description: z.string().max(2000).optional(),
        classroomId: z.string().uuid().nullable().optional(),
        questions: z.array(z.unknown()).optional(),
        category: z.string().max(64).optional(),
        tags: z.array(z.string().max(40)).max(12).optional(),
        isPublic: z.boolean().optional(),
      })
      .parse(await request.json());

    let quiz =
      body.title !== undefined ||
      body.description !== undefined ||
      body.classroomId !== undefined ||
      body.questions !== undefined ||
      body.category !== undefined ||
      body.tags !== undefined
        ? await updateQuiz({
            quizId: id,
            ownerProfileId: authz.profile.id,
            title: body.title,
            description: body.description,
            classroomId: body.classroomId,
            questions: body.questions as never,
            category: body.category,
            tags: body.tags,
          })
        : await getQuiz(id);

    if (!quiz || quiz.ownerProfileId !== authz.profile.id) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    if (body.isPublic !== undefined) {
      quiz = await setQuizPublic({
        quizId: id,
        ownerProfileId: authz.profile.id,
        isPublic: body.isPublic,
        category: body.category,
      });
    }

    return NextResponse.json({ quiz });
  } catch (error) {
    console.error(error);
    const message = error instanceof Error ? error.message : "Could not update";
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function DELETE(_req: Request, ctx: Ctx) {
  const authz = await requireTeacher();
  if (!authz) {
    return NextResponse.json({ error: "Teachers only" }, { status: 403 });
  }
  const { id } = await ctx.params;
  try {
    await deleteQuiz(id, authz.profile.id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error(error);
    const message = error instanceof Error ? error.message : "Could not delete";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
