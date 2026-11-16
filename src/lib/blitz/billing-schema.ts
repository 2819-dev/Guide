/**
 * Blitz billing tables (Stripe subscriptions, admin plan grants, promo codes).
 *
 * These live outside src/lib/schema.ts on purpose: they are created at
 * runtime by ensureBlitzBillingSchema() (production migrations are not run by
 * hand), and keeping them out of the main schema means no existing
 * select-all query can reference a column that does not exist yet.
 * drizzle/0016_blitz_billing.sql mirrors the DDL below for the record.
 */
import { sql } from "drizzle-orm";
import {
  bigint,
  boolean,
  integer,
  pgTable,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { getDb } from "@/lib/db";

/** Stripe customer per Guide profile (customer reuse across checkouts). */
export const blitzBillingCustomers = pgTable("blitz_billing_customers", {
  profileId: uuid("profile_id").primaryKey(),
  stripeCustomerId: varchar("stripe_customer_id", { length: 64 }).notNull(),
  email: varchar("email", { length: 254 }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

/** Latest known state of each Stripe subscription (keyed by Stripe id). */
export const blitzSubscriptions = pgTable("blitz_subscriptions", {
  id: varchar("id", { length: 64 }).primaryKey(),
  profileId: uuid("profile_id").notNull(),
  stripeCustomerId: varchar("stripe_customer_id", { length: 64 }).notNull(),
  planId: varchar("plan_id", { length: 16 }).notNull(),
  billingInterval: varchar("billing_interval", { length: 8 }),
  priceId: varchar("price_id", { length: 64 }),
  status: varchar("status", { length: 24 }).notNull(),
  currentPeriodEnd: timestamp("current_period_end", { withTimezone: true }),
  cancelAtPeriodEnd: boolean("cancel_at_period_end").notNull().default(false),
  /** Unix seconds of the event/snapshot that wrote this row (ordering guard). */
  stateVersion: bigint("state_version", { mode: "number" }).notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

/** Plans granted without Stripe: by an Official, or by a redeemed promo code. */
export const blitzPlanGrants = pgTable("blitz_plan_grants", {
  id: uuid("id").defaultRandom().primaryKey(),
  profileId: uuid("profile_id").notNull(),
  planId: varchar("plan_id", { length: 16 }).notNull(),
  /** "admin" | "promo" */
  source: varchar("source", { length: 16 }).notNull(),
  promoCodeId: uuid("promo_code_id"),
  grantedBy: uuid("granted_by"),
  note: varchar("note", { length: 300 }).notNull().default(""),
  startsAt: timestamp("starts_at", { withTimezone: true }).defaultNow().notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }),
  revokedAt: timestamp("revoked_at", { withTimezone: true }),
  revokedBy: uuid("revoked_by"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

/** Owner-created promo codes: free upgrades or Stripe Checkout discounts. */
export const blitzPromoCodes = pgTable(
  "blitz_promo_codes",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    code: varchar("code", { length: 40 }).notNull(),
    /** "upgrade" (grants a plan for N days) | "discount" (Stripe coupon) */
    kind: varchar("kind", { length: 16 }).notNull(),
    planId: varchar("plan_id", { length: 16 }),
    durationDays: integer("duration_days"),
    percentOff: integer("percent_off"),
    /** Stripe coupon duration: once | repeating | forever */
    discountDuration: varchar("discount_duration", { length: 16 }),
    discountMonths: integer("discount_months"),
    maxRedemptions: integer("max_redemptions"),
    redemptionCount: integer("redemption_count").notNull().default(0),
    expiresAt: timestamp("expires_at", { withTimezone: true }),
    active: boolean("active").notNull().default(true),
    stripeCouponId: varchar("stripe_coupon_id", { length: 64 }),
    stripePromotionCodeId: varchar("stripe_promotion_code_id", { length: 64 }),
    note: varchar("note", { length: 300 }).notNull().default(""),
    createdBy: uuid("created_by"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [uniqueIndex("blitz_promo_codes_code_idx").on(t.code)],
);

export const blitzPromoRedemptions = pgTable(
  "blitz_promo_redemptions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    promoCodeId: uuid("promo_code_id").notNull(),
    profileId: uuid("profile_id").notNull(),
    grantId: uuid("grant_id"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    uniqueIndex("blitz_promo_redemptions_code_profile_idx").on(
      t.promoCodeId,
      t.profileId,
    ),
  ],
);

/** Processed Stripe webhook event ids (idempotency log). */
export const blitzStripeEvents = pgTable("blitz_stripe_events", {
  id: varchar("id", { length: 80 }).primaryKey(),
  type: varchar("type", { length: 80 }).notNull(),
  processedAt: timestamp("processed_at", { withTimezone: true }).defaultNow().notNull(),
});

/* ---------- runtime bootstrap ---------- */

let schemaReady: Promise<void> | null = null;

/**
 * Idempotently creates the billing tables. Cached per isolate; retried on
 * failure. Keep in sync with drizzle/0016_blitz_billing.sql.
 */
export function ensureBlitzBillingSchema(): Promise<void> {
  schemaReady ??= (async () => {
    const db = getDb();
    await db.execute(sql`CREATE TABLE IF NOT EXISTS blitz_billing_customers (
      profile_id uuid PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
      stripe_customer_id varchar(64) NOT NULL,
      email varchar(254),
      created_at timestamptz NOT NULL DEFAULT now()
    )`);
    await db.execute(
      sql`CREATE UNIQUE INDEX IF NOT EXISTS blitz_billing_customers_stripe_idx ON blitz_billing_customers (stripe_customer_id)`,
    );
    await db.execute(sql`CREATE TABLE IF NOT EXISTS blitz_subscriptions (
      id varchar(64) PRIMARY KEY,
      profile_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
      stripe_customer_id varchar(64) NOT NULL,
      plan_id varchar(16) NOT NULL,
      billing_interval varchar(8),
      price_id varchar(64),
      status varchar(24) NOT NULL,
      current_period_end timestamptz,
      cancel_at_period_end boolean NOT NULL DEFAULT false,
      state_version bigint NOT NULL DEFAULT 0,
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now()
    )`);
    await db.execute(
      sql`CREATE INDEX IF NOT EXISTS blitz_subscriptions_profile_idx ON blitz_subscriptions (profile_id)`,
    );
    await db.execute(sql`CREATE TABLE IF NOT EXISTS blitz_promo_codes (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      code varchar(40) NOT NULL,
      kind varchar(16) NOT NULL,
      plan_id varchar(16),
      duration_days integer,
      percent_off integer,
      discount_duration varchar(16),
      discount_months integer,
      max_redemptions integer,
      redemption_count integer NOT NULL DEFAULT 0,
      expires_at timestamptz,
      active boolean NOT NULL DEFAULT true,
      stripe_coupon_id varchar(64),
      stripe_promotion_code_id varchar(64),
      note varchar(300) NOT NULL DEFAULT '',
      created_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now()
    )`);
    await db.execute(
      sql`CREATE UNIQUE INDEX IF NOT EXISTS blitz_promo_codes_code_idx ON blitz_promo_codes (code)`,
    );
    await db.execute(sql`CREATE TABLE IF NOT EXISTS blitz_plan_grants (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      profile_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
      plan_id varchar(16) NOT NULL,
      source varchar(16) NOT NULL,
      promo_code_id uuid REFERENCES blitz_promo_codes(id) ON DELETE SET NULL,
      granted_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
      note varchar(300) NOT NULL DEFAULT '',
      starts_at timestamptz NOT NULL DEFAULT now(),
      expires_at timestamptz,
      revoked_at timestamptz,
      revoked_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
      created_at timestamptz NOT NULL DEFAULT now()
    )`);
    await db.execute(
      sql`CREATE INDEX IF NOT EXISTS blitz_plan_grants_profile_idx ON blitz_plan_grants (profile_id)`,
    );
    await db.execute(sql`CREATE TABLE IF NOT EXISTS blitz_promo_redemptions (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      promo_code_id uuid NOT NULL REFERENCES blitz_promo_codes(id) ON DELETE CASCADE,
      profile_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
      grant_id uuid REFERENCES blitz_plan_grants(id) ON DELETE SET NULL,
      created_at timestamptz NOT NULL DEFAULT now()
    )`);
    await db.execute(
      sql`CREATE UNIQUE INDEX IF NOT EXISTS blitz_promo_redemptions_code_profile_idx ON blitz_promo_redemptions (promo_code_id, profile_id)`,
    );
    await db.execute(sql`CREATE TABLE IF NOT EXISTS blitz_stripe_events (
      id varchar(80) PRIMARY KEY,
      type varchar(80) NOT NULL,
      processed_at timestamptz NOT NULL DEFAULT now()
    )`);
    await db.execute(sql`CREATE TABLE IF NOT EXISTS blitz_billing_meta (
      key varchar(64) PRIMARY KEY,
      created_at timestamptz NOT NULL DEFAULT now()
    )`);
    // One-time: plans set by the old Official stub (testquiz_entitlements.plan_id)
    // become permanent admin grants, so nobody is silently downgraded.
    await db.execute(sql`
      WITH marker AS (
        INSERT INTO blitz_billing_meta (key) VALUES ('legacy_plan_grants_v1')
        ON CONFLICT (key) DO NOTHING
        RETURNING key
      )
      INSERT INTO blitz_plan_grants (profile_id, plan_id, source, note)
      SELECT e.profile_id, e.plan_id, 'admin', 'Carried over from the earlier plan setting'
      FROM testquiz_entitlements e, marker
      WHERE e.plan_id IN ('plus', 'ultra')`);
  })().catch((e) => {
    schemaReady = null;
    throw e;
  });
  return schemaReady;
}

/** Normalizes neon-http execute() results to a row array. */
export function rowsOf<T>(result: unknown): T[] {
  if (Array.isArray(result)) return result as T[];
  const rows = (result as { rows?: T[] } | null)?.rows;
  return Array.isArray(rows) ? rows : [];
}
