"use client";

import { useMemo, useState, type CSSProperties } from "react";
import { TileSymbol } from "@/components/blitz/brand";
import type {
  BlitzQuestion,
  LiveAnswerPayload,
  LiveAnswerRecord,
} from "@/lib/blitz/types";

export const CHOICE_TYPES = ["quiz", "true_false", "poll"] as const;
export const TEXT_TYPES = ["type_answer", "word_cloud", "brainstorm", "open_ended"] as const;
export const NUMBER_TYPES = ["slider", "scale", "nps_scale"] as const;
export const PIN_TYPES = ["pin_answer", "drop_pin"] as const;

export function isChoiceType(t: string): boolean {
  return (CHOICE_TYPES as readonly string[]).includes(t);
}

/* ---------------------------------------------------------------- tiles */

type TileState = "idle" | "picked" | "dim" | "correct" | "wrong";

export function AnswerTile({
  index,
  text,
  state = "idle",
  as = "div",
  onClick,
  disabled,
  count,
  share,
  size = "md",
  tf,
}: {
  index: number;
  text: string;
  state?: TileState;
  as?: "div" | "button";
  onClick?: () => void;
  disabled?: boolean;
  count?: number;
  /** 0–1 share for the reveal bar */
  share?: number;
  size?: "sm" | "md" | "lg" | "xl";
  tf?: boolean;
}) {
  const cls = `bz-tile bz-tile--${index % 6} bz-tile--${size} is-${state}${tf ? " bz-tile--tf" : ""}`;
  const inner = (
    <>
      <span className="bz-tile-badge">
        <TileSymbol index={index} size={size === "sm" ? 18 : size === "xl" ? 40 : 28} />
      </span>
      <span className="bz-tile-text">{text}</span>
      {state === "correct" ? (
        <span className="bz-tile-check" aria-label="Correct answer">
          <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden>
            <path d="M5 12.5 10 17 19 7" fill="none" stroke="currentColor" strokeWidth="3.6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
      ) : null}
      {count !== undefined ? (
        <span className="bz-tile-count">
          <span className="bz-tile-bar" style={{ "--share": share ?? 0 } as CSSProperties} />
          <b>{count}</b>
        </span>
      ) : null}
    </>
  );
  if (as === "button") {
    return (
      <button
        type="button"
        className={cls}
        onClick={onClick}
        disabled={disabled}
        style={{ "--i": index } as CSSProperties}
        aria-pressed={state === "picked"}
      >
        {inner}
      </button>
    );
  }
  return (
    <div className={cls} style={{ "--i": index } as CSSProperties}>
      {inner}
    </div>
  );
}

/** Host / preview grid of choice tiles, with optional reveal counts. */
export function ChoiceBoard({
  question,
  reveal = false,
  answers,
  size = "lg",
}: {
  question: BlitzQuestion;
  reveal?: boolean;
  answers?: LiveAnswerRecord[];
  size?: "md" | "lg" | "xl";
}) {
  const choices = question.choices ?? [];
  const counts = useMemo(() => {
    const m = new Map<string, number>();
    for (const a of answers ?? []) {
      for (const id of a.payload.choiceIds ?? []) m.set(id, (m.get(id) ?? 0) + 1);
    }
    return m;
  }, [answers]);
  const max = Math.max(1, ...choices.map((c) => counts.get(c.id) ?? 0));
  const graded = question.type !== "poll";
  return (
    <div className={`bz-board bz-board--${choices.length <= 2 ? "two" : "grid"}`}>
      {choices.map((c, i) => {
        const n = counts.get(c.id) ?? 0;
        const state: TileState = !reveal
          ? "idle"
          : !graded
            ? "idle"
            : c.correct
              ? "correct"
              : "dim";
        return (
          <AnswerTile
            key={c.id}
            index={i}
            text={c.text || `Option ${i + 1}`}
            state={state}
            size={size}
            tf={question.type === "true_false"}
            share={n / max}
          />
        );
      })}
    </div>
  );
}

