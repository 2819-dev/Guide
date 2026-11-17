/**
 * Blitz billing: Stripe Checkout, customer portal, and webhook → entitlement.
 *
 * The webhook path is split so it can be tested without Stripe:
 *   handleStripeEvent(event, deps)  → maps an event to a SubscriptionSnapshot
 *   applySubscriptionSnapshot(snap) → idempotent upsert + entitlement refresh
 */
import type Stripe from "stripe";
import { sql } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { sendEmail } from "@/lib/email";
import {
  blitzPriceIds,
  getStripe,
  planForPriceId,
} from "@/lib/blitz/billing-config";
import {
  ensureBlitzBillingSchema,
  rowsOf,
} from "@/lib/blitz/billing-schema";
import { getEntitlement, getEntitlementDetails } from "@/lib/blitz/entitlements";
import {
  isPaidPlanId,
  type BlitzBillingInterval,
  type BlitzPaidPlanId,
} from "@/lib/blitz/plans";

/* ---------- customers ---------- */

export async function getStripeCustomerId(profileId: string): Promise<string | null> {
  await ensureBlitzBillingSchema();
  const db = getDb();
  const [row] = rowsOf<{ stripe_customer_id: string }>(
    await db.execute(
      sql`SELECT stripe_customer_id FROM blitz_billing_customers WHERE profile_id = ${profileId}`,
    ),
  );
  return row?.stripe_customer_id ?? null;
}

async function profileIdForCustomer(customerId: string): Promise<string | null> {
  const db = getDb();
  const [row] = rowsOf<{ profile_id: string }>(
    await db.execute(
      sql`SELECT profile_id FROM blitz_billing_customers WHERE stripe_customer_id = ${customerId}`,
    ),
  );
  return row?.profile_id ?? null;
}

async function rememberCustomer(
  profileId: string,
  customerId: string,
  email: string | null,
): Promise<void> {
  const db = getDb();
  await db.execute(sql`
    INSERT INTO blitz_billing_customers (profile_id, stripe_customer_id, email)
    VALUES (${profileId}, ${customerId}, ${email})
    ON CONFLICT (profile_id) DO UPDATE
      SET stripe_customer_id = EXCLUDED.stripe_customer_id,
          email = COALESCE(EXCLUDED.email, blitz_billing_customers.email)`);
}

async function ensureCustomer(
  stripe: Stripe,
  profile: { id: string; displayName: string; loginEmail: string | null },
): Promise<string> {
  const existing = await getStripeCustomerId(profile.id);
  if (existing) return existing;
  const customer = await stripe.customers.create(
    {
      email: profile.loginEmail ?? undefined,
      name: profile.displayName,
      metadata: { profile_id: profile.id, app: "blitz" },
    },
    { idempotencyKey: `blitz-customer-${profile.id}` },
  );
  await rememberCustomer(profile.id, customer.id, profile.loginEmail);
  return customer.id;
}

/* ---------- checkout + portal ---------- */

export type CheckoutResult =
  | { ok: true; url: string }
  | { ok: false; status: number; error: string; code?: string; portalUrl?: string };

export async function createCheckoutSession(opts: {
  profile: { id: string; displayName: string; loginEmail: string | null };
  plan: BlitzPaidPlanId;
  interval: BlitzBillingInterval;
  origin: string;
}): Promise<CheckoutResult> {
  const stripe = getStripe();
  const priceId = blitzPriceIds()[opts.plan][opts.interval];
  if (!stripe || !priceId) {
    return {
      ok: false,
      status: 503,
      code: "billing_not_configured",
      error: "Payments coming soon.",
    };
  }

  const { effective } = await getEntitlementDetails(
    opts.profile.id,
  );
  if (effective.source === "subscription" && effective.subscription) {
    const portal = await createPortalSession(opts.profile.id, opts.origin).catch(() => null);
    return {
      ok: false,
      status: 409,
      code: "already_subscribed",
      error:
        "You already have a Blitz subscription. Use Manage subscription to switch plans or billing period.",
      portalUrl: portal && portal.ok ? portal.url : undefined,
    };
  }

  const customer = await ensureCustomer(stripe, opts.profile);
  const back = `${opts.origin}/apps/blitz/upgrade`;
  const meta = { profile_id: opts.profile.id, blitz_plan: opts.plan, app: "blitz" };
  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer,
    client_reference_id: opts.profile.id,
    line_items: [{ price: priceId, quantity: 1 }],
    allow_promotion_codes: true,
    metadata: meta,
    subscription_data: { metadata: meta },
    success_url: `${back}?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${back}?checkout=canceled`,
  });
  if (!session.url) {
    return { ok: false, status: 502, error: "Stripe did not return a checkout link." };
  }
  return { ok: true, url: session.url };
}

