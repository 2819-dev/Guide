"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { randomUUID } from "@/lib/edge-crypto";
import {
  TESTQUIZ_CORE_TYPES,
  TESTQUIZ_QUESTION_TYPES,
  TESTQUIZ_TYPE_LABEL,
  type TestQuizDocument,
  type TestQuizQuestion,
  type TestQuizQuestionType,
} from "@/lib/testquiz/types";
import { newBlankQuestion } from "@/lib/testquiz/blank-question";

type Props = { quizId: string };

export function TestQuizEditorPanel({ quizId }: Props) {
  const router = useRouter();
  const [quiz, setQuiz] = useState<TestQuizDocument | null>(null);
  const [allowAll, setAllowAll] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState(0);

  useEffect(() => {
    void (async () => {
      const [qRes, eRes] = await Promise.all([
        fetch(`/api/testquiz/quizzes/${quizId}`),
        fetch("/api/testquiz/entitlements"),
      ]);
      const qData = await qRes.json();
      const eData = await eRes.json();
      if (!qRes.ok) {
        setError(qData.error ?? "Not found");
        return;
      }
      setQuiz(qData.quiz);
      if (eRes.ok) setAllowAll(eData.plan?.questionTypes === "all");
    })();
  }, [quizId]);

  async function save(next: TestQuizDocument) {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/testquiz/quizzes/${quizId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: next.title,
          description: next.description,
          questions: next.questions,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Save failed");
      setQuiz(data.quiz);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  function updateQuestion(index: number, patch: Partial<TestQuizQuestion>) {
    if (!quiz) return;
    const questions = quiz.questions.map((q, i) =>
      i === index ? { ...q, ...patch } : q,
    );
    setQuiz({ ...quiz, questions });
  }

  function addQuestion(type: TestQuizQuestionType) {
    if (!quiz) return;
    if (!allowAll && !TESTQUIZ_CORE_TYPES.includes(type)) {
      setError(`“${TESTQUIZ_TYPE_LABEL[type]}” needs Plus or Ultra.`);
      return;
    }
    const questions = [...quiz.questions, newBlankQuestion(type)];
    setQuiz({ ...quiz, questions });
    setSelected(questions.length - 1);
  }

  async function host() {
    if (!quiz) return;
    await save(quiz);
    const res = await fetch("/api/testquiz/games", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ quizId: quiz.id }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "Could not host");
      return;
    }
    router.push(`/apps/testquiz/host/${data.game.id}`);
  }

  if (!quiz && !error) {
    return <p className="px-5 py-10 text-[var(--tq-muted)]">Loading editor…</p>;
  }
  if (!quiz) {
    return <p className="px-5 py-10 text-[var(--tq-warn)]">{error}</p>;
  }

  const q = quiz.questions[selected];
  const types = allowAll ? TESTQUIZ_QUESTION_TYPES : TESTQUIZ_CORE_TYPES;

  return (
    <div className="tq-rise mx-auto max-w-6xl px-5 py-6 sm:px-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link href="/apps/testquiz/library" className="text-sm text-[var(--tq-muted)] no-underline hover:underline">
          ← Library
        </Link>
        <div className="flex gap-2">
          <button
            type="button"
            className="tq-btn tq-btn-ghost"
            disabled={saving}
            onClick={() => void save(quiz)}
          >
            {saving ? "Saving…" : "Save"}
          </button>
          <button
            type="button"
            className="tq-btn tq-btn-primary"
            disabled={quiz.questions.length === 0}
            onClick={() => void host()}
          >
            Host
          </button>
        </div>
      </div>

      <input
        className="tq-input mt-4 text-xl font-bold"
        value={quiz.title}
        onChange={(e) => setQuiz({ ...quiz, title: e.target.value })}
        aria-label="Quiz title"
      />
      <textarea
        className="tq-textarea mt-2"
        value={quiz.description}
        onChange={(e) => setQuiz({ ...quiz, description: e.target.value })}
        placeholder="Optional description"
      />

      {error ? (
        <p className="mt-3 rounded-xl bg-[rgba(255,107,74,0.15)] px-4 py-3 text-sm">
          {error}
        </p>
      ) : null}

      <div className="mt-6 grid gap-6 lg:grid-cols-[240px_1fr]">
        <aside className="space-y-2">
          {quiz.questions.map((item, i) => (
            <button
              key={item.id}
              type="button"
              className={`tq-tile w-full text-left ${i === selected ? "ring-2 ring-[var(--tq-accent)]" : ""}`}
              onClick={() => setSelected(i)}
            >
              <span className="text-xs uppercase tracking-wide text-[var(--tq-muted)]">
                {TESTQUIZ_TYPE_LABEL[item.type]}
              </span>
              <div className="mt-1 line-clamp-2 text-sm font-semibold">
                {item.prompt || `Question ${i + 1}`}
              </div>
            </button>
          ))}
          <div className="pt-2">
            <label className="mb-1 block text-xs text-[var(--tq-muted)]">
              Add question
            </label>
            <select
              className="tq-select"
              defaultValue=""
              onChange={(e) => {
                const v = e.target.value as TestQuizQuestionType;
                if (v) addQuestion(v);
                e.target.value = "";
              }}
            >
              <option value="" disabled>
                Choose type…
              </option>
              {types.map((t) => (
                <option key={t} value={t}>
                  {TESTQUIZ_TYPE_LABEL[t]}
                </option>
              ))}
            </select>
            {!allowAll ? (
              <p className="mt-2 text-xs text-[var(--tq-muted)]">
                Free plan: Quiz and True/False. Plus/Ultra unlock all types.
              </p>
            ) : null}
          </div>
        </aside>

        <section className="rounded-2xl border border-white/10 bg-black/20 p-5">
          {!q ? (
            <p className="text-[var(--tq-muted)]">Add a question to edit.</p>
          ) : (
            <QuestionFields
              question={q}
              onChange={(patch) => updateQuestion(selected, patch)}
              onDelete={() => {
                const questions = quiz.questions.filter((_, i) => i !== selected);
                setQuiz({ ...quiz, questions });
                setSelected(Math.max(0, selected - 1));
              }}
            />
          )}
        </section>
      </div>
    </div>
  );
}

