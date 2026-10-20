import { NextResponse } from "next/server";
import { asc, desc, eq } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "@/lib/db";
import { requireProfile } from "@/lib/profile";
import {
  fileToIconDataUrl,
  normalizeHexColor,
  slugifyRoleName,
} from "@/lib/role-badges";
import {
  profiles,
  roleBadgeAssignments,
  roleBadges,
} from "@/lib/schema";

/** List Discord-style roles + people for assignment. */
export async function GET() {
  const authz = await requireProfile(["admin", "moderator"]);
  if (!authz) {
    return NextResponse.json({ error: "Access required" }, { status: 403 });
  }

  const db = getDb();
  const roles = await db
    .select()
    .from(roleBadges)
    .orderBy(asc(roleBadges.name));

  const people = await db
    .select({
      id: profiles.id,
      displayName: profiles.displayName,
      role: profiles.role,
      loginEmail: profiles.loginEmail,
      schoolId: profiles.schoolId,
    })
    .from(profiles)
    .orderBy(asc(profiles.displayName))
    .limit(200);

  const assignments = await db
    .select({
      id: roleBadgeAssignments.id,
      roleBadgeId: roleBadgeAssignments.roleBadgeId,
      profileId: roleBadgeAssignments.profileId,
      profileName: profiles.displayName,
      roleName: roleBadges.name,
      roleColor: roleBadges.color,
      roleIconUrl: roleBadges.iconUrl,
      createdAt: roleBadgeAssignments.createdAt,
    })
    .from(roleBadgeAssignments)
    .innerJoin(profiles, eq(roleBadgeAssignments.profileId, profiles.id))
    .innerJoin(roleBadges, eq(roleBadgeAssignments.roleBadgeId, roleBadges.id))
    .orderBy(desc(roleBadgeAssignments.createdAt))
    .limit(100);

  return NextResponse.json({
    roles: roles.map((r) => ({
      id: r.id,
      name: r.name,
      slug: r.slug,
      color: r.color,
      iconUrl: r.iconUrl,
      createdAt: r.createdAt,
    })),
    people,
    assignments,
  });
}

/** Create a role (multipart: name, color, optional icon file). */
export async function POST(request: Request) {
  const authz = await requireProfile(["admin", "moderator"]);
  if (!authz) {
    return NextResponse.json({ error: "Access required" }, { status: 403 });
  }

  try {
    const contentType = request.headers.get("content-type") ?? "";
    let name = "";
    let colorRaw = "#245239";
    let iconUrl: string | null = null;
    let iconMime: string | null = null;

    if (contentType.includes("multipart/form-data")) {
      const form = await request.formData();
      name = String(form.get("name") ?? "").trim();
      colorRaw = String(form.get("color") ?? "#245239");
      const file = form.get("icon");
      if (file instanceof File && file.size > 0) {
        const converted = await fileToIconDataUrl(file);
        if ("error" in converted) {
          return NextResponse.json({ error: converted.error }, { status: 400 });
        }
        iconUrl = converted.dataUrl;
        iconMime = converted.mime;
      }
    } else {
      const body = z
        .object({
          name: z.string().trim().min(2).max(80),
          color: z.string().optional(),
          iconUrl: z.string().optional(),
        })
        .parse(await request.json());
      name = body.name;
      colorRaw = body.color ?? "#245239";
      iconUrl = body.iconUrl ?? null;
    }

    if (name.length < 2) {
      return NextResponse.json(
        { error: "Give the role a name (at least 2 characters)." },
        { status: 400 },
      );
    }
    const color = normalizeHexColor(colorRaw);
    if (!color) {
      return NextResponse.json(
        { error: "Use a hex color like #3a7d58." },
        { status: 400 },
      );
    }

    const db = getDb();
    let slug = slugifyRoleName(name);
    const [taken] = await db
      .select({ id: roleBadges.id })
      .from(roleBadges)
      .where(eq(roleBadges.slug, slug))
      .limit(1);
    if (taken) slug = `${slug}-${Date.now().toString(36).slice(-4)}`;

    const [created] = await db
      .insert(roleBadges)
      .values({
        name,
        slug,
        color,
        iconUrl,
        iconMime,
        createdByProfileId: authz.profile.id,
      })
      .returning();

    return NextResponse.json(
      {
        role: {
          id: created.id,
          name: created.name,
          slug: created.slug,
          color: created.color,
          iconUrl: created.iconUrl,
        },
      },
      { status: 201 },
    );
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Could not create role" }, { status: 500 });
  }
}
