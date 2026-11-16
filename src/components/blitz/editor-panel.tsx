"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState, type CSSProperties } from "react";
import { TileSymbol } from "@/components/blitz/brand";
import { GameSetupDialog } from "@/components/blitz/game-setup-dialog";
import {
  ChoiceBoard,
  PlayerAnswerInput,
} from "@/components/blitz/question-views";
import { newBlankQuestion } from "@/lib/blitz/blank-question";
import { BLITZ_DISCOVER_CATEGORIES } from "@/lib/blitz/discover";
import type { BlitzPlan } from "@/lib/blitz/plans";
import {
  BLITZ_CORE_TYPES,
  BLITZ_QUESTION_TYPES,
  BLITZ_TYPE_LABEL,
  type BlitzDocument,
  type BlitzQuestion,
  type BlitzQuestionType,
} from "@/lib/blitz/types";
import { playabilityIssue } from "@/lib/blitz/validate";
import { randomUUID } from "@/lib/edge-crypto";

type Props = { quizId: string };

const TYPE_ICON: Record<BlitzQuestionType, { glyph: string; color: string; hint: string }> = {
  quiz: { glyph: "◆", color: "var(--bz-lime)", hint: "Pick the right answer" },
  true_false: { glyph: "✓✗", color: "var(--bz-coral)", hint: "Two-way call" },
  type_answer: { glyph: "Aa", color: "var(--bz-cyan)", hint: "Type it exactly" },
  puzzle: { glyph: "1-2-3", color: "var(--bz-sun)", hint: "Put in order" },
  slider: { glyph: "⟷", color: "var(--bz-violet)", hint: "Guess a number" },
  pin_answer: { glyph: "⌖", color: "var(--bz-mint)", hint: "Tap the spot" },
  poll: { glyph: "▥", color: "var(--bz-lime)", hint: "Opinion, no score" },
  word_cloud: { glyph: "☁", color: "var(--bz-cyan)", hint: "Words float up" },
  brainstorm: { glyph: "✦", color: "var(--bz-sun)", hint: "Collect ideas" },
  drop_pin: { glyph: "◎", color: "var(--bz-mint)", hint: "Pins, no score" },
  open_ended: { glyph: "¶", color: "var(--bz-violet)", hint: "Free response" },
  scale: { glyph: "1–5", color: "var(--bz-coral)", hint: "Rate it" },
  nps_scale: { glyph: "0–10", color: "var(--bz-coral)", hint: "Would you recommend" },
};

const TIME_PRESETS = [5, 10, 15, 20, 30, 60, 90];

