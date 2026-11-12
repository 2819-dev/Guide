import { NextResponse } from "next/server";
import { z } from "zod";
import { requireProfile } from "@/lib/profile";
import {
  hostAction,
  submitAnswer,
  updateHostSettings,
  viewForHost,
  viewForPlayer,
} from "@/lib/testquiz/store";

export const runtime = "edge";

type Ctx = { params: Promise<{ id: string }> };

export async function POST(request: Request, ctx: Ctx) {
  const authz = await requireProfile();
  if (!authz) {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }
  const { id } = await ctx.params;

  try {
    const body = z
      .object({
        kind: z.enum(["host", "settings", "answer"]),
        action: z
          .object({
            type: z.enum([
              "start",
              "lock",
              "reveal",
              "leaderboard",
              "next",
              "skip",
              "podium",
              "end",
              "kick",
              "mute_music",
            ]),
            playerId: z.string().uuid().optional(),
            muted: z.boolean().optional(),
          })
          .optional(),
        settings: z
          .object({
            allowNicknames: z.boolean().optional(),
            allowAvatars: z.boolean().optional(),
            musicEnabled: z.boolean().optional(),
          })
          .optional(),
        payload: z
          .object({
            choiceIds: z.array(z.string()).optional(),
            text: z.string().max(500).optional(),
            number: z.number().optional(),
            order: z.array(z.string()).optional(),
            pinX: z.number().min(0).max(1).optional(),
            pinY: z.number().min(0).max(1).optional(),
          })
          .optional(),
      })
      .parse(await request.json());

    if (body.kind === "host") {
      if (!body.action) {
        return NextResponse.json({ error: "Missing action" }, { status: 400 });
      }
      const action =
        body.action.type === "kick"
          ? { type: "kick" as const, playerId: body.action.playerId! }
          : body.action.type === "mute_music"
            ? { type: "mute_music" as const, muted: !!body.action.muted }
            : { type: body.action.type };

      const state = await hostAction(id, authz.profile.id, action);
      return NextResponse.json({ game: viewForHost(state) });
    }

    if (body.kind === "settings") {
      const state = await updateHostSettings(
        id,
        authz.profile.id,
        body.settings ?? {},
      );
      return NextResponse.json({ game: viewForHost(state) });
    }

    if (body.kind === "answer") {
      const result = await submitAnswer({
        gameId: id,
        playerId: authz.profile.id,
        payload: body.payload ?? {},
      });
      // Re-fetch view after submit is inside submitAnswer's save; get via hostAction path
      const { getGame } = await import("@/lib/testquiz/store");
      const state = await getGame(id);
      return NextResponse.json({
        ...result,
        game: state ? viewForPlayer(state, authz.profile.id) : null,
      });
    }

    return NextResponse.json({ error: "Unknown kind" }, { status: 400 });
  } catch (error) {
    console.error(error);
    const message = error instanceof Error ? error.message : "Action failed";
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
