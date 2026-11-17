import { NextResponse } from "next/server";
import { desc, eq } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "@/lib/db";
import { publicStudentCode } from "@/lib/roles";
import { requireProfile } from "@/lib/profile";
import { supportTickets } from "@/lib/schema";

export const runtime = 'edge';

function ticketNumber() {
  const n = Date.now().toString(36).toUpperCase();
  return `G-${n.slice(-8)}`;
}

export async function GET() {
  const authz = await requireProfile(["admin"]);
  if (!authz) {
    return NextResponse.json({ error: "Only Guide Officials can do this." }, { status: 403 });
  }

  const db = getDb();
  const rows = await db
    .select({
      id: supportTickets.id,
      ticketNumber: supportTickets.ticketNumber,
      category: supportTickets.category,
      subject: supportTickets.subject,
      body: supportTickets.body,
      status: supportTickets.status,
      reporterCode: supportTickets.reporterCode,
      createdAt: supportTickets.createdAt,
      updatedAt: supportTickets.updatedAt,
    })
    .from(supportTickets)
    .orderBy(desc(supportTickets.createdAt));

  // Explicitly omit any PII fields — only opaque reporter codes
  return NextResponse.json({
    tickets: rows.map((t) => ({
      ...t,
      // Never expose email/name; reporterCode is already opaque
    })),
    note: "Help requests show the request details only. Personal information is not shown here.",
  });
}

export async function POST(request: Request) {
  /** Anyone signed in can file a ticket; reporter identity stored as opaque code only */
  const authz = await requireProfile();
  if (!authz) {
    return NextResponse.json({ error: "Log in to continue." }, { status: 401 });
  }

  try {
    const body = z
      .object({
        category: z.enum([
          "study",
          "account",
          "education",
          "billing",
          "other",
        ]),
        subject: z.string().min(3).max(200),
        body: z.string().min(10).max(4000),
      })
      .parse(await request.json());

    const db = getDb();
    const [ticket] = await db
      .insert(supportTickets)
      .values({
        ticketNumber: ticketNumber(),
        category: body.category,
        subject: body.subject,
        body: body.body,
        reporterCode: publicStudentCode(authz.profile.id),
        status: "open",
      })
      .returning({
        ticketNumber: supportTickets.ticketNumber,
        status: supportTickets.status,
      });

    return NextResponse.json({ ticket }, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Your request wasn’t sent. Check the subject and details, then try again." }, { status: 400 });
  }
}

export async function PATCH(request: Request) {
  const authz = await requireProfile(["admin"]);
  if (!authz) {
    return NextResponse.json({ error: "Only Guide Officials can do this." }, { status: 403 });
  }
  try {
    const body = z
      .object({
        ticketId: z.string().uuid(),
        status: z.enum(["open", "in_progress", "resolved", "closed"]),
      })
      .parse(await request.json());
    const db = getDb();
    const [updated] = await db
      .update(supportTickets)
      .set({ status: body.status, updatedAt: new Date() })
      .where(eq(supportTickets.id, body.ticketId))
      .returning({
        id: supportTickets.id,
        ticketNumber: supportTickets.ticketNumber,
        status: supportTickets.status,
      });
    return NextResponse.json({ ticket: updated });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "The status wasn’t updated. Try again." }, { status: 400 });
  }
}

/** Official-only: permanently remove a test/spam entry. */
export async function DELETE(request: Request) {
  const authz = await requireProfile(["admin"]);
  if (!authz) {
    return NextResponse.json({ error: "You don’t have access to this. Log in with the correct account." }, { status: 403 });
  }
  const id = new URL(request.url).searchParams.get("id") ?? "";
  if (!/^[0-9a-f-]{36}$/i.test(id)) {
    return NextResponse.json({ error: "That item couldn’t be found. Refresh the page and try again." }, { status: 400 });
  }
  const db = getDb();
  await db.delete(supportTickets).where(eq(supportTickets.id, id));
  return NextResponse.json({ ok: true });
}
