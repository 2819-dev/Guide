import { NextResponse } from "next/server";
import { desc, eq } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "@/lib/db";
import { parseDafId } from "@/lib/daf";
import { getOrCreateLearner } from "@/lib/session";
import { studyNotes } from "@/lib/schema";

const postSchema = z.object({
  dafId: z.string().min(2).max(8),
  title: z.string().min(1).max(200).optional(),
  content: z.string().min(10).max(50_000),
  sourceFilename: z.string().max(255).optional(),
});

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const dafId = searchParams.get("dafId");
    if (!dafId || !parseDafId(dafId)) {
      return NextResponse.json({ error: "Valid dafId required" }, { status: 400 });
    }
    const learner = await getOrCreateLearner();
    const db = getDb();
    const notes = await db
      .select()
      .from(studyNotes)
      .where(eq(studyNotes.learnerId, learner.id))
      .orderBy(desc(studyNotes.createdAt));

    return NextResponse.json({
      notes: notes.filter((n) => n.dafId === dafId),
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to load notes" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = postSchema.parse(await request.json());
    if (!parseDafId(body.dafId)) {
      return NextResponse.json({ error: "Invalid dafId" }, { status: 400 });
    }
    const learner = await getOrCreateLearner();
    const db = getDb();
    const [note] = await db
      .insert(studyNotes)
      .values({
        learnerId: learner.id,
        dafId: body.dafId,
        title: body.title ?? "Study notes",
        content: body.content,
        sourceFilename: body.sourceFilename,
      })
      .returning();

    return NextResponse.json({ note }, { status: 201 });
  } catch (error) {
    console.error(error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.flatten() }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed to save notes" }, { status: 500 });
  }
}