/** Projector bar chart of how many picked each choice (reveal). */
export function RevealBars({
  question,
  answers,
}: {
  question: BlitzQuestion;
  answers: LiveAnswerRecord[];
}) {
  const choices = question.choices ?? [];
  const counts = choices.map(
    (c) => answers.filter((a) => a.payload.choiceIds?.includes(c.id)).length,
  );
  const max = Math.max(1, ...counts);
  const graded = question.type !== "poll";
  return (
    <div className="bz-rbars" aria-label="Answer counts">
      {choices.map((c, i) => (
        <div
          key={c.id}
          className={`bz-rbar bz-tile--${i % 6} ${graded && !c.correct ? "is-dim" : ""}`}
          style={{ "--h": counts[i]! / max, "--i": i } as CSSProperties}
        >
          <b>{counts[i]}</b>
          <span className="bz-rbar-col" />
          <span className="bz-rbar-sym">
            <TileSymbol index={i} size={22} />
          </span>
        </div>
      ))}
    </div>
  );
}

/* ---------------------------------------------------------------- player input */

export function PlayerAnswerInput({
  question,
  busy,
  onSubmit,
}: {
  question: BlitzQuestion;
  busy: boolean;
  onSubmit: (payload: LiveAnswerPayload) => void;
}) {
  const t = question.type;
  if (isChoiceType(t)) {
    return <ChoicePicker question={question} busy={busy} onSubmit={onSubmit} />;
  }
  if ((TEXT_TYPES as readonly string[]).includes(t)) {
    return <TextAnswer question={question} busy={busy} onSubmit={onSubmit} />;
  }
  if (t === "slider") {
    return <SliderAnswer question={question} busy={busy} onSubmit={onSubmit} />;
  }
  if (t === "scale" || t === "nps_scale") {
    return <ScaleAnswer question={question} busy={busy} onSubmit={onSubmit} />;
  }
  if (t === "puzzle") {
    return <PuzzleAnswer question={question} busy={busy} onSubmit={onSubmit} />;
  }
  if ((PIN_TYPES as readonly string[]).includes(t)) {
    return <PinAnswer question={question} busy={busy} onSubmit={onSubmit} />;
  }
  return null;
}

function ChoicePicker({
  question,
  busy,
  onSubmit,
}: {
  question: BlitzQuestion;
  busy: boolean;
  onSubmit: (p: LiveAnswerPayload) => void;
}) {
  const [picked, setPicked] = useState<string[]>([]);
  const choices = question.choices ?? [];
  const multi = !!question.multiSelect;
  return (
    <div className="bz-pick">
      {multi ? <p className="bz-pick-hint">Pick all that apply, then lock in</p> : null}
      <div className={`bz-board bz-board--phone bz-board--${choices.length <= 2 ? "two" : "grid"} ${choices.length > 4 ? "bz-board--many" : ""}`}>
        {choices.map((c, i) => (
          <AnswerTile
            key={c.id}
            as="button"
            index={i}
            text={c.text || `Option ${i + 1}`}
            tf={question.type === "true_false"}
            size="md"
            disabled={busy}
            state={picked.includes(c.id) ? "picked" : picked.length && !multi ? "dim" : "idle"}
            onClick={() => {
              if (multi) {
                setPicked((p) => (p.includes(c.id) ? p.filter((x) => x !== c.id) : [...p, c.id]));
              } else {
                setPicked([c.id]);
                onSubmit({ choiceIds: [c.id] });
              }
            }}
          />
        ))}
      </div>
      {multi ? (
        <button
          type="button"
          className="bz-btn bz-btn--primary bz-btn--block bz-btn--lg"
          disabled={busy || picked.length === 0}
          onClick={() => onSubmit({ choiceIds: picked })}
        >
          Lock in {picked.length ? `(${picked.length})` : ""}
        </button>
      ) : null}
    </div>
  );
}

