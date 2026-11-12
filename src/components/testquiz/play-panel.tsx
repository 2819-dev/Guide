"use client";

import { useEffect, useMemo, useState } from "react";
import { TestQuizAudioPlayer } from "@/components/testquiz/audio-player";
import {
  CountdownDrama,
  QuestionTimerBar,
  playerLabel,
} from "@/components/testquiz/live-bits";
import { useGamePoll } from "@/components/testquiz/use-game-poll";
import type { LiveAnswerPayload } from "@/lib/testquiz/types";

const CHOICE_CLASS = ["tq-choice-a", "tq-choice-b", "tq-choice-c", "tq-choice-d"];

type Props = { gameId: string; playerId: string };

export function TestQuizPlayPanel({ gameId, playerId }: Props) {
  const { game, setGame, error } = useGamePoll(gameId, 900);
  const [feedback, setFeedback] = useState<{
    kind: "correct" | "wrong" | "neutral";
    text: string;
    streak?: number;
  } | null>(null);
  const [busy, setBusy] = useState(false);
  const [text, setText] = useState("");
  const [number, setNumber] = useState(50);
  const [selected, setSelected] = useState<string[]>([]);
  const [order, setOrder] = useState<string[]>([]);
  const [pin, setPin] = useState<{ x: number; y: number } | null>(null);
  const [questionKey, setQuestionKey] = useState<string | null>(null);

  const question = game?.questions[game.questionIndex];
  const myAnswer = useMemo(() => {
    if (!game || !question) return null;
    return game.answers.find(
      (a) => a.playerId === playerId && a.questionId === question.id,
    );
  }, [game, question, playerId]);

  const me = game?.players.find((p) => p.id === playerId);

  // Reset local answer UI when the question changes
  useEffect(() => {
    if (!question) return;
    if (question.id === questionKey) return;
    setQuestionKey(question.id);
    setSelected([]);
    setText("");
    setOrder((question.choices ?? []).map((c) => c.id));
    setNumber(
      question.sliderCorrect ??
        Math.round(
          ((question.sliderMin ?? 0) + (question.sliderMax ?? 100)) / 2,
        ),
    );
    setPin(null);
    setFeedback(null);
  }, [question, questionKey]);

  async function submit(payload: LiveAnswerPayload) {
    if (busy || myAnswer) return;
    setBusy(true);
    setFeedback(null);
    try {
      const res = await fetch(`/api/testquiz/games/${gameId}/action`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind: "answer", payload }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not submit");
      if (data.game) setGame(data.game);
      if (data.correct === true) {
        setFeedback({
          kind: "correct",
          text: `Correct! +${data.pointsAwarded}`,
          streak: data.streak,
        });
      } else if (data.correct === false) {
        setFeedback({ kind: "wrong", text: "Not quite" });
      } else {
        setFeedback({ kind: "neutral", text: "Response recorded" });
      }
    } catch (e) {
      setFeedback({
        kind: "wrong",
        text: e instanceof Error ? e.message : "Submit failed",
      });
    } finally {
      setBusy(false);
    }
  }

  if (!game) {
    return (
      <p className="px-5 py-10 text-[var(--tq-muted)]">
        {error ?? "Loading…"}
      </p>
    );
  }

  if (me?.kicked) {
    return (
      <p className="px-5 py-10 text-center text-[var(--tq-warn)]">
        You were removed from this game.
      </p>
    );
  }

  return (
    <div className="tq-rise mx-auto max-w-3xl px-4 py-5 sm:px-8 sm:py-6">
      <TestQuizAudioPlayer
        src={game.musicTrack}
        enabled={game.settings.musicEnabled && !!game.musicTrack}
      />
      <div className="flex items-center justify-between gap-3 text-sm">
        <span className="truncate text-[var(--tq-muted)]">{game.quizTitle}</span>
        <div className="flex items-center gap-2">
          {(me?.streak ?? 0) >= 2 ? (
            <span className="tq-streak">🔥 {me?.streak}</span>
          ) : null}
          <span className="font-bold tabular-nums text-[var(--tq-ink)]">
            {me?.score ?? 0} pts
          </span>
        </div>
      </div>

      {game.phase === "lobby" ? (
        <div className="mt-16 text-center">
          <p className="tq-pulse text-3xl font-extrabold tracking-tight">
            You’re in!
          </p>
          <p className="mt-3 text-[var(--tq-muted)]">
            Wait for your teacher to start the game.
          </p>
          <div className="tq-lobby-chip mt-8">
            {playerLabel(
              {
                displayName: me?.displayName ?? "You",
                nickname: me?.nickname ?? null,
              },
              game.settings.allowNicknames,
            )}
          </div>
        </div>
      ) : null}

      {game.phase === "countdown" ? (
        <div className="mt-14 text-center">
          <CountdownDrama phaseStartedAtMs={game.phaseStartedAtMs} />
          <p className="mt-4 text-xl font-semibold sm:text-2xl">
            {question?.prompt}
          </p>
        </div>
      ) : null}

      {game.phase === "question" && question ? (
        <div className="mt-6">
          <div className="mb-4">
            <QuestionTimerBar
              startedAtMs={game.questionStartedAtMs}
              limitSec={question.timeLimitSec}
            />
          </div>
          <h2 className="text-2xl font-extrabold tracking-tight sm:text-3xl">
            {question.prompt}
          </h2>

          {question.mediaUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={question.mediaUrl}
              alt=""
              className="mt-4 max-h-48 w-full rounded-2xl object-contain"
            />
          ) : null}

          {(question.type === "quiz" ||
            question.type === "true_false" ||
            question.type === "poll") && (
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              {(question.choices ?? []).map((c, i) => {
                const on = selected.includes(c.id);
                return (
                  <button
                    key={c.id}
                    type="button"
                    disabled={!!myAnswer || busy}
                    className={`tq-choice ${CHOICE_CLASS[i % 4]} ${on ? "ring-4 ring-white" : ""}`}
                    onClick={() => {
                      if (question.multiSelect) {
                        setSelected((prev) =>
                          prev.includes(c.id)
                            ? prev.filter((x) => x !== c.id)
                            : [...prev, c.id],
                        );
                      } else {
                        setSelected([c.id]);
                        void submit({ choiceIds: [c.id] });
                      }
                    }}
                  >
                    {c.text || `Option ${i + 1}`}
                  </button>
                );
              })}
            </div>
          )}

          {question.multiSelect && !myAnswer ? (
            <button
              type="button"
              className="tq-btn tq-btn-primary mt-4 w-full sm:w-auto"
              disabled={selected.length === 0 || busy}
              onClick={() => void submit({ choiceIds: selected })}
            >
              Submit answers
            </button>
          ) : null}

          {(question.type === "type_answer" ||
            question.type === "word_cloud" ||
            question.type === "brainstorm" ||
            question.type === "open_ended") &&
            !myAnswer && (
              <div className="mt-6 space-y-3">
                <input
                  className="tq-input text-lg"
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="Type your answer"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && text.trim()) {
                      void submit({ text });
                    }
                  }}
                />
                <button
                  type="button"
                  className="tq-btn tq-btn-primary w-full"
                  disabled={!text.trim() || busy}
                  onClick={() => void submit({ text })}
                >
                  Submit
                </button>
              </div>
            )}

          {(question.type === "slider" ||
            question.type === "scale" ||
            question.type === "nps_scale") &&
            !myAnswer && (
              <div className="mt-6 space-y-4">
                <input
                  type="range"
                  className="w-full accent-[var(--tq-accent)]"
                  min={question.sliderMin ?? 0}
                  max={question.sliderMax ?? 100}
                  step={question.sliderStep ?? 1}
                  value={number}
                  onChange={(e) => setNumber(Number(e.target.value))}
                />
                <p className="text-center text-4xl font-extrabold tabular-nums">
                  {number}
                </p>
                <div className="flex justify-between text-xs text-[var(--tq-muted)]">
                  <span>{question.scaleMinLabel ?? question.sliderMin}</span>
                  <span>{question.scaleMaxLabel ?? question.sliderMax}</span>
                </div>
                <button
                  type="button"
                  className="tq-btn tq-btn-primary w-full"
                  disabled={busy}
                  onClick={() => void submit({ number })}
                >
                  Submit
                </button>
              </div>
            )}

          {question.type === "puzzle" && !myAnswer && (
            <PuzzlePlay
              choiceIds={(question.choices ?? []).map((c) => c.id)}
              labels={Object.fromEntries(
                (question.choices ?? []).map((c) => [c.id, c.text]),
              )}
              order={order.length ? order : (question.choices ?? []).map((c) => c.id)}
              setOrder={setOrder}
              onSubmit={() =>
                void submit({
                  order: order.length
                    ? order
                    : (question.choices ?? []).map((c) => c.id),
                })
              }
              busy={busy}
            />
          )}

          {(question.type === "pin_answer" || question.type === "drop_pin") &&
            !myAnswer && (
              <div className="mt-6 space-y-3">
                {question.mediaUrl ? (
                  <button
                    type="button"
                    className="relative block w-full overflow-hidden rounded-2xl border border-white/15 p-0"
                    onClick={(e) => {
                      const rect = e.currentTarget.getBoundingClientRect();
                      const x = (e.clientX - rect.left) / rect.width;
                      const y = (e.clientY - rect.top) / rect.height;
                      setPin({ x, y });
                    }}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={question.mediaUrl}
                      alt="Tap to place pin"
                      className="block max-h-72 w-full object-contain"
                    />
                    {pin ? (
                      <span
                        className="absolute h-5 w-5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-[var(--tq-warn)] shadow-lg"
                        style={{ left: `${pin.x * 100}%`, top: `${pin.y * 100}%` }}
                      />
                    ) : null}
                  </button>
                ) : (
                  <p className="text-sm text-[var(--tq-muted)]">
                    No image set — submitting center pin.
                  </p>
                )}
                <button
                  type="button"
                  className="tq-btn tq-btn-primary w-full"
                  disabled={busy || (!!question.mediaUrl && !pin)}
                  onClick={() =>
                    void submit({
                      pinX: pin?.x ?? 0.5,
                      pinY: pin?.y ?? 0.5,
                    })
                  }
                >
                  Drop pin
                </button>
              </div>
            )}

          {myAnswer || feedback ? (
            <div
              className={`tq-feedback mt-6 ${
                feedback?.kind === "correct"
                  ? "tq-feedback-correct"
                  : feedback?.kind === "wrong"
                    ? "tq-feedback-wrong tq-shake"
                    : "tq-feedback-neutral"
              }`}
            >
              <p className="text-2xl font-extrabold">
                {feedback?.text ?? "Answer locked in"}
              </p>
              {(feedback?.streak ?? 0) >= 2 ? (
                <p className="tq-streak mt-3">🔥 {feedback?.streak} streak!</p>
              ) : null}
              {myAnswer && !feedback ? (
                <p className="mt-1 text-sm text-[var(--tq-muted)]">
                  Wait for the reveal…
                </p>
              ) : null}
            </div>
          ) : null}
        </div>
      ) : null}

      {(game.phase === "lock" || game.phase === "reveal") && (
        <div className="mt-12">
          <div
            className={`tq-feedback mx-auto max-w-md ${
              feedback?.kind === "correct"
                ? "tq-feedback-correct"
                : feedback?.kind === "wrong"
                  ? "tq-feedback-wrong"
                  : "tq-feedback-neutral"
            }`}
          >
            <p className="text-2xl font-extrabold">
              {feedback?.text ??
                (game.phase === "lock" ? "Answers locked" : "Reveal")}
            </p>
            {(feedback?.streak ?? me?.streak ?? 0) >= 2 ? (
              <p className="tq-streak mt-3">
                🔥 {feedback?.streak ?? me?.streak} streak
              </p>
            ) : null}
          </div>
        </div>
      )}

      {game.phase === "leaderboard" && (
        <div className="mt-10">
          <h2 className="tq-brand text-center">Scores</h2>
          <ol className="mt-6 space-y-2">
            {[...game.players]
              .filter((p) => !p.kicked)
              .sort((a, b) => b.score - a.score)
              .slice(0, 8)
              .map((p, i) => (
                <li
                  key={p.id}
                  className={`flex justify-between rounded-xl px-4 py-3 ${
                    p.id === playerId
                      ? "bg-[var(--tq-accent)]/20 font-bold"
                      : "bg-white/5"
                  }`}
                >
                  <span>
                    {i + 1}.{" "}
                    {playerLabel(p, game.settings.allowNicknames)}
                    {(p.streak ?? 0) >= 2 ? ` 🔥${p.streak}` : ""}
                  </span>
                  <span className="tabular-nums">{p.score}</span>
                </li>
              ))}
          </ol>
        </div>
      )}

      {(game.phase === "podium" || game.phase === "ended") && (
        <div className="mt-14 text-center">
          <h2 className="tq-brand">Nice work!</h2>
          <p className="mt-3 text-xl">
            You finished with{" "}
            <strong className="text-[var(--tq-accent)]">{me?.score ?? 0}</strong>{" "}
            points
          </p>
          <a
            href="/apps/testquiz/join"
            className="tq-btn tq-btn-primary mt-8 inline-flex no-underline"
          >
            Join another
          </a>
        </div>
      )}
    </div>
  );
}

