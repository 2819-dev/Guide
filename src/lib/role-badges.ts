import { eq } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { roleBadgeAssignments, roleBadges } from "@/lib/schema";

export type RoleBadgeView = {
  id: string;
  name: string;
  slug: string;
  color: string;
  iconUrl: string | null;
};

export function slugifyRoleName(name: string): string {
  const base = name
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
  return base || "role";
}

export function normalizeHexColor(raw: string): string | null {
  const v = raw.trim();
  if (/^#[0-9A-Fa-f]{6}$/.test(v)) return v.toLowerCase();
  if (/^[0-9A-Fa-f]{6}$/.test(v)) return `#${v.toLowerCase()}`;
  return null;
}

/** Roles assigned to a profile (for account / student hub chips). */
export async function listRolesForProfile(
  profileId: string,
): Promise<RoleBadgeView[]> {
  const db = getDb();
  const rows = await db
    .select({
      id: roleBadges.id,
      name: roleBadges.name,
      slug: roleBadges.slug,
      color: roleBadges.color,
      iconUrl: roleBadges.iconUrl,
    })
    .from(roleBadgeAssignments)
    .innerJoin(roleBadges, eq(roleBadgeAssignments.roleBadgeId, roleBadges.id))
    .where(eq(roleBadgeAssignments.profileId, profileId));
  return rows;
}

const ALLOWED_MIME = new Set([
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/gif",
  "image/svg+xml",
]);

/** Convert an uploaded File/Blob into a data URL stored on Neon (no Blob token required). */
export async function fileToIconDataUrl(
  file: File,
): Promise<{ dataUrl: string; mime: string } | { error: string }> {
  if (!ALLOWED_MIME.has(file.type)) {
    return { error: "Use a PNG, JPEG, WebP, GIF, or SVG icon." };
  }
  if (file.size > 512 * 1024) {
    return { error: "Icon must be 512 KB or smaller." };
  }
  const buf = Buffer.from(await file.arrayBuffer());
  const b64 = buf.toString("base64");
  return {
    dataUrl: `data:${file.type};base64,${b64}`,
    mime: file.type,
  };
}
