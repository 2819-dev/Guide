import { hasEducationAccess } from "@/lib/education-access";
import { requireProfile, type Profile } from "@/lib/profile";
import { BLITZ_OFFICIAL_ROLES } from "@/lib/blitz/admin";

/** Teachers (approved school) and Officials can buy/redeem Blitz plans. */
export async function requireBlitzTeacher(): Promise<Profile | null> {
  const authz = await requireProfile(["rebbe", "admin"]);
  if (!authz) return null;
  if (!(await hasEducationAccess(authz.profile))) return null;
  return authz.profile;
}

/** Guide Official (admin / moderator). */
export async function requireBlitzOfficial(): Promise<Profile | null> {
  const authz = await requireProfile([...BLITZ_OFFICIAL_ROLES]);
  return authz?.profile ?? null;
}

/** Origin for Stripe return URLs: the request's own origin. */
export function requestOrigin(request: Request): string {
  try {
    return new URL(request.url).origin;
  } catch {
    return process.env.NEXT_PUBLIC_GUIDE_URL?.trim() || "https://guidelearning.org";
  }
}
