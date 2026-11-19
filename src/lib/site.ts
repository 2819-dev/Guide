/** Guide school platform URL (canonical: https://guidelearning.org on Cloudflare Pages). */
export function guidePublicUrl(): string {
  const raw = process.env.NEXT_PUBLIC_GUIDE_URL?.replace(/\/$/, "") ?? "";
  return raw || "https://guidelearning.org";
}

/**
 * Arcade Education product home (subdomain — not a Guide path mount).
 * Canonical: https://arcade-edu.guidelearning.org
 */
export function arcadePublicUrl(): string {
  const raw = process.env.NEXT_PUBLIC_ARCADE_URL?.replace(/\/$/, "") ?? "";
  return raw || "https://arcade-edu.guidelearning.org";
}
