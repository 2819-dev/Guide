import { NextResponse } from "next/server";
import { getAppEntitlement, mintLaunchToken } from "@/lib/app-launch";
import { getApp } from "@/lib/apps";
import { requireProfile } from "@/lib/profile";
import { guidePublicUrl } from "@/lib/site";

export const runtime = "edge";

/**
 * Mint a short-lived launch token and redirect to the external app
 * (Arcade: https://arcade-edu.guidelearning.org/launch?token=…).
 *
 * GET /api/apps/launch?slug=arcade-education
 * Optional: &format=json → { redirectUrl, token } instead of 302.
 *
 * If ARCADE_LAUNCH_JWT_SECRET is unset, entitled users are sent to the
 * absolute product home without a token (degraded until secret is configured).
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const slug = url.searchParams.get("slug")?.trim() ?? "";
  const format = url.searchParams.get("format");

  const app = slug ? getApp(slug) : undefined;
  if (!app) {
    return NextResponse.json({ error: "Unknown app" }, { status: 400 });
  }
  if (!app.launchUrl) {
    return NextResponse.json(
      { error: "App does not support launch bridge" },
      { status: 400 },
    );
  }

  const authz = await requireProfile();
  if (!authz) {
    return NextResponse.redirect(
      new URL("/auth/sign-in", guidePublicUrl()),
      307,
    );
  }

  const minted = await mintLaunchToken({
    profile: authz.profile,
    authUserId: authz.user.id,
    slug,
  });

  if (!minted.ok) {
    // Secret not configured yet — still leave Guide path; open Arcade home.
    if (minted.status === 503) {
      const ent = await getAppEntitlement(authz.profile, slug);
      if (!ent.entitled) {
        return NextResponse.json(
          { error: "App is not installed for your classes" },
          { status: 403 },
        );
      }
      const fallback = app.launchUrl;
      if (format === "json") {
        return NextResponse.json({
          redirectUrl: fallback,
          token: null,
          degraded: true,
        });
      }
      return NextResponse.redirect(fallback, 302);
    }

    return NextResponse.json(
      { error: minted.error },
      { status: minted.status },
    );
  }

  if (format === "json") {
    return NextResponse.json({
      redirectUrl: minted.redirectUrl,
      token: minted.token,
      claims: {
        slug: minted.claims.slug,
        profileId: minted.claims.profileId,
        classroomIds: minted.claims.classroomIds,
        exp: minted.claims.exp,
      },
    });
  }

  return NextResponse.redirect(minted.redirectUrl, 302);
}
