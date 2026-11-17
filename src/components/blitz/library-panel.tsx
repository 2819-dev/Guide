"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { Squiggle, TileSymbol } from "@/components/blitz/brand";
import { GameSetupDialog } from "@/components/blitz/game-setup-dialog";
import { categoryLabel } from "@/lib/blitz/discover";
import type { BlitzPlan } from "@/lib/blitz/plans";
import {
  BLITZ_TEMPLATE_CATEGORIES,
  BLITZ_TEMPLATES,
  templateNeedsPlus,
  type BlitzTemplate,
  type BlitzTemplateCategory,
} from "@/lib/blitz/templates";
import { BLITZ_TYPE_LABEL, type BlitzDocument } from "@/lib/blitz/types";

type Entitlement = {
  plan: BlitzPlan;
  liveGamesUsedThisMonth: number;
  liveGamesRemaining: number | null;
};

const NEON = ["var(--bz-lime)", "var(--bz-coral)", "var(--bz-cyan)", "var(--bz-sun)", "var(--bz-violet)", "var(--bz-mint)"];

const CATEGORY_COLOR: Record<BlitzTemplateCategory, string> = {
  "warm-up": "var(--bz-sun)",
  review: "var(--bz-cyan)",
  vocabulary: "var(--bz-violet)",
  math: "var(--bz-lime)",
  science: "var(--bz-mint)",
  "check-in": "var(--bz-coral)",
  fun: "#ff8fd1",
  exit: "#9ae6ff",
};

const MOTIF_INDEX = { bolt: 0, star: 1, hex: 2, moon: 3, spark: 4, wave: 5 } as const;

function hashIndex(s: string, n: number) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 33 + s.charCodeAt(i)) >>> 0;
  return h % n;
}

