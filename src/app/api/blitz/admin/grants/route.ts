import { NextResponse } from "next/server";
import { z } from "zod";
import {
  findProfileByEmail,
  listActiveGrants,
  revokeGrantById,
} from "@/lib/blitz/admin";
import { requireBlitzOfficial } from "@/lib/blitz/billing-auth";
import { getEntitlement, grantPlan, revokeAdminGrants } from "@/lib/blitz/entitlements";

export const runtime = "edge";

const forbidden = () =>
  NextResponse.json({ error: "Guide Official access required" }, { status: 403 });

export async function GET() {
  if (!(await requireBlitzOfficial())) return forbidden();
  return NextResponse.json({ grants: await listActiveGrants() });
}

/** Grant a plan by teacher email. plan "free" revokes Official grants. */
export async function POST(request: Request) {
  const official = await requireBlitzOfficial();
  if (!official) return forbidden();
  const parsed = z
    .object({
      email: z.string().trim().email().max(254),
      planId: z.enum(["free", "plus", "ultra"]),
      expiresAt: z.string().optional().nullable(),
      note: z.string().max(300).optional(),
    })
    .safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Enter a valid email and plan." }, { status: 400 });
  }
  const { email, planId, note } = parsed.data;
  let expiresAt: Date | null = null;
  if (parsed.data.expiresAt) {
    const raw = parsed.data.expiresAt;
    expiresAt = new Date(/^\d{4}-\d{2}-\d{2}$/.test(raw) ? `${raw}T23:59:59Z` : raw);
    if (Number.isNaN(expiresAt.getTime()) || expiresAt.getTime() <= Date.now()) {
      return NextResponse.json({ error: "The expiry date must be in the future." }, { status: 400 });
    }
  }

  const teacher = await findProfileByEmail(email);
  if (!teacher) {
    return NextResponse.json({ error: `No Guide account uses ${email}.` }, { status: 404 });
  }
  if (teacher.role === "customer") {
    return NextResponse.json(
      { error: `${teacher.displayName} is a student account. Blitz plans are for teachers.` },
      { status: 400 },
    );
  }
  try {
    const snap = await grantPlan({
      profileId: teacher.id,
      planId,
      expiresAt,
      grantedBy: official.id,
      note,
    });
    return NextResponse.json({ teacher, plan: snap.plan.id, planLabel: snap.plan.label });
  } catch (error) {
    console.error("[blitz admin grant]", error);
    return NextResponse.json({ error: "Could not save the plan." }, { status: 500 });
  }
}

/** Revoke one grant ({ grantId }) or all Official grants for an email ({ email }). */
export async function DELETE(request: Request) {
  const official = await requireBlitzOfficial();
  if (!official) return forbidden();
  const parsed = z
    .object({
      grantId: z.string().uuid().optional(),
      email: z.string().trim().email().optional(),
    })
    .safeParse(await request.json().catch(() => null));
  if (!parsed.success || (!parsed.data.grantId && !parsed.data.email)) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
  let profileId: string | null = null;
  if (parsed.data.grantId) {
    profileId = await revokeGrantById(parsed.data.grantId, official.id);
    if (!profileId) return NextResponse.json({ error: "Grant not found or already revoked." }, { status: 404 });
  } else if (parsed.data.email) {
    const teacher = await findProfileByEmail(parsed.data.email);
    if (!teacher) return NextResponse.json({ error: "No account with that email." }, { status: 404 });
    profileId = teacher.id;
    await revokeAdminGrants(profileId, official.id);
  }
  const snap = profileId ? await getEntitlement(profileId) : null;
  return NextResponse.json({ ok: true, plan: snap?.plan.id ?? null });
}
