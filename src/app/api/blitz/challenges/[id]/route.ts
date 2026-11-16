import { NextResponse } from "next/server";
import { z } from "zod";
import { hasEducationAccess } from "@/lib/education-access";
import { requireProfile } from "@/lib/profile";
import {
  answerChallengeQuestion,
  beginChallengeQuestion,
  deleteChallenge,
  getChallengeReport,
  getStudentChallenge,
  setChallengeClosed,
} from "@/lib/blitz/challenge";

export const runtime = "edge";

type Ctx = { params: Promise<{ id: string }> };

/** Owner teacher → report. Class member → their play view. */
export async function GET(_req: Request, ctx: Ctx) {
  const authz = await requireProfile();
  if (!authz) {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }
  const { id } = await ctx.params;
  if (!z.string().uuid().safeParse(id).success) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  try {
    const report = await getChallengeReport(id, authz.profile.id);
    if (report) return NextResponse.json({ role: "teacher", ...report });
    const view = await getStudentChallenge(id, authz.profile.id);
    if (!view) {
      return NextResponse.json(
        { error: "This challenge isn’t assigned to any of your classes." },
        { status: 404 },
      );
    }
    return NextResponse.json({ role: "student", view });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Could not load challenge" }, { status: 500 });
  }
}

/** Student play actions: begin (start/resume clock) and answer. */
export async function POST(request: Request, ctx: Ctx) {
  const authz = await requireProfile();
  if (!authz) {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }
  const { id } = await ctx.params;
  try {
    const body = z
      .discriminatedUnion("kind", [
        z.object({ kind: z.literal("begin") }),
        z.object({
          kind: z.literal("answer"),
          questionId: z.string().min(1).max(64),
          payload: z.object({
            choiceIds: z.array(z.string()).max(12).optional(),
            text: z.string().max(500).optional(),
            number: z.number().optional(),
            order: z.array(z.string()).max(12).optional(),
            pinX: z.number().min(0).max(1).optional(),
            pinY: z.number().min(0).max(1).optional(),
          }),
        }),
      ])
      .parse(await request.json());

    if (body.kind === "begin") {
      const view = await beginChallengeQuestion(id, {
        id: authz.profile.id,
        displayName: authz.profile.displayName,
      });
      return NextResponse.json({ view });
    }
    const out = await answerChallengeQuestion(
      id,
      authz.profile.id,
      body.questionId,
      body.payload,
    );
    return NextResponse.json(out);
  } catch (error) {
    console.error(error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }
    const message = error instanceof Error ? error.message : "Action failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

/** Teacher: close / reopen. */
export async function PATCH(request: Request, ctx: Ctx) {
  const authz = await requireProfile(["rebbe", "admin"]);
  if (!authz || !(await hasEducationAccess(authz.profile))) {
    return NextResponse.json({ error: "Teachers only" }, { status: 403 });
  }
  const { id } = await ctx.params;
  try {
    const body = z.object({ closed: z.boolean() }).parse(await request.json());
    await setChallengeClosed(id, authz.profile.id, body.closed);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error(error);
    const message = error instanceof Error ? error.message : "Could not update";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function DELETE(_req: Request, ctx: Ctx) {
  const authz = await requireProfile(["rebbe", "admin"]);
  if (!authz || !(await hasEducationAccess(authz.profile))) {
    return NextResponse.json({ error: "Teachers only" }, { status: 403 });
  }
  const { id } = await ctx.params;
  await deleteChallenge(id, authz.profile.id);
  return NextResponse.json({ ok: true });
}
