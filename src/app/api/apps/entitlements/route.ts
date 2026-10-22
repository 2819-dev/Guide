import { NextResponse } from "next/server";
import {
  arcadeCorsHeaders,
  getAppEntitlement,
  verifyAccessToken,
} from "@/lib/app-launch";
import { getApp } from "@/lib/apps";
import { getDb } from "@/lib/db";
import { requireProfile } from "@/lib/profile";
import { profiles } from "@/lib/schema";
import { eq } from "drizzle-orm";

export const runtime = "edge";

export async function OPTIONS(request: Request) {
  return new NextResponse(null, {
    status: 204,
    headers: arcadeCorsHeaders(request),
  });
}

/**
 * Re-check classroom install for an app.
 *
 * GET /api/apps/entitlements?slug=arcade-education
 * Auth: Guide session cookie, or Authorization: Bearer <accessToken> from exchange.
 */
export async function GET(request: Request) {
  const cors = arcadeCorsHeaders(request);
  const url = new URL(request.url);
  const slug = url.searchParams.get("slug")?.trim() ?? "";

  if (!slug || !getApp(slug)) {
    return NextResponse.json(
      { error: "Unknown app" },
      { status: 400, headers: cors },
    );
  }

  const authHeader = request.headers.get("Authorization") ?? "";
  const bearer = authHeader.match(/^Bearer\s+(.+)$/i)?.[1]?.trim();

  if (bearer) {
    const claims = await verifyAccessToken(bearer);
    if (!claims) {
      return NextResponse.json(
        { error: "Invalid access token" },
        { status: 401, headers: cors },
      );
    }
    if (claims.slug !== slug) {
      return NextResponse.json(
        { error: "Token slug mismatch" },
        { status: 403, headers: cors },
      );
    }

    const db = getDb();
    const [profile] = await db
      .select()
      .from(profiles)
      .where(eq(profiles.id, claims.profileId))
      .limit(1);

    if (!profile) {
      return NextResponse.json(
        { entitled: false, slug, classrooms: [] },
        { headers: cors },
      );
    }

    const ent = await getAppEntitlement(profile, slug);
    return NextResponse.json(
      {
        entitled: ent.entitled,
        slug,
        profileId: profile.id,
        school: {
          id: ent.schoolId,
          slug: ent.schoolSlug,
          name: ent.schoolName,
        },
        classrooms: ent.classroomIds.map((id, i) => ({
          id,
          name: ent.classroomNames[i] ?? null,
        })),
      },
      { headers: cors },
    );
  }

  const authz = await requireProfile();
  if (!authz) {
    return NextResponse.json(
      { error: "Sign in required" },
      { status: 401, headers: cors },
    );
  }

  const ent = await getAppEntitlement(authz.profile, slug);
  return NextResponse.json(
    {
      entitled: ent.entitled,
      slug,
      profileId: authz.profile.id,
      school: {
        id: ent.schoolId,
        slug: ent.schoolSlug,
        name: ent.schoolName,
      },
      classrooms: ent.classroomIds.map((id, i) => ({
        id,
        name: ent.classroomNames[i] ?? null,
      })),
    },
    { headers: cors },
  );
}
