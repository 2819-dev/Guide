/**
 * Dual deploy from one repo:
 *   NEXT_PUBLIC_SITE=guide  → school platform (default)
 *   NEXT_PUBLIC_SITE=amud   → public Amud learning site
 */

export type SiteId = "guide" | "amud";

export function getSiteId(): SiteId {
  return process.env.NEXT_PUBLIC_SITE === "amud" ? "amud" : "guide";
}

export function isAmudSite(): boolean {
  return getSiteId() === "amud";
}

export function isGuideSite(): boolean {
  return getSiteId() === "guide";
}

/** Public Amud URL (set on Guide deploy so school UI can deep-link out). */
export function amudPublicUrl(): string {
  const raw = process.env.NEXT_PUBLIC_AMUD_URL?.replace(/\/$/, "") ?? "";
  return raw;
}

/** Guide school platform URL (canonical: https://guidelearning.org on Cloudflare Pages). */
export function guidePublicUrl(): string {
  const raw = process.env.NEXT_PUBLIC_GUIDE_URL?.replace(/\/$/, "") ?? "";
  return raw || "https://guidelearning.org";
}

