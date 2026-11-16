/** Guide Official tools for Blitz: teacher lookup, grants, subscribers, usage. */
import { sql } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { stripeDashboardUrl } from "@/lib/blitz/billing-config";
import {
  ensureBlitzBillingSchema,
  rowsOf,
} from "@/lib/blitz/billing-schema";
import { ENTITLED_SUBSCRIPTION_STATUSES } from "@/lib/blitz/entitlements";

export const BLITZ_OFFICIAL_ROLES = ["admin", "moderator"] as const;

const iso = (v: unknown): string | null =>
  v == null ? null : new Date(v as string).toISOString();

export type TeacherLookup = {
  id: string;
  displayName: string;
  email: string | null;
  role: string;
};

export async function findProfileByEmail(email: string): Promise<TeacherLookup | null> {
  const db = getDb();
  const [row] = rowsOf<{ id: string; display_name: string; login_email: string | null; role: string }>(
    await db.execute(sql`
      SELECT id, display_name, login_email, role FROM profiles
      WHERE lower(login_email) = ${email.trim().toLowerCase()}
      ORDER BY (role = 'rebbe') DESC, created_at ASC
      LIMIT 1`),
  );
  if (!row) return null;
  return { id: row.id, displayName: row.display_name, email: row.login_email, role: row.role };
}

export type GrantRow = {
  id: string;
  profileId: string;
  teacherName: string;
  teacherEmail: string | null;
  planId: string;
  source: string;
  code: string | null;
  note: string;
  expiresAt: string | null;
  createdAt: string;
  grantedByName: string | null;
};

/** Active (unrevoked, unexpired) grants — admin and promo. */
export async function listActiveGrants(): Promise<GrantRow[]> {
  await ensureBlitzBillingSchema();
  const db = getDb();
  const rows = rowsOf<Record<string, unknown>>(
    await db.execute(sql`
      SELECT g.id, g.profile_id, p.display_name, p.login_email, g.plan_id, g.source,
             c.code, g.note, g.expires_at, g.created_at, gb.display_name AS granted_by_name
      FROM blitz_plan_grants g
      JOIN profiles p ON p.id = g.profile_id
      LEFT JOIN profiles gb ON gb.id = g.granted_by
      LEFT JOIN blitz_promo_codes c ON c.id = g.promo_code_id
      WHERE g.revoked_at IS NULL AND (g.expires_at IS NULL OR g.expires_at > now())
      ORDER BY g.created_at DESC
      LIMIT 300`),
  );
  return rows.map((r) => ({
    id: r.id as string,
    profileId: r.profile_id as string,
    teacherName: r.display_name as string,
    teacherEmail: (r.login_email as string | null) ?? null,
    planId: r.plan_id as string,
    source: r.source as string,
    code: (r.code as string | null) ?? null,
    note: (r.note as string) ?? "",
    expiresAt: iso(r.expires_at),
    createdAt: iso(r.created_at) ?? "",
    grantedByName: (r.granted_by_name as string | null) ?? null,
  }));
}

/** Revoke one grant by id (admin or promo). Returns the affected profile. */
export async function revokeGrantById(
  grantId: string,
  revokedBy: string,
): Promise<string | null> {
  await ensureBlitzBillingSchema();
  const db = getDb();
  const [row] = rowsOf<{ profile_id: string }>(
    await db.execute(sql`
      UPDATE blitz_plan_grants SET revoked_at = now(), revoked_by = ${revokedBy}
      WHERE id = ${grantId}::uuid AND revoked_at IS NULL
      RETURNING profile_id`),
  );
  return row?.profile_id ?? null;
}

export type SubscriberRow = {
  id: string;
  profileId: string;
  teacherName: string;
  teacherEmail: string | null;
  planId: string;
  interval: string | null;
  status: string;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
  updatedAt: string;
  stripeUrl: string;
  customerUrl: string;
};

export async function listSubscribers(): Promise<SubscriberRow[]> {
  await ensureBlitzBillingSchema();
  const db = getDb();
  const rows = rowsOf<Record<string, unknown>>(
    await db.execute(sql`
      SELECT s.*, p.display_name, p.login_email
      FROM blitz_subscriptions s
      JOIN profiles p ON p.id = s.profile_id
      ORDER BY (s.status IN ('active','trialing','past_due')) DESC, s.updated_at DESC
      LIMIT 500`),
  );
  return rows.map((r) => ({
    id: r.id as string,
    profileId: r.profile_id as string,
    teacherName: r.display_name as string,
    teacherEmail: (r.login_email as string | null) ?? null,
    planId: r.plan_id as string,
    interval: (r.billing_interval as string | null) ?? null,
    status: r.status as string,
    currentPeriodEnd: iso(r.current_period_end),
    cancelAtPeriodEnd: Boolean(r.cancel_at_period_end),
    updatedAt: iso(r.updated_at) ?? "",
    stripeUrl: stripeDashboardUrl("subscriptions", r.id as string),
    customerUrl: stripeDashboardUrl("customers", r.stripe_customer_id as string),
  }));
}