export async function createPortalSession(
  profileId: string,
  origin: string,
): Promise<{ ok: true; url: string } | { ok: false; status: number; error: string; code?: string }> {
  const stripe = getStripe();
  if (!stripe) {
    return { ok: false, status: 503, code: "billing_not_configured", error: "Payments coming soon." };
  }
  const customer = await getStripeCustomerId(profileId);
  if (!customer) {
    return {
      ok: false,
      status: 404,
      code: "no_customer",
      error: "You don’t have a Blitz subscription to manage yet.",
    };
  }
  const session = await stripe.billingPortal.sessions.create({
    customer,
    return_url: `${origin}/apps/blitz/upgrade`,
  });
  return { ok: true, url: session.url };
}

/* ---------- webhook: subscription snapshots ---------- */

export type SubscriptionSnapshot = {
  subscriptionId: string;
  customerId: string;
  /** Guide profile id if known (metadata / client_reference_id). */
  profileId: string | null;
  priceId: string | null;
  /** Plan hint from metadata when the price id isn't in env. */
  planHint: string | null;
  status: string;
  /** Unix seconds */
  currentPeriodEnd: number | null;
  cancelAtPeriodEnd: boolean;
  /** Unix seconds — newer versions win; older events are ignored. */
  version: number;
};

export type LooseSubscription = {
  id: string;
  customer: string | { id: string };
  status: string;
  metadata?: Record<string, string> | null;
  cancel_at_period_end?: boolean;
  current_period_end?: number | null;
  items?: {
    data?: Array<{
      price?: { id?: string; recurring?: { interval?: string } | null } | null;
      current_period_end?: number | null;
    }>;
  };
};

function idOf(v: string | { id: string } | null | undefined): string | null {
  if (!v) return null;
  return typeof v === "string" ? v : v.id;
}

/** Works across Stripe API versions (period end moved onto items in 2025). */
export function snapshotFromSubscription(
  sub: LooseSubscription,
  version: number,
  profileIdHint: string | null = null,
): SubscriptionSnapshot {
  const item = sub.items?.data?.[0];
  return {
    subscriptionId: sub.id,
    customerId: idOf(sub.customer) ?? "",
    profileId: sub.metadata?.profile_id || profileIdHint || null,
    priceId: item?.price?.id ?? null,
    planHint: sub.metadata?.blitz_plan ?? null,
    status: sub.status,
    currentPeriodEnd: sub.current_period_end ?? item?.current_period_end ?? null,
    cancelAtPeriodEnd: Boolean(sub.cancel_at_period_end),
    version,
  };
}

export type ApplyResult =
  | { applied: true; profileId: string; planId: string; status: string }
  | { applied: false; reason: string };

