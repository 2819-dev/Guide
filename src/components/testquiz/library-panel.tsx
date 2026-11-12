"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import type { TestQuizDocument } from "@/lib/testquiz/types";
import { TESTQUIZ_TYPE_LABEL } from "@/lib/testquiz/types";
import type { TestQuizPlan } from "@/lib/testquiz/plans";
import { TESTQUIZ_TEMPLATES } from "@/lib/testquiz/templates";
import { categoryLabel } from "@/lib/testquiz/discover";

type Entitlement = {
  plan: TestQuizPlan;
  liveGamesUsedThisMonth: number;
  liveGamesRemaining: number | null;
};

export function TestQuizLibraryPanel() {
  const router = useRouter();
  const [quizzes, setQuizzes] = useState<TestQuizDocument[]>([]);
  const [entitlement, setEntitlement] = useState<Entitlement | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"all" | "public" | "private">("all");

  async function load() {
    const [qRes, eRes] = await Promise.all([
      fetch("/api/testquiz/quizzes"),
      fetch("/api/testquiz/entitlements"),
    ]);
    const qData = await qRes.json();
    const eData = await eRes.json();
    if (!qRes.ok) {
      setError(qData.error ?? "Could not load quizzes");
      return;
    }
    setQuizzes(qData.quizzes ?? []);
    if (eRes.ok) setEntitlement(eData);
  }

  useEffect(() => {
    void load();
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return quizzes.filter((quiz) => {
      if (filter === "public" && !quiz.isPublic) return false;
      if (filter === "private" && quiz.isPublic) return false;
      if (!q) return true;
      return (
        quiz.title.toLowerCase().includes(q) ||
        quiz.description.toLowerCase().includes(q)
      );
    });
  }, [quizzes, query, filter]);

  async function createQuiz(opts?: {
    title?: string;
    description?: string;
    questions?: unknown[];
    category?: string;
  }) {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/testquiz/quizzes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: opts?.title ?? "New quiz",
          description: opts?.description,
          questions: opts?.questions ?? [],
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Create failed");
      if (opts?.category) {
        await fetch(`/api/testquiz/quizzes/${data.quiz.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ category: opts.category }),
        });
      }
      router.push(`/apps/testquiz/edit/${data.quiz.id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Create failed");
      setBusy(false);
    }
  }

  async function duplicateQuiz(quiz: TestQuizDocument) {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/testquiz/quizzes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: `${quiz.title} (copy)`,
          description: quiz.description,
          questions: quiz.questions,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not duplicate");
      await fetch(`/api/testquiz/quizzes/${data.quiz.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category: quiz.category,
          tags: quiz.tags,
        }),
      });
      router.push(`/apps/testquiz/edit/${data.quiz.id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not duplicate");
      setBusy(false);
    }
  }

  async function hostQuiz(quizId: string) {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/testquiz/games", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quizId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not host");
      router.push(`/apps/testquiz/host/${data.game.id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not host");
      setBusy(false);
    }
  }

  async function deleteQuiz(quizId: string) {
    if (!window.confirm("Delete this quiz from your library?")) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/testquiz/quizzes/${quizId}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not delete");
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not delete");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="tq-rise mx-auto max-w-6xl px-5 py-8 sm:px-8">
      <div className="tq-hero-band flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="tq-badge">TestQuiz</p>
          <h1 className="tq-brand mt-2">Quiz library</h1>
          <p className="mt-2 max-w-xl text-[var(--tq-muted)]">
            Build quizzes, host live PIN games, or pull ideas from Discover —
            Kahoot-class create and play for class.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/apps/testquiz/discover"
            className="tq-btn tq-btn-ghost no-underline"
          >
            Discover
          </Link>
          <Link
            href="/apps/testquiz/join"
            className="tq-btn tq-btn-ghost no-underline"
          >
            Join
          </Link>
          <Link
            href="/apps/testquiz/reports"
            className="tq-btn tq-btn-ghost no-underline"
          >
            Reports
          </Link>
          <button
            type="button"
            className="tq-btn tq-btn-primary"
            disabled={busy}
            onClick={() => void createQuiz()}
          >
            Create quiz
          </button>
        </div>
      </div>

      {entitlement ? (
        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          <div className="tq-stat">
            <strong>{entitlement.plan.label}</strong>
            <span className="text-xs text-[var(--tq-muted)]">Your plan</span>
          </div>
          <div className="tq-stat">
            <strong>
              {entitlement.liveGamesRemaining == null
                ? "∞"
                : entitlement.liveGamesRemaining}
            </strong>
            <span className="text-xs text-[var(--tq-muted)]">
              Live games left this month
            </span>
          </div>
          <div className="tq-stat">
            <strong>{entitlement.plan.maxPlayersPerGame}</strong>
            <span className="text-xs text-[var(--tq-muted)]">
              Max players per game
            </span>
          </div>
        </div>
      ) : null}

      {error ? (
        <p className="mt-4 rounded-xl border border-[#fed7aa] bg-[#fff7ed] px-4 py-3 text-sm text-[var(--tq-warn)]">
          {error}
        </p>
      ) : null}

      <section className="mt-8">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="tq-kicker">Starter templates</h2>
        </div>
        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          {TESTQUIZ_TEMPLATES.map((t) => (
            <button
              key={t.id}
              type="button"
              disabled={busy}
              className="tq-tile w-full text-left"
              onClick={() =>
                void createQuiz({
                  title: t.title,
                  description: t.description,
                  questions: t.questions(),
                })
              }
            >
              <div className="mb-2 h-1.5 w-12 rounded-full bg-[var(--tq-accent)]" />
              <h3 className="font-bold">{t.title}</h3>
              <p className="mt-1 text-sm text-[var(--tq-muted)]">{t.blurb}</p>
              <p className="mt-3 text-sm font-semibold text-[var(--tq-accent-deep)]">
                Use template →
              </p>
            </button>
          ))}
        </div>
      </section>

      <section className="mt-10">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <h2 className="tq-kicker">Your quizzes</h2>
          <div className="flex flex-wrap gap-2">
            <input
              className="tq-input max-w-[14rem]"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search quizzes"
              aria-label="Search quizzes"
            />
            <select
              className="tq-select max-w-[9rem]"
              value={filter}
              onChange={(e) =>
                setFilter(e.target.value as "all" | "public" | "private")
              }
              aria-label="Filter"
            >
              <option value="all">All</option>
              <option value="public">On Discover</option>
              <option value="private">Private</option>
            </select>
          </div>
        </div>

        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.length === 0 ? (
            <div className="tq-soft p-8 text-[var(--tq-muted)] sm:col-span-2 lg:col-span-3">
              {quizzes.length === 0
                ? "No quizzes yet. Start from a template or create a blank quiz."
                : "No quizzes match this search."}
            </div>
          ) : (
            filtered.map((q) => {
              const types = [
                ...new Set(q.questions.map((qq) => TESTQUIZ_TYPE_LABEL[qq.type])),
              ].slice(0, 3);
              return (
                <article key={q.id} className="tq-tile flex flex-col">
                  <div
                    className="mb-3 h-2 w-full rounded-full"
                    style={{
                      background:
                        "linear-gradient(90deg, var(--tq-accent), var(--tq-b), var(--tq-a))",
                    }}
                  />
                  <div className="flex flex-wrap items-center gap-2">
                    {q.isPublic ? (
                      <span className="tq-badge">Discover</span>
                    ) : (
                      <span className="text-xs font-semibold uppercase tracking-wide text-[var(--tq-muted)]">
                        Private
                      </span>
                    )}
                    <span className="text-xs text-[var(--tq-muted)]">
                      {categoryLabel(q.category)}
                    </span>
                  </div>
                  <h2 className="mt-2 text-lg font-bold">{q.title}</h2>
                  <p className="mt-1 line-clamp-2 text-sm text-[var(--tq-muted)]">
                    {q.description || "No description"}
                  </p>
                  <p className="mt-2 text-sm text-[var(--tq-muted)]">
                    {q.questions.length} question
                    {q.questions.length === 1 ? "" : "s"}
                    {types.length ? ` · ${types.join(", ")}` : ""}
                  </p>
                  <div className="mt-auto flex flex-wrap gap-2 pt-4">
                    <button
                      type="button"
                      className="tq-btn tq-btn-primary text-sm"
                      disabled={busy || q.questions.length === 0}
                      onClick={() => void hostQuiz(q.id)}
                    >
                      Host
                    </button>
                    <Link
                      href={`/apps/testquiz/edit/${q.id}`}
                      className="tq-btn tq-btn-ghost text-sm no-underline"
                    >
                      Edit
                    </Link>
                    <button
                      type="button"
                      className="tq-btn tq-btn-ghost text-sm"
                      disabled={busy}
                      onClick={() => void duplicateQuiz(q)}
                    >
                      Duplicate
                    </button>
                    <button
                      type="button"
                      className="tq-btn tq-btn-danger text-sm"
                      disabled={busy}
                      onClick={() => void deleteQuiz(q.id)}
                    >
                      Delete
                    </button>
                  </div>
                </article>
              );
            })
          )}
        </div>
      </section>
    </div>
  );
}
