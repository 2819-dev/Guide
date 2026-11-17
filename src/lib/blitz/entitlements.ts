import { eq, sql } from "drizzle-orm";
import { getDb } from "@/lib/db";
import {
  ensureBlitzBillingSchema,
  rowsOf,
} from "@/lib/blitz/billing-schema";
import {
  BLITZ_PLAN_RANK,
  DEFAULT_BLITZ_PLAN,
  getPlan,
  isBlitzPlanId,
  type BlitzPlan,
  type BlitzPlanId,
} from "@/lib/blitz/plans";
import {
  BLITZ_CORE_TYPES,
  type BlitzQuestionType,
} from "@/lib/blitz/types";
import { testquizEntitlements } from "@/lib/schema";

function currentMonthKey(): string {
  const d = new Date();
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

export type EntitlementSnapshot = {
  plan: BlitzPlan;
  liveGamesUsedThisMonth: number;
  liveGamesRemaining: number | null;
  usageMonth: string;
};

/* ---------- effective plan resolution ---------- */

/** Stripe statuses that keep paid access (past_due = Stripe is retrying). */
export const ENTITLED_SUBSCRIPTION_STATUSES = [
  "active",
  "trialing",
  "past_due",
] as const;

export type SubscriptionFact = {
  id: string;
  plan: string;
  status: string;
  interval: string | null;
  periodEnd: string | null;
  cancelAtPeriodEnd: boolean;
};

export type GrantFact = {
  id: string;
  plan: string;
  source: "admin" | "promo" | string;
  expiresAt: string | null;
  code: string | null;
};

export type PlanSource = "subscription" | "admin" | "promo" | "free";

export type EffectivePlan = {
  planId: BlitzPlanId;
  source: PlanSource;
  subscription: SubscriptionFact | null;
  grant: GrantFact | null;
};

function subscriptionEntitled(s: SubscriptionFact, now: Date): boolean {
  if (!(ENTITLED_SUBSCRIPTION_STATUSES as readonly string[]).includes(s.status)) {
    return false;
  }
  // Safety net if a deletion webhook is missed: allow a 3-day grace past
  // the period end, then stop granting.
  if (s.periodEnd) {
    const end = new Date(s.periodEnd).getTime();
    if (Number.isFinite(end) && end + 3 * 86_400_000 < now.getTime()) return false;
  }
  return true;
}

function grantActive(g: GrantFact, now: Date): boolean {
  if (!g.expiresAt) return true;
  return new Date(g.expiresAt).getTime() > now.getTime();
}

function rank(plan: string): number {
  return isBlitzPlanId(plan) ? BLITZ_PLAN_RANK[plan] : 0;
}

/**
 * Pure: highest plan across active subscriptions and active grants.
 * Ties prefer subscription > admin > promo. Exported for tests.
 */
export function pickEffectivePlan(
  subs: SubscriptionFact[],
  grants: GrantFact[],
  now: Date = new Date(),
): EffectivePlan {
  let best: EffectivePlan = {
    planId: DEFAULT_BLITZ_PLAN,
    source: "free",
    subscription: null,
    grant: null,
  };
  let bestRank = 0;
  for (const s of subs) {
    if (!subscriptionEntitled(s, now)) continue;
    const r = rank(s.plan);
    if (r > bestRank) {
      bestRank = r;
      best = { planId: s.plan as BlitzPlanId, source: "subscription", subscription: s, grant: null };
    }
  }
  const order = (g: GrantFact) => (g.source === "admin" ? 0 : 1);
  const sorted = [...grants].sort((a, b) => order(a) - order(b));
  for (const g of sorted) {
    if (!grantActive(g, now)) continue;
    const r = rank(g.plan);
    if (r > bestRank) {
      bestRank = r;
      best = {
        planId: g.plan as BlitzPlanId,
        source: g.source === "promo" ? "promo" : "admin",
        subscription: null,
        grant: g,
      };
    }
  }
  // Still surface the subscription (e.g. canceled / past due) for the UI.
  if (!best.subscription && subs.length > 0) {
    const latest = [...subs].sort(
      (a, b) =>
        new Date(b.periodEnd ?? 0).getTime() - new Date(a.periodEnd ?? 0).getTime(),
    )[0];
    best = { ...best, subscription: latest };
  }
  return best;
}

function parseJsonArray<T>(v: unknown): T[] {
  if (Array.isArray(v)) return v as T[];
  if (typeof v === "string") {
    try {
      const parsed = JSON.parse(v);
      return Array.isArray(parsed) ? (parsed as T[]) : [];
    } catch {
      return [];
    }
  }
  return [];
}

type StateRow = {
  has_row: boolean;
  cached_plan: string | null;
  used: number | null;
  usage_month: string | null;
  subs: unknown;
  grants: unknown;
  has_customer: boolean;
};

export type EntitlementDetails = {
  snapshot: EntitlementSnapshot;
  effective: EffectivePlan;
  hasStripeCustomer: boolean;
};

/** Loads usage + every plan source in one round trip, then syncs the cache row. */
export async function getEntitlementDetails(
  profileId: string,
): Promise<EntitlementDetails> {
  await ensureBlitzBillingSchema();
  const db = getDb();
  const month = currentMonthKey();
  const [row] = rowsOf<StateRow>(
    await db.execute(sql`
      SELECT
        (e.profile_id IS NOT NULL) AS has_row,
        e.plan_id AS cached_plan,
        e.live_games_used_this_month AS used,
        e.usage_month,
        (SELECT COALESCE(json_agg(json_build_object(
            'id', s.id, 'plan', s.plan_id, 'status', s.status,
            'interval', s.billing_interval, 'periodEnd', s.current_period_end,
            'cancelAtPeriodEnd', s.cancel_at_period_end)), '[]'::json)
         FROM blitz_subscriptions s WHERE s.profile_id = p.pid) AS subs,
        (SELECT COALESCE(json_agg(json_build_object(
            'id', g.id, 'plan', g.plan_id, 'source', g.source,
            'expiresAt', g.expires_at, 'code', c.code)), '[]'::json)
         FROM blitz_plan_grants g
         LEFT JOIN blitz_promo_codes c ON c.id = g.promo_code_id
         WHERE g.profile_id = p.pid AND g.revoked_at IS NULL
           AND g.starts_at <= now()
           AND (g.expires_at IS NULL OR g.expires_at > now())) AS grants,
        EXISTS (SELECT 1 FROM blitz_billing_customers bc WHERE bc.profile_id = p.pid) AS has_customer
      FROM (SELECT ${profileId}::uuid AS pid) p
      LEFT JOIN testquiz_entitlements e ON e.profile_id = p.pid`),
  );

  const effective = pickEffectivePlan(
    parseJsonArray<SubscriptionFact>(row?.subs),
    parseJsonArray<GrantFact>(row?.grants),
  );
  const plan = getPlan(effective.planId);

  let used = row?.used ?? 0;
  let usageMonth = row?.usage_month ?? month;

  if (!row?.has_row) {
    used = 0;
    usageMonth = month;
    await db
      .insert(testquizEntitlements)
      .values({
        profileId,
        planId: plan.id,
        liveGamesUsedThisMonth: 0,
        usageMonth: month,
      })
      .onConflictDoNothing();
  } else if (usageMonth !== month || row.cached_plan !== plan.id) {
    if (usageMonth !== month) {
      used = 0;
      usageMonth = month;
    }
    // plan_id is a cache of the effective plan (handy for reporting).
    await db
      .update(testquizEntitlements)
      .set({
        planId: plan.id,
        liveGamesUsedThisMonth: used,
        usageMonth,
        updatedAt: new Date(),
      })
      .where(eq(testquizEntitlements.profileId, profileId));
  }

  return {
    snapshot: {
      plan,
      liveGamesUsedThisMonth: used,
      liveGamesRemaining:
        plan.liveGamesPerMonth < 0
          ? null
          : Math.max(0, plan.liveGamesPerMonth - used),
      usageMonth,
    },
    effective,
    hasStripeCustomer: Boolean(row?.has_customer),
  };
}

export async function getEntitlement(
  profileId: string,
): Promise<EntitlementSnapshot> {
  return (await getEntitlementDetails(profileId)).snapshot;
}

/* ---------- admin grants ---------- */

/** Revoke every active Official-granted plan for a teacher. */
export async function revokeAdminGrants(
  profileId: string,
  revokedBy: string | null = null,
): Promise<number> {
  await ensureBlitzBillingSchema();
  const db = getDb();
  const rows = rowsOf<{ id: string }>(
    await db.execute(sql`
      UPDATE blitz_plan_grants
      SET revoked_at = now(), revoked_by = ${revokedBy}
      WHERE profile_id = ${profileId} AND source = 'admin' AND revoked_at IS NULL
      RETURNING id`),
  );
  return rows.length;
}

/**
 * Official grant: replaces any earlier admin grant. "free" just revokes.
 * Never touches Stripe subscriptions or promo grants.
 */
export async function grantPlan(opts: {
  profileId: string;
  planId: BlitzPlanId;
  expiresAt?: Date | null;
  grantedBy?: string | null;
  note?: string;
}): Promise<EntitlementSnapshot> {
  await revokeAdminGrants(opts.profileId, opts.grantedBy ?? null);
  if (opts.planId !== "free") {
    const db = getDb();
    await db.execute(sql`
      INSERT INTO blitz_plan_grants (profile_id, plan_id, source, granted_by, note, expires_at)
      VALUES (${opts.profileId}, ${opts.planId}, 'admin', ${opts.grantedBy ?? null},
              ${(opts.note ?? "").slice(0, 300)}, ${opts.expiresAt ? opts.expiresAt.toISOString() : null})`);
  }
  return getEntitlement(opts.profileId);
}

/** Back-compat for the Official stub API: permanent admin grant. */
export async function setPlan(
  profileId: string,
  planId: BlitzPlanId,
): Promise<EntitlementSnapshot> {
  return grantPlan({ profileId, planId });
}

/* ---------- usage ---------- */

export async function consumeLiveGame(
  profileId: string,
): Promise<{ ok: true } | { error: string }> {
  const snap = await getEntitlement(profileId);
  if (
    snap.plan.liveGamesPerMonth >= 0 &&
    snap.liveGamesUsedThisMonth >= snap.plan.liveGamesPerMonth
  ) {
    return {
      error: `You’ve used all of this month’s live games on the ${snap.plan.label} plan. See plans to host more.`,
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
  plan: BlitzPlan,
  type: BlitzQuestionType,
): boolean {
  if (plan.questionTypes === "all") return true;
  return BLITZ_CORE_TYPES.includes(type);
}
