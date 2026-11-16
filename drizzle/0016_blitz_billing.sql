-- Blitz billing: Stripe subscriptions, Official plan grants, promo codes.
-- For the record only: the app applies this idempotently at runtime via
-- ensureBlitzBillingSchema() in src/lib/blitz/billing-schema.ts.
-- Existing tables (incl. testquiz_entitlements) are not altered;
-- testquiz_entitlements.plan_id becomes a cache of the effective plan.

CREATE TABLE IF NOT EXISTS blitz_billing_customers (
  profile_id uuid PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  stripe_customer_id varchar(64) NOT NULL,
  email varchar(254),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS blitz_billing_customers_stripe_idx ON blitz_billing_customers (stripe_customer_id);

CREATE TABLE IF NOT EXISTS blitz_subscriptions (
  id varchar(64) PRIMARY KEY,                       -- Stripe subscription id
  profile_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  stripe_customer_id varchar(64) NOT NULL,
  plan_id varchar(16) NOT NULL,                     -- plus | ultra
  billing_interval varchar(8),                      -- month | year
  price_id varchar(64),
  status varchar(24) NOT NULL,                      -- Stripe status
  current_period_end timestamptz,
  cancel_at_period_end boolean NOT NULL DEFAULT false,
  state_version bigint NOT NULL DEFAULT 0,          -- unix secs; older events ignored
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS blitz_subscriptions_profile_idx ON blitz_subscriptions (profile_id);

CREATE TABLE IF NOT EXISTS blitz_promo_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code varchar(40) NOT NULL,
  kind varchar(16) NOT NULL,                        -- upgrade | discount
  plan_id varchar(16),
  duration_days integer,
  percent_off integer,
  discount_duration varchar(16),                    -- once | repeating | forever
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
);
CREATE UNIQUE INDEX IF NOT EXISTS blitz_promo_codes_code_idx ON blitz_promo_codes (code);

CREATE TABLE IF NOT EXISTS blitz_plan_grants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  plan_id varchar(16) NOT NULL,
  source varchar(16) NOT NULL,                      -- admin | promo
  promo_code_id uuid REFERENCES blitz_promo_codes(id) ON DELETE SET NULL,
  granted_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  note varchar(300) NOT NULL DEFAULT '',
  starts_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz,
  revoked_at timestamptz,
  revoked_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS blitz_plan_grants_profile_idx ON blitz_plan_grants (profile_id);

CREATE TABLE IF NOT EXISTS blitz_promo_redemptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  promo_code_id uuid NOT NULL REFERENCES blitz_promo_codes(id) ON DELETE CASCADE,
  profile_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  grant_id uuid REFERENCES blitz_plan_grants(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS blitz_promo_redemptions_code_profile_idx ON blitz_promo_redemptions (promo_code_id, profile_id);

CREATE TABLE IF NOT EXISTS blitz_stripe_events (
  id varchar(80) PRIMARY KEY,                       -- Stripe event id (idempotency)
  type varchar(80) NOT NULL,
  processed_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS blitz_billing_meta (
  key varchar(64) PRIMARY KEY,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- One-time: plans set by the earlier Official stub become permanent admin grants.
WITH marker AS (
  INSERT INTO blitz_billing_meta (key) VALUES ('legacy_plan_grants_v1')
  ON CONFLICT (key) DO NOTHING
  RETURNING key
)
INSERT INTO blitz_plan_grants (profile_id, plan_id, source, note)
SELECT e.profile_id, e.plan_id, 'admin', 'Carried over from the earlier plan setting'
FROM testquiz_entitlements e, marker
WHERE e.plan_id IN ('plus', 'ultra');
