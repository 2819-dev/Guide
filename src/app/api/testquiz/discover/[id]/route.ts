import { NextResponse } from "next/server";
import { hasEducationAccess } from "@/lib/education-access";
import { requireProfile } from "@/lib/profile";
import { copyDiscoverQuiz, getDiscoverQuiz } from "@/lib/testquiz/store";

export const runtime = "edge";

type Ctx = { params: Promise<{ id: string }> };

async function requireTeacher() {
  const authz = await requireProfile(["rebbe", "admin"]);
  if (!authz) return null;
  if (!(await hasEducationAccess(authz.profile))) return null;
  return authz;
}

/** Preview a public Discover quiz (teachers only). */
export async function GET(_request: Request, ctx: Ctx) {
  const authz = await requireTeacher();
  if (!authz) {
    return NextResponse.json({ error: "Teachers only" }, { status: 403 });
  }
  const { id } = await ctx.params;
  const quiz = await getDiscoverQuiz(id);
  if (!quiz) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json({ quiz });
}

/** Copy Discover quiz into the teacher's library. */
export async function POST(_request: Request, ctx: Ctx) {
  const authz = await requireTeacher();
  if (!authz) {
    return NextResponse.json({ error: "Teachers only" }, { status: 403 });
  }
  const { id } = await ctx.params;
  try {
    const quiz = await copyDiscoverQuiz({
      sourceQuizId: id,
      ownerProfileId: authz.profile.id,
    });
    return NextResponse.json({ quiz });
  } catch (error) {
    console.error(error);
    const message =
      error instanceof Error ? error.message : "Could not copy quiz";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
