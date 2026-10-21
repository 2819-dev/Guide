import { randomBytes, sha256HexSync } from "@/lib/edge-crypto";

const BADGE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

/** Short printable badge code (Clever-style MVP). */
export function generateBadgeCode(length = 8): string {
  const bytes = randomBytes(length);
  let out = "";
  for (let i = 0; i < length; i++) {
    out += BADGE_ALPHABET[bytes[i]! % BADGE_ALPHABET.length];
  }
  return out;
}

export function normalizeBadgeCode(raw: string): string {
  return raw.trim().toUpperCase().replace(/[^A-Z0-9]/g, "");
}

/** Synthetic Neon Auth email for badge sign-in. */
export function badgeAuthEmail(schoolSlug: string, badgeCode: string): string {
  const code = normalizeBadgeCode(badgeCode).toLowerCase();
  const slug = schoolSlug
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "")
    .slice(0, 80);
  return `badge.${slug}.${code}@guide.student`;
}

/** Stable display id for printing (not a secret beyond the code itself). */
export function badgeDisplayId(schoolSlug: string, badgeCode: string): string {
  const digest = sha256HexSync(
    `${schoolSlug}:${normalizeBadgeCode(badgeCode)}`,
  )
    .slice(0, 6)
    .toUpperCase();
  return `${normalizeBadgeCode(badgeCode)}-${digest}`;
}
