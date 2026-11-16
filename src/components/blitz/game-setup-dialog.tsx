"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { BlitzBolt, TileSymbol } from "@/components/blitz/brand";
import {
  BLITZ_MODES,
  BLITZ_THEMES,
  hasPremiumPlay,
} from "@/lib/blitz/modes";
import type { BlitzPlan } from "@/lib/blitz/plans";
import type { BlitzGameMode, BlitzThemeId } from "@/lib/blitz/types";

type QuizLite = { id: string; title: string; questions: unknown[] };

type ClassLite = { id: string; name: string; studentCount: number };

function defaultDue(): string {
  const d = new Date(Date.now() + 3 * 86400000);
  d.setHours(23, 59, 0, 0);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** Host setup: pick live mode + theme, or assign a self-paced challenge. */
export function GameSetupDialog({
  quiz,
  plan,
  initialTab = "live",
  onClose,
}: {
  quiz: QuizLite;
  plan: BlitzPlan | null;
  initialTab?: "live" | "challenge";
  onClose: () => void;
}) {
  const router = useRouter();
  const premium = plan ? hasPremiumPlay(plan) : false;
  const [tab, setTab] = useState<"live" | "challenge">(initialTab);
  const [mode, setMode] = useState<BlitzGameMode>("classic");
  const [theme, setTheme] = useState<BlitzThemeId>("night");
  const [teamCount, setTeamCount] = useState(2);
  const [nicknames, setNicknames] = useState(true);
  const [avatars, setAvatars] = useState(true);
  const [music, setMusic] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [classes, setClasses] = useState<ClassLite[] | null>(null);
  const [classId, setClassId] = useState("");
  const [due, setDue] = useState(defaultDue);
  const [speed, setSpeed] = useState(true);
  const [assigned, setAssigned] = useState<{ id: string; className: string } | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  useEffect(() => {
    if (tab !== "challenge" || classes) return;
    void fetch("/api/blitz/classes")
      .then((r) => (r.ok ? r.json() : { classes: [] }))
      .then((d) => {
        setClasses(d.classes ?? []);
        if (d.classes?.[0]) setClassId(d.classes[0].id);
      })
      .catch(() => setClasses([]));
  }, [tab, classes]);

  async function startLive() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/blitz/games", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          quizId: quiz.id,
          settings: {
            mode,
            theme,
            teamCount,
            allowNicknames: nicknames,
            allowAvatars: avatars,
            musicEnabled: music,
          },
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not open the lobby");
      router.push(`/apps/blitz/host/${data.game.id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not open the lobby");
      setBusy(false);
    }
  }

  async function assign() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/blitz/challenges", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          quizId: quiz.id,
          classroomId: classId,
          dueAt: due ? new Date(due).toISOString() : null,
          mode: speed ? "classic" : "accuracy",
          theme,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not assign");
      setAssigned({ id: data.challenge.id, className: data.challenge.classroomName });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not assign");
    } finally {
      setBusy(false);
    }
  }

  const challengeUrl =
    assigned && typeof window !== "undefined"
      ? `${window.location.origin}/apps/blitz/challenge/${assigned.id}`
      : "";

  return (
    <div className="bz-backdrop" onClick={onClose}>
      <div
        className="bz-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="bz-setup-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bz-modal-head">
          <div className="min-w-0">
            <p className="bz-kicker">{quiz.questions.length} questions</p>
            <h2 id="bz-setup-title" className="bz-h2 mt-1" style={{ overflowWrap: "anywhere" }}>
              {quiz.title}
            </h2>
          </div>
          <button type="button" className="bz-iconbtn" aria-label="Close" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="bz-seg mt-4">
          <button type="button" aria-pressed={tab === "live"} onClick={() => setTab("live")}>
            Live game
          </button>
          <button type="button" aria-pressed={tab === "challenge"} onClick={() => setTab("challenge")}>
            Self-paced challenge {!premium ? <span className="bz-lock">Plus</span> : null}
          </button>
        </div>

        {tab === "live" ? (
          <>
            <p className="bz-label mt-5">Game mode</p>
            <div className="bz-option-grid">
              {BLITZ_MODES.map((m, i) => {
                const locked = m.premium && !premium;
                return (
                  <button
                    key={m.id}
                    type="button"
                    className="bz-option"
                    aria-pressed={mode === m.id}
                    disabled={locked}
                    onClick={() => setMode(m.id)}
                  >
                    {locked ? <span className="bz-lock">Plus</span> : null}
                    <span style={{ color: ["var(--bz-lime)", "var(--bz-cyan)", "var(--bz-sun)"][i] }}>
                      <TileSymbol index={i} size={26} />
                    </span>
                    <b>{m.label}</b>
                    <small>{m.tagline}</small>
                  </button>
                );
              })}
            </div>
            {mode === "team" ? (
              <div className="mt-3 flex items-center gap-3">
                <span className="bz-label" style={{ margin: 0 }}>
                  Teams
                </span>
                <div className="bz-seg">
                  {[2, 3, 4].map((n) => (
                    <button key={n} type="button" aria-pressed={teamCount === n} onClick={() => setTeamCount(n)}>
                      {n}
                    </button>
                  ))}
                </div>
                <span className="bz-faint">Players are auto-balanced as they join.</span>
              </div>
            ) : null}
          </>
        ) : null}

        <p className="bz-label mt-5">Stage theme</p>
        <div className="bz-option-grid" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(118px, 1fr))" }}>
          {BLITZ_THEMES.map((t) => {
            const locked = t.premium && !premium;
            return (
              <button
                key={t.id}
                type="button"
                className="bz-option"
                aria-pressed={theme === t.id}
                disabled={locked}
                onClick={() => setTheme(t.id)}
                style={{ padding: "0.55rem" }}
              >
                {locked ? <span className="bz-lock">Plus</span> : null}
                <span className="bz-swatch" aria-hidden>
                  <span style={{ background: t.swatch[0] }} />
                  <span style={{ background: t.swatch[1] }} />
                  <span style={{ background: t.swatch[2] }} />
                </span>
                <b style={{ fontSize: "1rem" }}>{t.label}</b>
                <small>{t.blurb}</small>
              </button>
            );
          })}
        </div>

        {tab === "live" ? (
          <>
            <div className="mt-5 flex flex-wrap gap-x-6 gap-y-3">
              <label className="bz-switch">
                <input type="checkbox" checked={nicknames} onChange={(e) => setNicknames(e.target.checked)} />
                <span className="bz-switch-track" aria-hidden />
                Nicknames
              </label>
              <label className="bz-switch">
                <input type="checkbox" checked={avatars} onChange={(e) => setAvatars(e.target.checked)} />
                <span className="bz-switch-track" aria-hidden />
                Critter avatars
              </label>
              <label className="bz-switch">
                <input type="checkbox" checked={music && !!plan?.music} disabled={!plan?.music} onChange={(e) => setMusic(e.target.checked)} />
                <span className="bz-switch-track" aria-hidden />
                Music {!plan?.music ? <span className="bz-lock">Plus</span> : null}
              </label>
            </div>
            {error ? (
              <p className="bz-alert mt-4">
                {error}
                {/plan|Plus|Ultra/i.test(error) ? (
                  <Link href="/apps/blitz/upgrade" style={{ color: "var(--bz-sun)", marginLeft: 6, whiteSpace: "nowrap" }}>
                    See plans →
                  </Link>
                ) : null}
              </p>
            ) : null}
            <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
              {!premium ? (
                <Link href="/apps/blitz/upgrade" className="bz-faint" style={{ color: "var(--bz-sun)", fontWeight: 700 }}>
                  Unlock team battles, themes &amp; music →
                </Link>
              ) : (
                <span />
              )}
              <button type="button" className="bz-btn bz-btn--primary bz-btn--lg" disabled={busy} onClick={() => void startLive()}>
                {busy ? "Opening…" : "Open the lobby"} <BlitzBolt size={22} color="var(--bz-sun)" />
              </button>
            </div>
          </>
        ) : !premium ? (
          <div className="bz-card bz-card--pad mt-5" style={{ textAlign: "center" }}>
            <p className="bz-h3">Assign Blitz as homework</p>
            <p className="bz-muted mt-2">
              Students play on their own time before a deadline, and you get a per-student report. Self-paced challenges come with Plus and Ultra.
            </p>
            <Link href="/apps/blitz/upgrade" className="bz-btn bz-btn--sun mt-4 no-underline">
              See plans
            </Link>
          </div>
        ) : assigned ? (
          <div className="bz-card bz-card--pad mt-5">
            <p className="bz-h3">Assigned to {assigned.className}</p>
            <p className="bz-muted mt-1">
              Students see it on their Blitz join screen. You can also share the link:
            </p>
            <div className="mt-3 flex gap-2">
              <input className="bz-input" readOnly value={challengeUrl} onFocus={(e) => e.currentTarget.select()} />
              <button
                type="button"
                className="bz-btn"
                onClick={() => {
                  void navigator.clipboard?.writeText(challengeUrl).then(() => {
                    setCopied(true);
                    window.setTimeout(() => setCopied(false), 1500);
                  });
                }}
              >
                {copied ? "Copied" : "Copy"}
              </button>
            </div>
            <div className="mt-4 flex flex-wrap justify-end gap-2">
              <button type="button" className="bz-btn" onClick={onClose}>
                Done
              </button>
              <Link href={`/apps/blitz/reports?challenge=${assigned.id}`} className="bz-btn bz-btn--primary no-underline">
                Watch results
              </Link>
            </div>
          </div>
        ) : (
          <>
            <div className="bz-field-row mt-5">
              <label>
                <span className="bz-label">Class</span>
                <select className="bz-select" value={classId} onChange={(e) => setClassId(e.target.value)} disabled={!classes?.length}>
                  {classes === null ? <option>Loading…</option> : null}
                  {classes?.length === 0 ? <option value="">No classes yet</option> : null}
                  {classes?.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.studentCount})
                    </option>
                  ))}
                </select>
              </label>
              <label>
                <span className="bz-label">Due</span>
                <input type="datetime-local" className="bz-input" value={due} onChange={(e) => setDue(e.target.value)} />
              </label>
            </div>
            <div className="mt-4">
              <label className="bz-switch">
                <input type="checkbox" checked={speed} onChange={(e) => setSpeed(e.target.checked)} />
                <span className="bz-switch-track" aria-hidden />
                Speed bonus (faster answers score more)
              </label>
            </div>
            {classes?.length === 0 ? (
              <p className="bz-alert bz-alert--info mt-4">
                Create a class in your Guide teacher panel first, then assign challenges to it.
              </p>
            ) : null}
            {error ? <p className="bz-alert mt-4">{error}</p> : null}
            <div className="mt-6 flex justify-end">
              <button type="button" className="bz-btn bz-btn--primary bz-btn--lg" disabled={busy || !classId} onClick={() => void assign()}>
                {busy ? "Assigning…" : "Assign to class"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
