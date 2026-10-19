import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "@/lib/db";
import { parseDafId } from "@/lib/daf";
import { requireProfile } from "@/lib/profile";
import { progress } from "@/lib/schema";

export async function GET() {
  const authz = await requireProfile(["customer", "rebbe", "admin"]);
  if (!authz) {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }
  try {
    const db = getDb();
    const rows = await db
      .select()
      .from(progress)
      .where(eq(progress.profileId, authz.profile.id));
    return NextResponse.json({ progress: rows });
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
    const body = z.object({ dafId: z.string() }).parse(await request.json());
    if (!parseDafId(body.dafId)) {
      return NextResponse.json({ error: "Invalid daf" }, { status: 400 });
    }
    const db = getDb();
    const existing = await db
      .select()
      .from(progress)
      .where(
        and(
          eq(progress.profileId, authz.profile.id),
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