export function BlitzLibraryPanel() {
  const router = useRouter();
  const [quizzes, setQuizzes] = useState<BlitzDocument[] | null>(null);
  const [entitlement, setEntitlement] = useState<Entitlement | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [cat, setCat] = useState<BlitzTemplateCategory | "all">("all");
  const [setup, setSetup] = useState<{ quiz: BlitzDocument; tab: "live" | "challenge" } | null>(null);

  async function load() {
    const [qRes, eRes] = await Promise.all([fetch("/api/blitz/quizzes"), fetch("/api/blitz/entitlements")]);
    const qData = await qRes.json();
    const eData = await eRes.json().catch(() => null);
    if (!qRes.ok) {
      setError(qData.error ?? "Could not load your quizzes. Refresh to try again.");
      setQuizzes([]);
      return;
    }
    setQuizzes(qData.quizzes ?? []);
    if (eRes.ok && eData?.plan) setEntitlement(eData);
  }

  useEffect(() => {
    void load();
  }, []);

  const allTypes = entitlement?.plan.questionTypes === "all";

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (quizzes ?? []).filter(
      (quiz) => !q || quiz.title.toLowerCase().includes(q) || quiz.description.toLowerCase().includes(q),
    );
  }, [quizzes, query]);

  const templates = useMemo(
    () => BLITZ_TEMPLATES.filter((t) => cat === "all" || t.category === cat),
    [cat],
  );

  async function createQuiz(opts?: { title?: string; description?: string; questions?: unknown[]; category?: string }) {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/blitz/quizzes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: opts?.title ?? "Untitled quiz",
          description: opts?.description,
          questions: opts?.questions ?? [],
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not create the quiz.");
      if (opts?.category) {
        await fetch(`/api/blitz/quizzes/${data.quiz.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ category: opts.category }),
        });
      }
      router.push(`/apps/blitz/edit/${data.quiz.id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not create the quiz.");
      setBusy(false);
    }
  }

  function startFromTemplate(t: BlitzTemplate) {
    if (!allTypes && templateNeedsPlus(t)) {
      setError(`“${t.title}” uses question types included with Plus. Upgrade to use it, or choose a template with Quiz or True/False questions.`);
      return;
    }
    void createQuiz({
      title: t.title,
      description: t.description,
      questions: t.questions(),
      category: t.discoverCategory,
    });
  }

  async function duplicateQuiz(quiz: BlitzDocument) {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/blitz/quizzes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: `${quiz.title} (copy)`, description: quiz.description, questions: quiz.questions }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not duplicate the quiz.");
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not duplicate the quiz.");
    } finally {
      setBusy(false);
    }
  }

  async function deleteQuiz(quizId: string) {
    if (!window.confirm("Delete this quiz? This can’t be undone.")) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/blitz/quizzes/${quizId}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not delete the quiz.");
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not delete the quiz.");
    } finally {
      setBusy(false);
    }
  }

  const plan = entitlement?.plan;

  return (
    <div className="bz-page">
      <section className="bz-hero">
        <div>
          <p className="bz-kicker">Live classroom quizzes</p>
          <h1 className="bz-h1 mt-2">
            Quizzes the whole class plays{" "}
            <span className="bz-mark">
              together
              <Squiggle />
            </span>
            .
          </h1>
          <p className="bz-muted mt-4" style={{ maxWidth: 520, fontSize: "1.05rem" }}>
            Build a quiz, show the PIN on screen, and see answers come in live. Host it for the class, play in teams, or assign it as a self-paced challenge.
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            <button type="button" className="bz-btn bz-btn--primary bz-btn--lg" disabled={busy} onClick={() => void createQuiz()}>
              New quiz
            </button>
            <Link href="/apps/blitz/discover" className="bz-btn bz-btn--lg no-underline">
              Browse Discover
            </Link>
          </div>
        </div>
        <div>
          <div className="bz-hero-stats">
            <div className="bz-stat">
              <b style={{ color: "var(--bz-lime)" }}>{plan?.label ?? "—"}</b>
              <span>Your plan</span>
            </div>
            <div className="bz-stat">
              <b>{entitlement ? (entitlement.liveGamesRemaining == null ? "∞" : entitlement.liveGamesRemaining) : "—"}</b>
              <span>Live games left this month</span>
            </div>
            <div className="bz-stat">
              <b>{plan?.maxPlayersPerGame ?? "—"}</b>
              <span>Players per game</span>
            </div>
          </div>
          {plan && plan.id === "free" ? (
            <p className="bz-plan-strip">
              Free includes Quiz and True/False questions and the Night and Arcade themes.
              <Link href="/apps/blitz/upgrade">Compare plans</Link>
            </p>
          ) : null}
        </div>
      </section>

      {error ? (
        <p className="bz-alert mt-6" role="alert">
          {error}
          {error.includes("Plus") ? (
            <Link href="/apps/blitz/upgrade" style={{ color: "var(--bz-sun)", marginLeft: 6 }}>
              See plans
            </Link>
          ) : null}
        </p>
      ) : null}

      <section className="bz-section">
        <div className="bz-section-head">
          <div>
            <p className="bz-kicker">Start from a template</p>
            <h2 className="bz-h2 mt-1">Ready-made quizzes</h2>
          </div>
        </div>
        <div className="bz-filters mb-3" role="group" aria-label="Template categories">
          <button type="button" className="bz-filter" aria-pressed={cat === "all"} onClick={() => setCat("all")}>
            All
          </button>
          {BLITZ_TEMPLATE_CATEGORIES.map((c) => (
            <button key={c.id} type="button" className="bz-filter" aria-pressed={cat === c.id} onClick={() => setCat(c.id)}>
              {c.label}
            </button>
          ))}
        </div>
        <div className="bz-templates">
          {templates.map((t, i) => {
            const locked = !allTypes && templateNeedsPlus(t);
            const catLabel = BLITZ_TEMPLATE_CATEGORIES.find((c) => c.id === t.category)?.label;
            return (
              <button
                key={t.id}
                type="button"
                disabled={busy}
                className="bz-tpl"
                style={{ "--tpl": CATEGORY_COLOR[t.category], "--tilt": `${[-1.2, 0.8, -0.5, 1.1][i % 4]}deg` } as CSSProperties}
                onClick={() => startFromTemplate(t)}
              >
                <span className="bz-tpl-motif">
                  <TileSymbol index={MOTIF_INDEX[t.motif]} size={120} />
                </span>
                <span className="bz-tpl-cat">{catLabel}</span>
                <span className="bz-tpl-title">{t.title}</span>
                <span className="bz-tpl-desc">{t.description}</span>
                <span className="bz-tpl-foot">
                  <span>{t.blurb}</span>
                  {locked ? <span className="bz-lock">Plus</span> : <span className="bz-tpl-go">Use template</span>}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      <section className="bz-section">
        <div className="bz-section-head">
          <div>
            <p className="bz-kicker">Your library</p>
            <h2 className="bz-h2 mt-1">
              My quizzes {quizzes ? <span className="bz-muted">({quizzes.length})</span> : null}
            </h2>
          </div>
          <input
            className="bz-input"
            style={{ maxWidth: 260 }}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search your quizzes"
            aria-label="Search your quizzes"
          />
        </div>

        {quizzes === null ? (
          <p className="bz-muted" role="status">Loading your quizzes…</p>
        ) : filtered.length === 0 ? (
          <div className="bz-empty">
            <TileSymbol index={0} size={48} className="text-[var(--bz-lime)]" />
            <p className="bz-h3" style={{ color: "var(--bz-text)" }}>
              {quizzes.length === 0 ? "No quizzes yet" : "No quizzes match your search"}
            </p>
            {quizzes.length === 0 ? (
              <p>Start from a template above, or create a new quiz.</p>
            ) : null}
          </div>
        ) : (
          <div className="bz-quiz-grid">
            {filtered.map((q) => {
              const types = [...new Set(q.questions.map((qq) => BLITZ_TYPE_LABEL[qq.type]))];
              const ci = hashIndex(q.id, NEON.length);
              const empty = q.questions.length === 0;
              return (
                <article key={q.id} className="bz-card bz-quiz">
                  <div className="bz-cover" style={{ "--cv": NEON[ci] } as CSSProperties}>
                    <span className="bz-cover-sym">
                      <TileSymbol index={ci} size={58} />
                    </span>
                    <span className="bz-cover-sym">
                      <TileSymbol index={ci + 1} size={84} />
                    </span>
                    <span className="bz-cover-sym">
                      <TileSymbol index={ci + 2} size={40} />
                    </span>
                    <span className="bz-cover-count">
                      {q.questions.length} {q.questions.length === 1 ? "question" : "questions"}
                    </span>
                  </div>
                  <div className="bz-quiz-body">
                    <h3 className="bz-quiz-title">{q.title}</h3>
                    <div className="bz-quiz-meta">
                      {q.isPublic ? <span className="bz-chip bz-chip--cyan">On Discover</span> : null}
                      <span className="bz-chip">{categoryLabel(q.category)}</span>
                      {types.slice(0, 2).map((t) => (
                        <span key={t} className="bz-chip">
                          {t}
                        </span>
                      ))}
                      {types.length > 2 ? <span className="bz-chip">+{types.length - 2}</span> : null}
                    </div>
                    {q.description ? (
                      <p className="bz-faint" style={{ marginTop: 6, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                        {q.description}
                      </p>
                    ) : null}
                    <div className="bz-quiz-actions">
                      <button
                        type="button"
                        className="bz-btn bz-btn--primary bz-btn--sm"
                        disabled={busy || empty}
                        title={empty ? "Add a question first" : "Host live"}
                        onClick={() => setSetup({ quiz: q, tab: "live" })}
                      >
                        Host live
                      </button>
                      <button
                        type="button"
                        className="bz-btn bz-btn--sm"
                        disabled={busy || empty}
                        onClick={() => setSetup({ quiz: q, tab: "challenge" })}
                      >
                        Assign
                      </button>
                      <Link href={`/apps/blitz/edit/${q.id}`} className="bz-btn bz-btn--sm no-underline">
                        Edit
                      </Link>
                      <button type="button" className="bz-btn bz-btn--quiet bz-btn--sm" disabled={busy} onClick={() => void duplicateQuiz(q)}>
                        Duplicate
                      </button>
                      <button type="button" className="bz-btn bz-btn--quiet bz-btn--sm" disabled={busy} onClick={() => void deleteQuiz(q.id)} aria-label={`Delete ${q.title}`}>
                        Delete
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      {setup ? (
        <GameSetupDialog quiz={setup.quiz} plan={plan ?? null} initialTab={setup.tab} onClose={() => setSetup(null)} />
      ) : null}
    </div>
  );
}
