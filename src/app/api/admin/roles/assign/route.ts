import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "@/lib/db";
import { requireProfile } from "@/lib/profile";
import { profiles, roleBadgeAssignments, roleBadges } from "@/lib/schema";

const schema = z.object({
  roleBadgeId: z.string().uuid(),
  profileId: z.string().uuid(),
  assign: z.boolean(),
});

/** Assign or remove a Discord-style role from a person. */
export async function POST(request: Request) {
  const authz = await requireProfile(["admin", "moderator"]);
  if (!authz) {
    return NextResponse.json({ error: "Access required" }, { status: 403 });
  }

  try {
    const body = schema.parse(await request.json());
    const db = getDb();

    const [role] = await db
      .select()
      .from(roleBadges)
      .where(eq(roleBadges.id, body.roleBadgeId))
      .limit(1);
    if (!role) {
      return NextResponse.json({ error: "Role not found" }, { status: 404 });
    }

    const [person] = await db
      .select()
      .from(profiles)
      .where(eq(profiles.id, body.profileId))
      .limit(1);
    if (!person) {
      return NextResponse.json({ error: "Person not found" }, { status: 404 });
    }

    if (body.assign) {
      const [existing] = await db
        .select()
        .from(roleBadgeAssignments)
        .where(
          and(
            eq(roleBadgeAssignments.roleBadgeId, body.roleBadgeId),
            eq(roleBadgeAssignments.profileId, body.profileId),
          ),
        )
        .limit(1);
      if (!existing) {
        await db.insert(roleBadgeAssignments).values({
          roleBadgeId: body.roleBadgeId,
          profileId: body.profileId,
          assignedByProfileId: authz.profile.id,
        });
      }
    } else {
      await db
        .delete(roleBadgeAssignments)
        .where(
          and(
            eq(roleBadgeAssignments.roleBadgeId, body.roleBadgeId),
            eq(roleBadgeAssignments.profileId, body.profileId),
          ),
        );
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error(error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }
    return NextResponse.json({ error: "Could not update assignment" }, { status: 500 });
  }
}
