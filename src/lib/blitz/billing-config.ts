/**
 * Stripe configuration for Blitz — read from env at request time (never at
 * module load) so Cloudflare Pages secrets work and missing keys only turn
 * billing off instead of crashing the app.
 */
import Stripe from "stripe";
import type {
  BlitzBillingInterval,
  BlitzPaidPlanId,
} from "@/lib/blitz/plans";

export type BlitzPriceMap = Record<
  BlitzPaidPlanId,
  Record<BlitzBillingInterval, string | null>
>;

function env(name: string): string | null {
  const v = process.env[name]?.trim();
  return v ? v : null;
}

export function blitzPriceIds(): BlitzPriceMap {
  return {
    plus: {
      month: env("STRIPE_PRICE_PLUS_MONTHLY"),
      year: env("STRIPE_PRICE_PLUS_YEARLY"),
    },
    ultra: {
      month: env("STRIPE_PRICE_ULTRA_MONTHLY"),
      year: env("STRIPE_PRICE_ULTRA_YEARLY"),
    },
  };
}

/** True when the secret key exists (portal, promo sync, webhook processing). */
export function stripeConfigured(): boolean {
  return Boolean(env("STRIPE_SECRET_KEY"));
}

/** True when teachers can actually start a checkout (key + at least one price). */
export function checkoutConfigured(): boolean {
  if (!stripeConfigured()) return false;
  const p = blitzPriceIds();
  return Boolean(p.plus.month || p.plus.year || p.ultra.month || p.ultra.year);
}

export function stripeWebhookSecret(): string | null {
  return env("STRIPE_WEBHOOK_SECRET");
}

/** Test-mode keys (sk_test_ / rk_test_) → Stripe dashboard test links. */
export function stripeTestMode(): boolean {
  const key = env("STRIPE_SECRET_KEY") ?? "";
  return key.includes("_test_");
}

export function stripeDashboardUrl(
  kind: "subscriptions" | "customers" | "coupons" | "promotion_codes",
  id: string,
): string {
  return `https://dashboard.stripe.com/${stripeTestMode() ? "test/" : ""}${kind}/${encodeURIComponent(id)}`;
}

/** Edge-safe Stripe client (fetch HTTP client). Null when not configured. */
export function getStripe(): Stripe | null {
  const key = env("STRIPE_SECRET_KEY");
  if (!key) return null;
  return new Stripe(key, {
    httpClient: Stripe.createFetchHttpClient(),
    appInfo: { name: "Guide Blitz" },
  });
}

/** Map a Stripe price id back to a Blitz plan + interval using env config. */
export function planForPriceId(
  priceId: string | null | undefined,
): { plan: BlitzPaidPlanId; interval: BlitzBillingInterval } | null {
  if (!priceId) return null;
  const prices = blitzPriceIds();
  for (const plan of ["plus", "ultra"] as const) {
    for (const interval of ["month", "year"] as const) {
      if (prices[plan][interval] === priceId) return { plan, interval };
    }
  }
  return null;
}

export const BILLING_NOT_CONFIGURED_MESSAGE =
  "Payments coming soon. You can still redeem a code from Guide.";
