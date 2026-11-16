import { NextResponse } from "next/server";
import { getBlitzOverview, listSubscribers } from "@/lib/blitz/admin";
import { requireBlitzOfficial } from "@/lib/blitz/billing-auth";
import { checkoutConfigured, stripeConfigured } from "@/lib/blitz/billing-config";

export const runtime = "edge";

/** Usage overview + subscribers for the Blitz admin console. */
export async function GET() {
  if (!(await requireBlitzOfficial())) {
    return NextResponse.json({ error: "Guide Official access required" }, { status: 403 });
  }
  const [overview, subscribers] = await Promise.all([getBlitzOverview(), listSubscribers()]);
  return NextResponse.json({
    overview,
    subscribers,
    stripe: { configured: stripeConfigured(), checkout: checkoutConfigured() },
  });
}
