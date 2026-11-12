"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { TestQuizDocument } from "@/lib/testquiz/types";
import type { TestQuizPlan } from "@/lib/testquiz/plans";

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

  async function createQuiz() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/testquiz/quizzes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: "New quiz" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Create failed");
      router.push(`/apps/testquiz/edit/${data.quiz.id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Create failed");
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

  return (
    <div className="tq-rise mx-auto max-w-5xl px-5 py-8 sm:px-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="tq-brand">Quiz library</h1>
          <p className="mt-2 max-w-xl text-[var(--tq-muted)]">
            Create quizzes, then host a live game. Students join with a PIN from
            My apps.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/apps/testquiz/reports" className="tq-btn tq-btn-ghost no-underline">
            Reports
          </Link>
          <button
            type="button"
            className="tq-btn tq-btn-primary"
            disabled={busy}
            onClick={() => void createQuiz()}
          >
            New quiz
          </button>
        </div>
      </div>

      {entitlement ? (
        <p className="mt-4 text-sm text-[var(--tq-muted)]">
          Plan <strong className="text-[var(--tq-ink)]">{entitlement.plan.label}</strong>
          {" · "}
          {entitlement.liveGamesRemaining == null
            ? "Unlimited live games"
            : `${entitlement.liveGamesRemaining} live games left this month`}
          {" · "}
          up to {entitlement.plan.maxPlayersPerGame} players
        </p>
      ) : null}

      {error ? (
        <p className="mt-4 rounded-xl bg-[rgba(255,107,74,0.15)] px-4 py-3 text-sm">
          {error}
        </p>
      ) : null}

      <div className="mt-8 grid gap-3 sm:grid-cols-2">
        {quizzes.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/20 p-8 text-[var(--tq-muted)] sm:col-span-2">
            No quizzes yet. Create one to get started.
          </div>
        ) : (
          quizzes.map((q) => (
            <article key={q.id} className="tq-tile">
              <h2 className="text-lg font-bold">{q.title}</h2>
              <p className="mt-1 text-sm text-[var(--tq-muted)]">
                {q.questions.length} question{q.questions.length === 1 ? "" : "s"}
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <Link
                  href={`/apps/testquiz/edit/${q.id}`}
                  className="tq-btn tq-btn-ghost no-underline text-sm"
                >
                  Edit
                </Link>
                <button
                  type="button"
                  className="tq-btn tq-btn-primary text-sm"
                  disabled={busy || q.questions.length === 0}
                  onClick={() => void hostQuiz(q.id)}
                >
                  Host
                </button>
              </div>
            </article>
          ))
        )}
      </div>
    </div>
  );
}
