import { NextResponse } from "next/server";
import { getOrCreateLearner } from "@/lib/session";

export async function GET() {
  try {
    const learner = await getOrCreateLearner();
    return NextResponse.json({
      ok: true,
      learnerId: learner.id,
      displayName: learner.displayName,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Session unavailable" }, { status: 500 });
  }
}
