import { NextResponse } from "next/server";
import { createPortalSession } from "@/lib/blitz/billing";
import { requestOrigin, requireBlitzTeacher } from "@/lib/blitz/billing-auth";
import { BILLING_NOT_CONFIGURED_MESSAGE } from "@/lib/blitz/billing-config";

export const runtime = "edge";

async function open(request: Request) {
  const profile = await requireBlitzTeacher();
  if (!profile) return { status: 403, error: "Teachers only" } as const;
  try {
    const result = await createPortalSession(profile.id, requestOrigin(request));
    if (!result.ok) {
      return {
        status: result.status,
        error: result.code === "billing_not_configured" ? BILLING_NOT_CONFIGURED_MESSAGE : result.error,
        code: result.code,
      } as const;
    }
    return { status: 200, url: result.url } as const;
  } catch (error) {
    console.error("[blitz portal]", error);
    return { status: 502, error: "We couldn’t open billing. Please try again." } as const;
  }
}

/** Link target: redirects to the Stripe customer portal. */
export async function GET(request: Request) {
  const r = await open(request);
  const origin = requestOrigin(request);
  if ("url" in r && r.url) return NextResponse.redirect(r.url, 303);
  if (r.status === 403) return NextResponse.redirect(`${origin}/auth/sign-in?as=educator`, 303);
  return NextResponse.redirect(`${origin}/apps/blitz/upgrade?billing=unavailable`, 303);
}

/** JSON: { url } for client-side navigation. */
export async function POST(request: Request) {
  const r = await open(request);
  if ("url" in r && r.url) return NextResponse.json({ url: r.url });
  return NextResponse.json(
    { error: r.error, code: "code" in r ? r.code : undefined },
    { status: r.status },
  );
}
