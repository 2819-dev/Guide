"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent, type ReactNode } from "react";
import {
  BLITZ_PLAN_DISPLAY,
  BLITZ_PLAN_IDS,
  BLITZ_PLAN_RANK,
  BLITZ_PLANS,
  type BlitzBillingInterval,
  type BlitzPlan,
  type BlitzPlanId,
} from "@/lib/blitz/plans";
import { PlanBadge, StageEyebrow } from "./stage";

export type UpgradeViewProps = {
  planId: BlitzPlanId;
  liveGamesUsed: number;
  liveGamesRemaining: number | null;
  source: "subscription" | "admin" | "promo" | "free";
  subscription: {
    plan: string;
    status: string;
    interval: string | null;
    periodEnd: string | null;
    cancelAtPeriodEnd: boolean;
  } | null;
  grant: { plan: string; source: string; expiresAt: string | null; code: string | null } | null;
  hasStripeCustomer: boolean;
  checkoutReady: boolean;
  /** Which plan/interval combos have a Stripe price configured. */
  available: Record<"plus" | "ultra", Record<BlitzBillingInterval, boolean>>;
  flash: { tone: "good" | "info" | "warn"; text: string } | null;
};

const fmtDate = (iso: string | null) =>
  iso
    ? new Date(iso).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        timeZone: "UTC",
      })
    : "";

const fmtUsd = (n: number) =>
  n % 1 === 0 ? `$${n}` : `$${n.toFixed(2)}`;

function capLine(n: number, unit: string) {
  return n < 0 ? `Unlimited ${unit}` : `${n.toLocaleString()} ${unit}`;
}

function featureRows(plan: BlitzPlan): { text: string; on: boolean }[] {
  return [
    { text: capLine(plan.liveGamesPerMonth, "live games / month"), on: true },
    { text: `Up to ${plan.maxPlayersPerGame} players per game`, on: true },
    { text: `Up to ${plan.maxQuestionsPerQuiz} questions per quiz`, on: true },
    {
      text: plan.questionTypes === "all" ? "Every question type" : "Quiz + true/false questions",
      on: true,
    },
    { text: "Lobby music", on: plan.music },
    { text: "Advanced reports", on: plan.advancedReports },
    { text: "CSV / JSON export", on: plan.reportsExport },
    { text: plan.watermark ? "Blitz watermark on screen" : "No watermark", on: !plan.watermark },
  ];
}

function sourceLine(p: UpgradeViewProps): string {
  const s = p.subscription;
  if (p.source === "subscription" && s) {
    const period = s.interval === "year" ? "Billed yearly" : s.interval === "month" ? "Billed monthly" : "Subscription";
    if (s.status === "past_due") return `${period} · Payment issue: update your card in Manage subscription`;
    if (s.cancelAtPeriodEnd) return `${period} · Canceled, ends ${fmtDate(s.periodEnd)}`;
    if (s.status === "trialing") return `Free trial · first charge ${fmtDate(s.periodEnd)}`;
    return `${period} · Renews ${fmtDate(s.periodEnd)}`;
  }
  if (p.source === "promo" && p.grant) {
    return `From code ${p.grant.code ?? ""}${p.grant.expiresAt ? ` · until ${fmtDate(p.grant.expiresAt)}` : ""}`;
  }
  if (p.source === "admin" && p.grant) {
    return `Granted by Guide${p.grant.expiresAt ? ` · until ${fmtDate(p.grant.expiresAt)}` : ""}`;
  }
  if (s && (s.status === "canceled" || s.status === "unpaid" || s.status === "incomplete_expired")) {
    return "Your subscription has ended. Pick a plan to come back anytime.";
  }
  return "Free forever. Upgrade when your class needs more.";
}