function QuestionFields({
  question,
  onChange,
  onDelete,
}: {
  question: TestQuizQuestion;
  onChange: (patch: Partial<TestQuizQuestion>) => void;
  onDelete: () => void;
}) {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-sm font-semibold text-[var(--tq-accent)]">
          {TESTQUIZ_TYPE_LABEL[question.type]}
        </span>
        <button type="button" className="tq-btn tq-btn-danger text-sm" onClick={onDelete}>
          Delete
        </button>
      </div>
      <textarea
        className="tq-textarea"
        value={question.prompt}
        onChange={(e) => onChange({ prompt: e.target.value })}
        placeholder="Question prompt"
      />
      <div className="grid gap-3 sm:grid-cols-3">
        <label className="text-sm">
          <span className="mb-1 block text-[var(--tq-muted)]">Time (sec)</span>
          <input
            className="tq-input"
            type="number"
            min={5}
            max={240}
            value={question.timeLimitSec}
            onChange={(e) =>
              onChange({ timeLimitSec: Number(e.target.value) || 20 })
            }
          />
        </label>
        <label className="text-sm">
          <span className="mb-1 block text-[var(--tq-muted)]">Points</span>
          <select
            className="tq-select"
            value={question.points}
            onChange={(e) =>
              onChange({ points: Number(e.target.value) as 0 | 1000 | 2000 })
            }
          >
            <option value={0}>0</option>
            <option value={1000}>1000</option>
            <option value={2000}>2000</option>
          </select>
        </label>
        {question.type === "quiz" ? (
          <label className="flex items-end gap-2 text-sm pb-3">
            <input
              type="checkbox"
              checked={!!question.multiSelect}
              onChange={(e) => onChange({ multiSelect: e.target.checked })}
            />
            Multi-select
          </label>
        ) : null}
      </div>

      {(question.type === "quiz" ||
        question.type === "true_false" ||
        question.type === "poll" ||
        question.type === "puzzle") && (
        <div className="space-y-2">
          {(question.choices ?? []).map((c, i) => (
            <div key={c.id} className="flex gap-2">
              <input
                className="tq-input"
                value={c.text}
                onChange={(e) => {
                  const choices = (question.choices ?? []).map((x) =>
                    x.id === c.id ? { ...x, text: e.target.value } : x,
                  );
                  onChange({ choices });
                }}
                placeholder={`Choice ${i + 1}`}
              />
              {question.type !== "poll" && question.type !== "puzzle" ? (
                <label className="flex items-center gap-1 text-sm whitespace-nowrap">
                  <input
                    type="checkbox"
                    checked={!!c.correct}
                    onChange={(e) => {
                      const choices = (question.choices ?? []).map((x) =>
                        x.id === c.id
                          ? { ...x, correct: e.target.checked }
                          : question.multiSelect
                            ? x
                            : { ...x, correct: false },
                      );
                      onChange({ choices });
                    }}
                  />
                  Correct
                </label>
              ) : null}
            </div>
          ))}
          {question.type === "quiz" || question.type === "poll" ? (
            <button
              type="button"
              className="tq-btn tq-btn-ghost text-sm"
              onClick={() =>
                onChange({
                  choices: [
                    ...(question.choices ?? []),
                    { id: randomUUID(), text: "", correct: false },
                  ],
                })
              }
            >
              Add choice
            </button>
          ) : null}
        </div>
      )}

      {question.type === "type_answer" ? (
        <div className="space-y-2">
          {(question.acceptedAnswers ?? [""]).map((a, i) => (
            <input
              key={i}
              className="tq-input"
              value={a}
              onChange={(e) => {
                const acceptedAnswers = [...(question.acceptedAnswers ?? [])];
                acceptedAnswers[i] = e.target.value;
                onChange({ acceptedAnswers });
              }}
              placeholder={`Accepted answer ${i + 1}`}
            />
          ))}
          <button
            type="button"
            className="tq-btn tq-btn-ghost text-sm"
            onClick={() =>
              onChange({
                acceptedAnswers: [...(question.acceptedAnswers ?? []), ""],
              })
            }
          >
            Add accepted answer
          </button>
        </div>
      ) : null}

      {(question.type === "slider" ||
        question.type === "scale" ||
        question.type === "nps_scale") && (
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="text-sm">
            <span className="mb-1 block text-[var(--tq-muted)]">Min</span>
            <input
              className="tq-input"
              type="number"
              value={question.sliderMin ?? 0}
              onChange={(e) => onChange({ sliderMin: Number(e.target.value) })}
            />
          </label>
          <label className="text-sm">
            <span className="mb-1 block text-[var(--tq-muted)]">Max</span>
            <input
              className="tq-input"
              type="number"
              value={question.sliderMax ?? 100}
              onChange={(e) => onChange({ sliderMax: Number(e.target.value) })}
            />
          </label>
          {question.type === "slider" ? (
            <>
              <label className="text-sm">
                <span className="mb-1 block text-[var(--tq-muted)]">Correct</span>
                <input
                  className="tq-input"
                  type="number"
                  value={question.sliderCorrect ?? 50}
                  onChange={(e) =>
                    onChange({ sliderCorrect: Number(e.target.value) })
                  }
                />
              </label>
              <label className="text-sm">
                <span className="mb-1 block text-[var(--tq-muted)]">Tolerance</span>
                <input
                  className="tq-input"
                  type="number"
                  value={question.sliderTolerance ?? 5}
                  onChange={(e) =>
                    onChange({ sliderTolerance: Number(e.target.value) })
                  }
                />
              </label>
            </>
          ) : (
            <>
              <label className="text-sm">
                <span className="mb-1 block text-[var(--tq-muted)]">Min label</span>
                <input
                  className="tq-input"
                  value={question.scaleMinLabel ?? ""}
                  onChange={(e) => onChange({ scaleMinLabel: e.target.value })}
                />
              </label>
              <label className="text-sm">
                <span className="mb-1 block text-[var(--tq-muted)]">Max label</span>
                <input
                  className="tq-input"
                  value={question.scaleMaxLabel ?? ""}
                  onChange={(e) => onChange({ scaleMaxLabel: e.target.value })}
                />
              </label>
            </>
          )}
        </div>
      )}

      {(question.type === "pin_answer" || question.type === "drop_pin") && (
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="text-sm sm:col-span-2">
            <span className="mb-1 block text-[var(--tq-muted)]">Image URL</span>
            <input
              className="tq-input"
              value={question.mediaUrl ?? ""}
              onChange={(e) => onChange({ mediaUrl: e.target.value })}
              placeholder="https://…"
            />
          </label>
          <label className="text-sm">
            <span className="mb-1 block text-[var(--tq-muted)]">Pin X (0–1)</span>
            <input
              className="tq-input"
              type="number"
              step="0.01"
              min={0}
              max={1}
              value={question.pinX ?? 0.5}
              onChange={(e) => onChange({ pinX: Number(e.target.value) })}
            />
          </label>
          <label className="text-sm">
            <span className="mb-1 block text-[var(--tq-muted)]">Pin Y (0–1)</span>
            <input
              className="tq-input"
              type="number"
              step="0.01"
              min={0}
              max={1}
              value={question.pinY ?? 0.5}
              onChange={(e) => onChange({ pinY: Number(e.target.value) })}
            />
          </label>
        </div>
      )}
    </div>
  );
}
