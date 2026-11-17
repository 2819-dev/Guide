import { NextResponse } from "next/server";
import { requireProfile } from "@/lib/profile";
import {
  tickGame,
  viewForHost,
  viewForPlayer,
} from "@/lib/blitz/store";

export const runtime = "edge";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: Request, ctx: Ctx) {
  const authz = await requireProfile();
  if (!authz) {
    return NextResponse.json({ error: "Sign in to continue." }, { status: 401 });
  }
  const { id } = await ctx.params;
  const state = await tickGame(id);
  if (!state) {
    return NextResponse.json({ error: "Game not found." }, { status: 404 });
  }

  const isHost =
    state.hostProfileId === authz.profile.id || authz.profile.role === "admin";
  const isPlayer = state.players.some(
    (p) => p.id === authz.profile.id && !p.kicked,
  );

  if (!isHost && !isPlayer) {
    return NextResponse.json({ error: "You’re not in this game. Join with the PIN first." }, { status: 403 });
  }

  if (isHost) {
    return NextResponse.json({
      game: viewForHost(state),
      role: "host" as const,
      serverNowMs: Date.now(),
    });
  }
  return NextResponse.json({
    game: viewForPlayer(state, authz.profile.id),
    role: "player" as const,
    playerId: authz.profile.id,
    serverNowMs: Date.now(),
  });
}