export function UpgradeView(props: UpgradeViewProps) {
  const router = useRouter();
  const [interval, setBillingInterval] = useState<BlitzBillingInterval>(
    props.subscription?.interval === "year" ? "year" : "month",
  );
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [codeMsg, setCodeMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const current = BLITZ_PLANS[props.planId];
  const subscribed = props.source === "subscription";
  const cap = current.liveGamesPerMonth;
  const pct = cap < 0 ? 0 : Math.min(100, Math.round((props.liveGamesUsed / Math.max(1, cap)) * 100));

  async function startCheckout(plan: "plus" | "ultra") {
    setBusy(plan);
    setError(null);
    try {
      const res = await fetch("/api/blitz/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan, interval }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        url?: string;
        error?: string;
        portalUrl?: string;
      };
      if (data.url) {
        window.location.assign(data.url);
        return;
      }
      if (data.portalUrl) {
        window.location.assign(data.portalUrl);
        return;
      }
      setError(data.error ?? "We couldn’t start checkout. Try again.");
    } catch {
      setError("We couldn’t reach the server. Check your connection and try again.");
    }
    setBusy(null);
  }

  async function openPortal() {
    setBusy("portal");
    setError(null);
    try {
      const res = await fetch("/api/blitz/billing/portal", { method: "POST" });
      const data = (await res.json().catch(() => ({}))) as { url?: string; error?: string };
      if (data.url) {
        window.location.assign(data.url);
        return;
      }
      setError(data.error ?? "We couldn’t open billing. Try again.");
    } catch {
      setError("We couldn’t reach the server. Check your connection and try again.");
    }
    setBusy(null);
  }

  async function redeem(e: FormEvent) {
    e.preventDefault();
    if (!code.trim()) {
      setCodeMsg({ ok: false, text: "Enter a code." });
      return;
    }
    setBusy("code");
    setCodeMsg(null);
    try {
      const res = await fetch("/api/blitz/promo/redeem", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });
      const data = (await res.json().catch(() => ({}))) as { message?: string; error?: string };
      if (res.ok) {
        setCodeMsg({ ok: true, text: data.message ?? "Code applied!" });
        setCode("");
        router.refresh();
      } else {
        setCodeMsg({ ok: false, text: data.error ?? "That code didn’t work." });
      }
    } catch {
      setCodeMsg({ ok: false, text: "We couldn’t reach the server. Try again." });
    }
    setBusy(null);
  }

  const flashTone = {
    good: "border-[#b6f03a]/50 bg-[#b6f03a]/10 text-[#e4fbb8]",
    info: "border-[#22d3ee]/50 bg-[#22d3ee]/10 text-[#c9f5fc]",
    warn: "border-[#ffc93c]/60 bg-[#ffc93c]/10 text-[#ffe9ad]",
  } as const;

  return (
    <div className="flex flex-col gap-8">
      {/* Current plan */}
      <section aria-labelledby="current-plan" className="flex flex-col gap-5">
        <div className="flex flex-col gap-2">
          <StageEyebrow>Your Blitz plan</StageEyebrow>
          <div className="flex flex-wrap items-center gap-3">
            <h1 id="current-plan" className="m-0 text-3xl font-black tracking-tight text-white sm:text-4xl">
              Blitz {current.label}
            </h1>
            <PlanBadge planId={current.id} label={props.source === "free" ? "Current" : props.source === "subscription" ? "Subscribed" : props.source === "promo" ? "Code" : "Granted"} />
          </div>
          <p className="m-0 text-[0.95rem] text-indigo-100">{sourceLine(props)}</p>
        </div>

        {props.flash ? (
          <p role="status" className={`m-0 rounded-xl border px-4 py-3 text-sm font-semibold ${flashTone[props.flash.tone]}`}>
            {props.flash.text}
          </p>
        ) : null}

        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-2xl border border-white/10 bg-white/[0.06] p-4 sm:col-span-2">
            <div className="flex items-baseline justify-between gap-3">
              <p className="m-0 text-sm font-semibold text-indigo-100">Live games this month</p>
              <p className="m-0 text-lg font-black tabular-nums text-white">
                {props.liveGamesUsed}
                <span className="text-sm font-semibold text-indigo-200"> / {cap < 0 ? "∞" : cap}</span>
              </p>
            </div>
            <div
              className="mt-3 h-3 overflow-hidden rounded-full bg-white/10"
              role="progressbar"
              aria-label="Live games used this month"
              aria-valuemin={0}
              aria-valuemax={cap < 0 ? undefined : cap}
              aria-valuenow={props.liveGamesUsed}
            >
              <div
                className={`h-full rounded-full ${cap < 0 ? "w-full bg-gradient-to-r from-[#22d3ee] to-[#b6f03a] opacity-60" : pct >= 90 ? "bg-[#ff5a5f]" : pct >= 70 ? "bg-[#ffc93c]" : "bg-[#b6f03a]"}`}
                style={cap < 0 ? undefined : { width: `${Math.max(pct, props.liveGamesUsed > 0 ? 4 : 0)}%` }}
              />
            </div>
            <p className="m-0 mt-2 text-xs text-indigo-200">
              {cap < 0
                ? "Unlimited on Ultra. Resets don’t matter to you."
                : props.liveGamesRemaining === 0
                  ? "You’ve used every live game this month. Upgrade or wait for the 1st."
                  : `${props.liveGamesRemaining} left · resets on the 1st (UTC)`}
            </p>
          </div>
          <div className="flex flex-col justify-center gap-1 rounded-2xl border border-white/10 bg-white/[0.06] p-4 text-sm text-indigo-100">
            <p className="m-0"><span className="font-black text-white">{current.maxPlayersPerGame}</span> players per game</p>
            <p className="m-0"><span className="font-black text-white">{current.maxQuestionsPerQuiz}</span> questions per quiz</p>
            {props.hasStripeCustomer ? (
              <button
                type="button"
                onClick={openPortal}
                disabled={busy !== null || !props.checkoutReady}
                className="mt-2 inline-flex min-h-11 items-center justify-center rounded-xl border border-[#22d3ee]/60 px-3 text-sm font-bold text-[#22d3ee] transition hover:bg-[#22d3ee]/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#22d3ee] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {busy === "portal" ? "Opening…" : "Manage subscription"}
              </button>
            ) : null}
          </div>
        </div>
      </section>

      {!props.checkoutReady ? (
        <div role="note" className="rounded-2xl border border-[#ffc93c]/60 bg-[#ffc93c]/10 px-4 py-3">
          <p className="m-0 font-bold text-[#ffe9ad]">Payments aren’t set up yet</p>
          <p className="m-0 mt-0.5 text-sm text-[#fff1c9]">
            Paid plans will open here soon. Have a code from Guide? Redeem it below.
          </p>
        </div>
      ) : null}

      {error ? (
        <p role="alert" className="m-0 rounded-xl border border-[#ff5a5f]/60 bg-[#ff5a5f]/10 px-4 py-3 text-sm font-semibold text-[#ffd0d1]">
          {error}
        </p>
      ) : null}

      {/* Plans */}
      <section aria-labelledby="compare" className="flex flex-col gap-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <StageEyebrow>Plans</StageEyebrow>
            <h2 id="compare" className="m-0 mt-1 text-2xl font-black tracking-tight text-white">
              Pick what fits your class
            </h2>
          </div>
          <div role="radiogroup" aria-label="Billing period" className="inline-flex rounded-full border border-white/15 bg-white/[0.06] p-1">
            {(["month", "year"] as const).map((iv) => (
              <button
                key={iv}
                type="button"
                role="radio"
                aria-checked={interval === iv}
                onClick={() => setBillingInterval(iv)}
                className={`min-h-10 rounded-full px-4 text-sm font-bold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#22d3ee] ${interval === iv ? "bg-white text-[#15123b]" : "text-indigo-100 hover:text-white"}`}
              >
                {iv === "month" ? "Monthly" : "Yearly"}
                {iv === "year" ? (
                  <span className={`ml-1.5 rounded-full px-1.5 py-0.5 text-[0.68rem] font-extrabold ${interval === iv ? "bg-[#b6f03a] text-[#15123b]" : "bg-[#b6f03a]/20 text-[#d8f99a]"}`}>
                    2+ months free
                  </span>
                ) : null}
              </button>
            ))}
          </div>
        </div>

        <ul className="m-0 grid list-none gap-4 p-0 md:grid-cols-3">
          {BLITZ_PLAN_IDS.map((id) => {
            const plan = BLITZ_PLANS[id];
            const display = BLITZ_PLAN_DISPLAY[id];
            const isCurrent = id === props.planId;
            const featured = id === "plus";
            const price = interval === "month" ? display.monthlyUsd : display.yearlyUsd;
            const paid = id !== "free";
            const canBuy = paid && props.checkoutReady && props.available[id as "plus" | "ultra"][interval];
            const lower = BLITZ_PLAN_RANK[id] < BLITZ_PLAN_RANK[props.planId];
            const accent =
              id === "ultra" ? "#ffc93c" : id === "plus" ? "#b6f03a" : "#22d3ee";

            let action: ReactNode = null;
            if (isCurrent) {
              action = (
                <span className="inline-flex min-h-11 w-full items-center justify-center rounded-xl border border-white/20 text-sm font-bold text-indigo-100">
                  Your current plan
                </span>
              );
            } else if (!paid) {
              action = (
                <span className="inline-flex min-h-11 w-full items-center justify-center text-sm font-semibold text-indigo-200">
                  {subscribed ? "Cancel anytime in Manage subscription" : "Always free"}
                </span>
              );
            } else if (subscribed && props.hasStripeCustomer) {
              action = (
                <button
                  type="button"
                  onClick={openPortal}
                  disabled={busy !== null || !props.checkoutReady}
                  className="inline-flex min-h-11 w-full items-center justify-center rounded-xl border border-white/30 text-sm font-bold text-white transition hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#22d3ee] disabled:opacity-50"
                >
                  Switch in Manage subscription
                </button>
              );
            } else if (!canBuy) {
              action = (
                <span className="inline-flex min-h-11 w-full items-center justify-center rounded-xl border border-dashed border-white/25 text-sm font-bold text-indigo-100">
                  Not available yet
                </span>
              );
            } else {
              action = (
                <button
                  type="button"
                  onClick={() => startCheckout(id as "plus" | "ultra")}
                  disabled={busy !== null}
                  className="inline-flex min-h-11 w-full items-center justify-center rounded-xl text-sm font-extrabold text-[#15123b] transition hover:brightness-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white disabled:cursor-not-allowed disabled:opacity-45"
                  style={{ backgroundColor: accent }}
                >
                  {busy === id
                    ? "Opening checkout…"
                    : lower
                        ? `Subscribe to ${plan.label}`
                        : `Upgrade to ${plan.label}`}
                </button>
              );
            }

            return (
              <li
                key={id}
                className={`relative flex flex-col gap-4 rounded-3xl border p-5 ${featured ? "border-[#b6f03a]/60 bg-white/[0.09] shadow-[0_0_0_1px_rgba(182,240,58,0.25),0_20px_50px_-20px_rgba(182,240,58,0.35)]" : "border-white/10 bg-white/[0.05]"}`}
              >
                {featured ? (
                  <span className="absolute -top-3 left-5 rounded-full bg-[#b6f03a] px-2.5 py-0.5 text-[0.7rem] font-extrabold uppercase tracking-wider text-[#15123b]">
                    Most popular
                  </span>
                ) : null}
                <div>
                  <div className="flex items-center gap-2">
                    <span aria-hidden className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: accent }} />
                    <h3 className="m-0 text-xl font-black text-white">{plan.label}</h3>
                    {isCurrent ? <PlanBadge planId={id} label="Current" /> : null}
                  </div>
                  <p className="m-0 mt-1 text-sm text-indigo-100">{display.tagline}</p>
                </div>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-4xl font-black tracking-tight text-white">
                    {paid ? fmtUsd(price) : "$0"}
                  </span>
                  <span className="text-sm font-semibold text-indigo-200">
                    {paid ? (interval === "month" ? "/ month" : "/ year") : "forever"}
                  </span>
                </div>
                {paid && interval === "year" ? (
                  <p className="-mt-3 m-0 text-xs font-semibold text-[#d8f99a]">
                    ≈ {fmtUsd(Math.round((display.yearlyUsd / 12) * 100) / 100)} / month
                  </p>
                ) : null}
                {action}
                <ul className="m-0 flex list-none flex-col gap-2 p-0 text-sm">
                  {featureRows(plan).map((f) => (
                    <li key={f.text} className={`flex items-start gap-2 ${f.on ? "text-indigo-50" : "text-indigo-300 line-through decoration-white/30"}`}>
                      <span aria-hidden className="mt-0.5 font-black" style={{ color: f.on ? accent : "rgba(255,255,255,0.35)" }}>
                        {f.on ? "✓" : "–"}
                      </span>
                      <span>
                        <span className="sr-only">{f.on ? "Included: " : "Not included: "}</span>
                        {f.text}
                      </span>
                    </li>
                  ))}
                </ul>
              </li>
            );
          })}
        </ul>
        <p className="m-0 text-xs text-indigo-200">
          Prices in USD. Subscriptions renew automatically; cancel anytime and keep your plan until the end of the period. Discount codes go in at checkout.
        </p>
      </section>

      {/* Redeem */}
      <section aria-labelledby="redeem" className="rounded-3xl border border-[#22d3ee]/30 bg-[#22d3ee]/[0.06] p-5">
        <h2 id="redeem" className="m-0 text-lg font-black text-white">Have a code?</h2>
        <p className="m-0 mt-1 text-sm text-indigo-100">Free-upgrade codes from Guide apply right away.</p>
        <form onSubmit={redeem} className="mt-3 flex flex-col gap-2 sm:flex-row">
          <label htmlFor="blitz-code" className="sr-only">Promo code</label>
          <input
            id="blitz-code"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="ENTER-CODE"
            autoComplete="off"
            autoCapitalize="characters"
            spellCheck={false}
            maxLength={40}
            className="min-h-11 flex-1 rounded-xl border border-white/20 bg-[#15123b]/70 px-4 font-mono text-base font-bold tracking-widest text-white placeholder:text-indigo-300 focus:border-[#22d3ee] focus:outline-none focus:ring-2 focus:ring-[#22d3ee]/40"
          />
          <button
            type="submit"
            disabled={busy !== null}
            className="min-h-11 rounded-xl bg-[#22d3ee] px-5 text-sm font-extrabold text-[#15123b] transition hover:brightness-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white disabled:opacity-50"
          >
            {busy === "code" ? "Applying…" : "Apply code"}
          </button>
        </form>
        {codeMsg ? (
          <p
            role={codeMsg.ok ? "status" : "alert"}
            className={`m-0 mt-3 text-sm font-semibold ${codeMsg.ok ? "text-[#d8f99a]" : "text-[#ffb3b5]"}`}
          >
            {codeMsg.text}
          </p>
        ) : null}
      </section>
    </div>
  );
}
