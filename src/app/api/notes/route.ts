import { NextResponse } from "next/server";
import { and, desc, eq } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "@/lib/db";
import { resolveTractateAndDaf } from "@/lib/daf";
import { requireProfile } from "@/lib/profile";
import { studyNotes } from "@/lib/schema";
import { getFeaturedTractate, getTractate } from "@/lib/tractates";

export const runtime = 'edge';

const postSchema = z.object({
  dafId: z.string().min(2).max(8),
  tractateSlug: z.string().optional(),
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
    const url = new URL(request.url);
    const dafId = url.searchParams.get("dafId");
    const tractateSlug =
      url.searchParams.get("tractate") ?? getFeaturedTractate().slug;
    if (!dafId || !resolveTractateAndDaf(tractateSlug, dafId)) {
      return NextResponse.json({ error: "Valid daf required" }, { status: 400 });
    }
    const db = getDb();
    const notes = await db
      .select()
      .from(studyNotes)
      .where(
        and(
          eq(studyNotes.profileId, authz.profile.id),
          eq(studyNotes.tractateSlug, tractateSlug),
          eq(studyNotes.dafId, dafId),
        ),
      )
      .orderBy(desc(studyNotes.createdAt));
    return NextResponse.json({ notes });
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
    const tractateSlug =
      body.tractateSlug ?? getFeaturedTractate().slug;
    if (!getTractate(tractateSlug)?.available) {
      return NextResponse.json({ error: "Unknown tractate" }, { status: 400 });
    }
    if (!resolveTractateAndDaf(tractateSlug, body.dafId)) {
      return NextResponse.json({ error: "Invalid daf" }, { status: 400 });
    }
    const db = getDb();
    const [note] = await db
      .insert(studyNotes)
      .values({
        profileId: authz.profile.id,
        tractateSlug,
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
