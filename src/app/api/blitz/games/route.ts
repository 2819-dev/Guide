import { NextResponse } from "next/server";
import { z } from "zod";
import { hasEducationAccess } from "@/lib/education-access";
import { requireProfile } from "@/lib/profile";
import { hostGame, listGamesForHost, viewForHost } from "@/lib/blitz/store";

export const runtime = "edge";

export async function GET() {
  const authz = await requireProfile(["rebbe", "admin"]);
  if (!authz || !(await hasEducationAccess(authz.profile))) {
    return NextResponse.json({ error: "This is only available to teachers." }, { status: 403 });
  }
  const games = await listGamesForHost(authz.profile.id);
  return NextResponse.json({ games });
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
        classroomId: z.string().uuid().nullable().optional(),
        settings: z
          .object({
            allowNicknames: z.boolean().optional(),
            allowAvatars: z.boolean().optional(),
            musicEnabled: z.boolean().optional(),
            mode: z.enum(["classic", "accuracy", "team"]).optional(),
            theme: z
              .enum(["night", "arcade", "ocean", "sunset", "space"])
              .optional(),
            teamCount: z.number().int().min(2).max(4).optional(),
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
    const message = error instanceof Error ? error.message : "Could not open the lobby.";
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "That request wasn’t valid. Refresh the page and try again." }, { status: 400 });
    }
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
