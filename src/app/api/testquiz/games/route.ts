import { NextResponse } from "next/server";
import { z } from "zod";
import { hasEducationAccess } from "@/lib/education-access";
import { requireProfile } from "@/lib/profile";
import { hostGame, listGamesForHost, viewForHost } from "@/lib/testquiz/store";

export const runtime = "edge";

export async function GET() {
  const authz = await requireProfile(["rebbe", "admin"]);
  if (!authz || !(await hasEducationAccess(authz.profile))) {
    return NextResponse.json({ error: "Teachers only" }, { status: 403 });
  }
  const games = await listGamesForHost(authz.profile.id);
  return NextResponse.json({ games });
}

export async function POST(request: Request) {
  const authz = await requireProfile(["rebbe", "admin"]);
  if (!authz || !(await hasEducationAccess(authz.profile))) {
    return NextResponse.json({ error: "Teachers only" }, { status: 403 });
  }
  try {
    const body = z
      .object({
        quizId: z.string().uuid(),
        classroomId: z.string().uuid().nullable().optional(),
        settings: z
          .object({
            allowNicknames: z.boolean().optional(),
            allowAvatars: z.boolean().optional(),
            musicEnabled: z.boolean().optional(),
          })
          .optional(),
      })
      .parse(await request.json());

    const state = await hostGame({
      quizId: body.quizId,
      hostProfileId: authz.profile.id,
      classroomId: body.classroomId,
      settings: body.settings,
    });
    return NextResponse.json({ game: viewForHost(state) });
  } catch (error) {
    console.error(error);
    const message = error instanceof Error ? error.message : "Could not host";
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
