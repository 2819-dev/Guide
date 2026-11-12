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
import { TESTQUIZ_DISCOVER_CATEGORIES } from "@/lib/testquiz/discover";

const CHOICE_CLASS = ["tq-choice-a", "tq-choice-b", "tq-choice-c", "tq-choice-d"];

type Props = { quizId: string };

export function TestQuizEditorPanel({ quizId }: Props) {
  const router = useRouter();
  const [quiz, setQuiz] = useState<TestQuizDocument | null>(null);
  const [allowAll, setAllowAll] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState(0);
  const [preview, setPreview] = useState(false);
  const [dragIndex, setDragIndex] = useState<number | null>(null);

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

  async function save(
    next: TestQuizDocument,
    extra?: { isPublic?: boolean },
  ) {
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
          category: next.category,
          tags: next.tags,
          ...(extra?.isPublic !== undefined ? { isPublic: extra.isPublic } : {}),
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
    setPreview(false);
  }

  function duplicateQuestion(index: number) {
    if (!quiz) return;
    const src = quiz.questions[index];
    if (!src) return;
    const copy: TestQuizQuestion = structuredClone(src);
    copy.id = randomUUID();
    if (copy.choices) {
      const idMap = new Map<string, string>();
      copy.choices = copy.choices.map((c) => {
        const nid = randomUUID();
        idMap.set(c.id, nid);
        return { ...c, id: nid };
      });
      if (copy.correctOrder) {
        copy.correctOrder = copy.correctOrder.map((id) => idMap.get(id) ?? id);
      }
    }
    const questions = [
      ...quiz.questions.slice(0, index + 1),
      copy,
      ...quiz.questions.slice(index + 1),
    ];
    setQuiz({ ...quiz, questions });
    setSelected(index + 1);
  }

  function reorder(from: number, to: number) {
    if (!quiz || from === to || to < 0 || to >= quiz.questions.length) return;
    const questions = [...quiz.questions];
    const [item] = questions.splice(from, 1);
    if (!item) return;
    questions.splice(to, 0, item);
    setQuiz({ ...quiz, questions });
    setSelected(to);
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
        <Link
          href="/apps/testquiz/library"
          className="text-sm text-[var(--tq-muted)] no-underline hover:underline"
        >
          ← Library
        </Link>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className="tq-btn tq-btn-ghost"
            disabled={!q}
            onClick={() => setPreview((v) => !v)}
          >
            {preview ? "Edit question" : "Preview as player"}
          </button>
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
            Host live
          </button>
        </div>
      </div>

      <input
        className="tq-input mt-4 text-xl font-bold"
        value={quiz.title}
        onChange={(e) => setQuiz({ ...quiz, title: e.target.value })}
        aria-label="Quiz title"
        placeholder="Quiz title"
      />
      <textarea
        className="tq-textarea mt-2"
        value={quiz.description}
        onChange={(e) => setQuiz({ ...quiz, description: e.target.value })}
        placeholder="Optional description for your library"
      />

      <div className="tq-panel mt-4 flex flex-wrap items-end gap-3 p-4">
        <label className="min-w-[10rem] flex-1 text-sm">
          <span className="mb-1 block text-[var(--tq-muted)]">Discover category</span>
          <select
            className="tq-select"
            value={quiz.category || "general"}
            onChange={(e) => setQuiz({ ...quiz, category: e.target.value })}
          >
            {TESTQUIZ_DISCOVER_CATEGORIES.map((c) => (
              <option key={c.id} value={c.id}>
                {c.label}
              </option>
            ))}
          </select>
        </label>
        <div className="flex flex-wrap items-center gap-2">
          {quiz.isPublic ? (
            <span className="tq-badge">Published on Discover</span>
          ) : (
            <span className="text-sm text-[var(--tq-muted)]">Private to you</span>
          )}
          <button
            type="button"
            className="tq-btn tq-btn-ghost text-sm"
            disabled={saving || quiz.questions.length === 0}
            onClick={() => void save(quiz, { isPublic: !quiz.isPublic })}
          >
            {quiz.isPublic ? "Unpublish" : "Publish to Discover"}
          </button>
        </div>
      </div>

      {error ? (
        <p className="mt-3 rounded-xl bg-[rgba(255,107,74,0.15)] px-4 py-3 text-sm">
          {error}
        </p>
      ) : null}

      <div className="mt-6 grid gap-6 lg:grid-cols-[280px_1fr]">
        <aside className="space-y-2">
          <p className="px-1 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--tq-muted)]">
            Questions · drag to reorder
          </p>
          {quiz.questions.map((item, i) => (
            <div
              key={item.id}
              draggable
              onDragStart={() => setDragIndex(i)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => {
                if (dragIndex != null) reorder(dragIndex, i);
                setDragIndex(null);
              }}
              onDragEnd={() => setDragIndex(null)}
              className={`tq-tile flex w-full items-start gap-2 text-left ${
                i === selected ? "ring-2 ring-[var(--tq-accent)]" : ""
              } ${dragIndex === i ? "opacity-50" : ""}`}
            >
              <span className="tq-drag-handle" title="Drag to reorder" aria-hidden>
                ⠿
              </span>
              <button
                type="button"
                className="min-w-0 flex-1 bg-transparent p-0 text-left text-inherit"
                onClick={() => {
                  setSelected(i);
                  setPreview(false);
                }}
              >
                <span className="text-xs uppercase tracking-wide text-[var(--tq-muted)]">
                  {i + 1}. {TESTQUIZ_TYPE_LABEL[item.type]} · {item.timeLimitSec}s
                </span>
                <div className="mt-1 line-clamp-2 text-sm font-semibold">
                  {item.prompt || `Untitled question`}
                </div>
              </button>
            </div>
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

        <section className="tq-panel p-5 sm:p-6">
          {!q ? (
            <p className="text-[var(--tq-muted)]">Add a question to edit.</p>
          ) : preview ? (
            <PlayerPreview question={q} index={selected} />
          ) : (
            <QuestionFields
              question={q}
              onChange={(patch) => updateQuestion(selected, patch)}
              onDuplicate={() => duplicateQuestion(selected)}
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

function PlayerPreview({
  question,
  index,
}: {
  question: TestQuizQuestion;
  index: number;
}) {
  return (
    <div className="tq-preview-frame tq-rise">
      <p className="text-xs uppercase tracking-[0.16em] text-[var(--tq-muted)]">
        Preview as player · Q{index + 1} · {TESTQUIZ_TYPE_LABEL[question.type]}
      </p>
      <h2 className="mt-3 text-2xl font-extrabold tracking-tight sm:text-3xl">
        {question.prompt || "Question prompt"}
      </h2>
      {question.mediaUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={question.mediaUrl}
          alt=""
          className="mt-4 max-h-48 rounded-xl object-contain"
        />
      ) : null}
      {(question.type === "quiz" ||
        question.type === "true_false" ||
        question.type === "poll" ||
        question.type === "puzzle") && (
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          {(question.choices ?? []).map((c, i) => (
            <div key={c.id} className={`tq-choice ${CHOICE_CLASS[i % 4]}`}>
              {c.text || `Option ${i + 1}`}
            </div>
          ))}
        </div>
      )}
      {(question.type === "type_answer" ||
        question.type === "word_cloud" ||
        question.type === "brainstorm" ||
        question.type === "open_ended") && (
        <input
          className="tq-input mt-6"
          disabled
          placeholder="Students type here…"
        />
      )}
      {(question.type === "slider" ||
        question.type === "scale" ||
        question.type === "nps_scale") && (
        <div className="mt-6">
          <input
            type="range"
            className="w-full"
            disabled
            min={question.sliderMin ?? 0}
            max={question.sliderMax ?? 100}
            defaultValue={question.sliderCorrect ?? question.sliderMin ?? 0}
          />
          <div className="mt-2 flex justify-between text-xs text-[var(--tq-muted)]">
            <span>{question.scaleMinLabel ?? question.sliderMin}</span>
            <span>{question.scaleMaxLabel ?? question.sliderMax}</span>
          </div>
        </div>
      )}
      <p className="mt-6 text-sm text-[var(--tq-muted)]">
        {question.timeLimitSec}s · {question.points} pts
        {question.multiSelect ? " · multi-select" : ""}
      </p>
    </div>
  );
}

function QuestionFields({
  question,
  onChange,
  onDelete,
  onDuplicate,
}: {
  question: TestQuizQuestion;
  onChange: (patch: Partial<TestQuizQuestion>) => void;
  onDelete: () => void;
  onDuplicate: () => void;
}) {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="rounded-full bg-[rgba(62,207,142,0.15)] px-3 py-1 text-sm font-semibold text-[var(--tq-accent)]">
          {TESTQUIZ_TYPE_LABEL[question.type]}
        </span>
        <div className="flex flex-wrap gap-2">
          <button type="button" className="tq-btn tq-btn-ghost text-sm" onClick={onDuplicate}>
            Duplicate
          </button>
          <button type="button" className="tq-btn tq-btn-danger text-sm" onClick={onDelete}>
            Delete
          </button>
        </div>
      </div>

      <textarea
        className="tq-textarea text-lg font-semibold"
        value={question.prompt}
        onChange={(e) => onChange({ prompt: e.target.value })}
        placeholder="Question prompt"
      />

      <label className="block text-sm">
        <span className="mb-1 block text-[var(--tq-muted)]">
          Image / media URL (optional)
        </span>
        <input
          className="tq-input"
          value={question.mediaUrl ?? ""}
          onChange={(e) => onChange({ mediaUrl: e.target.value })}
          placeholder="https://…"
        />
      </label>

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
            <option value={0}>0 (ungraded)</option>
            <option value={1000}>1000</option>
            <option value={2000}>2000 (double)</option>
          </select>
        </label>
        {question.type === "quiz" ? (
          <label className="flex items-end gap-2 pb-3 text-sm">
            <input
              type="checkbox"
              checked={!!question.multiSelect}
              onChange={(e) => onChange({ multiSelect: e.target.checked })}
            />
            Multi-select (select all that apply)
          </label>
        ) : (
          <div />
        )}
      </div>

      {(question.type === "quiz" ||
        question.type === "true_false" ||
        question.type === "poll" ||
        question.type === "puzzle") && (
        <div className="space-y-2">
          <p className="text-sm font-semibold text-[var(--tq-muted)]">
            {question.type === "puzzle"
              ? "Items (set correct order below)"
              : question.type === "poll"
                ? "Poll options"
                : "Answer choices"}
          </p>
          {(question.choices ?? []).map((c, i) => (
            <div key={c.id} className="flex gap-2">
              <span
                className={`mt-1 inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-sm font-bold text-white ${CHOICE_CLASS[i % 4]}`}
              >
                {String.fromCharCode(65 + i)}
              </span>
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
                <label className="flex items-center gap-1 whitespace-nowrap text-sm">
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
          {(question.type === "quiz" || question.type === "poll") && (
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
          )}
          {question.type === "puzzle" ? (
            <PuzzleOrderEditor question={question} onChange={onChange} />
          ) : null}
        </div>
      )}

      {question.type === "type_answer" ? (
        <div className="space-y-2">
          <p className="text-sm font-semibold text-[var(--tq-muted)]">
            Accepted answers (any match counts)
          </p>
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
                <span className="mb-1 block text-[var(--tq-muted)]">Correct value</span>
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
                <span className="mb-1 block text-[var(--tq-muted)]">Tolerance ±</span>
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
          <p className="text-sm text-[var(--tq-muted)] sm:col-span-2">
            Students tap the image. Set the correct pin (0–1 normalized) and
            hit radius for graded pin-answer.
          </p>
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
          <label className="text-sm">
            <span className="mb-1 block text-[var(--tq-muted)]">Hit radius</span>
            <input
              className="tq-input"
              type="number"
              step="0.01"
              min={0.02}
              max={0.5}
              value={question.pinRadius ?? 0.08}
              onChange={(e) => onChange({ pinRadius: Number(e.target.value) })}
            />
          </label>
        </div>
      )}

      {(question.type === "word_cloud" ||
        question.type === "brainstorm" ||
        question.type === "open_ended") && (
        <p className="rounded-xl bg-white/5 px-4 py-3 text-sm text-[var(--tq-muted)]">
          Students type a short response. These types are ungraded — great for
          discussion and check-ins.
        </p>
      )}
    </div>
  );
}

function PuzzleOrderEditor({
  question,
  onChange,
}: {
  question: TestQuizQuestion;
  onChange: (patch: Partial<TestQuizQuestion>) => void;
}) {
  const order =
    question.correctOrder ?? (question.choices ?? []).map((c) => c.id);
  const labels = Object.fromEntries(
    (question.choices ?? []).map((c) => [c.id, c.text || "Item"]),
  );

  function move(id: string, dir: -1 | 1) {
    const idx = order.indexOf(id);
    if (idx < 0) return;
    const next = [...order];
    const j = idx + dir;
    if (j < 0 || j >= next.length) return;
    [next[idx], next[j]] = [next[j]!, next[idx]!];
    onChange({ correctOrder: next });
  }

  return (
    <div className="mt-3 rounded-xl border border-white/10 bg-black/20 p-3">
      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[var(--tq-muted)]">
        Correct order
      </p>
      <div className="space-y-2">
        {order.map((id, i) => (
          <div
            key={id}
            className="flex items-center justify-between gap-2 rounded-lg bg-white/5 px-3 py-2"
          >
            <span className="text-sm font-semibold">
              {i + 1}. {labels[id]}
            </span>
            <span className="flex gap-1">
              <button
                type="button"
                className="tq-btn tq-btn-ghost text-sm"
                onClick={() => move(id, -1)}
              >
                ↑
              </button>
              <button
                type="button"
                className="tq-btn tq-btn-ghost text-sm"
                onClick={() => move(id, 1)}
              >
                ↓
              </button>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
