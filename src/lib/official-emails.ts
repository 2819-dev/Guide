/**
 * Emails that must be Guide Official (`profiles.role = admin`).
 * Password values are never stored here.
 */

export const OFFICIAL_ADMIN_EMAILS = [
  "hf@guidelearning.org",
  "hfrankel@guidelearning.org",
  "admin@bighappysmiley.com", // legacy seed Official
] as const;

export function isOfficialAdminEmail(
  email: string | null | undefined,
): boolean {
  if (!email) return false;
  const normalized = email.trim().toLowerCase();
  return (OFFICIAL_ADMIN_EMAILS as readonly string[]).includes(normalized);
}

/** New Official accounts should change the temporary password on first login. */
export function officialRequiresInitialPasswordChange(
  email: string | null | undefined,
): boolean {
  const e = email?.trim().toLowerCase();
  return e === "hf@guidelearning.org" || e === "hfrankel@guidelearning.org";
}