function TextAnswer({
  question,
  busy,
  onSubmit,
}: {
  question: BlitzQuestion;
  busy: boolean;
  onSubmit: (p: LiveAnswerPayload) => void;
}) {
  const [text, setText] = useState("");
  const short = question.type === "type_answer" || question.type === "word_cloud";
  const limit = question.type === "word_cloud" ? 30 : question.type === "type_answer" ? 60 : 250;
  return (
    <form
      className="bz-textanswer"
      onSubmit={(e) => {
        e.preventDefault();
        if (text.trim()) onSubmit({ text: text.trim() });
      }}
    >
      {short ? (
        <input
          className="bz-bigfield"
          value={text}
          maxLength={limit}
          autoFocus
          autoComplete="off"
          onChange={(e) => setText(e.target.value)}
          placeholder={question.type === "word_cloud" ? "One word or two…" : "Type your answer"}
          aria-label="Your answer"
        />
      ) : (
        <textarea
          className="bz-bigfield bz-bigfield--area"
          value={text}
          maxLength={limit}
          autoFocus
          onChange={(e) => setText(e.target.value)}
          placeholder={question.type === "brainstorm" ? "Throw an idea in…" : "Write your thoughts…"}
          aria-label="Your answer"
        />
      )}
      <div className="bz-textanswer-row">
        <span className="bz-faint">
          {text.length}/{limit}
        </span>
        <button type="submit" className="bz-btn bz-btn--primary bz-btn--lg" disabled={busy || !text.trim()}>
          Send it
        </button>
      </div>
    </form>
  );
}

function SliderAnswer({
  question,
  busy,
  onSubmit,
}: {
  question: BlitzQuestion;
  busy: boolean;
  onSubmit: (p: LiveAnswerPayload) => void;
}) {
  const min = question.sliderMin ?? 0;
  const max = question.sliderMax ?? 100;
  const step = question.sliderStep ?? 1;
  const [n, setN] = useState(Math.round((min + max) / 2 / step) * step);
  const pct = ((n - min) / Math.max(1, max - min)) * 100;
  return (
    <div className="bz-slider">
      <p className="bz-slider-value" style={{ "--pct": `${pct}%` } as CSSProperties}>
        {n}
      </p>
      <input
        type="range"
        className="bz-range"
        min={min}
        max={max}
        step={step}
        value={n}
        style={{ "--pct": `${pct}%` } as CSSProperties}
        onChange={(e) => setN(Number(e.target.value))}
        aria-label="Your answer"
      />
      <div className="bz-slider-ends">
        <span>{min}</span>
        <span>{max}</span>
      </div>
      <button
        type="button"
        className="bz-btn bz-btn--primary bz-btn--block bz-btn--lg"
        disabled={busy}
        onClick={() => onSubmit({ number: n })}
      >
        Lock in {n}
      </button>
    </div>
  );
}

function ScaleAnswer({
  question,
  busy,
  onSubmit,
}: {
  question: BlitzQuestion;
  busy: boolean;
  onSubmit: (p: LiveAnswerPayload) => void;
}) {
  const min = question.sliderMin ?? (question.type === "nps_scale" ? 0 : 1);
  const max = question.sliderMax ?? (question.type === "nps_scale" ? 10 : 5);
  const values = Array.from({ length: Math.max(1, max - min + 1) }, (_, i) => min + i).slice(0, 11);
  return (
    <div className="bz-scale">
      <div className={`bz-scale-keys ${values.length > 6 ? "is-wide" : ""}`}>
        {values.map((v, i) => (
          <button
            key={v}
            type="button"
            className="bz-scale-key"
            disabled={busy}
            style={{ "--t": values.length > 1 ? i / (values.length - 1) : 0 } as CSSProperties}
            onClick={() => onSubmit({ number: v })}
          >
            {v}
          </button>
        ))}
      </div>
      <div className="bz-slider-ends">
        <span>{question.scaleMinLabel ?? min}</span>
        <span>{question.scaleMaxLabel ?? max}</span>
      </div>
    </div>
  );
}

