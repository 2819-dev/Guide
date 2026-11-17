import { NextResponse } from "next/server";
import { and, desc, eq } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "@/lib/db";
import { ensureProfile, requireProfile } from "@/lib/profile";
import {
  developerApplications,
  developerApps,
  profiles,
} from "@/lib/schema";

export const runtime = "edge";

const submitSchema = z.object({
  contactName: z.string().trim().min(2, "Enter your full name.").max(120),
  contactEmail: z
    .string()
    .trim()
    .email("Enter a valid email address.")
    .max(254),
  organization: z
    .string()
    .trim()
    .min(2, "Enter your organization’s name.")
    .max(200),
  websiteUrl: z
    .string()
    .trim()
    .url("Enter a full website address, starting with https://.")
    .max(500),
  appName: z.string().trim().min(2, "Enter your app’s name.").max(160),
  appAbout: z
    .string()
    .trim()
    .min(20, "Describe your app in at least 20 characters.")
    .max(4000, "Keep the description under 4,000 characters."),
});

const reviewSchema = z.object({
  applicationId: z.string().uuid(),
  status: z.enum(["approved", "rejected"]),
  reviewNote: z.string().trim().max(2000).optional(),
});

function slugify(name: string): string {
  return (
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 48) || "app"
  );
}

export async function GET() {
  const authz = await requireProfile(["admin", "moderator"]);
  if (!authz) {
    return NextResponse.json({ error: "You don’t have access to this. Log in with the correct account." }, { status: 403 });
  }

  const db = getDb();
  const rows = await db
    .select()
    .from(developerApplications)
    .orderBy(desc(developerApplications.createdAt));

  return NextResponse.json({ applications: rows });
}

export async function POST(request: Request) {
  try {
    const body = submitSchema.parse(await request.json());
    const session = await ensureProfile().catch(() => null);
    const db = getDb();

    if (session?.profile.id) {
      const [existing] = await db
        .select()
        .from(developerApplications)
        .where(
          and(
            eq(developerApplications.applicantProfileId, session.profile.id),
            eq(developerApplications.status, "pending"),
          ),
        )
        .limit(1);
      if (existing) {
        return NextResponse.json(
          {
            error:
              "You already have a developer application under review. We’ll email you when a decision is made.",
            application: { id: existing.id, status: existing.status },
          },
          { status: 409 },
        );
      }
    }

    const [application] = await db
      .insert(developerApplications)
      .values({
        contactName: body.contactName,
        contactEmail: body.contactEmail.toLowerCase(),
        organization: body.organization,
        websiteUrl: body.websiteUrl,
        appName: body.appName,
        appAbout: body.appAbout,
        applicantProfileId: session?.profile.id ?? null,
        status: "pending",
      })
      .returning();

    return NextResponse.json({
      application: { id: application.id, status: application.status },
    });
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json(
        { error: e.issues[0]?.message ?? "That request wasn’t valid. Refresh the page and try again." },
        { status: 400 },
      );
    }
    return NextResponse.json({ error: "Your application wasn’t submitted. Try again in a moment." }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  const authz = await requireProfile(["admin", "moderator"]);
  if (!authz) {
    return NextResponse.json({ error: "You don’t have access to this. Log in with the correct account." }, { status: 403 });
  }

  try {
    const body = reviewSchema.parse(await request.json());
    const db = getDb();
    const [updated] = await db
      .update(developerApplications)
      .set({
        status: body.status,
        reviewNote: body.reviewNote ?? null,
        reviewedByProfileId: authz.profile.id,
        reviewedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(developerApplications.id, body.applicationId))
      .returning();

    if (!updated) {
      return NextResponse.json({ error: "That item couldn’t be found. Refresh the page and try again." }, { status: 404 });
    }

    if (body.status === "approved" && updated.applicantProfileId) {
      const base = slugify(updated.appName);
      let slug = base;
      for (let i = 0; i < 5; i++) {
        const candidate = i === 0 ? base : `${base}-${i + 1}`;
        const [clash] = await db
          .select({ id: developerApps.id })
          .from(developerApps)
          .where(eq(developerApps.slug, candidate))
          .limit(1);
        if (!clash) {
          slug = candidate;
          break;
        }
      }

      const [existingApp] = await db
        .select()
        .from(developerApps)
        .where(eq(developerApps.applicationId, updated.id))
        .limit(1);

      if (!existingApp) {
        await db.insert(developerApps).values({
          ownerProfileId: updated.applicantProfileId,
          applicationId: updated.id,
          name: updated.appName,
          slug,
          websiteUrl: updated.websiteUrl,
          about: updated.appAbout,
          status: "active",
        });
      }

      // Keep role as customer; portal access is via approved application.
      await db
        .update(profiles)
        .set({ updatedAt: new Date() })
        .where(eq(profiles.id, updated.applicantProfileId));
    }

    return NextResponse.json({ application: updated });
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json(
        { error: e.issues[0]?.message ?? "That request wasn’t valid. Refresh the page and try again." },
        { status: 400 },
      );
    }
    return NextResponse.json({ error: "The decision wasn’t saved. Try again." }, { status: 500 });
  }
}

/** Official-only: permanently remove a test/spam entry. */
export async function DELETE(request: Request) {
  const authz = await requireProfile(["admin", "moderator"]);
  if (!authz) {
    return NextResponse.json({ error: "You don’t have access to this. Log in with the correct account." }, { status: 403 });
  }
  const id = new URL(request.url).searchParams.get("id") ?? "";
  if (!/^[0-9a-f-]{36}$/i.test(id)) {
    return NextResponse.json({ error: "That item couldn’t be found. Refresh the page and try again." }, { status: 400 });
  }
  const db = getDb();
  await db.delete(developerApplications).where(eq(developerApplications.id, id));
  return NextResponse.json({ ok: true });
}
