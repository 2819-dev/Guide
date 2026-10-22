import { NextResponse } from "next/server";
import { desc, eq } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "@/lib/db";
import { requireProfile } from "@/lib/profile";
import { suggestions } from "@/lib/schema";
import { isStudentSuggestionsBlocked } from "@/lib/suggestions-access";

export const runtime = 'edge';

const createSchema = z.object({
  title: z.string().trim().min(2).max(200),
  body: z.string().trim().min(4).max(8000),
  published: z.boolean().optional(),
});

/** Students: published list (or locked). Official: all + create. */
export async function GET() {
  const authz = await requireProfile();
  if (!authz) {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }

  const isOfficial =
    authz.profile.role === "admin" || authz.profile.role === "moderator";

  if (!isOfficial) {
    const access = await isStudentSuggestionsBlocked(authz.profile.id);
    if (access.blocked) {
      return NextResponse.json({
        suggestions: [],
        blocked: true,
        reason: access.reason,
      });
    }
  }

  const db = getDb();
  const rows = isOfficial
    ? await db.select().from(suggestions).orderBy(desc(suggestions.createdAt))
    : await db
        .select()
        .from(suggestions)
        .where(eq(suggestions.published, true))
        .orderBy(desc(suggestions.createdAt));

  return NextResponse.json({
    suggestions: rows.map((s) => ({
      id: s.id,
      title: s.title,
      body: s.body,
      published: s.published,
      createdAt: s.createdAt,
    })),
    blocked: false,
    reason: null,
  });
}

export async function POST(request: Request) {
  const authz = await requireProfile(["admin", "moderator"]);
  if (!authz) {
    return NextResponse.json({ error: "Guide Official access required" }, { status: 403 });
  }

  try {
    const body = createSchema.parse(await request.json());
    const db = getDb();
    const [row] = await db
      .insert(suggestions)
      .values({
        title: body.title,
        body: body.body,
        published: body.published ?? true,
        createdByProfileId: authz.profile.id,
      })
      .returning();

    return NextResponse.json({ suggestion: row }, { status: 201 });
  } catch (error) {
    console.error(error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Please add a title and suggestion text." },
        { status: 400 },
      );
    }
    return NextResponse.json({ error: "Could not create suggestion" }, { status: 500 });
  }
}
