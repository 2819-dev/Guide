/**
 * Blitz promo codes.
 *  - "upgrade": grants Plus/Ultra for N days, redeemed in Blitz (no Stripe).
 *  - "discount": a Stripe coupon + promotion code; teachers enter it at
 *    Stripe Checkout (allow_promotion_codes is on).
 */
import { sql } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { getStripe } from "@/lib/blitz/billing-config";
import {
  ensureBlitzBillingSchema,
  rowsOf,
} from "@/lib/blitz/billing-schema";
import { getEntitlement } from "@/lib/blitz/entitlements";
import {
  getPlan,
  type BlitzPaidPlanId,
} from "@/lib/blitz/plans";

export type PromoKind = "upgrade" | "discount";
export type DiscountDuration = "once" | "repeating" | "forever";

export type PromoCodeRow = {
  id: string;
  code: string;
  kind: PromoKind;
  planId: string | null;
  durationDays: number | null;
  percentOff: number | null;
  discountDuration: DiscountDuration | null;
  discountMonths: number | null;
  maxRedemptions: number | null;
  redemptionCount: number;
  expiresAt: string | null;
  active: boolean;
  stripeCouponId: string | null;
  stripePromotionCodeId: string | null;
  note: string;
  createdAt: string;
  recentRedeemers: { name: string; email: string | null; at: string }[];
};

/** Uppercase letters, digits, dash, underscore; 3–40 chars. */
export function normalizePromoCode(raw: string): string {
  return raw.trim().toUpperCase().replace(/\s+/g, "");
}

export function promoCodeFormatError(code: string): string | null {
  if (code.length < 3) return "Codes need at least 3 characters.";
  if (code.length > 40) return "Codes can be at most 40 characters.";
  if (!/^[A-Z0-9][A-Z0-9_-]*$/.test(code)) {
    return "Use letters, numbers, dashes, or underscores (no spaces).";
  }
  return null;
}

/* ---------- admin: create / list / toggle ---------- */

export type CreatePromoInput =
  | {
      kind: "upgrade";
      code: string;
      planId: BlitzPaidPlanId;
      durationDays: number;
      maxRedemptions: number | null;
      expiresAt: Date | null;
      note?: string;
    }
  | {
      kind: "discount";
      code: string;
      percentOff: number;
      discountDuration: DiscountDuration;
      discountMonths: number | null;
      maxRedemptions: number | null;
      expiresAt: Date | null;
      note?: string;
    };

export async function createPromoCode(
  input: CreatePromoInput,
  createdBy: string,
): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  await ensureBlitzBillingSchema();
  const code = normalizePromoCode(input.code);
  const formatErr = promoCodeFormatError(code);
  if (formatErr) return { ok: false, error: formatErr };
  if (input.expiresAt && input.expiresAt.getTime() <= Date.now()) {
    return { ok: false, error: "The expiry date is already in the past." };
  }

  const db = getDb();
  const [dupe] = rowsOf<{ id: string }>(
    await db.execute(sql`SELECT id FROM blitz_promo_codes WHERE code = ${code}`),
  );
  if (dupe) return { ok: false, error: `The code ${code} already exists.` };

  let stripeCouponId: string | null = null;
  let stripePromotionCodeId: string | null = null;

  if (input.kind === "discount") {
    const stripe = getStripe();
    if (!stripe) {
      return {
        ok: false,
        error:
          "Payments aren’t connected yet, so checkout discount codes can’t be created. Create a free upgrade code instead.",
      };
    }
    if (input.discountDuration === "repeating" && !input.discountMonths) {
      return { ok: false, error: "Repeating discounts need a number of months." };
    }
    try {
      const coupon = await stripe.coupons.create({
        name: `Blitz ${code} (${input.percentOff}% off)`,
        percent_off: input.percentOff,
        duration: input.discountDuration,
        ...(input.discountDuration === "repeating"
          ? { duration_in_months: input.discountMonths ?? 1 }
          : {}),
        metadata: { app: "blitz", code },
      });
      stripeCouponId = coupon.id;
      const promo = await stripe.promotionCodes.create({
        coupon: coupon.id,
        code,
        ...(input.maxRedemptions ? { max_redemptions: input.maxRedemptions } : {}),
        ...(input.expiresAt
          ? { expires_at: Math.floor(input.expiresAt.getTime() / 1000) }
          : {}),
        metadata: { app: "blitz" },
      });
      stripePromotionCodeId = promo.id;
    } catch (e) {
      console.error("[blitz promo] stripe create failed", e);
      const msg = e instanceof Error ? e.message : "";
      return { ok: false, error: `Stripe couldn’t create the code${msg ? `: ${msg}` : "."}` };
    }
  }

  const [row] = rowsOf<{ id: string }>(
    await db.execute(sql`
      INSERT INTO blitz_promo_codes
        (code, kind, plan_id, duration_days, percent_off, discount_duration, discount_months,
         max_redemptions, expires_at, stripe_coupon_id, stripe_promotion_code_id, note, created_by)
      VALUES
        (${code}, ${input.kind},
         ${input.kind === "upgrade" ? input.planId : null},
         ${input.kind === "upgrade" ? input.durationDays : null},
         ${input.kind === "discount" ? input.percentOff : null},
         ${input.kind === "discount" ? input.discountDuration : null},
         ${input.kind === "discount" && input.discountDuration === "repeating" ? input.discountMonths : null},
         ${input.maxRedemptions}, ${input.expiresAt ? input.expiresAt.toISOString() : null},
         ${stripeCouponId}, ${stripePromotionCodeId}, ${(input.note ?? "").slice(0, 300)}, ${createdBy})
      ON CONFLICT (code) DO NOTHING
      RETURNING id`),
  );
  if (!row) return { ok: false, error: `The code ${code} already exists.` };
  return { ok: true, id: row.id };
}

