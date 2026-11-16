import Link from "next/link";
import { redirect } from "next/navigation";
import { BlitzStage, StageEyebrow } from "@/components/blitz-billing/stage";
import {
  UpgradeView,
  type UpgradeViewProps,
} from "@/components/blitz-billing/upgrade-view";
import { syncCheckoutSession } from "@/lib/blitz/billing";
import { blitzPriceIds, checkoutConfigured } from "@/lib/blitz/billing-config";
import { getEntitlementDetails } from "@/lib/blitz/entitlements";
import { hasEducationAccess } from "@/lib/education-access";
import { requireProfile } from "@/lib/profile";

export const runtime = "edge";
export const dynamic = "force-dynamic";

export const metadata = { title: "Blitz plans" };

export default async function BlitzUpgradePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const authz = await requireProfile();
  if (!authz) redirect("/auth/sign-in?as=educator");
  const { profile } = authz;
  if (profile.role !== "rebbe" && profile.role !== "admin") {
    redirect("/apps/blitz/join");
  }

  if (!(await hasEducationAccess(profile))) {
    return (
      <BlitzStage>
        <div className="mx-auto flex max-w-xl flex-col gap-3 py-10">
          <StageEyebrow>Blitz plans</StageEyebrow>
          <h1 className="m-0 text-3xl font-black text-white">Almost there</h1>
          <p className="m-0 text-indigo-100">
            Blitz plans open once your school is approved on Guide. We’ll email you as soon as it is.
          </p>
          <Link
            href="/teacher"
            className="mt-2 inline-flex min-h-11 w-fit items-center rounded-xl bg-[#b6f03a] px-5 font-extrabold text-[#15123b] no-underline"
          >
            Back to Guide
          </Link>
        </div>
      </BlitzStage>
    );
  }

  const params = await searchParams;
  const one = (k: string) => {
    const v = params[k];
    return Array.isArray(v) ? v[0] : v;
  };

  let flash: UpgradeViewProps["flash"] = null;
  if (one("checkout") === "success") {
    const sessionId = one("session_id");
    const synced = sessionId ? await syncCheckoutSession(sessionId, profile.id) : false;
    flash = {
      tone: "good",
      text: synced
        ? "You’re all set. Thanks for upgrading Blitz!"
        : "Payment received. Your plan will switch on in a moment. Refresh if it hasn’t yet.",
    };
  } else if (one("checkout") === "canceled") {
    flash = { tone: "info", text: "Checkout canceled. Nothing was charged." };
  } else if (one("billing") === "unavailable") {
    flash = { tone: "warn", text: "Billing isn’t available for your account right now." };
  }

  const details = await getEntitlementDetails(profile.id);
  const prices = blitzPriceIds();
  const { snapshot, effective } = details;

  return (
    <BlitzStage>
      <UpgradeView
        planId={snapshot.plan.id}
        liveGamesUsed={snapshot.liveGamesUsedThisMonth}
        liveGamesRemaining={snapshot.liveGamesRemaining}
        source={effective.source}
        subscription={effective.subscription}
        grant={effective.grant}
        hasStripeCustomer={details.hasStripeCustomer}
        checkoutReady={checkoutConfigured()}
        available={{
          plus: { month: Boolean(prices.plus.month), year: Boolean(prices.plus.year) },
          ultra: { month: Boolean(prices.ultra.month), year: Boolean(prices.ultra.year) },
        }}
        flash={flash}
      />
    </BlitzStage>
  );
}
