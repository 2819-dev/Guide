"use client";

import { useMemo, useState } from "react";
import { TestQuizAudioPlayer } from "@/components/testquiz/audio-player";
import { useGamePoll } from "@/components/testquiz/use-game-poll";
import type { LiveAnswerPayload } from "@/lib/testquiz/types";

const CHOICE_CLASS = ["tq-choice-a", "tq-choice-b", "tq-choice-c", "tq-choice-d"];

type Props = { gameId: string; playerId: string };

export function TestQuizPlayPanel({ gameId, playerId }: Props) {
  const { game, setGame, error } = useGamePoll(gameId, 900);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [text, setText] = useState("");
  const [number, setNumber] = useState(50);
  const [selected, setSelected] = useState<string[]>([]);
  const [order, setOrder] = useState<string[]>([]);

  const question = game?.questions[game.questionIndex];
  const myAnswer = useMemo(() => {
    if (!game || !question) return null;
    return game.answers.find(
      (a) => a.playerId === playerId && a.questionId === question.id,
    );
  }, [game, question, playerId]);

  const me = game?.players.find((p) => p.id === playerId);

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
        setFeedback(`Correct! +${data.pointsAwarded}`);
      } else if (data.correct === false) {
        setFeedback("Not quite");
      } else {
        setFeedback("Response recorded");
      }
    } catch (e) {
      setFeedback(e instanceof Error ? e.message : "Submit failed");
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
    <div className="tq-rise mx-auto max-w-3xl px-5 py-6 sm:px-8">
      <TestQuizAudioPlayer
        src={game.musicTrack}
        enabled={game.settings.musicEnabled && !!game.musicTrack}
      />
      <div className="flex items-center justify-between gap-3 text-sm text-[var(--tq-muted)]">
        <span>{game.quizTitle}</span>
        <span className="font-bold text-[var(--tq-ink)]">{me?.score ?? 0} pts</span>
      </div>

      {game.phase === "lobby" ? (
        <div className="mt-16 text-center">
          <p className="tq-pulse text-2xl font-bold">You’re in!</p>
          <p className="mt-3 text-[var(--tq-muted)]">
            Wait for your teacher to start the game.
          </p>
        </div>
      ) : null}

      {game.phase === "countdown" ? (
        <div className="mt-16 text-center">
          <p className="tq-countdown-num" key={game.phaseStartedAtMs}>
            …
          </p>
          <p className="mt-2 text-xl font-semibold">{question?.prompt}</p>
        </div>
      ) : null}

      {game.phase === "question" && question ? (
        <div className="mt-8">
          <h2 className="text-2xl font-extrabold sm:text-3xl">{question.prompt}</h2>

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
              className="tq-btn tq-btn-primary mt-4"
              disabled={selected.length === 0 || busy}
              onClick={() => void submit({ choiceIds: selected })}
            >
              Submit
            </button>
          ) : null}

          {(question.type === "type_answer" ||
            question.type === "word_cloud" ||
            question.type === "brainstorm" ||
            question.type === "open_ended") &&
            !myAnswer && (
              <div className="mt-6 space-y-3">
                <input
                  className="tq-input"
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="Type your answer"
                />
                <button
                  type="button"
                  className="tq-btn tq-btn-primary"
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
              <div className="mt-6 space-y-3">
                <input
                  type="range"
                  className="w-full"
                  min={question.sliderMin ?? 0}
                  max={question.sliderMax ?? 100}
                  step={question.sliderStep ?? 1}
                  value={number}
                  onChange={(e) => setNumber(Number(e.target.value))}
                />
                <p className="text-center text-2xl font-bold">{number}</p>
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
              <button
                type="button"
                className="tq-btn tq-btn-primary mt-6"
                disabled={busy}
                onClick={() => void submit({ pinX: 0.5, pinY: 0.5 })}
              >
                Drop pin (center)
              </button>
            )}

          {myAnswer ? (
            <p className="mt-6 text-center text-lg font-semibold text-[var(--tq-accent)]">
              Answer locked in
            </p>
          ) : null}
        </div>
      ) : null}

      {(game.phase === "lock" || game.phase === "reveal") && (
        <div className="mt-16 text-center">
          <p className="text-2xl font-bold">
            {feedback ?? (game.phase === "lock" ? "Answers locked" : "Reveal")}
          </p>
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
                    p.id === playerId ? "bg-[var(--tq-accent)]/20 font-bold" : "bg-white/5"
                  }`}
                >
                  <span>
                    {i + 1}.{" "}
                    {game.settings.allowNicknames
                      ? p.nickname || p.displayName
                      : p.displayName}
                  </span>
                  <span>{p.score}</span>
                </li>
              ))}
          </ol>
        </div>
      )}

      {(game.phase === "podium" || game.phase === "ended") && (
        <div className="mt-16 text-center">
          <h2 className="tq-brand">Nice work!</h2>
          <p className="mt-3 text-xl">
            You finished with <strong>{me?.score ?? 0}</strong> points
          </p>
          <a
            href="/apps/testquiz/join"
            className="tq-btn tq-btn-primary mt-8 inline-flex no-underline"
          >
            Join another
          </a>
        </div>
      )}

      {feedback && game.phase === "question" ? (
        <p className="mt-4 text-center text-[var(--tq-accent)]">{feedback}</p>
      ) : null}
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
      {ids.map((id) => (
        <div
          key={id}
          className="flex items-center justify-between gap-2 rounded-xl bg-white/10 px-3 py-3"
        >
          <span className="font-semibold">{labels[id] || "Item"}</span>
          <span className="flex gap-1">
            <button type="button" className="tq-btn tq-btn-ghost text-sm" onClick={() => move(id, -1)}>
              ↑
            </button>
            <button type="button" className="tq-btn tq-btn-ghost text-sm" onClick={() => move(id, 1)}>
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
