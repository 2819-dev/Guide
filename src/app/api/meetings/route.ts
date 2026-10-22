import { NextResponse } from "next/server";
import { desc, eq } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "@/lib/db";
import { requireProfile } from "@/lib/profile";
import { meetingRequests } from "@/lib/schema";

export const runtime = "edge";

const submitSchema = z.object({
  contactName: z.string().trim().min(2).max(120),
  contactEmail: z.string().trim().email().max(254),
  organization: z.string().trim().min(2).max(200),
  contactRole: z.string().trim().min(2).max(120),
  preferredTime: z.string().trim().max(200).optional().default(""),
  message: z.string().trim().min(10).max(4000),
});

const reviewSchema = z.object({
  requestId: z.string().uuid(),
  status: z.enum(["pending", "contacted", "scheduled", "closed"]),
  reviewNote: z.string().trim().max(2000).optional(),
});

export async function GET() {
  const authz = await requireProfile(["admin", "moderator"]);
  if (!authz) {
    return NextResponse.json({ error: "Access required" }, { status: 403 });
  }

  const db = getDb();
  const rows = await db
    .select()
    .from(meetingRequests)
    .orderBy(desc(meetingRequests.createdAt));

  return NextResponse.json({ requests: rows });
}

export async function POST(request: Request) {
  try {
    const body = submitSchema.parse(await request.json());
    const db = getDb();
    const [row] = await db
      .insert(meetingRequests)
      .values({
        contactName: body.contactName,
        contactEmail: body.contactEmail.toLowerCase(),
        organization: body.organization,
        contactRole: body.contactRole,
        preferredTime: body.preferredTime || null,
        message: body.message,
        status: "pending",
      })
      .returning();

    return NextResponse.json({ request: { id: row.id, status: row.status } });
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json(
        { error: e.issues[0]?.message ?? "Invalid request" },
        { status: 400 },
      );
    }
    return NextResponse.json({ error: "Could not submit" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  const authz = await requireProfile(["admin", "moderator"]);
  if (!authz) {
    return NextResponse.json({ error: "Access required" }, { status: 403 });
  }

  try {
    const body = reviewSchema.parse(await request.json());
    const db = getDb();
    const [updated] = await db
      .update(meetingRequests)
      .set({
        status: body.status,
        reviewNote: body.reviewNote ?? null,
        reviewedByProfileId: authz.profile.id,
        reviewedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(meetingRequests.id, body.requestId))
      .returning();

    if (!updated) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json({ request: updated });
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json(
        { error: e.issues[0]?.message ?? "Invalid request" },
        { status: 400 },
      );
    }
    return NextResponse.json({ error: "Could not update" }, { status: 500 });
  }
}
