/**
 * Emails that must be Guide Official (`profiles.role = admin`).
 * Password values are never stored here.
 */

export const OFFICIAL_ADMIN_EMAILS = [
  "hf@guidelearning.org",
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
  return email?.trim().toLowerCase() === "hf@guidelearning.org";
}
