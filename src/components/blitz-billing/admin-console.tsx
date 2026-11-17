"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent, type ReactNode } from "react";
import type { BlitzOverview, GrantRow, SubscriberRow } from "@/lib/blitz/admin";
import type { PromoCodeRow } from "@/lib/blitz/promo";
import { PlanBadge } from "./stage";

type Tab = "promo" | "plans" | "subscribers" | "usage";

export type AdminConsoleProps = {
  codes: PromoCodeRow[];
  grants: GrantRow[];
  subscribers: SubscriberRow[];
  overview: BlitzOverview;
  stripe: { configured: boolean; checkout: boolean; testMode: boolean };
  initialTab?: Tab;
};

const fmtDate = (iso: string | null) =>
  iso
    ? new Date(iso).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        timeZone: "UTC",
      })
    : "—";

const planLabel = (id: string | null) =>
  id === "ultra" ? "Ultra" : id === "plus" ? "Plus" : "Free";

const inputCls =
  "min-h-11 w-full rounded-xl border border-white/20 bg-[#15123b]/70 px-3 text-[0.95rem] text-white placeholder:text-indigo-300 focus:border-[#22d3ee] focus:outline-none focus:ring-2 focus:ring-[#22d3ee]/40";
const labelCls = "flex flex-col gap-1.5 text-sm font-semibold text-indigo-100";
const primaryBtn =
  "inline-flex min-h-11 items-center justify-center rounded-xl bg-[#b6f03a] px-5 text-sm font-extrabold text-[#15123b] transition hover:brightness-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white disabled:cursor-not-allowed disabled:opacity-50";
const ghostBtn =
  "inline-flex min-h-11 shrink-0 items-center justify-center whitespace-nowrap rounded-xl border border-white/25 px-3 text-sm font-bold text-white transition hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#22d3ee] disabled:opacity-50";
const dangerBtn =
  "inline-flex min-h-11 shrink-0 items-center justify-center whitespace-nowrap rounded-xl border border-[#ff5a5f]/70 px-3 text-sm font-bold text-[#ffb3b5] transition hover:bg-[#ff5a5f]/15 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ff5a5f] disabled:opacity-50";

function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={`rounded-2xl border border-white/10 bg-white/[0.05] p-4 sm:p-5 ${className}`}>
      {children}
    </div>
  );
}

function Notice({ msg }: { msg: { ok: boolean; text: string } | null }) {
  if (!msg) return null;
  return (
    <p
      role={msg.ok ? "status" : "alert"}
      className={`m-0 rounded-xl border px-3 py-2 text-sm font-semibold ${msg.ok ? "border-[#b6f03a]/50 bg-[#b6f03a]/10 text-[#e4fbb8]" : "border-[#ff5a5f]/60 bg-[#ff5a5f]/10 text-[#ffd0d1]"}`}
    >
      {msg.text}
    </p>
  );
}