/** Idempotent: upsert keyed by subscription id, guarded by version. */
export async function applySubscriptionSnapshot(
  snap: SubscriptionSnapshot,
): Promise<ApplyResult> {
  await ensureBlitzBillingSchema();
  const mapped = planForPriceId(snap.priceId);
  const planId = mapped?.plan ?? (isPaidPlanId(snap.planHint) ? snap.planHint : null);
  if (!planId) return { applied: false, reason: `unknown price ${snap.priceId ?? "(none)"}` };

  const db = getDb();
  let profileId = snap.profileId;
  if (!profileId && snap.customerId) profileId = await profileIdForCustomer(snap.customerId);
  if (!profileId) {
    // Fall back to an earlier row for this subscription.
    const [row] = rowsOf<{ profile_id: string }>(
      await db.execute(
        sql`SELECT profile_id FROM blitz_subscriptions WHERE id = ${snap.subscriptionId}`,
      ),
    );
    profileId = row?.profile_id ?? null;
  }
  if (!profileId) return { applied: false, reason: "no matching Guide profile" };

  const [exists] = rowsOf<{ ok: number }>(
    await db.execute(sql`SELECT 1 AS ok FROM profiles WHERE id = ${profileId}::uuid`),
  );
  if (!exists) return { applied: false, reason: "profile not found" };

  if (snap.customerId) await rememberCustomer(profileId, snap.customerId, null);

  const interval =
    mapped?.interval ??
    null;
  const periodEnd = snap.currentPeriodEnd
    ? new Date(snap.currentPeriodEnd * 1000).toISOString()
    : null;

  await db.execute(sql`
    INSERT INTO blitz_subscriptions
      (id, profile_id, stripe_customer_id, plan_id, billing_interval, price_id, status,
       current_period_end, cancel_at_period_end, state_version, updated_at)
    VALUES
      (${snap.subscriptionId}, ${profileId}, ${snap.customerId}, ${planId}, ${interval},
       ${snap.priceId}, ${snap.status}, ${periodEnd}, ${snap.cancelAtPeriodEnd},
       ${snap.version}, now())
    ON CONFLICT (id) DO UPDATE SET
      profile_id = EXCLUDED.profile_id,
      stripe_customer_id = EXCLUDED.stripe_customer_id,
      plan_id = EXCLUDED.plan_id,
      billing_interval = COALESCE(EXCLUDED.billing_interval, blitz_subscriptions.billing_interval),
      price_id = EXCLUDED.price_id,
      status = EXCLUDED.status,
      current_period_end = EXCLUDED.current_period_end,
      cancel_at_period_end = EXCLUDED.cancel_at_period_end,
      state_version = EXCLUDED.state_version,
      updated_at = now()
    WHERE blitz_subscriptions.state_version <= EXCLUDED.state_version`);

  // Recompute + cache the effective plan on testquiz_entitlements.
  const ent = await getEntitlement(profileId);
  return { applied: true, profileId, planId: ent.plan.id, status: snap.status };
}

/* ---------- webhook: events ---------- */

export type StripeEventDeps = {
  /** Fetch the live subscription (injected so tests run without Stripe). */
  retrieveSubscription: (id: string) => Promise<LooseSubscription>;
  /** Optional side effect for failed payments (email). */
  onPaymentFailed?: (info: { profileId: string; attempt: number }) => Promise<void>;
  now?: () => number;
};

export type MinimalStripeEvent = {
  id: string;
  type: string;
  created: number;
  data: { object: unknown };
};

export const HANDLED_STRIPE_EVENTS = [
  "checkout.session.completed",
  "customer.subscription.created",
  "customer.subscription.updated",
  "customer.subscription.deleted",
  "invoice.payment_failed",
] as const;

