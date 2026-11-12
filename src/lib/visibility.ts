/**
 * Hide smoke / test / fixture rows from every Guide surface
 * (students, teachers, school admins, Official).
 */

const SMOKE_NAME_RE =
  /\b(smoke|fixture|sandbox|dummy|placeholder|sample\s+school|test\s+school|testing\s+school|test\s+yeshiva|smoke\s+yeshiva|preview\s+academy)\b/i;

const SMOKE_SLUG_RE =
  /^(smoke|fixture|sandbox|test|testing|dummy|placeholder)([-_]|$)/i;

const SMOKE_EMAIL_RE =
  /@(example\.com|test\.school|test\.com)$|^(apply-shot-|apply-ui-|wording-|smoke-|fixture-)/i;

export function isSmokeOrTestLabel(
  nameOrSlug: string | null | undefined,
): boolean {
  if (!nameOrSlug) return false;
  const s = nameOrSlug.trim();
  if (!s) return false;
  if (SMOKE_NAME_RE.test(s)) return true;
  if (SMOKE_SLUG_RE.test(s)) return true;
  if (/^test[\s_-]*school/i.test(s)) return true;
  if (/schooling$/i.test(s) && /^test\b/i.test(s)) return true;
  return false;
}

export function isSmokeOrTestEmail(
  email: string | null | undefined,
): boolean {
  if (!email) return false;
  return SMOKE_EMAIL_RE.test(email.trim());
}

export function isSmokeOrTestSchool(row: {
  name?: string | null;
  slug?: string | null;
  schoolName?: string | null;
}): boolean {
  return (
    isSmokeOrTestLabel(row.name) ||
    isSmokeOrTestLabel(row.slug) ||
    isSmokeOrTestLabel(row.schoolName)
  );
}

export function isSmokeOrTestApplication(row: {
  schoolName?: string | null;
  className?: string | null;
  contactEmail?: string | null;
}): boolean {
  return (
    isSmokeOrTestLabel(row.schoolName) ||
    isSmokeOrTestLabel(row.className) ||
    isSmokeOrTestEmail(row.contactEmail)
  );
}

export function filterVisibleRows<T>(
  rows: T[],
  keep: (row: T) => boolean,
): T[] {
  return rows.filter(keep);
}