export async function listPromoCodes(): Promise<PromoCodeRow[]> {
  await ensureBlitzBillingSchema();
  const db = getDb();
  type Raw = {
    id: string;
    code: string;
    kind: PromoKind;
    plan_id: string | null;
    duration_days: number | null;
    percent_off: number | null;
    discount_duration: DiscountDuration | null;
    discount_months: number | null;
    max_redemptions: number | null;
    redemption_count: number;
    expires_at: string | Date | null;
    active: boolean;
    stripe_coupon_id: string | null;
    stripe_promotion_code_id: string | null;
    note: string;
    created_at: string | Date;
    redeemers: unknown;
  };
  const rows = rowsOf<Raw>(
    await db.execute(sql`
      SELECT c.*,
        (SELECT COALESCE(json_agg(json_build_object(
            'name', p.display_name, 'email', p.login_email, 'at', r.created_at)
            ORDER BY r.created_at DESC), '[]'::json)
         FROM (SELECT * FROM blitz_promo_redemptions WHERE promo_code_id = c.id
               ORDER BY created_at DESC LIMIT 25) r
         JOIN profiles p ON p.id = r.profile_id) AS redeemers
      FROM blitz_promo_codes c
      ORDER BY c.active DESC, c.created_at DESC
      LIMIT 300`),
  );
  const iso = (v: string | Date | null) =>
    v == null ? null : v instanceof Date ? v.toISOString() : new Date(v).toISOString();
  return rows.map((r) => ({
    id: r.id,
    code: r.code,
    kind: r.kind,
    planId: r.plan_id,
    durationDays: r.duration_days,
    percentOff: r.percent_off,
    discountDuration: r.discount_duration,
    discountMonths: r.discount_months,
    maxRedemptions: r.max_redemptions,
    redemptionCount: r.redemption_count,
    expiresAt: iso(r.expires_at),
    active: r.active,
    stripeCouponId: r.stripe_coupon_id,
    stripePromotionCodeId: r.stripe_promotion_code_id,
    note: r.note,
    createdAt: iso(r.created_at) ?? "",
    recentRedeemers: (Array.isArray(r.redeemers)
      ? r.redeemers
      : typeof r.redeemers === "string"
        ? JSON.parse(r.redeemers)
        : []) as PromoCodeRow["recentRedeemers"],
  }));
}

export async function setPromoActive(
  id: string,
  active: boolean,
): Promise<{ ok: true } | { ok: false; error: string }> {
  await ensureBlitzBillingSchema();
  const db = getDb();
  const [row] = rowsOf<{ stripe_promotion_code_id: string | null }>(
    await db.execute(sql`
      UPDATE blitz_promo_codes SET active = ${active}, updated_at = now()
      WHERE id = ${id}::uuid RETURNING stripe_promotion_code_id`),
  );
  if (!row) return { ok: false, error: "Code not found." };
  if (row.stripe_promotion_code_id) {
    const stripe = getStripe();
    if (stripe) {
      try {
        await stripe.promotionCodes.update(row.stripe_promotion_code_id, { active });
      } catch (e) {
        console.error("[blitz promo] stripe toggle failed", e);
        return {
          ok: false,
          error: "Saved in Guide, but the payment provider didn’t update. Check the code in the Stripe dashboard.",
        };
      }
    }
  }
  return { ok: true };
}

/* ---------- teacher: redeem ---------- */

