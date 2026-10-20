import { asc, eq } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { schoolApplications, schools } from "@/lib/schema";

export type SchoolRow = typeof schools.$inferSelect;

/** URL-safe slug from a school name; appends short suffix on collision. */
export function slugifySchoolName(name: string): string {
  const base = name
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
  return base || "school";
}

export async function syncSchoolFromApplication(applicationId: string) {
  const db = getDb();
  const [app] = await db
    .select()
    .from(schoolApplications)
    .where(eq(schoolApplications.id, applicationId))
    .limit(1);
  if (!app || app.status !== "approved") return null;

  const [existing] = await db
    .select()
    .from(schools)
    .where(eq(schools.applicationId, app.id))
    .limit(1);
  if (existing) {
    if (existing.name !== app.schoolName) {
      const [updated] = await db
        .update(schools)
        .set({ name: app.schoolName })
        .where(eq(schools.id, existing.id))
        .returning();
      return updated;
    }
    return existing;
  }

  let slug = slugifySchoolName(app.schoolName);
  const [slugTaken] = await db
    .select()
    .from(schools)
    .where(eq(schools.slug, slug))
    .limit(1);
  if (slugTaken) {
    slug = `${slug}-${app.id.slice(0, 8)}`;
  }

  const [created] = await db
    .insert(schools)
    .values({
      name: app.schoolName,
      slug,
      applicationId: app.id,
    })
    .returning();
  return created;
}

/** Ensure every approved application has a schools row (backfill + approve). */
export async function ensureApprovedSchools(): Promise<SchoolRow[]> {
  const db = getDb();
  const approved = await db
    .select()
    .from(schoolApplications)
    .where(eq(schoolApplications.status, "approved"));

  for (const app of approved) {
    await syncSchoolFromApplication(app.id);
  }

  return db.select().from(schools).orderBy(asc(schools.name));
}

export async function listSchools(query?: string): Promise<SchoolRow[]> {
  const rows = await ensureApprovedSchools();
  const q = query?.trim().toLowerCase();
  if (!q) return rows;
  return rows.filter(
    (s) =>
      s.name.toLowerCase().includes(q) || s.slug.toLowerCase().includes(q),
  );
}
