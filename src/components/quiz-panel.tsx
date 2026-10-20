"use client";

import Link from "next/link";
import { useState } from "react";
import { QUIZ_KIND_LABEL, type QuizKind } from "@/lib/quiz-kinds";

type PublicQuestion = {
  id: string;
  prompt: string;
  choices: string[];
  source: "daf" | "notes" | "mixed";
  kind?: QuizKind;
};

type GradedQuestion = PublicQuestion & {
  correctIndex: number;
  explanation: string;
};

type Props = {
  dafId: string;
  tractateSlug: string;
  hasNotes: boolean;
  signedIn: boolean;
};

function kindLabel(kind?: QuizKind): string | null {
  if (!kind) return null;
  return QUIZ_KIND_LABEL[kind] ?? null;
}

export function QuizPanel({ dafId, tractateSlug, hasNotes, signedIn }: Props) {
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
          Test Yourself
        </h3>
        <p className="mt-2 text-ink-muted">
          Translation, comprehension, key terms, and who-says-what — drawn from
          this daf.{" "}
          <Link
            href="/auth/sign-in?as=student"
            className="font-semibold text-forest-700"
          >
            Log in as Student
          </Link>{" "}
          to start and keep your scores.
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
        body: JSON.stringify({ dafId, tractateSlug, mode }),
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
          Test Yourself
        </h3>
        <p className="mt-1 text-ink-muted">
          Real questions from this page — Hebrew ↔ English translation plus
          comprehension, key terms, and sugya attribution when the text
          supports them. A new shuffle each run.
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
        {busy && !questions.length ? "Building questions…" : "Start Test Yourself"}
      </button>

      {error && (
        <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-800">
          {error}
        </p>
      )}

      {questions.length > 0 && !result && (
        <div className="space-y-5">
          {questions.map((q, qi) => {
            const label = kindLabel(q.kind);
            return (
              <fieldset key={q.id} className="panel">
                <legend className="px-1 text-sm font-semibold text-forest-600">
                  Question {qi + 1}
                  {label ? ` · ${label}` : ""}
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
                      <span
                        className={`text-ink ${
                          /[\u0590-\u05FF]/.test(choice) ? "hebrew text-right" : ""
                        }`}
                        dir={/[\u0590-\u05FF]/.test(choice) ? "rtl" : undefined}
                      >
                        {choice}
                      </span>
                    </label>
                  ))}
                </div>
              </fieldset>
            );
          })}
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
              Score saved
            </p>
            <p className="display mt-1 text-5xl font-semibold">{result.score}%</p>
            <p className="mt-2 text-sm text-forest-200">
              Kept with your account for this daf.
            </p>
          </div>
          {result.questions.map((q, qi) => {
            const correct = answers[qi] === q.correctIndex;
            const label = kindLabel(q.kind);
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
                  {label ? ` · ${label}` : ""}
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
            New set of questions
          </button>
        </div>
      )}
    </section>
  );
}
