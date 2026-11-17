import Link from "next/link";
import { redirect } from "next/navigation";
import { AdminConsole } from "@/components/blitz-billing/admin-console";
import { BlitzStage, StageEyebrow } from "@/components/blitz-billing/stage";
import {
  BLITZ_OFFICIAL_ROLES,
  getBlitzOverview,
  listActiveGrants,
  listSubscribers,
} from "@/lib/blitz/admin";
import {
  checkoutConfigured,
  stripeConfigured,
  stripeTestMode,
} from "@/lib/blitz/billing-config";
import { listPromoCodes } from "@/lib/blitz/promo";
import { requireProfile } from "@/lib/profile";

export const runtime = "edge";
export const dynamic = "force-dynamic";

export const metadata = { title: "Admin · Blitz" };

const TABS = ["promo", "plans", "subscribers", "usage"] as const;

export default async function BlitzAdminPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const signedIn = await requireProfile();
  if (!signedIn) redirect("/auth/sign-in?as=official");
  if (!(BLITZ_OFFICIAL_ROLES as readonly string[]).includes(signedIn.profile.role)) {
    redirect("/apps/blitz");
  }
  if (signedIn.profile.mustChangePassword) redirect("/auth/change-password");

  const params = await searchParams;
  const rawTab = Array.isArray(params.tab) ? params.tab[0] : params.tab;
  const initialTab = (TABS as readonly string[]).includes(rawTab ?? "")
    ? (rawTab as (typeof TABS)[number])
    : "promo";

  const [codes, grants, subscribers, overview] = await Promise.all([
    listPromoCodes(),
    listActiveGrants(),
    listSubscribers(),
    getBlitzOverview(),
  ]);

  return (
    <BlitzStage wide>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <StageEyebrow>Guide Official · Blitz</StageEyebrow>
          <h1 className="m-0 mt-1 text-3xl font-black tracking-tight text-white sm:text-4xl">
            Blitz admin
          </h1>
          <p className="m-0 mt-1 text-[0.95rem] text-indigo-100">
            Promo codes, plans, subscribers, and usage.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/admin#blitz"
            className="inline-flex min-h-11 items-center rounded-xl border border-white/25 px-4 text-sm font-bold text-white no-underline hover:bg-white/10"
          >
            ← Official dashboard
          </Link>
          <Link
            href="/apps/blitz/upgrade"
            className="inline-flex min-h-11 items-center rounded-xl border border-[#22d3ee]/60 px-4 text-sm font-bold text-[#22d3ee] no-underline hover:bg-[#22d3ee]/10"
          >
            Teacher plans page
          </Link>
        </div>
      </div>
      <AdminConsole
        codes={codes}
        grants={grants}
        subscribers={subscribers}
        overview={overview}
        stripe={{
          configured: stripeConfigured(),
          checkout: checkoutConfigured(),
          testMode: stripeTestMode(),
        }}
        initialTab={initialTab}
      />
    </BlitzStage>
  );
}
