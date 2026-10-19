import { cookies } from "next/headers";
import { eq } from "drizzle-orm";
import { randomBytes } from "crypto";
import { getDb } from "./db";
import { learners } from "./schema";

export const SESSION_COOKIE = "guide_session";

export async function getOrCreateLearner() {
  const jar = await cookies();
  let token = jar.get(SESSION_COOKIE)?.value;
  const db = getDb();

  if (token) {
    const existing = await db
      .select()
      .from(learners)
      .where(eq(learners.sessionToken, token))
      .limit(1);
    if (existing[0]) {
      await db
        .update(learners)
        .set({ lastSeenAt: new Date() })
        .where(eq(learners.id, existing[0].id));
      return existing[0];
    }

    const inserted = await db
      .insert(learners)
      .values({ sessionToken: token })
      .returning();
    return inserted[0];
  }

  token = randomBytes(24).toString("hex");
  const inserted = await db
    .insert(learners)
    .values({ sessionToken: token })
    .returning();

  try {
    jar.set(SESSION_COOKIE, token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
    });
  } catch {
    // Cookie may already be managed by middleware / route handlers.
  }

  return inserted[0];
}