function PuzzleAnswer({
  question,
  busy,
  onSubmit,
}: {
  question: BlitzQuestion;
  busy: boolean;
  onSubmit: (p: LiveAnswerPayload) => void;
}) {
  const choices = question.choices ?? [];
  const [order, setOrder] = useState(choices.map((c) => c.id));
  const [held, setHeld] = useState<string | null>(null);
  const label = Object.fromEntries(choices.map((c, i) => [c.id, { text: c.text || `Item ${i + 1}`, i }]));

  function move(id: string, dir: -1 | 1) {
    const i = order.indexOf(id);
    const j = i + dir;
    if (i < 0 || j < 0 || j >= order.length) return;
    const next = [...order];
    [next[i], next[j]] = [next[j]!, next[i]!];
    setOrder(next);
  }

  function tap(id: string) {
    if (!held) return setHeld(id);
    if (held === id) return setHeld(null);
    const next = [...order];
    const a = next.indexOf(held);
    const b = next.indexOf(id);
    [next[a], next[b]] = [next[b]!, next[a]!];
    setOrder(next);
    setHeld(null);
  }

  return (
    <div className="bz-puzzle">
      <p className="bz-pick-hint">Tap two blocks to swap them, or use the arrows</p>
      <ol className="bz-puzzle-list">
        {order.map((id, pos) => (
          <li key={id} className={`bz-puzzle-item bz-tile--${label[id]!.i % 6} ${held === id ? "is-held" : ""}`}>
            <span className="bz-puzzle-pos">{pos + 1}</span>
            <button type="button" className="bz-puzzle-body" onClick={() => tap(id)}>
              {label[id]!.text}
            </button>
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
      <button
        type="button"
        className="bz-btn bz-btn--primary bz-btn--block bz-btn--lg"
        disabled={busy}
        onClick={() => onSubmit({ order })}
      >
        Lock in order
      </button>
    </div>
  );
}

function PinAnswer({
  question,
  busy,
  onSubmit,
}: {
  question: BlitzQuestion;
  busy: boolean;
  onSubmit: (p: LiveAnswerPayload) => void;
}) {
  const [pin, setPin] = useState<{ x: number; y: number } | null>(null);
  return (
    <div className="bz-pin">
      {question.mediaUrl ? (
        <button
          type="button"
          className="bz-pin-canvas"
          onClick={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            setPin({
              x: Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width)),
              y: Math.min(1, Math.max(0, (e.clientY - rect.top) / rect.height)),
            });
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={question.mediaUrl} alt="Tap to drop your pin" />
          {pin ? <PinMark x={pin.x} y={pin.y} /> : null}
        </button>
      ) : (
        <p className="bz-note">No image on this question — your pin lands in the middle.</p>
      )}
      <button
        type="button"
        className="bz-btn bz-btn--primary bz-btn--block bz-btn--lg"
        disabled={busy || (!!question.mediaUrl && !pin)}
        onClick={() => onSubmit({ pinX: pin?.x ?? 0.5, pinY: pin?.y ?? 0.5 })}
      >
        {pin || !question.mediaUrl ? "Drop pin here" : "Tap the picture first"}
      </button>
    </div>
  );
}

export function PinMark({ x, y, tone = "coral", small }: { x: number; y: number; tone?: string; small?: boolean }) {
  return (
    <span
      className={`bz-pinmark bz-pinmark--${tone} ${small ? "is-small" : ""}`}
      style={{ left: `${x * 100}%`, top: `${y * 100}%` }}
      aria-hidden
    />
  );
}

/* ---------------------------------------------------------------- host results */

function normalize(s: string) {
  return s.trim().toLowerCase().replace(/\s+/g, " ");
}

/** Results area for non-choice types (reveal), or a live "waiting" visual. */
export function HostResults({
  question,
  answers,
  reveal,
}: {
  question: BlitzQuestion;
  answers: LiveAnswerRecord[];
  reveal: boolean;
}) {
  const t = question.type;

  if ((TEXT_TYPES as readonly string[]).includes(t)) {
    const words = new Map<string, { text: string; n: number; ok: boolean | null }>();
    for (const a of answers) {
      const raw = a.payload.text?.trim();
      if (!raw) continue;
      const k = normalize(raw);
      const w = words.get(k) ?? { text: raw, n: 0, ok: a.correct };
      w.n += 1;
      words.set(k, w);
    }
    const list = [...words.values()].sort((a, b) => b.n - a.n);
    const max = Math.max(1, ...list.map((w) => w.n));
    if (t === "open_ended" || t === "brainstorm") {
      return (
        <div className="bz-notes">
          {list.length === 0 ? <WaitingBlurb text="Ideas will pin up here as they land…" /> : null}
          {list.slice(0, 24).map((w, i) => (
            <div key={w.text + i} className={`bz-note-card bz-tile--${i % 6}`} style={{ "--r": `${((i * 37) % 7) - 3}deg`, animationDelay: `${i * 50}ms` } as CSSProperties}>
              {w.text}
              {w.n > 1 ? <b>×{w.n}</b> : null}
            </div>
          ))}
        </div>
      );
    }
    return (
      <div className="bz-cloud">
        {t === "type_answer" && reveal ? (
          <p className="bz-cloud-answer">
            Accepted: <strong>{(question.acceptedAnswers ?? []).filter(Boolean).join(" · ")}</strong>
          </p>
        ) : null}
        {list.length === 0 ? <WaitingBlurb text={t === "type_answer" ? "Answers stay hidden until the reveal" : "Words will float in here…"} /> : null}
        {(t !== "type_answer" || reveal) &&
          list.slice(0, 40).map((w, i) => (
            <span
              key={w.text + i}
              className={`bz-cloud-word ${w.ok === true ? "is-ok" : w.ok === false ? "is-miss" : ""}`}
              style={{ fontSize: `${1 + (w.n / max) * 2.4}rem`, animationDelay: `${i * 40}ms`, "--c": i % 6 } as CSSProperties}
            >
              {w.text}
            </span>
          ))}
      </div>
    );
  }

  if (t === "slider") {
    const min = question.sliderMin ?? 0;
    const max = question.sliderMax ?? 100;
    const span = Math.max(1, max - min);
    const pos = (v: number) => `${((v - min) / span) * 100}%`;
    const target = question.sliderCorrect;
    const tol = question.sliderTolerance ?? 0;
    return (
      <div className="bz-numline">
        <div className="bz-numline-track">
          {reveal && target != null ? (
            <span className="bz-numline-zone" style={{ left: pos(Math.max(min, target - tol)), width: `${((Math.min(max, target + tol) - Math.max(min, target - tol)) / span) * 100}%` }} />
          ) : null}
          {answers.map((a, i) =>
            typeof a.payload.number === "number" ? (
              <span key={i} className={`bz-numline-dot ${reveal ? (a.correct ? "is-ok" : "is-miss") : ""}`} style={{ left: pos(a.payload.number), animationDelay: `${i * 30}ms` }} />
            ) : null,
          )}
          {reveal && target != null ? (
            <span className="bz-numline-target" style={{ left: pos(target) }}>
              {target}
            </span>
          ) : null}
        </div>
        <div className="bz-slider-ends">
          <span>{min}</span>
          <span>{max}</span>
        </div>
        {answers.length === 0 ? <WaitingBlurb text="Guesses drop onto the line here" /> : null}
      </div>
    );
  }

  if (t === "scale" || t === "nps_scale") {
    const min = question.sliderMin ?? (t === "nps_scale" ? 0 : 1);
    const max = question.sliderMax ?? (t === "nps_scale" ? 10 : 5);
    const values = Array.from({ length: Math.max(1, max - min + 1) }, (_, i) => min + i).slice(0, 11);
    const counts = values.map((v) => answers.filter((a) => a.payload.number === v).length);
    const top = Math.max(1, ...counts);
    const nums = answers.map((a) => a.payload.number).filter((n): n is number => typeof n === "number");
    const avg = nums.length ? nums.reduce((s, n) => s + n, 0) / nums.length : null;
    let nps: number | null = null;
    if (t === "nps_scale" && nums.length) {
      const pro = nums.filter((n) => n >= 9).length;
      const det = nums.filter((n) => n <= 6).length;
      nps = Math.round(((pro - det) / nums.length) * 100);
    }
    return (
      <div className="bz-hist">
        <div className="bz-hist-bars">
          {values.map((v, i) => (
            <div key={v} className="bz-hist-col">
              <span className="bz-hist-n">{counts[i]}</span>
              <span className="bz-hist-bar" style={{ "--h": counts[i]! / top, "--t": values.length > 1 ? i / (values.length - 1) : 0 } as CSSProperties} />
              <span className="bz-hist-label">{v}</span>
            </div>
          ))}
        </div>
        <div className="bz-slider-ends">
          <span>{question.scaleMinLabel}</span>
          <span>{question.scaleMaxLabel}</span>
        </div>
        {avg != null ? (
          <p className="bz-hist-avg">
            Average <strong>{avg.toFixed(1)}</strong>
            {nps != null ? (
              <>
                {" "}· NPS <strong>{nps}</strong>
              </>
            ) : null}
          </p>
        ) : null}
      </div>
    );
  }

  if (t === "puzzle") {
    const correctOrder = question.correctOrder ?? [];
    const byId = Object.fromEntries((question.choices ?? []).map((c, i) => [c.id, { text: c.text, i }]));
    const right = answers.filter((a) => a.correct).length;
    if (!reveal) {
      return (
        <div className="bz-puzzle-host">
          {(question.choices ?? []).map((c, i) => (
            <AnswerTile key={c.id} index={i} text={c.text || `Item ${i + 1}`} size="md" />
          ))}
        </div>
      );
    }
    return (
      <div className="bz-puzzle-host is-reveal">
        {correctOrder.map((id, pos) => (
          <div key={id} className={`bz-puzzle-item bz-tile--${(byId[id]?.i ?? pos) % 6}`} style={{ animationDelay: `${pos * 120}ms` }}>
            <span className="bz-puzzle-pos">{pos + 1}</span>
            <span className="bz-puzzle-body">{byId[id]?.text}</span>
          </div>
        ))}
        <p className="bz-hist-avg">
          <strong>{right}</strong> of {answers.length} got the order right
        </p>
      </div>
    );
  }

  if ((PIN_TYPES as readonly string[]).includes(t)) {
    return (
      <div className="bz-pin-host">
        {question.mediaUrl ? (
          <div className="bz-pin-canvas is-static">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={question.mediaUrl} alt="" />
            {answers.map((a, i) =>
              typeof a.payload.pinX === "number" && typeof a.payload.pinY === "number" ? (
                <PinMark key={i} x={a.payload.pinX} y={a.payload.pinY} small tone={reveal && t === "pin_answer" ? (a.correct ? "lime" : "coral") : "sun"} />
              ) : null,
            )}
            {reveal && t === "pin_answer" && question.pinX != null && question.pinY != null ? (
              <span
                className="bz-pin-target"
                style={{
                  left: `${question.pinX * 100}%`,
                  top: `${question.pinY * 100}%`,
                  width: `${(question.pinRadius ?? 0.08) * 200}%`,
                }}
              />
            ) : null}
          </div>
        ) : (
          <WaitingBlurb text="Add an image to this question to see pins on a map." />
        )}
      </div>
    );
  }

  return null;
}

function WaitingBlurb({ text }: { text: string }) {
  return <p className="bz-waiting">{text}</p>;
}

/* ---------------------------------------------------------------- answer text */

/** Human-readable correct answer (for feedback + reviews). */
export function correctAnswerText(q: BlitzQuestion): string | null {
  switch (q.type) {
    case "quiz":
    case "true_false": {
      const right = (q.choices ?? []).filter((c) => c.correct).map((c) => c.text);
      return right.length ? right.join(" + ") : null;
    }
    case "type_answer":
      return (q.acceptedAnswers ?? []).filter(Boolean)[0] ?? null;
    case "slider":
      return q.sliderCorrect != null ? `${q.sliderCorrect}${q.sliderTolerance ? ` (±${q.sliderTolerance})` : ""}` : null;
    case "puzzle": {
      const byId = Object.fromEntries((q.choices ?? []).map((c) => [c.id, c.text]));
      return (q.correctOrder ?? []).map((id) => byId[id]).join(" → ");
    }
    case "pin_answer":
      return "the marked spot";
    default:
      return null;
  }
}

/** What a player answered, as text. */
export function payloadText(q: BlitzQuestion, p: LiveAnswerPayload | undefined): string {
  if (!p) return "—";
  if (p.choiceIds?.length) {
    const byId = Object.fromEntries((q.choices ?? []).map((c) => [c.id, c.text]));
    return p.choiceIds.map((id) => byId[id] ?? "?").join(" + ");
  }
  if (p.text) return p.text;
  if (typeof p.number === "number") return String(p.number);
  if (p.order?.length) {
    const byId = Object.fromEntries((q.choices ?? []).map((c) => [c.id, c.text]));
    return p.order.map((id) => byId[id]).join(" → ");
  }
  if (typeof p.pinX === "number") return "Pin dropped";
  return "No answer";
}
