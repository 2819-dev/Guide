import { NextResponse } from "next/server";
import { requireProfile } from "@/lib/profile";
import { peekGame } from "@/lib/blitz/store";

export const runtime = "edge";

/** Join screen step 1: does this PIN exist, and what can the player set? */
export async function GET(request: Request) {
  const authz = await requireProfile();
  if (!authz) {
    return NextResponse.json(
      { error: "Sign in to Guide to join Blitz." },
      { status: 401 },
    );
  }
  const pin = new URL(request.url).searchParams.get("pin") ?? "";
  const game = await peekGame(pin);
  if (!game || game.phase === "ended") {
    return NextResponse.json(
      { error: "No live game with that PIN. Check the screen and try again." },
      { status: 404 },
    );
  }
  return NextResponse.json({ game });
}
