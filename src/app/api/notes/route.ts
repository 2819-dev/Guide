import { NextResponse } from "next/server";
import { desc, eq } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "@/lib/db";
import { parseDafId } from "@/lib/daf";
import { requireProfile } from "@/lib/profile";
import { studyNotes } from "@/lib/schema";

const postSchema = z.object({
  dafId: z.string().min(2).max(8),
  title: z.string().min(1).max(200).optional(),
  content: z.string().min(10).max(50_000),
  sourceFilename: z.string().max(255).optional(),
});

export async function GET(request: Request) {
  const authz = await requireProfile(["customer", "rebbe", "admin"]);
  if (!authz) {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }
  try {
    const dafId = new URL(request.url).searchParams.get("dafId");
    if (!dafId || !parseDafId(dafId)) {
      return NextResponse.json({ error: "Valid daf required" }, { status: 400 });
    }
    const db = getDb();
    const notes = await db
      .select()
      .from(studyNotes)
      .where(eq(studyNotes.profileId, authz.profile.id))
      .orderBy(desc(studyNotes.createdAt));
    return NextResponse.json({
      notes: notes.filter((n) => n.dafId === dafId),
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Could not load notes" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const authz = await requireProfile(["customer", "rebbe", "admin"]);
  if (!authz) {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }
  try {
    const body = postSchema.parse(await request.json());
    if (!parseDafId(body.dafId)) {
      return NextResponse.json({ error: "Invalid daf" }, { status: 400 });
    }
    const db = getDb();
    const [note] = await db
      .insert(studyNotes)
      .values({
        profileId: authz.profile.id,
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
      return NextResponse.json({ error: "Invalid notes" }, { status: 400 });
    }
    return NextResponse.json({ error: "Could not save notes" }, { status: 500 });
  }
}