export function BlitzEditorPanel({ quizId }: Props) {
  const [quiz, setQuiz] = useState<BlitzDocument | null>(null);
  const [plan, setPlan] = useState<BlitzPlan | null>(null);
  const [saveState, setSaveState] = useState<"saved" | "dirty" | "saving" | "error">("saved");
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState(0);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [setup, setSetup] = useState<"live" | "challenge" | null>(null);
  const timer = useRef<number | null>(null);
  const latest = useRef<BlitzDocument | null>(null);

  const allowAll = plan?.questionTypes === "all";

  useEffect(() => {
    void (async () => {
      const [qRes, eRes] = await Promise.all([fetch(`/api/blitz/quizzes/${quizId}`), fetch("/api/blitz/entitlements")]);
      const qData = await qRes.json();
      const eData = await eRes.json().catch(() => null);
      if (!qRes.ok) {
        setError(qData.error ?? "Not found");
        return;
      }
      setQuiz(qData.quiz);
      latest.current = qData.quiz;
      if (eRes.ok && eData?.plan) setPlan(eData.plan);
    })();
  }, [quizId]);

  const save = useCallback(
    async (extra?: { isPublic?: boolean }) => {
      const next = latest.current;
      if (!next) return false;
      setSaveState("saving");
      try {
        const res = await fetch(`/api/blitz/quizzes/${quizId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: next.title.trim() || "Untitled Blitz",
            description: next.description,
            questions: next.questions,
            category: next.category,
            tags: next.tags,
            ...(extra?.isPublic !== undefined ? { isPublic: extra.isPublic } : {}),
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Save failed");
        if (extra?.isPublic !== undefined) {
          setQuiz(data.quiz);
          latest.current = data.quiz;
        }
        setSaveState(latest.current === next ? "saved" : "dirty");
        setError(null);
        return true;
      } catch (e) {
        setSaveState("error");
        setError(e instanceof Error ? e.message : "Save failed");
        return false;
      }
    },
    [quizId],
  );

  /** Every edit goes through here: local update + debounced autosave. */
  const change = useCallback(
    (next: BlitzDocument) => {
      setQuiz(next);
      latest.current = next;
      setSaveState("dirty");
      if (timer.current) window.clearTimeout(timer.current);
      timer.current = window.setTimeout(() => void save(), 1100);
    },
    [save],
  );

  useEffect(() => () => {
    if (timer.current) window.clearTimeout(timer.current);
  }, []);

  function updateQuestion(index: number, patch: Partial<BlitzQuestion>) {
    if (!quiz) return;
    change({ ...quiz, questions: quiz.questions.map((q, i) => (i === index ? { ...q, ...patch } : q)) });
  }

  function addQuestion(type: BlitzQuestionType) {
    if (!quiz) return;
    if (!allowAll && !BLITZ_CORE_TYPES.includes(type)) {
      setError(`“${BLITZ_TYPE_LABEL[type]}” comes with Blitz Plus.`);
      return;
    }
    const questions = [...quiz.questions, newBlankQuestion(type)];
    change({ ...quiz, questions });
    setSelected(questions.length - 1);
  }

  function duplicateQuestion(index: number) {
    if (!quiz) return;
    const src = quiz.questions[index];
    if (!src) return;
    const copy: BlitzQuestion = structuredClone(src);
    copy.id = randomUUID();
    if (copy.choices) {
      const idMap = new Map<string, string>();
      copy.choices = copy.choices.map((c) => {
        const nid = randomUUID();
        idMap.set(c.id, nid);
        return { ...c, id: nid };
      });
      if (copy.correctOrder) copy.correctOrder = copy.correctOrder.map((id) => idMap.get(id) ?? id);
    }
    change({ ...quiz, questions: [...quiz.questions.slice(0, index + 1), copy, ...quiz.questions.slice(index + 1)] });
    setSelected(index + 1);
  }

  function reorder(from: number, to: number) {
    if (!quiz || from === to || to < 0 || to >= quiz.questions.length) return;
    const questions = [...quiz.questions];
    const [item] = questions.splice(from, 1);
    if (!item) return;
    questions.splice(to, 0, item);
    change({ ...quiz, questions });
    setSelected(to);
  }

  async function openSetup(tab: "live" | "challenge") {
    if (!quiz) return;
    const issue = playabilityIssue(quiz.questions);
    if (issue) {
      setError(issue);
      return;
    }
    if (timer.current) window.clearTimeout(timer.current);
    if (await save()) setSetup(tab);
  }

  if (!quiz) {
    return (
      <div className="bz-page">
        <p className={error ? "bz-alert" : "bz-muted"}>{error ?? "Loading editor…"}</p>
      </div>
    );
  }

  const q = quiz.questions[selected];
  const estMin = Math.max(1, Math.round(quiz.questions.reduce((s, x) => s + x.timeLimitSec + 10, 0) / 60));

  return (
    <div className="bz-page" style={{ paddingTop: "1.25rem" }}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link href="/apps/blitz/library" className="bz-btn bz-btn--quiet bz-btn--sm no-underline">
          ← Library
        </Link>
        <div className="flex flex-wrap items-center gap-2">
          <span className="bz-faint" aria-live="polite" style={{ minWidth: 80, textAlign: "right" }}>
            {saveState === "saving" ? "Saving…" : saveState === "dirty" ? "Unsaved" : saveState === "error" ? "Not saved" : "All saved ✓"}
          </span>
          <button type="button" className="bz-btn bz-btn--sm" onClick={() => setShowSettings((v) => !v)} aria-expanded={showSettings}>
            Settings
          </button>
          <button type="button" className="bz-btn bz-btn--sm" disabled={!quiz.questions.length} onClick={() => void openSetup("challenge")}>
            Assign
          </button>
          <button type="button" className="bz-btn bz-btn--primary" disabled={!quiz.questions.length} onClick={() => void openSetup("live")}>
            Host live
          </button>
        </div>
      </div>

      <input
        className="bz-h1 mt-4"
        style={{
          width: "100%",
          background: "transparent",
          border: 0,
          borderBottom: "3px dashed rgba(196,180,255,.2)",
          color: "var(--bz-text)",
          padding: "0.2rem 0 0.4rem",
          fontSize: "clamp(1.9rem, 4vw, 3rem)",
        }}
        value={quiz.title}
        onChange={(e) => change({ ...quiz, title: e.target.value })}
        aria-label="Quiz title"
        placeholder="Name your Blitz"
      />
      <p className="bz-faint mt-2">
        {quiz.questions.length} questions · about {estMin} min · {quiz.isPublic ? "on Discover" : "private"}
      </p>

      {showSettings ? (
        <div className="bz-card bz-card--pad mt-4 bz-rise">
          <div className="bz-field-row">
            <label style={{ gridColumn: "1 / -1" }}>
              <span className="bz-label">Description</span>
              <textarea
                className="bz-textarea"
                value={quiz.description}
                onChange={(e) => change({ ...quiz, description: e.target.value })}
                placeholder="What’s this Blitz about? (shows in your library and on Discover)"
              />
            </label>
            <label>
              <span className="bz-label">Discover category</span>
              <select className="bz-select" value={quiz.category || "general"} onChange={(e) => change({ ...quiz, category: e.target.value })}>
                {BLITZ_DISCOVER_CATEGORIES.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.label}
                  </option>
                ))}
              </select>
            </label>
            <div>
              <span className="bz-label">Share with other teachers</span>
              <button
                type="button"
                className={`bz-btn ${quiz.isPublic ? "" : "bz-btn--cyan"}`}
                disabled={saveState === "saving" || quiz.questions.length === 0}
                onClick={() => void save({ isPublic: !quiz.isPublic })}
              >
                {quiz.isPublic ? "Unpublish from Discover" : "Publish to Discover"}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {error ? (
        <p className="bz-alert mt-4" role="alert">
          {error}
          {error.includes("Plus") ? (
            <Link href="/apps/blitz/upgrade" style={{ color: "var(--bz-sun)", marginLeft: 6 }}>
              See plans
            </Link>
          ) : null}
        </p>
      ) : null}

      <div className="bz-editor mt-6">
        <aside className="bz-qlist-wrap">
          <div className="bz-qlist">
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
                className={`bz-qitem ${i === selected ? "is-active" : ""} ${dragIndex === i ? "is-drag" : ""}`}
                onClick={() => setSelected(i)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter") setSelected(i);
                }}
              >
                <span className="bz-qnum">{i + 1}</span>
                <span className="bz-qitem-text">
                  <small style={{ color: TYPE_ICON[item.type].color }}>
                    {BLITZ_TYPE_LABEL[item.type]} · {item.timeLimitSec}s
                  </small>
                  <span>{item.prompt || <em style={{ opacity: 0.6 }}>No prompt yet</em>}</span>
                </span>
                <span className="bz-qitem-move">
                  <button type="button" aria-label="Move up" disabled={i === 0} onClick={(e) => { e.stopPropagation(); reorder(i, i - 1); }}>
                    ▲
                  </button>
                  <button type="button" aria-label="Move down" disabled={i === quiz.questions.length - 1} onClick={(e) => { e.stopPropagation(); reorder(i, i + 1); }}>
                    ▼
                  </button>
                </span>
              </div>
            ))}
          </div>
          <p className="bz-kicker mt-5 mb-2">Add a question</p>
          <div className="bz-typegrid">
            {BLITZ_QUESTION_TYPES.map((t) => {
              const locked = !allowAll && !BLITZ_CORE_TYPES.includes(t);
              return (
                <button
                  key={t}
                  type="button"
                  className="bz-typebtn"
                  disabled={locked}
                  title={locked ? "Comes with Blitz Plus" : TYPE_ICON[t].hint}
                  style={{ "--tc": TYPE_ICON[t].color } as CSSProperties}
                  onClick={() => addQuestion(t)}
                >
                  {locked ? <span className="bz-lock">Plus</span> : null}
                  <i aria-hidden>{TYPE_ICON[t].glyph}</i>
                  {BLITZ_TYPE_LABEL[t]}
                </button>
              );
            })}
          </div>
          {!allowAll ? (
            <p className="bz-faint mt-2">
              Free: Quiz + True/False. <Link href="/apps/blitz/upgrade" style={{ color: "var(--bz-sun)" }}>Plus unlocks all 13 types.</Link>
            </p>
          ) : null}
        </aside>

        <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
          <div className="bz-canvas">
            {!q ? (
              <div className="bz-empty">
                <TileSymbol index={1} size={48} className="text-[var(--bz-sun)]" />
                <p className="bz-h3" style={{ color: "var(--bz-text)" }}>
                  Add your first question
                </p>
                <div className="flex flex-wrap justify-center gap-2">
                  <button type="button" className="bz-btn bz-btn--primary" onClick={() => addQuestion("quiz")}>
                    + Quiz
                  </button>
                  <button type="button" className="bz-btn" onClick={() => addQuestion("true_false")}>
                    + True / false
                  </button>
                </div>
              </div>
            ) : (
              <QuestionFields
                key={q.id}
                question={q}
                index={selected}
                onChange={(patch) => updateQuestion(selected, patch)}
                onDuplicate={() => duplicateQuestion(selected)}
                onDelete={() => {
                  change({ ...quiz, questions: quiz.questions.filter((_, i) => i !== selected) });
                  setSelected(Math.max(0, selected - 1));
                }}
              />
            )}
          </div>
          {q ? (
            <div>
              <p className="bz-kicker mb-2" style={{ textAlign: "center" }}>
                Player preview
              </p>
              <div className="bz-preview-phone">
                <div className="bz-prompt-card bz-prompt-card--sm" style={{ fontSize: "1rem", marginBottom: 12 }}>
                  {q.prompt || "Your question…"}
                </div>
                <PlayerAnswerInput key={JSON.stringify(q)} question={q} busy={false} onSubmit={() => undefined} />
              </div>
            </div>
          ) : null}
        </section>
      </div>

      {setup ? <GameSetupDialog quiz={quiz} plan={plan} initialTab={setup} onClose={() => setSetup(null)} /> : null}
    </div>
  );
}

/* ------------------------------------------------------------------ fields */

function QuestionFields({
  question,
  index,
  onChange,
  onDelete,
  onDuplicate,
}: {
  question: BlitzQuestion;
  index: number;
  onChange: (patch: Partial<BlitzQuestion>) => void;
  onDelete: () => void;
  onDuplicate: () => void;
}) {
  const t = question.type;
  const choiceLike = t === "quiz" || t === "true_false" || t === "poll" || t === "puzzle";
  const ungraded = ["poll", "word_cloud", "brainstorm", "drop_pin", "open_ended", "scale", "nps_scale"].includes(t);

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="bz-chip" style={{ background: TYPE_ICON[t].color, color: "var(--bz-ink)", borderColor: "var(--bz-ink)" }}>
          Q{index + 1} · {BLITZ_TYPE_LABEL[t]}
        </span>
        <div className="flex gap-2">
          <button type="button" className="bz-btn bz-btn--sm" onClick={onDuplicate}>
            Duplicate
          </button>
          <button type="button" className="bz-btn bz-btn--danger bz-btn--sm" onClick={onDelete}>
            Delete
          </button>
        </div>
      </div>

      <textarea
        className="bz-prompt-edit"
        value={question.prompt}
        rows={2}
        onChange={(e) => onChange({ prompt: e.target.value })}
        placeholder={t === "poll" ? "Ask the room something…" : "Type your question"}
        aria-label="Question prompt"
      />

      <div className="flex flex-wrap items-end gap-4">
        <div>
          <span className="bz-label">Timer</span>
          <div className="bz-seg">
            {TIME_PRESETS.map((s) => (
              <button key={s} type="button" aria-pressed={question.timeLimitSec === s} onClick={() => onChange({ timeLimitSec: s })}>
                {s}s
              </button>
            ))}
          </div>
        </div>
        {!ungraded ? (
          <div>
            <span className="bz-label">Points</span>
            <div className="bz-seg">
              {([0, 1000, 2000] as const).map((p) => (
                <button key={p} type="button" aria-pressed={question.points === p} onClick={() => onChange({ points: p })}>
                  {p === 0 ? "None" : p === 2000 ? "Double" : "Standard"}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <span className="bz-chip">No points — opinion question</span>
        )}
        {t === "quiz" ? (
          <label className="bz-switch">
            <input type="checkbox" checked={!!question.multiSelect} onChange={(e) => onChange({ multiSelect: e.target.checked })} />
            <span className="bz-switch-track" aria-hidden />
            Multiple right answers
          </label>
        ) : null}
      </div>

      <label>
        <span className="bz-label">
          {t === "pin_answer" || t === "drop_pin" ? "Image to pin on (URL — required)" : "Image (optional URL)"}
        </span>
        <input className="bz-input" value={question.mediaUrl ?? ""} onChange={(e) => onChange({ mediaUrl: e.target.value })} placeholder="https://…" />
      </label>

      {choiceLike ? <ChoiceEditor question={question} onChange={onChange} /> : null}

      {t === "type_answer" ? (
        <div className="flex flex-col gap-2">
          <span className="bz-label">Accepted answers (case and punctuation don’t matter)</span>
          {(question.acceptedAnswers ?? [""]).map((a, i) => (
            <div key={i} className="bz-choice-edit bz-tile--2" style={{ "--tile": "var(--bz-cyan)" } as CSSProperties}>
              <span className="bz-tile-badge" style={{ width: "2.4rem", height: "2.4rem" }}>
                ✓
              </span>
              <input
                type="text"
                value={a}
                onChange={(e) => {
                  const acceptedAnswers = [...(question.acceptedAnswers ?? [])];
                  acceptedAnswers[i] = e.target.value;
                  onChange({ acceptedAnswers });
                }}
                placeholder={i === 0 ? "Main answer" : "Also accept…"}
              />
              {(question.acceptedAnswers ?? []).length > 1 ? (
                <button
                  type="button"
                  className="bz-mini-x"
                  aria-label="Remove"
                  onClick={() => onChange({ acceptedAnswers: (question.acceptedAnswers ?? []).filter((_, j) => j !== i) })}
                >
                  ✕
                </button>
              ) : null}
            </div>
          ))}
          <button
            type="button"
            className="bz-btn bz-btn--sm self-start"
            disabled={(question.acceptedAnswers ?? []).length >= 8}
            onClick={() => onChange({ acceptedAnswers: [...(question.acceptedAnswers ?? []), ""] })}
          >
            + Another spelling
          </button>
        </div>
      ) : null}

      {t === "slider" || t === "scale" || t === "nps_scale" ? (
        <div className="bz-field-row">
          <NumField label="Lowest" value={question.sliderMin ?? 0} onChange={(v) => onChange({ sliderMin: v })} />
          <NumField label="Highest" value={question.sliderMax ?? 100} onChange={(v) => onChange({ sliderMax: v })} />
          {t === "slider" ? (
            <>
              <NumField label="Correct value" value={question.sliderCorrect ?? 50} onChange={(v) => onChange({ sliderCorrect: v })} />
              <NumField label="Counts if within ±" value={question.sliderTolerance ?? 5} onChange={(v) => onChange({ sliderTolerance: v })} />
              <NumField label="Step" value={question.sliderStep ?? 1} onChange={(v) => onChange({ sliderStep: Math.max(0.01, v) })} />
            </>
          ) : (
            <>
              <label>
                <span className="bz-label">Low label</span>
                <input className="bz-input" value={question.scaleMinLabel ?? ""} onChange={(e) => onChange({ scaleMinLabel: e.target.value })} />
              </label>
              <label>
                <span className="bz-label">High label</span>
                <input className="bz-input" value={question.scaleMaxLabel ?? ""} onChange={(e) => onChange({ scaleMaxLabel: e.target.value })} />
              </label>
            </>
          )}
        </div>
      ) : null}

      {t === "pin_answer" || t === "drop_pin" ? <PinEditor question={question} onChange={onChange} /> : null}

      {t === "word_cloud" || t === "brainstorm" || t === "open_ended" ? (
        <p className="bz-alert bz-alert--info">
          {t === "word_cloud"
            ? "Short answers grow into a word cloud on the big screen — repeated words get bigger."
            : t === "brainstorm"
              ? "Ideas pin up as colorful sticky notes on the projector."
              : "Longer responses appear as a wall of notes. Great for exit tickets."}{" "}
          No points, no wrong answers.
        </p>
      ) : null}

      {choiceLike && (question.choices ?? []).length > 0 && t !== "puzzle" ? (
        <div>
          <p className="bz-kicker mb-2">On the projector</p>
          <div style={{ transform: "scale(.9)", transformOrigin: "top left", width: "111%" }}>
            <ChoiceBoard question={question} reveal size="md" />
          </div>
        </div>
      ) : null}
    </div>
  );
}

function NumField({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <label>
      <span className="bz-label">{label}</span>
      <input className="bz-input" type="number" value={value} onChange={(e) => onChange(Number(e.target.value))} />
    </label>
  );
}

function ChoiceEditor({
  question,
  onChange,
}: {
  question: BlitzQuestion;
  onChange: (patch: Partial<BlitzQuestion>) => void;
}) {
  const t = question.type;
  const choices = question.choices ?? [];
  const graded = t === "quiz" || t === "true_false";
  const canEditCount = t === "quiz" || t === "poll" || t === "puzzle";

  function setChoice(id: string, patch: { text?: string; correct?: boolean }) {
    onChange({
      choices: choices.map((c) => {
        if (c.id === id) return { ...c, ...patch };
        // Single-answer quiz: picking one clears the others.
        if (patch.correct && graded && !question.multiSelect) return { ...c, correct: false };
        return c;
      }),
    });
  }

  function remove(id: string) {
    onChange({
      choices: choices.filter((c) => c.id !== id),
      correctOrder: question.correctOrder?.filter((x) => x !== id),
    });
  }

  function add() {
    const id = randomUUID();
    onChange({
      choices: [...choices, { id, text: "", correct: false }],
      correctOrder: t === "puzzle" ? [...(question.correctOrder ?? choices.map((c) => c.id)), id] : question.correctOrder,
    });
  }

  return (
    <div className="flex flex-col gap-3">
      <span className="bz-label">
        {t === "puzzle"
          ? "Blocks (set the right order below)"
          : t === "poll"
            ? "Options"
            : "Answers — tap the circle to mark the right one"}
      </span>
      <div className="grid gap-3 sm:grid-cols-2">
        {choices.map((c, i) => (
          <div key={c.id} className={`bz-choice-edit bz-tile--${i % 6}`}>
            <span className="bz-tile-badge" style={{ width: "2.4rem", height: "2.4rem" }}>
              <TileSymbol index={i} size={22} />
            </span>
            <input
              type="text"
              value={c.text}
              readOnly={t === "true_false"}
              onChange={(e) => setChoice(c.id, { text: e.target.value })}
              placeholder={`Answer ${i + 1}${i >= 2 && t !== "puzzle" ? " (optional)" : ""}`}
              maxLength={120}
            />
            {graded ? (
              <button
                type="button"
                className="bz-correct-toggle"
                aria-pressed={!!c.correct}
                aria-label={c.correct ? "Marked correct" : "Mark as correct"}
                title={c.correct ? "Correct answer" : "Mark as correct"}
                onClick={() => setChoice(c.id, { correct: !c.correct })}
              >
                <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden>
                  <path d="M5 12.5 10 17 19 7" fill="none" stroke="currentColor" strokeWidth="3.6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            ) : null}
            {canEditCount && choices.length > 2 ? (
              <button type="button" className="bz-mini-x" aria-label="Remove answer" onClick={() => remove(c.id)}>
                ✕
              </button>
            ) : null}
          </div>
        ))}
      </div>
      {canEditCount && choices.length < 6 ? (
        <button type="button" className="bz-btn bz-btn--sm self-start" onClick={add}>
          + Add answer
        </button>
      ) : null}
      {t === "puzzle" ? <PuzzleOrderEditor question={question} onChange={onChange} /> : null}
    </div>
  );
}

function PuzzleOrderEditor({
  question,
  onChange,
}: {
  question: BlitzQuestion;
  onChange: (patch: Partial<BlitzQuestion>) => void;
}) {
  const choices = question.choices ?? [];
  const known = new Set(choices.map((c) => c.id));
  const order = [
    ...(question.correctOrder ?? []).filter((id) => known.has(id)),
    ...choices.map((c) => c.id).filter((id) => !(question.correctOrder ?? []).includes(id)),
  ];
  const byId = Object.fromEntries(choices.map((c, i) => [c.id, { text: c.text || `Block ${i + 1}`, i }]));

  function move(id: string, dir: -1 | 1) {
    const i = order.indexOf(id);
    const j = i + dir;
    if (i < 0 || j < 0 || j >= order.length) return;
    const next = [...order];
    [next[i], next[j]] = [next[j]!, next[i]!];
    onChange({ correctOrder: next });
  }

  return (
    <div className="bz-card bz-card--pad">
      <p className="bz-kicker mb-2">Correct order (players see them shuffled)</p>
      <ol className="bz-puzzle-list">
        {order.map((id, pos) => (
          <li key={id} className={`bz-puzzle-item bz-tile--${byId[id]!.i % 6}`}>
            <span className="bz-puzzle-pos">{pos + 1}</span>
            <span className="bz-puzzle-body" style={{ cursor: "default" }}>
              {byId[id]!.text}
            </span>
            <span className="bz-puzzle-arrows">
              <button type="button" aria-label="Move up" disabled={pos === 0} onClick={() => move(id, -1)}>
                ▲
              </button>
              <button type="button" aria-label="Move down" disabled={pos === order.length - 1} onClick={() => move(id, 1)}>
                ▼
              </button>
            </span>
          </li>
        ))}
      </ol>
    </div>
  );
}

function PinEditor({
  question,
  onChange,
}: {
  question: BlitzQuestion;
  onChange: (patch: Partial<BlitzQuestion>) => void;
}) {
  const graded = question.type === "pin_answer";
  const x = question.pinX ?? 0.5;
  const y = question.pinY ?? 0.5;
  const r = question.pinRadius ?? 0.08;
  if (!question.mediaUrl) {
    return <p className="bz-alert bz-alert--info">Add an image URL above, then {graded ? "tap the image to set the right spot" : "students drop pins anywhere on it"}.</p>;
  }
  return (
    <div className="flex flex-col gap-3">
      {graded ? <span className="bz-label">Tap the image to set the right spot</span> : null}
      <button
        type="button"
        className="bz-pin-canvas"
        style={{ cursor: graded ? "crosshair" : "default" }}
        onClick={(e) => {
          if (!graded) return;
          const rect = e.currentTarget.getBoundingClientRect();
          onChange({
            pinX: Math.round(((e.clientX - rect.left) / rect.width) * 1000) / 1000,
            pinY: Math.round(((e.clientY - rect.top) / rect.height) * 1000) / 1000,
          });
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={question.mediaUrl} alt="Pin target" />
        {graded ? <span className="bz-pin-target" style={{ left: `${x * 100}%`, top: `${y * 100}%`, width: `${r * 200}%` }} /> : null}
      </button>
      {graded ? (
        <label>
          <span className="bz-label">Target size: {Math.round(r * 100)}% of the picture</span>
          <input
            type="range"
            className="bz-range"
            min={0.02}
            max={0.3}
            step={0.01}
            value={r}
            style={{ "--pct": `${((r - 0.02) / 0.28) * 100}%` } as CSSProperties}
            onChange={(e) => onChange({ pinRadius: Number(e.target.value) })}
          />
        </label>
      ) : null}
    </div>
  );
}
