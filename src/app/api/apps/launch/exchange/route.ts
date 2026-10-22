import { NextResponse } from "next/server";
import { z } from "zod";
import { arcadeCorsHeaders, exchangeLaunchToken } from "@/lib/app-launch";

export const runtime = "edge";

/** CORS preflight for Arcade subdomain. */
export async function OPTIONS(request: Request) {
  return new NextResponse(null, {
    status: 204,
    headers: arcadeCorsHeaders(request),
  });
}

/**
 * Arcade redeems a one-time launch token → identity + entitlement claims
 * plus a short-lived access token for optional entitlements re-checks.
 *
 * POST /api/apps/launch/exchange  { "token": "…" }
 */
export async function POST(request: Request) {
  const cors = arcadeCorsHeaders(request);
  try {
    const body = z
      .object({ token: z.string().min(20).max(4096) })
      .parse(await request.json());

    const result = await exchangeLaunchToken(body.token);
    if (!result.ok) {
      return NextResponse.json(
        { error: result.error },
        { status: result.status, headers: cors },
      );
    }

    const { claims, accessToken } = result;
    return NextResponse.json(
      {
        accessToken,
        profile: {
          id: claims.profileId,
          authUserId: claims.authUserId,
          role: claims.role,
          displayName: claims.displayName,
        },
        school: {
          id: claims.schoolId,
          slug: claims.schoolSlug,
          name: claims.schoolName,
        },
        appSlug: claims.slug,
        classrooms: claims.classroomIds.map((id, i) => ({
          id,
          name: claims.classroomNames[i] ?? null,
        })),
        expiresAt: claims.exp,
      },
      { headers: cors },
    );
  } catch (error) {
    console.error(error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request" },
        { status: 400, headers: cors },
      );
    }
    return NextResponse.json(
      { error: "Could not exchange token" },
      { status: 500, headers: cors },
    );
  }
}