export type BlitzOverview = {
  teachers: number;
  planCounts: { free: number; plus: number; ultra: number };
  payingSubscriptions: number;
  pastDue: number;
  activeGrants: number;
  activePromoCodes: number;
  redemptionsThisMonth: number;
  liveGamesThisMonth: number;
  liveGamesAllTime: number;
  quizzes: number;
  publicQuizzes: number;
};

/**
 * Effective plan per teacher computed in SQL (same rules as
 * pickEffectivePlan, minus the 3-day stale-period safety net).
 */
export async function getBlitzOverview(): Promise<BlitzOverview> {
  await ensureBlitzBillingSchema();
  const db = getDb();
  const statuses = sql.raw(
    ENTITLED_SUBSCRIPTION_STATUSES.map((s) => `'${s}'`).join(","),
  );
  const [plans] = rowsOf<Record<string, string | number>>(
    await db.execute(sql`
      WITH t AS (
        SELECT p.id FROM profiles p
        WHERE p.role = 'rebbe'
           OR EXISTS (SELECT 1 FROM blitz_subscriptions s WHERE s.profile_id = p.id)
           OR EXISTS (SELECT 1 FROM blitz_plan_grants g WHERE g.profile_id = p.id AND g.revoked_at IS NULL)
      ),
      eff AS (
        SELECT t.id, GREATEST(
          COALESCE((SELECT MAX(CASE s.plan_id WHEN 'ultra' THEN 2 WHEN 'plus' THEN 1 ELSE 0 END)
                    FROM blitz_subscriptions s
                    WHERE s.profile_id = t.id AND s.status IN (${statuses})), 0),
          COALESCE((SELECT MAX(CASE g.plan_id WHEN 'ultra' THEN 2 WHEN 'plus' THEN 1 ELSE 0 END)
                    FROM blitz_plan_grants g
                    WHERE g.profile_id = t.id AND g.revoked_at IS NULL AND g.starts_at <= now()
                      AND (g.expires_at IS NULL OR g.expires_at > now())), 0)
        ) AS r
        FROM t
      )
      SELECT
        count(*) AS teachers,
        count(*) FILTER (WHERE r = 0) AS free,
        count(*) FILTER (WHERE r = 1) AS plus,
        count(*) FILTER (WHERE r = 2) AS ultra
      FROM eff`),
  );
  const [stats] = rowsOf<Record<string, string | number>>(
    await db.execute(sql`
      SELECT
        (SELECT count(*) FROM blitz_subscriptions WHERE status IN ('active','trialing')) AS paying,
        (SELECT count(*) FROM blitz_subscriptions WHERE status = 'past_due') AS past_due,
        (SELECT count(*) FROM blitz_plan_grants WHERE revoked_at IS NULL
           AND (expires_at IS NULL OR expires_at > now())) AS grants,
        (SELECT count(*) FROM blitz_promo_codes WHERE active
           AND (expires_at IS NULL OR expires_at > now())) AS promo_codes,
        (SELECT count(*) FROM blitz_promo_redemptions
           WHERE created_at >= date_trunc('month', now())) AS redemptions_month,
        (SELECT count(*) FROM testquiz_games
           WHERE created_at >= date_trunc('month', now() AT TIME ZONE 'UTC') AT TIME ZONE 'UTC') AS games_month,
        (SELECT count(*) FROM testquiz_games) AS games_all,
        (SELECT count(*) FROM testquiz_quizzes) AS quizzes,
        (SELECT count(*) FROM testquiz_quizzes WHERE is_public) AS public_quizzes`),
  );
  const n = (v: unknown) => Number(v ?? 0);
  return {
    teachers: n(plans?.teachers),
    planCounts: { free: n(plans?.free), plus: n(plans?.plus), ultra: n(plans?.ultra) },
    payingSubscriptions: n(stats?.paying),
    pastDue: n(stats?.past_due),
    activeGrants: n(stats?.grants),
    activePromoCodes: n(stats?.promo_codes),
    redemptionsThisMonth: n(stats?.redemptions_month),
    liveGamesThisMonth: n(stats?.games_month),
    liveGamesAllTime: n(stats?.games_all),
    quizzes: n(stats?.quizzes),
    publicQuizzes: n(stats?.public_quizzes),
  };
}
