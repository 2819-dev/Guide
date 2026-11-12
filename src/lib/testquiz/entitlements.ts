import { eq } from "drizzle-orm";
import { getDb } from "@/lib/db";
import {
  DEFAULT_TESTQUIZ_PLAN,
  getPlan,
  type TestQuizPlan,
  type TestQuizPlanId,
} from "@/lib/testquiz/plans";
import {
  TESTQUIZ_CORE_TYPES,
  type TestQuizQuestionType,
} from "@/lib/testquiz/types";
import { testquizEntitlements } from "@/lib/schema";

function currentMonthKey(): string {
  const d = new Date();
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

export type EntitlementSnapshot = {
  plan: TestQuizPlan;
  liveGamesUsedThisMonth: number;
  liveGamesRemaining: number | null;
  usageMonth: string;
};

export async function getEntitlement(
  profileId: string,
): Promise<EntitlementSnapshot> {
  const db = getDb();
  const month = currentMonthKey();
  const [row] = await db
    .select()
    .from(testquizEntitlements)
    .where(eq(testquizEntitlements.profileId, profileId))
    .limit(1);

  if (!row) {
    await db.insert(testquizEntitlements).values({
      profileId,
      planId: DEFAULT_TESTQUIZ_PLAN,
      liveGamesUsedThisMonth: 0,
      usageMonth: month,
    });
    const plan = getPlan(DEFAULT_TESTQUIZ_PLAN);
    return {
      plan,
      liveGamesUsedThisMonth: 0,
      liveGamesRemaining:
        plan.liveGamesPerMonth < 0 ? null : plan.liveGamesPerMonth,
      usageMonth: month,
    };
  }

  let used = row.liveGamesUsedThisMonth;
  let usageMonth = row.usageMonth;
  if (usageMonth !== month) {
    used = 0;
    usageMonth = month;
    await db
      .update(testquizEntitlements)
      .set({
        liveGamesUsedThisMonth: 0,
        usageMonth: month,
        updatedAt: new Date(),
      })
      .where(eq(testquizEntitlements.profileId, profileId));
  }

  const plan = getPlan(row.planId);
  return {
    plan,
    liveGamesUsedThisMonth: used,
    liveGamesRemaining:
      plan.liveGamesPerMonth < 0
        ? null
        : Math.max(0, plan.liveGamesPerMonth - used),
    usageMonth,
  };
}

export async function setPlan(
  profileId: string,
  planId: TestQuizPlanId,
): Promise<EntitlementSnapshot> {
  const snap = await getEntitlement(profileId);
  const db = getDb();
  await db
    .update(testquizEntitlements)
    .set({ planId, updatedAt: new Date() })
    .where(eq(testquizEntitlements.profileId, profileId));
  return { ...snap, plan: getPlan(planId) };
}

export async function consumeLiveGame(
  profileId: string,
): Promise<{ ok: true } | { error: string }> {
  const snap = await getEntitlement(profileId);
  if (
    snap.plan.liveGamesPerMonth >= 0 &&
    snap.liveGamesUsedThisMonth >= snap.plan.liveGamesPerMonth
  ) {
    return {
      error: `Your ${snap.plan.label} plan has no live games left this month.`,
    };
  }
  const db = getDb();
  await db
    .update(testquizEntitlements)
    .set({
      liveGamesUsedThisMonth: snap.liveGamesUsedThisMonth + 1,
      usageMonth: snap.usageMonth,
      updatedAt: new Date(),
    })
    .where(eq(testquizEntitlements.profileId, profileId));
  return { ok: true };
}

export function planAllowsQuestionType(
  plan: TestQuizPlan,
  type: TestQuizQuestionType,
): boolean {
  if (plan.questionTypes === "all") return true;
  return TESTQUIZ_CORE_TYPES.includes(type);
}