export type RedeemResult =
  | { ok: true; planId: string; planLabel: string; expiresAt: string | null; message: string }
  | { ok: false; status: number; error: string };

export async function redeemPromoCode(
  profileId: string,
  rawCode: string,
): Promise<RedeemResult> {
  await ensureBlitzBillingSchema();
  const code = normalizePromoCode(rawCode);
  if (!code) return { ok: false, status: 400, error: "Enter a code." };

  const db = getDb();
  type Raw = {
    id: string;
    kind: string;
    plan_id: string | null;
    duration_days: number | null;
    max_redemptions: number | null;
    redemption_count: number;
    expires_at: string | null;
    active: boolean;
    already: boolean;
  };
  const [promo] = rowsOf<Raw>(
    await db.execute(sql`
      SELECT c.id, c.kind, c.plan_id, c.duration_days, c.max_redemptions, c.redemption_count,
             c.expires_at, c.active,
             EXISTS (SELECT 1 FROM blitz_promo_redemptions r
                     WHERE r.promo_code_id = c.id AND r.profile_id = ${profileId}::uuid) AS already
      FROM blitz_promo_codes c WHERE c.code = ${code}`),
  );

  if (!promo) return { ok: false, status: 404, error: "We couldn’t find that code. Check the spelling and try again." };
  if (promo.kind === "discount") {
    return {
      ok: false,
      status: 400,
      error: "That’s a checkout discount. Choose a plan below and enter the code at checkout.",
    };
  }
  if (!promo.active) return { ok: false, status: 410, error: "That code is no longer active." };
  if (promo.expires_at && new Date(promo.expires_at).getTime() <= Date.now()) {
    return { ok: false, status: 410, error: "That code has expired." };
  }
  if (promo.already) return { ok: false, status: 409, error: "You’ve already used this code." };
  if (promo.max_redemptions != null && promo.redemption_count >= promo.max_redemptions) {
    return { ok: false, status: 410, error: "That code has reached its redemption limit." };
  }

  // One atomic statement: redemption (unique per teacher) → grant → counter.
  // Sub-statements can't see each other's writes, so the grant id is minted here.
  const grantId = crypto.randomUUID();
  const [granted] = rowsOf<{ grant_id: string; plan_id: string; expires_at: string | null }>(
    await db.execute(sql`
      WITH code AS (
        SELECT id, plan_id, duration_days FROM blitz_promo_codes
        WHERE id = ${promo.id}::uuid AND active AND kind = 'upgrade'
          AND (expires_at IS NULL OR expires_at > now())
          AND (max_redemptions IS NULL OR redemption_count < max_redemptions)
      ),
      red AS (
        INSERT INTO blitz_promo_redemptions (promo_code_id, profile_id, grant_id)
        SELECT id, ${profileId}::uuid, ${grantId}::uuid FROM code
        ON CONFLICT (promo_code_id, profile_id) DO NOTHING
        RETURNING id, promo_code_id
      ),
      g AS (
        INSERT INTO blitz_plan_grants (id, profile_id, plan_id, source, promo_code_id, note, expires_at)
        SELECT ${grantId}::uuid, ${profileId}::uuid, code.plan_id, 'promo', code.id, ${`Code ${code}`},
               CASE WHEN code.duration_days IS NULL THEN NULL
                    ELSE now() + make_interval(days => code.duration_days) END
        FROM code JOIN red ON red.promo_code_id = code.id
        RETURNING id, plan_id, expires_at
      ),
      bump AS (
        UPDATE blitz_promo_codes SET redemption_count = redemption_count + 1, updated_at = now()
        WHERE id IN (SELECT promo_code_id FROM red)
        RETURNING id
      )
      SELECT g.id AS grant_id, g.plan_id, g.expires_at, (SELECT count(*) FROM bump) AS bumped
      FROM g`),
  );

  if (!granted) {
    return { ok: false, status: 409, error: "That code can’t be used right now. It may have just reached its limit." };
  }

  const ent = await getEntitlement(profileId);
  const plan = getPlan(granted.plan_id);
  const until = granted.expires_at
    ? new Date(granted.expires_at).toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
        timeZone: "UTC",
      })
    : null;
  const outranked = ent.plan.id !== plan.id;
  return {
    ok: true,
    planId: plan.id,
    planLabel: plan.label,
    expiresAt: granted.expires_at ? new Date(granted.expires_at).toISOString() : null,
    message: outranked
      ? `Code applied: ${plan.label}${until ? ` until ${until}` : ""}. You’re already on ${ent.plan.label}, which includes it.`
      : `Code applied. You’re now on Blitz ${plan.label}${until ? ` until ${until}` : ""}.`,
  };
}
