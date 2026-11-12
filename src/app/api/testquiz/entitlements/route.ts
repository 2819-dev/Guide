import { NextResponse } from "next/server";
import { z } from "zod";
import { hasEducationAccess } from "@/lib/education-access";
import { requireProfile } from "@/lib/profile";
import { getEntitlement, setPlan } from "@/lib/testquiz/entitlements";
import type { TestQuizPlanId } from "@/lib/testquiz/plans";

export const runtime = "edge";

export async function GET() {
  const authz = await requireProfile(["rebbe", "admin"]);
  if (!authz) {
    return NextResponse.json({ error: "Teachers only" }, { status: 403 });
  }
  if (!(await hasEducationAccess(authz.profile))) {
    return NextResponse.json({ error: "School access required" }, { status: 403 });
  }
  const snap = await getEntitlement(authz.profile.id);
  return NextResponse.json(snap);
}

/** Stub: Official/admin can set a teacher's plan until billing ships. */
export async function POST(request: Request) {
  const authz = await requireProfile(["admin"]);
  if (!authz) {
    return NextResponse.json({ error: "Official access required" }, { status: 403 });
  }
  try {
    const body = z
      .object({
        profileId: z.string().uuid(),
        planId: z.enum(["free", "plus", "ultra"]),
      })
      .parse(await request.json());
    const snap = await setPlan(body.profileId, body.planId as TestQuizPlanId);
    return NextResponse.json(snap);
  } catch (error) {
    console.error(error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }
    return NextResponse.json({ error: "Could not update plan" }, { status: 500 });
  }
}
