import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "@/lib/db";
import { resolveTractateAndDaf } from "@/lib/daf";
import { requireProfile } from "@/lib/profile";
import { progress } from "@/lib/schema";
import { getFeaturedTractate, getTractate } from "@/lib/tractates";

export const runtime = 'edge';

export async function GET(request: Request) {
  const authz = await requireProfile(["customer", "rebbe", "admin"]);
  if (!authz) {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }
  try {
    const tractateParam =
      new URL(request.url).searchParams.get("tractate") ?? undefined;
    const db = getDb();
    const rows = await db
      .select()
      .from(progress)
      .where(eq(progress.profileId, authz.profile.id));
    const filtered = tractateParam
      ? rows.filter((r) => r.tractateSlug === tractateParam)
      : rows;
    return NextResponse.json({ progress: filtered });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Could not load progress" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const authz = await requireProfile(["customer", "rebbe", "admin"]);
  if (!authz) {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }
  try {
    const body = z
      .object({
        dafId: z.string(),
        tractateSlug: z.string().optional(),
      })
      .parse(await request.json());
    const tractateSlug =
      body.tractateSlug ?? getFeaturedTractate().slug;
    if (!getTractate(tractateSlug)?.available) {
      return NextResponse.json({ error: "Unknown tractate" }, { status: 400 });
    }
    if (!resolveTractateAndDaf(tractateSlug, body.dafId)) {
      return NextResponse.json({ error: "Invalid daf" }, { status: 400 });
    }
    const db = getDb();
    const existing = await db
      .select()
      .from(progress)
      .where(
        and(
          eq(progress.profileId, authz.profile.id),
          eq(progress.tractateSlug, tractateSlug),
          eq(progress.dafId, body.dafId),
        ),
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
        profileId: authz.profile.id,
        tractateSlug,
        dafId: body.dafId,
        visited: true,
      })
      .returning();
    return NextResponse.json({ progress: row }, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Could not save progress" }, { status: 500 });
  }
}