/** Maps one Stripe event to entitlement changes. Safe to call repeatedly. */
export async function handleStripeEvent(
  event: MinimalStripeEvent,
  deps: StripeEventDeps,
): Promise<ApplyResult | { applied: false; reason: string }> {
  const nowSec = Math.floor((deps.now?.() ?? Date.now()) / 1000);
  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as {
        mode?: string;
        subscription?: string | { id: string } | null;
        customer?: string | { id: string } | null;
        client_reference_id?: string | null;
        metadata?: Record<string, string> | null;
      };
      if (session.mode !== "subscription") return { applied: false, reason: "not a subscription checkout" };
      const subId = idOf(session.subscription ?? null);
      if (!subId) return { applied: false, reason: "checkout without subscription" };
      const profileId = session.client_reference_id || session.metadata?.profile_id || null;
      const customerId = idOf(session.customer ?? null);
      if (profileId && customerId) {
        await ensureBlitzBillingSchema();
        await rememberCustomer(profileId, customerId, null);
      }
      // Live fetch = freshest state, so stamp it with "now".
      const sub = await deps.retrieveSubscription(subId);
      return applySubscriptionSnapshot(snapshotFromSubscription(sub, nowSec, profileId));
    }
    case "customer.subscription.created":
    case "customer.subscription.updated":
    case "customer.subscription.deleted": {
      const sub = event.data.object as LooseSubscription;
      return applySubscriptionSnapshot(snapshotFromSubscription(sub, event.created));
    }
    case "invoice.payment_failed": {
      const invoice = event.data.object as {
        subscription?: string | { id: string } | null;
        parent?: { subscription_details?: { subscription?: string | { id: string } | null } | null } | null;
        attempt_count?: number;
      };
      const subId =
        idOf(invoice.subscription ?? null) ??
        idOf(invoice.parent?.subscription_details?.subscription ?? null);
      if (!subId) return { applied: false, reason: "invoice without subscription" };
      const sub = await deps.retrieveSubscription(subId);
      const result = await applySubscriptionSnapshot(snapshotFromSubscription(sub, nowSec));
      if (result.applied && deps.onPaymentFailed) {
        await deps
          .onPaymentFailed({ profileId: result.profileId, attempt: invoice.attempt_count ?? 1 })
          .catch((e) => console.error("[blitz billing] payment-failed notice", e));
      }
      return result;
    }
    default:
      return { applied: false, reason: `ignored ${event.type}` };
  }
}

/** True if this event id was already processed. */
export async function stripeEventSeen(eventId: string): Promise<boolean> {
  await ensureBlitzBillingSchema();
  const db = getDb();
  const [row] = rowsOf<{ id: string }>(
    await db.execute(sql`SELECT id FROM blitz_stripe_events WHERE id = ${eventId}`),
  );
  return Boolean(row);
}

export async function markStripeEventProcessed(eventId: string, type: string): Promise<void> {
  const db = getDb();
  await db.execute(sql`
    INSERT INTO blitz_stripe_events (id, type) VALUES (${eventId}, ${type})
    ON CONFLICT (id) DO NOTHING`);
}

/** Default email for a failed renewal (first attempt only, to avoid spam). */
export async function notifyPaymentFailed(info: {
  profileId: string;
  attempt: number;
  origin: string;
}): Promise<void> {
  if (info.attempt > 1) return;
  const db = getDb();
  const [row] = rowsOf<{ login_email: string | null; display_name: string }>(
    await db.execute(
      sql`SELECT login_email, display_name FROM profiles WHERE id = ${info.profileId}`,
    ),
  );
  if (!row?.login_email) return;
  const link = `${info.origin}/apps/blitz/upgrade`;
  await sendEmail({
    to: row.login_email,
    subject: "Your Blitz payment didn’t go through",
    text: `Hi ${row.display_name},\n\nWe couldn’t charge your card for Blitz. Stripe will retry automatically. To update your card, open ${link} and choose “Manage subscription”.\n\n— Guide`,
    html: `<p>Hi ${escapeHtml(row.display_name)},</p><p>We couldn’t charge your card for your Blitz plan. Stripe will retry automatically, and your plan stays on in the meantime.</p><p>To update your card, open <a href="${link}">your Blitz plan page</a> and choose <strong>Manage subscription</strong>.</p><p>— Guide</p>`,
  });
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c] as string,
  );
}

/** After Checkout redirects back, sync immediately (webhook may lag). */
export async function syncCheckoutSession(
  sessionId: string,
  profileId: string,
): Promise<boolean> {
  const stripe = getStripe();
  if (!stripe || !/^cs_[A-Za-z0-9_]+$/.test(sessionId)) return false;
  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    if (session.client_reference_id !== profileId) return false;
    const subId = idOf(session.subscription as string | { id: string } | null);
    if (!subId) return false;
    const sub = await stripe.subscriptions.retrieve(subId);
    const res = await applySubscriptionSnapshot(
      snapshotFromSubscription(
        sub as unknown as LooseSubscription,
        Math.floor(Date.now() / 1000),
        profileId,
      ),
    );
    return res.applied;
  } catch (e) {
    console.error("[blitz billing] checkout sync failed", e);
    return false;
  }
}
