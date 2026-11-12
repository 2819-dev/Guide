import { NextResponse } from "next/server";
import { z } from "zod";
import { requireProfile } from "@/lib/profile";
import { joinGame, viewForPlayer } from "@/lib/testquiz/store";

export const runtime = "edge";

/** Students (and any signed-in Guide user) join with PIN — no guests. */
export async function POST(request: Request) {
  const authz = await requireProfile();
  if (!authz) {
    return NextResponse.json(
      { error: "Sign in to Guide to join TestQuiz." },
      { status: 401 },
    );
  }
  try {
    const body = z
      .object({
        pin: z.string().min(4).max(12),
        nickname: z.string().max(24).nullable().optional(),
        avatarId: z.string().max(32).nullable().optional(),
      })
      .parse(await request.json());

    const { state, playerId } = await joinGame({
      pin: body.pin,
      profileId: authz.profile.id,
      realName: authz.profile.displayName,
      nickname: body.nickname,
      avatarId: body.avatarId,
    });

    return NextResponse.json({
      game: viewForPlayer(state, playerId),
      playerId,
    });
  } catch (error) {
    console.error(error);
    const message = error instanceof Error ? error.message : "Could not join";
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
