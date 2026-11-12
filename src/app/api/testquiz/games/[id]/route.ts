import { NextResponse } from "next/server";
import { requireProfile } from "@/lib/profile";
import {
  getGame,
  tickGame,
  viewForHost,
  viewForPlayer,
} from "@/lib/testquiz/store";

export const runtime = "edge";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: Request, ctx: Ctx) {
  const authz = await requireProfile();
  if (!authz) {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }
  const { id } = await ctx.params;
  await tickGame(id);
  const state = await getGame(id);
  if (!state) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const isHost =
    state.hostProfileId === authz.profile.id || authz.profile.role === "admin";
  const isPlayer = state.players.some(
    (p) => p.id === authz.profile.id && !p.kicked,
  );

  if (!isHost && !isPlayer) {
    return NextResponse.json({ error: "Not in this game" }, { status: 403 });
  }

  if (isHost) {
    return NextResponse.json({
      game: viewForHost(state),
      role: "host" as const,
    });
  }
  return NextResponse.json({
    game: viewForPlayer(state, authz.profile.id),
    role: "player" as const,
    playerId: authz.profile.id,
  });
}
