import { eq } from "drizzle-orm";
import { badgeAuthEmail, generateBadgeCode, normalizeBadgeCode } from "@/lib/badge";
import { getDb } from "@/lib/db";
import { profiles, schools } from "@/lib/schema";

const AUTH_BASE = () => process.env.NEON_AUTH_BASE_URL!;

type AuthUserResult = { id?: string; email?: string };

async function authSignUp(
  email: string,
  password: string,
  name: string,
): Promise<{ user: AuthUserResult | null; error: string | null }> {
  const res = await fetch(`${AUTH_BASE()}/sign-up/email`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password, name }),
  });
  const data = (await res.json().catch(() => ({}))) as {
    user?: AuthUserResult;
    message?: string;
    error?: string;
  };
  if (!res.ok) {
    // Already exists is OK — we will sign in to resolve id
    const msg = data.message || data.error || "";
    if (
      res.status === 422 ||
      /already|exist|registered/i.test(msg) ||
      res.status === 409
    ) {
      return { user: null, error: "exists" };
    }
    return { user: null, error: msg || "Could not create badge login" };
  }
  return { user: data.user ?? null, error: null };
}

async function authSignInUserId(
  email: string,
  password: string,
): Promise<string | null> {
  const res = await fetch(`${AUTH_BASE()}/sign-in/email`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  const data = (await res.json().catch(() => ({}))) as {
    user?: AuthUserResult;
  };
  if (!res.ok) return null;
  return data.user?.id ?? null;
}

/**
 * Ensure profile has a badge code + Neon Auth badge identity.
 * Password for the badge identity is the badge code itself.
 */
export async function provisionStudentBadge(opts: {
  profileId: string;
  schoolId: string;
  displayName: string;
  existingBadgeCode?: string | null;
}): Promise<{ badgeCode: string; error: string | null }> {
  const db = getDb();
  const [school] = await db
    .select()
    .from(schools)
    .where(eq(schools.id, opts.schoolId))
    .limit(1);
  if (!school) return { badgeCode: "", error: "School not found" };

  let badgeCode = opts.existingBadgeCode
    ? normalizeBadgeCode(opts.existingBadgeCode)
    : "";
  if (!badgeCode) {
    for (let attempt = 0; attempt < 6; attempt++) {
      const candidate = generateBadgeCode(8);
      const [taken] = await db
        .select({ id: profiles.id })
        .from(profiles)
        .where(eq(profiles.badgeCode, candidate))
        .limit(1);
      if (!taken) {
        badgeCode = candidate;
        break;
      }
    }
  }
  if (!badgeCode) {
    return { badgeCode: "", error: "Could not assign a badge code" };
  }

  const email = badgeAuthEmail(school.slug, badgeCode);
  const password = badgeCode;

  let badgeAuthUserId: string | null = null;
  const signedUp = await authSignUp(email, password, opts.displayName || "Student");
  if (signedUp.error === "exists") {
    badgeAuthUserId = await authSignInUserId(email, password);
  } else if (signedUp.error) {
    return { badgeCode: "", error: signedUp.error };
  } else {
    badgeAuthUserId = signedUp.user?.id ?? (await authSignInUserId(email, password));
  }

  if (!badgeAuthUserId) {
    return {
      badgeCode: "",
      error: "Could not activate badge login. Try again in a moment.",
    };
  }

  await db
    .update(profiles)
    .set({
      schoolId: opts.schoolId,
      badgeCode,
      badgeAuthUserId,
      updatedAt: new Date(),
    })
    .where(eq(profiles.id, opts.profileId));

  return { badgeCode, error: null };
}
