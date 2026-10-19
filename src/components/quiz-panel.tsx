"use client";

import Link from "next/link";
import { useState } from "react";

type PublicQuestion = {
  id: string;
  prompt: string;
  choices: string[];
  source: "daf" | "notes" | "mixed";
};

type GradedQuestion = PublicQuestion & {
  correctIndex: number;
  explanation: string;
};

type Props = {
  dafId: string;
  hasNotes: boolean;
  signedIn: boolean;
};

export function QuizPanel({ dafId, hasNotes, signedIn }: Props) {
  const [mode, setMode] = useState<"daf" | "notes" | "mixed">("daf");
  const [quizId, setQuizId] = useState<string | null>(null);
  const [questions, setQuestions] = useState<PublicQuestion[]>([]);
  const [answers, setAnswers] = useState<(number | null)[]>([]);
  const [result, setResult] = useState<{
    score: number;
    questions: GradedQuestion[];
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (!signedIn) {
    return (
      <section className="panel">
        <h3 className="display text-2xl font-semibold text-forest-900">
          Quiz yourself
        </h3>
        <p className="mt-2 text-ink-muted">
          <Link href="/auth/sign-in" className="font-semibold text-forest-700">
            Sign in
          </Link>{" "}
          to start a quiz and keep your scores.
        </p>
      </section>
    );
  }

  async function startQuiz() {
    setBusy(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch("/api/quiz", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dafId, mode }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not start quiz");
      setQuizId(data.quiz.id);
      setQuestions(data.quiz.questions);
      setAnswers(data.quiz.questions.map(() => null));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Quiz failed");
    } finally {
      setBusy(false);
    }
  }

  async function submit() {
    if (!quizId) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/quiz", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quizId, answers }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not submit quiz");
      setResult({ score: data.quiz.score, questions: data.quiz.questions });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Submit failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="space-y-4">
      <div>
        <h3 className="display text-2xl font-semibold text-forest-900">
          Quiz yourself
        </h3>
        <p className="mt-1 text-ink-muted">
          Check what stuck from the page — or from your uploaded notes.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {(
          [
            ["daf", "From the daf"],
            ["notes", "From my notes"],
            ["mixed", "Daf + notes"],
          ] as const
        ).map(([value, label]) => {
          const disabled = value !== "daf" && !hasNotes;
          return (
            <button
              key={value}
              type="button"
              disabled={disabled}
              onClick={() => setMode(value)}
              className={`rounded-lg px-4 py-2 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-40 ${
                mode === value
                  ? "bg-forest-700 text-white"
                  : "bg-forest-100 text-forest-800 hover:bg-forest-200"
              }`}
            >
              {label}
            </button>
          );
        })}
      </div>

      <button
        type="button"
        onClick={() => void startQuiz()}
        disabled={busy}
        className="btn-primary"
      >
        {busy && !questions.length ? "Building quiz…" : "Start quiz"}
      </button>

      {error && (
        <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-800">
          {error}
        </p>
      )}

      {questions.length > 0 && !result && (
        <div className="space-y-5">
          {questions.map((q, qi) => (
            <fieldset key={q.id} className="panel">
              <legend className="px-1 text-sm font-semibold text-forest-600">
                Question {qi + 1}
              </legend>
              <p className="mt-1 whitespace-pre-wrap font-medium text-forest-950">
                {q.prompt}
              </p>
              <div className="mt-3 space-y-2">
                {q.choices.map((choice, ci) => (
                  <label
                    key={ci}
                    className={`flex cursor-pointer items-start gap-3 rounded-lg border px-3 py-2.5 transition ${
                      answers[qi] === ci
                        ? "border-forest-500 bg-forest-100"
                        : "border-line bg-white hover:border-forest-400"
                    }`}
                  >
                    <input
                      type="radio"
                      name={q.id}
                      checked={answers[qi] === ci}
                      onChange={() => {
                        const next = [...answers];
                        next[qi] = ci;
                        setAnswers(next);
                      }}
                      className="mt-1 accent-forest-600"
                    />
                    <span className="text-ink">{choice}</span>
                  </label>
                ))}
              </div>
            </fieldset>
          ))}
          <button
            type="button"
            onClick={() => void submit()}
            disabled={busy || answers.some((a) => a === null)}
            className="btn-primary"
          >
            {busy ? "Scoring…" : "Submit answers"}
          </button>
        </div>
      )}

      {result && (
        <div className="space-y-4">
          <div className="rounded-xl bg-forest-800 px-5 py-6 text-white">
            <p className="text-sm uppercase tracking-[0.16em] text-forest-200">
              Score
            </p>
            <p className="display mt-1 text-5xl font-semibold">{result.score}%</p>
          </div>
          {result.questions.map((q, qi) => {
            const correct = answers[qi] === q.correctIndex;
            return (
              <div
                key={q.id}
                className={`rounded-xl border px-4 py-3 ${
                  correct
                    ? "border-forest-300 bg-forest-100"
                    : "border-amber-300 bg-amber-50"
                }`}
              >
                <p className="font-semibold text-forest-950">
                  {qi + 1}. {correct ? "Correct" : "Review"}
                </p>
                <p className="mt-1 whitespace-pre-wrap text-sm text-ink-muted">
                  {q.explanation}
                </p>
              </div>
            );
          })}
          <button
            type="button"
            className="btn-secondary"
            onClick={() => {
              setQuizId(null);
              setQuestions([]);
              setAnswers([]);
              setResult(null);
            }}
          >
            Try another set
          </button>
        </div>
      )}
    </section>
  );
}