function PuzzlePlay({
  choiceIds,
  labels,
  order,
  setOrder,
  onSubmit,
  busy,
}: {
  choiceIds: string[];
  labels: Record<string, string>;
  order: string[];
  setOrder: (o: string[]) => void;
  onSubmit: () => void;
  busy: boolean;
}) {
  function move(id: string, dir: -1 | 1) {
    const idx = order.indexOf(id);
    if (idx < 0) return;
    const next = [...order];
    const j = idx + dir;
    if (j < 0 || j >= next.length) return;
    [next[idx], next[j]] = [next[j]!, next[idx]!];
    setOrder(next);
  }

  const ids = order.length ? order : choiceIds;

  return (
    <div className="mt-6 space-y-2">
      <p className="text-sm text-[var(--tq-muted)]">Put these in the right order</p>
      {ids.map((id, i) => (
        <div
          key={id}
          className="flex items-center justify-between gap-2 rounded-xl bg-white/10 px-3 py-3"
        >
          <span className="font-semibold">
            <span className="mr-2 text-[var(--tq-muted)]">{i + 1}.</span>
            {labels[id] || "Item"}
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
      <button
        type="button"
        className="tq-btn tq-btn-primary mt-3 w-full"
        disabled={busy}
        onClick={onSubmit}
      >
        Submit order
      </button>
    </div>
  );
}
