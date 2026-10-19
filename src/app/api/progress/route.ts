import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "@/lib/db";
import { parseDafId } from "@/lib/daf";
import { getOrCreateLearner } from "@/lib/session";
import { progress } from "@/lib/schema";

const visitSchema = z.object({
  dafId: z.string(),
});

export async function GET() {
  try {
    const learner = await getOrCreateLearner();
    const db = getDb();
    const rows = await db
      .select()
      .from(progress)
      .where(eq(progress.learnerId, learner.id));
    return NextResponse.json({ progress: rows });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to load progress" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = visitSchema.parse(await request.json());
    if (!parseDafId(body.dafId)) {
      return NextResponse.json({ error: "Invalid dafId" }, { status: 400 });
    }
    const learner = await getOrCreateLearner();
    const db = getDb();
    const existing = await db
      .select()
      .from(progress)
      .where(
        and(eq(progress.learnerId, learner.id), eq(progress.dafId, body.dafId)),
      )
      .limit(1);

    if (existing[0]) {
      const [row] = await db
        .update(progress)
        .set({ visited: true, lastVisitedAt: new Date() })
        .where(eq(progress.id, existing[0].id))
        .returning();
      return NextResponse.json({ progress: row });
    }

    const [row] = await db
      .insert(progress)
      .values({
        learnerId: learner.id,
        dafId: body.dafId,
        visited: true,
      })
      .returning();
    return NextResponse.json({ progress: row }, { status: 201 });
  } catch (error) {
    console.error(error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.flatten() }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed to save progress" }, { status: 500 });
  }
}
