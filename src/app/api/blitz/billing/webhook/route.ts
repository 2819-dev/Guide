import Stripe from "stripe";
import { NextResponse } from "next/server";
import {
  handleStripeEvent,
  markStripeEventProcessed,
  notifyPaymentFailed,
  stripeEventSeen,
  type LooseSubscription,
} from "@/lib/blitz/billing";
import { requestOrigin } from "@/lib/blitz/billing-auth";
import { getStripe, stripeWebhookSecret } from "@/lib/blitz/billing-config";

export const runtime = "edge";

/**
 * Stripe → Blitz entitlements. Configure in Stripe:
 *   https://guidelearning.org/api/blitz/billing/webhook
 * Events: checkout.session.completed, customer.subscription.created,
 *         customer.subscription.updated, customer.subscription.deleted,
 *         invoice.payment_failed
 */
export async function POST(request: Request) {
  const stripe = getStripe();
  const secret = stripeWebhookSecret();
  if (!stripe || !secret) {
    // 503 → Stripe retries later once keys are configured.
    return NextResponse.json({ error: "Billing not configured" }, { status: 503 });
  }

  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }
  const body = await request.text();

  let event: Stripe.Event;
  try {
    event = await stripe.webhooks.constructEventAsync(
      body,
      signature,
      secret,
      undefined,
      Stripe.createSubtleCryptoProvider(),
    );
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    if (await stripeEventSeen(event.id)) {
      return NextResponse.json({ received: true, duplicate: true });
    }
    const origin = requestOrigin(request);
    const result = await handleStripeEvent(event, {
      retrieveSubscription: async (id) =>
        (await stripe.subscriptions.retrieve(id)) as unknown as LooseSubscription,
      onPaymentFailed: (info) => notifyPaymentFailed({ ...info, origin }),
    });
    if (!result.applied) {
      console.info("[blitz webhook]", event.type, event.id, "skipped:", result.reason);
    }
    await markStripeEventProcessed(event.id, event.type);
    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("[blitz webhook] failed", event.type, event.id, error);
    // 500 → Stripe retries; processing is idempotent.
    return NextResponse.json({ error: "Processing failed" }, { status: 500 });
  }
}
