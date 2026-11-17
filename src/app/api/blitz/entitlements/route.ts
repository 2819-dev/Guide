import { NextResponse } from "next/server";
import { z } from "zod";
import { hasEducationAccess } from "@/lib/education-access";
import { requireProfile } from "@/lib/profile";
import { getEntitlement, grantPlan } from "@/lib/blitz/entitlements";
import type { BlitzPlanId } from "@/lib/blitz/plans";

export const runtime = "edge";

export async function GET() {
  const authz = await requireProfile(["rebbe", "admin"]);
  if (!authz) {
    return NextResponse.json({ error: "This is only available to teachers." }, { status: 403 });
  }
  if (!(await hasEducationAccess(authz.profile))) {
    return NextResponse.json({ error: "Blitz opens once your school is approved on Guide." }, { status: 403 });
  }
  const snap = await getEntitlement(authz.profile.id);
  return NextResponse.json(snap);
}

/**
 * Official: set a teacher's plan as a permanent Official grant ("free"
 * revokes Official grants). Stripe subscriptions and promo codes still apply;
 * the Blitz admin console (/apps/blitz/admin) is the full UI for this.
 */
export async function POST(request: Request) {
  const authz = await requireProfile(["admin", "moderator"]);
  if (!authz) {
    return NextResponse.json({ error: "Only Guide Officials can do this." }, { status: 403 });
  }
  try {
    const body = z
      .object({
        profileId: z.string().uuid(),
        planId: z.enum(["free", "plus", "ultra"]),
      })
      .parse(await request.json());
    const snap = await grantPlan({
      profileId: body.profileId,
      planId: body.planId as BlitzPlanId,
      grantedBy: authz.profile.id,
    });
    return NextResponse.json(snap);
  } catch (error) {
    console.error(error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "That request wasn’t valid. Refresh the page and try again." }, { status: 400 });
    }
    return NextResponse.json({ error: "Could not update the plan." }, { status: 500 });
  }
}