function StatusChip({ tone, children }: { tone: "good" | "warn" | "bad" | "muted"; children: ReactNode }) {
  const cls = {
    good: "bg-[#b6f03a]/15 text-[#d8f99a] border-[#b6f03a]/40",
    warn: "bg-[#ffc93c]/15 text-[#ffe08a] border-[#ffc93c]/40",
    bad: "bg-[#ff5a5f]/15 text-[#ffb3b5] border-[#ff5a5f]/40",
    muted: "bg-white/5 text-indigo-200 border-white/15",
  }[tone];
  return (
    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-bold ${cls}`}>
      {children}
    </span>
  );
}

async function send(
  url: string,
  method: string,
  body: unknown,
): Promise<{ ok: boolean; data: Record<string, unknown> }> {
  try {
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;
    return { ok: res.ok, data };
  } catch {
    return { ok: false, data: { error: "Couldn’t reach the server." } };
  }
}

function randomCode(): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const bytes = new Uint8Array(6);
  crypto.getRandomValues(bytes);
  return `BLITZ-${Array.from(bytes, (b) => alphabet[b % alphabet.length]).join("")}`;
}

/* ---------------- Promo codes ---------------- */

function PromoTab({ codes, stripe }: { codes: PromoCodeRow[]; stripe: AdminConsoleProps["stripe"] }) {
  const router = useRouter();
  const [kind, setKind] = useState<"upgrade" | "discount">("upgrade");
  const [code, setCode] = useState("");
  const [planId, setPlanId] = useState<"plus" | "ultra">("plus");
  const [days, setDays] = useState("30");
  const [percent, setPercent] = useState("20");
  const [duration, setDuration] = useState<"once" | "repeating" | "forever">("once");
  const [months, setMonths] = useState("3");
  const [maxRed, setMaxRed] = useState("");
  const [expires, setExpires] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [open, setOpen] = useState<string | null>(null);

  async function create(e: FormEvent) {
    e.preventDefault();
    setBusy("create");
    setMsg(null);
    const common = {
      code: code || randomCode(),
      maxRedemptions: maxRed ? Number(maxRed) : null,
      expiresAt: expires || null,
      note,
    };
    const body =
      kind === "upgrade"
        ? { kind, ...common, planId, durationDays: Number(days) }
        : {
            kind,
            ...common,
            percentOff: Number(percent),
            discountDuration: duration,
            discountMonths: duration === "repeating" ? Number(months) : null,
          };
    const { ok, data } = await send("/api/blitz/admin/promo", "POST", body);
    setBusy(null);
    if (ok) {
      setMsg({ ok: true, text: `Created ${String(body.code).toUpperCase()}.` });
      setCode("");
      setNote("");
      router.refresh();
    } else {
      setMsg({ ok: false, text: String(data.error ?? "Couldn’t create the code.") });
    }
  }

  async function toggle(c: PromoCodeRow) {
    setBusy(c.id);
    const { ok, data } = await send("/api/blitz/admin/promo", "PATCH", { id: c.id, active: !c.active });
    setBusy(null);
    setMsg(ok ? { ok: true, text: `${c.code} ${c.active ? "deactivated" : "reactivated"}.` } : { ok: false, text: String(data.error ?? "Couldn’t update the code.") });
    if (ok) router.refresh();
  }

  const discountBlocked = kind === "discount" && !stripe.configured;

  return (
    <div className="flex flex-col gap-5">
      <Card>
        <h2 className="m-0 text-lg font-black text-white">New promo code</h2>
        <form onSubmit={create} className="mt-4 flex flex-col gap-4">
          <div role="radiogroup" aria-label="Code type" className="grid gap-2 sm:grid-cols-2">
            {([
              ["upgrade", "Free upgrade", "Gives Plus or Ultra for a set number of days. Teachers redeem it on the Blitz plans page."],
              ["discount", "Checkout discount", "A percentage discount on a paid plan. Teachers enter it at checkout."],
            ] as const).map(([k, title, desc]) => (
              <button
                key={k}
                type="button"
                role="radio"
                aria-checked={kind === k}
                onClick={() => setKind(k)}
                className={`rounded-xl border p-3 text-left transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#22d3ee] ${kind === k ? "border-[#b6f03a] bg-[#b6f03a]/10" : "border-white/15 hover:bg-white/5"}`}
              >
                <span className="block font-extrabold text-white">{title}</span>
                <span className="mt-0.5 block text-xs text-indigo-200">{desc}</span>
              </button>
            ))}
          </div>

          {discountBlocked ? (
            <p className="m-0 rounded-xl border border-[#ffc93c]/60 bg-[#ffc93c]/10 px-3 py-2 text-sm text-[#ffe9ad]">
              Payments aren’t connected yet, so checkout discount codes can’t be created. Create a free upgrade code instead.
            </p>
          ) : null}

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <label className={labelCls}>
              Code
              <div className="flex gap-2">
                <input
                  className={`${inputCls} min-w-0 font-mono uppercase tracking-wider placeholder:font-sans placeholder:normal-case placeholder:tracking-normal`}
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase().replace(/\s+/g, ""))}
                  placeholder="Leave blank to generate"
                  maxLength={40}
                  autoComplete="off"
                />
                <button type="button" className={ghostBtn} onClick={() => setCode(randomCode())}>
                  Generate
                </button>
              </div>
            </label>

            {kind === "upgrade" ? (
              <>
                <label className={labelCls}>
                  Plan
                  <select className={inputCls} value={planId} onChange={(e) => setPlanId(e.target.value as "plus" | "ultra")}>
                    <option value="plus">Plus</option>
                    <option value="ultra">Ultra</option>
                  </select>
                </label>
                <label className={labelCls}>
                  Days of access
                  <input className={inputCls} type="number" min={1} max={3650} required value={days} onChange={(e) => setDays(e.target.value)} />
                </label>
              </>
            ) : (
              <>
                <label className={labelCls}>
                  Percent off
                  <input className={inputCls} type="number" min={1} max={100} required value={percent} onChange={(e) => setPercent(e.target.value)} />
                </label>
                <label className={labelCls}>
                  Applies to
                  <select className={inputCls} value={duration} onChange={(e) => setDuration(e.target.value as typeof duration)}>
                    <option value="once">First payment only</option>
                    <option value="repeating">Several months</option>
                    <option value="forever">Every payment</option>
                  </select>
                </label>
                {duration === "repeating" ? (
                  <label className={labelCls}>
                    Months
                    <input className={inputCls} type="number" min={1} max={36} required value={months} onChange={(e) => setMonths(e.target.value)} />
                  </label>
                ) : null}
              </>
            )}

            <label className={labelCls}>
              <span>Max redemptions <span className="font-normal text-indigo-300">(optional)</span></span>
              <input className={inputCls} type="number" min={1} value={maxRed} onChange={(e) => setMaxRed(e.target.value)} placeholder="Unlimited" />
            </label>
            <label className={labelCls}>
              <span>Code expires <span className="font-normal text-indigo-300">(optional)</span></span>
              <input className={`${inputCls} [color-scheme:dark]`} type="date" value={expires} onChange={(e) => setExpires(e.target.value)} />
            </label>
            <label className={`${labelCls} sm:col-span-2 lg:col-span-1`}>
              <span>Note <span className="font-normal text-indigo-300">(only Officials see this)</span></span>
              <input className={inputCls} value={note} maxLength={300} onChange={(e) => setNote(e.target.value)} placeholder="For example, Spring conference" />
            </label>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <button type="submit" className={primaryBtn} disabled={busy !== null || discountBlocked}>
              {busy === "create" ? "Creating…" : "Create code"}
            </button>
            <Notice msg={msg} />
          </div>
        </form>
      </Card>

      <div className="flex flex-col gap-3">
        <h2 className="m-0 text-lg font-black text-white">
          Codes <span className="text-sm font-semibold text-indigo-200">({codes.length})</span>
        </h2>
        {codes.length === 0 ? (
          <Card><p className="m-0 text-indigo-100">No codes yet. Create one above.</p></Card>
        ) : (
          <ul className="m-0 flex list-none flex-col gap-2 p-0">
            {codes.map((c) => {
              const expired = c.expiresAt ? new Date(c.expiresAt).getTime() < Date.now() : false;
              const usedUp = c.maxRedemptions != null && c.redemptionCount >= c.maxRedemptions;
              const status = !c.active ? (
                <StatusChip tone="muted">Inactive</StatusChip>
              ) : expired ? (
                <StatusChip tone="bad">Expired</StatusChip>
              ) : usedUp ? (
                <StatusChip tone="warn">Used up</StatusChip>
              ) : (
                <StatusChip tone="good">Active</StatusChip>
              );
              const what =
                c.kind === "upgrade"
                  ? `${planLabel(c.planId)} for ${c.durationDays} day${c.durationDays === 1 ? "" : "s"}`
                  : `${c.percentOff}% off ${c.discountDuration === "once" ? "first payment" : c.discountDuration === "forever" ? "every payment" : `${c.discountMonths} months`}`;
              return (
                <li key={c.id} className={`rounded-2xl border border-white/10 bg-white/[0.05] p-4 ${c.active ? "" : "opacity-75"}`}>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                    <span className="font-mono text-base font-black tracking-wider text-white">{c.code}</span>
                    <StatusChip tone="muted">{c.kind === "upgrade" ? "Free upgrade" : "Checkout discount"}</StatusChip>
                    {status}
                    <span className="ml-auto flex gap-2">
                      {c.recentRedeemers.length > 0 ? (
                        <button
                          type="button"
                          className={ghostBtn}
                          aria-expanded={open === c.id}
                          onClick={() => setOpen(open === c.id ? null : c.id)}
                        >
                          {open === c.id ? "Hide redemptions" : "Show redemptions"}
                        </button>
                      ) : null}
                      <button type="button" className={c.active ? dangerBtn : ghostBtn} disabled={busy !== null} onClick={() => toggle(c)}>
                        {busy === c.id ? "Saving…" : c.active ? "Deactivate" : "Reactivate"}
                      </button>
                    </span>
                  </div>
                  <dl className="m-0 mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-sm sm:grid-cols-4">
                    <div><dt className="text-xs text-indigo-300">Gives</dt><dd className="m-0 font-semibold text-white">{what}</dd></div>
                    <div><dt className="text-xs text-indigo-300">Redeemed</dt><dd className="m-0 font-semibold tabular-nums text-white">{c.redemptionCount}{c.maxRedemptions != null ? ` / ${c.maxRedemptions}` : ""}</dd></div>
                    <div><dt className="text-xs text-indigo-300">Expires</dt><dd className="m-0 font-semibold text-white">{c.expiresAt ? fmtDate(c.expiresAt) : "Never"}</dd></div>
                    <div><dt className="text-xs text-indigo-300">Created</dt><dd className="m-0 font-semibold text-white">{fmtDate(c.createdAt)}</dd></div>
                  </dl>
                  {c.note ? <p className="m-0 mt-2 text-sm text-indigo-200">{c.note}</p> : null}
                  {c.kind === "discount" && c.stripePromotionCodeId ? (
                    <p className="m-0 mt-1 text-xs text-indigo-300">
                      Stripe promotion code{" "}
                      <a className="font-semibold text-[#67e8f9] underline" href={`https://dashboard.stripe.com/${stripe.testMode ? "test/" : ""}promotion_codes/${c.stripePromotionCodeId}`} target="_blank" rel="noreferrer">
                        {c.stripePromotionCodeId}
                      </a>
                    </p>
                  ) : null}
                  {open === c.id ? (
                    <ul className="m-0 mt-3 flex list-none flex-col gap-1 border-t border-white/10 p-0 pt-3 text-sm">
                      {c.recentRedeemers.map((r, i) => (
                        <li key={`${r.email}-${i}`} className="flex flex-wrap justify-between gap-2 text-indigo-100">
                          <span><span className="font-semibold text-white">{r.name}</span>{r.email ? ` · ${r.email}` : ""}</span>
                          <span className="text-indigo-300">{fmtDate(r.at)}</span>
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}

/* ---------------- Plans (grants) ---------------- */

function PlansTab({ grants }: { grants: GrantRow[] }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [planId, setPlanId] = useState<"plus" | "ultra" | "free">("plus");
  const [expires, setExpires] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  async function grant(e: FormEvent) {
    e.preventDefault();
    setBusy("grant");
    setMsg(null);
    const { ok, data } = await send("/api/blitz/admin/grants", "POST", {
      email,
      planId,
      expiresAt: expires || null,
      note,
    });
    setBusy(null);
    if (ok) {
      const teacher = data.teacher as { displayName?: string } | undefined;
      setMsg({
        ok: true,
        text:
          planId === "free"
            ? `Removed Guide-granted plans for ${teacher?.displayName ?? email}. They’re now on ${String(data.planLabel)}.`
            : `${teacher?.displayName ?? email} is now on ${String(data.planLabel)}.`,
      });
      setEmail("");
      setNote("");
      setExpires("");
      router.refresh();
    } else {
      setMsg({ ok: false, text: String(data.error ?? "Couldn’t save the plan.") });
    }
  }

  async function revoke(g: GrantRow) {
    setBusy(g.id);
    const { ok, data } = await send("/api/blitz/admin/grants", "DELETE", { grantId: g.id });
    setBusy(null);
    setMsg(ok ? { ok: true, text: `Revoked ${planLabel(g.planId)} for ${g.teacherName}.` } : { ok: false, text: String(data.error ?? "Couldn’t revoke the plan.") });
    if (ok) router.refresh();
  }

  return (
    <div className="flex flex-col gap-5">
      <Card>
        <h2 className="m-0 text-lg font-black text-white">Give a teacher a plan</h2>
        <p className="m-0 mt-1 text-sm text-indigo-200">
          Replaces any plan you granted them earlier. Paid subscriptions and redeemed codes are not affected. Choose “Free” to remove your grant.
        </p>
        <form onSubmit={grant} className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <label className={`${labelCls} sm:col-span-2 lg:col-span-1`}>
            Teacher email
            <input className={inputCls} type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="teacher@school.org" autoComplete="off" />
          </label>
          <label className={labelCls}>
            Plan
            <select className={inputCls} value={planId} onChange={(e) => setPlanId(e.target.value as typeof planId)}>
              <option value="plus">Plus</option>
              <option value="ultra">Ultra</option>
              <option value="free">Free (remove grant)</option>
            </select>
          </label>
          <label className={labelCls}>
            <span>Until <span className="font-normal text-indigo-300">(optional)</span></span>
            <input className={`${inputCls} [color-scheme:dark]`} type="date" value={expires} disabled={planId === "free"} onChange={(e) => setExpires(e.target.value)} />
          </label>
          <label className={labelCls}>
            <span>Note <span className="font-normal text-indigo-300">(optional)</span></span>
            <input className={inputCls} value={note} maxLength={300} onChange={(e) => setNote(e.target.value)} placeholder="For example, Pilot school" />
          </label>
          <div className="flex flex-wrap items-center gap-3 sm:col-span-2 lg:col-span-4">
            <button type="submit" className={primaryBtn} disabled={busy !== null}>
              {busy === "grant" ? "Saving…" : planId === "free" ? "Remove plan" : "Grant plan"}
            </button>
            <Notice msg={msg} />
          </div>
        </form>
      </Card>

      <div className="flex flex-col gap-3">
        <h2 className="m-0 text-lg font-black text-white">
          Active grants <span className="text-sm font-semibold text-indigo-200">({grants.length})</span>
        </h2>
        {grants.length === 0 ? (
          <Card><p className="m-0 text-indigo-100">No active grants or redeemed codes.</p></Card>
        ) : (
          <ul className="m-0 flex list-none flex-col gap-2 p-0">
            {grants.map((g) => (
              <li key={g.id} className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-2xl border border-white/10 bg-white/[0.05] p-4">
                <div className="min-w-0 basis-full sm:basis-0 sm:flex-1">
                  <p className="m-0 truncate font-bold text-white">{g.teacherName}</p>
                  <p className="m-0 truncate text-sm text-indigo-200">{g.teacherEmail ?? "—"}</p>
                </div>
                <PlanBadge planId={g.planId} label={planLabel(g.planId)} />
                <div className="text-sm text-indigo-100">
                  <p className="m-0">{g.source === "promo" ? `Code ${g.code ?? ""}` : `Granted${g.grantedByName ? ` by ${g.grantedByName}` : ""}`}</p>
                  <p className="m-0 text-xs text-indigo-300">{g.expiresAt ? `Until ${fmtDate(g.expiresAt)}` : "No end date"}{g.note && g.source !== "promo" ? ` · ${g.note}` : ""}</p>
                </div>
                <button type="button" className={dangerBtn} disabled={busy !== null} onClick={() => revoke(g)}>
                  {busy === g.id ? "Revoking…" : "Revoke"}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

/* ---------------- Subscribers ---------------- */

function statusTone(s: string): "good" | "warn" | "bad" | "muted" {
  if (s === "active" || s === "trialing") return "good";
  if (s === "past_due" || s === "incomplete") return "warn";
  if (s === "canceled" || s === "unpaid" || s === "incomplete_expired") return "bad";
  return "muted";
}

function statusLabel(s: string): string {
  switch (s) {
    case "active":
      return "Active";
    case "trialing":
      return "Trial";
    case "past_due":
      return "Past due";
    case "incomplete":
      return "Incomplete";
    case "incomplete_expired":
      return "Expired";
    case "canceled":
      return "Canceled";
    case "unpaid":
      return "Unpaid";
    case "paused":
      return "Paused";
    default:
      return s.charAt(0).toUpperCase() + s.slice(1).replace(/_/g, " ");
  }
}

function SubscribersTab({ subscribers, stripe }: { subscribers: SubscriberRow[]; stripe: AdminConsoleProps["stripe"] }) {
  if (subscribers.length === 0) {
    return (
      <Card>
        <p className="m-0 font-bold text-white">No subscribers yet</p>
        <p className="m-0 mt-1 text-sm text-indigo-200">
          {stripe.checkout
            ? "Teachers who subscribe to a paid plan will appear here."
            : "Payments aren’t connected yet. Subscribers will appear here once checkout is available."}
        </p>
      </Card>
    );
  }
  return (
    <ul className="m-0 flex list-none flex-col gap-2 p-0">
      {subscribers.map((s) => (
        <li key={s.id} className="grid gap-3 rounded-2xl border border-white/10 bg-white/[0.05] p-4 sm:grid-cols-[1.4fr_auto_1fr_auto] sm:items-center">
          <div className="min-w-0">
            <p className="m-0 truncate font-bold text-white">{s.teacherName}</p>
            <p className="m-0 truncate text-sm text-indigo-200">{s.teacherEmail ?? "—"}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <PlanBadge planId={s.planId} label={planLabel(s.planId)} />
            <StatusChip tone="muted">{s.interval === "year" ? "Yearly" : s.interval === "month" ? "Monthly" : "—"}</StatusChip>
            <StatusChip tone={statusTone(s.status)}>{statusLabel(s.status)}</StatusChip>
          </div>
          <p className="m-0 text-sm text-indigo-100">
            {s.cancelAtPeriodEnd ? "Ends" : s.status === "canceled" ? "Ended" : "Renews"} {fmtDate(s.currentPeriodEnd)}
          </p>
          <div className="flex flex-wrap gap-2">
            <a className={ghostBtn} href={s.stripeUrl} target="_blank" rel="noreferrer">View subscription</a>
            <a className={ghostBtn} href={s.customerUrl} target="_blank" rel="noreferrer">View customer</a>
          </div>
        </li>
      ))}
    </ul>
  );
}

/* ---------------- Usage ---------------- */

function Stat({ label, value, accent }: { label: string; value: number | string; accent?: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.05] p-4">
      <p className="m-0 text-3xl font-black tabular-nums tracking-tight" style={{ color: accent ?? "#fff" }}>
        {typeof value === "number" ? value.toLocaleString() : value}
      </p>
      <p className="m-0 mt-1 text-xs font-bold uppercase tracking-wider text-indigo-200">{label}</p>
    </div>
  );
}

function UsageTab({ overview }: { overview: BlitzOverview }) {
  const { free, plus, ultra } = overview.planCounts;
  const total = Math.max(1, free + plus + ultra);
  const seg = [
    { label: "Free", n: free, color: "#8b8fd6" },
    { label: "Plus", n: plus, color: "#b6f03a" },
    { label: "Ultra", n: ultra, color: "#ffc93c" },
  ];
  return (
    <div className="flex flex-col gap-5">
      <Card>
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="m-0 text-lg font-black text-white">Teachers by plan</h2>
          <p className="m-0 text-sm text-indigo-200">{overview.teachers.toLocaleString()} teachers</p>
        </div>
        <div className="mt-4 flex h-4 w-full gap-0.5 overflow-hidden rounded-full bg-white/10" role="img" aria-label={`Free ${free}, Plus ${plus}, Ultra ${ultra}`}>
          {seg.map((s) =>
            s.n > 0 ? <div key={s.label} style={{ width: `${(s.n / total) * 100}%`, backgroundColor: s.color }} /> : null,
          )}
        </div>
        <ul className="m-0 mt-3 flex list-none flex-wrap gap-x-5 gap-y-1 p-0 text-sm">
          {seg.map((s) => (
            <li key={s.label} className="flex items-center gap-2 text-indigo-100">
              <span aria-hidden className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: s.color }} />
              {s.label} <span className="font-black tabular-nums text-white">{s.n}</span>
            </li>
          ))}
        </ul>
      </Card>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat label="Live games this month" value={overview.liveGamesThisMonth} accent="#22d3ee" />
        <Stat label="Live games all time" value={overview.liveGamesAllTime} />
        <Stat label="Quizzes" value={overview.quizzes} />
        <Stat label="Public on Discover" value={overview.publicQuizzes} />
        <Stat label="Paying subscriptions" value={overview.payingSubscriptions} accent="#b6f03a" />
        <Stat label="Past due" value={overview.pastDue} accent={overview.pastDue ? "#ff8a8d" : undefined} />
        <Stat label="Active grants and codes" value={overview.activeGrants} />
        <Stat label="Code redemptions this month" value={overview.redemptionsThisMonth} accent="#ffc93c" />
      </div>
    </div>
  );
}

/* ---------------- Shell ---------------- */

export function AdminConsole(props: AdminConsoleProps) {
  const [tab, setTab] = useState<Tab>(props.initialTab ?? "promo");
  const tabs: { id: Tab; label: string; count?: number }[] = [
    { id: "promo", label: "Promo codes", count: props.codes.filter((c) => c.active).length },
    { id: "plans", label: "Plans", count: props.grants.length },
    { id: "subscribers", label: "Subscribers", count: props.subscribers.length },
    { id: "usage", label: "Usage" },
  ];

  return (
    <div className="flex flex-col gap-5">
      {!props.stripe.checkout ? (
        <p role="note" className="m-0 rounded-xl border border-[#ffc93c]/60 bg-[#ffc93c]/10 px-4 py-3 text-sm text-[#ffe9ad]">
          <strong className="text-[#ffc93c]">Payments coming soon.</strong>{" "}
          {props.stripe.configured
            ? "The payment account is connected, but plan prices aren’t set up yet. Teachers can’t check out until they are."
            : "Free upgrade codes and granted plans work now. Checkout and discount codes will be available once payments are connected."}
        </p>
      ) : props.stripe.testMode ? (
        <p role="note" className="m-0 rounded-xl border border-[#22d3ee]/50 bg-[#22d3ee]/10 px-4 py-2 text-sm text-[#c9f5fc]">
          Payments are in <strong>test mode</strong>. No real charges are made.
        </p>
      ) : null}

      <div role="tablist" aria-label="Blitz admin sections" className="-mx-4 flex gap-1 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0">
        {tabs.map((t) => (
          <button
            key={t.id}
            id={`tab-${t.id}`}
            type="button"
            role="tab"
            aria-selected={tab === t.id}
            aria-controls={`panel-${t.id}`}
            onClick={() => setTab(t.id)}
            className={`inline-flex min-h-11 shrink-0 items-center gap-2 rounded-full px-4 text-sm font-bold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#22d3ee] ${tab === t.id ? "bg-white text-[#15123b]" : "border border-white/15 text-indigo-100 hover:bg-white/10 hover:text-white"}`}
          >
            {t.label}
            {t.count != null ? (
              <span className={`rounded-full px-1.5 text-xs tabular-nums ${tab === t.id ? "bg-[#15123b] text-white" : "bg-white/10 text-indigo-100"}`}>
                {t.count}
              </span>
            ) : null}
          </button>
        ))}
      </div>

      <div role="tabpanel" id={`panel-${tab}`} aria-labelledby={`tab-${tab}`}>
        {tab === "promo" ? <PromoTab codes={props.codes} stripe={props.stripe} /> : null}
        {tab === "plans" ? <PlansTab grants={props.grants} /> : null}
        {tab === "subscribers" ? <SubscribersTab subscribers={props.subscribers} stripe={props.stripe} /> : null}
        {tab === "usage" ? <UsageTab overview={props.overview} /> : null}
      </div>
    </div>
  );
}
