import { NextResponse } from "next/server";
import { z } from "zod";
import { createCheckoutSession } from "@/lib/blitz/billing";
import { requestOrigin, requireBlitzTeacher } from "@/lib/blitz/billing-auth";
import {
  BILLING_NOT_CONFIGURED_MESSAGE,
  checkoutConfigured,
} from "@/lib/blitz/billing-config";

export const runtime = "edge";

const Body = z.object({
  plan: z.enum(["plus", "ultra"]),
  interval: z.enum(["month", "year"]),
});

export async function POST(request: Request) {
  const profile = await requireBlitzTeacher();
  if (!profile) {
    return NextResponse.json({ error: "Teachers only" }, { status: 403 });
  }
  if (!checkoutConfigured()) {
    return NextResponse.json(
      { error: BILLING_NOT_CONFIGURED_MESSAGE, code: "billing_not_configured" },
      { status: 503 },
    );
  }
  const parsed = Body.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Pick a plan and billing period." }, { status: 400 });
  }
  try {
    const result = await createCheckoutSession({
      profile: {
        id: profile.id,
        displayName: profile.displayName,
        loginEmail: profile.loginEmail,
      },
      plan: parsed.data.plan,
      interval: parsed.data.interval,
      origin: requestOrigin(request),
    });
    if (!result.ok) {
      return NextResponse.json(
        { error: result.error, code: result.code, portalUrl: result.portalUrl },
        { status: result.status },
      );
    }
    return NextResponse.json({ url: result.url });
  } catch (error) {
    console.error("[blitz checkout]", error);
    return NextResponse.json(
      { error: "We couldn’t start checkout. Please try again." },
      { status: 502 },
    );
  }
}
