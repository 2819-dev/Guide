"use client";

import { useMemo, useState } from "react";
import { TestQuizAudioPlayer } from "@/components/testquiz/audio-player";
import { useGamePoll } from "@/components/testquiz/use-game-poll";
import { TESTQUIZ_TYPE_LABEL } from "@/lib/testquiz/types";

const CHOICE_CLASS = ["tq-choice-a", "tq-choice-b", "tq-choice-c", "tq-choice-d"];

type Props = { gameId: string };

export function TestQuizHostPanel({ gameId }: Props) {
  const { game, setGame, error, refresh } = useGamePoll(gameId, 1000);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function act(action: Record<string, unknown>, kind: "host" | "settings" = "host") {
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch(`/api/testquiz/games/${gameId}/action`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          kind === "settings"
            ? { kind: "settings", settings: action }
            : { kind: "host", action },
        ),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Action failed");
      setGame(data.game);
      await refresh();
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Action failed");
    } finally {
      setBusy(false);
    }
  }

  const question = game?.questions[game.questionIndex];
  const leaders = useMemo(() => {
    if (!game) return [];
    return [...game.players]
      .filter((p) => !p.kicked)
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);
  }, [game]);

  if (!game) {
    return (
      <p className="px-5 py-10 text-[var(--tq-muted)]">
        {error ?? "Loading host view…"}
      </p>
    );
  }

  return (
    <div className="tq-rise relative mx-auto max-w-6xl px-5 py-6 sm:px-8">
      <TestQuizAudioPlayer
        src={game.musicTrack}
        enabled={game.settings.musicEnabled && !!game.musicTrack}
      />
      {game.planWatermark ? (
        <div className="tq-watermark">TestQuiz Free</div>
      ) : null}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm text-[var(--tq-muted)]">{game.quizTitle}</p>
          <h1 className="tq-brand">Host</h1>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className="tq-btn tq-btn-ghost"
            disabled={busy}
            onClick={() =>
              void act({ type: "mute_music", muted: game.settings.musicEnabled })
            }
          >
            {game.settings.musicEnabled ? "Mute music" : "Unmute"}
          </button>
          <button
            type="button"
            className="tq-btn tq-btn-danger"
            disabled={busy}
            onClick={() => void act({ type: "end" })}
          >
            End game
          </button>
        </div>
      </div>

      {msg ? (
        <p className="mt-3 rounded-xl bg-[rgba(255,107,74,0.15)] px-4 py-3 text-sm">
          {msg}
        </p>
      ) : null}

      {game.phase === "lobby" ? (
        <div className="mt-8 grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="rounded-3xl border border-white/10 bg-black/25 p-8 text-center">
            <p className="text-sm uppercase tracking-[0.2em] text-[var(--tq-muted)]">
              Join with PIN
            </p>
            <p className="tq-pin tq-pulse mt-3">{game.pin}</p>
            <p className="mt-4 text-[var(--tq-muted)]">
              Students open TestQuiz from My apps, then enter this PIN.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <button
                type="button"
                className="tq-btn tq-btn-primary"
                disabled={busy || game.players.filter((p) => !p.kicked).length === 0}
                onClick={() => void act({ type: "start" })}
              >
                Start
              </button>
            </div>
            <div className="mt-8 grid gap-3 text-left sm:grid-cols-3">
              <Toggle
                label="Nicknames"
                checked={game.settings.allowNicknames}
                onChange={(v) => void act({ allowNicknames: v }, "settings")}
              />
              <Toggle
                label="Avatars"
                checked={game.settings.allowAvatars}
                onChange={(v) => void act({ allowAvatars: v }, "settings")}
              />
              <Toggle
                label="Music"
                checked={game.settings.musicEnabled}
                onChange={(v) => void act({ musicEnabled: v }, "settings")}
              />
            </div>
          </div>
          <div className="rounded-3xl border border-white/10 bg-black/25 p-6">
            <h2 className="text-lg font-bold">
              Players ({game.players.filter((p) => !p.kicked).length})
            </h2>
            <ul className="mt-4 max-h-[50vh] space-y-2 overflow-auto">
              {game.players
                .filter((p) => !p.kicked)
                .map((p) => (
                  <li
                    key={p.id}
                    className="flex items-center justify-between gap-2 rounded-xl bg-white/5 px-3 py-2"
                  >
                    <span>
                      {game.settings.allowNicknames
                        ? p.nickname || p.displayName
                        : p.displayName}
                    </span>
                    <button
                      type="button"
                      className="text-xs text-[var(--tq-warn)]"
                      onClick={() =>
                        void act({ type: "kick", playerId: p.id })
                      }
                    >
                      Kick
                    </button>
                  </li>
                ))}
            </ul>
          </div>
        </div>
      ) : null}

      {game.phase === "countdown" ? (
        <div className="mt-16 text-center">
          <p className="text-[var(--tq-muted)]">Get ready</p>
          <p className="tq-countdown-num" key={game.phaseStartedAtMs}>
            3
          </p>
          <p className="mt-4 text-xl font-semibold">{question?.prompt}</p>
        </div>
      ) : null}

      {(game.phase === "question" ||
        game.phase === "lock" ||
        game.phase === "reveal") &&
      question ? (
        <div className="mt-8">
          <p className="text-sm text-[var(--tq-muted)]">
            Q{game.questionIndex + 1} · {TESTQUIZ_TYPE_LABEL[question.type]}
          </p>
          <h2 className="mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl">
            {question.prompt}
          </h2>
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            {(question.choices ?? []).map((c, i) => (
              <div
                key={c.id}
                className={`tq-choice ${CHOICE_CLASS[i % 4]} ${
                  game.phase === "reveal" && c.correct
                    ? "ring-4 ring-white"
                    : ""
                }`}
              >
                {c.text || `Option ${i + 1}`}
                {game.phase === "reveal" && c.correct ? " ✓" : ""}
              </div>
            ))}
          </div>
          <p className="mt-4 text-sm text-[var(--tq-muted)]">
            Answers:{" "}
            {
              game.answers.filter((a) => a.questionId === question.id).length
            }{" "}
            / {game.players.filter((p) => !p.kicked).length}
          </p>
          <div className="mt-6 flex flex-wrap gap-2">
            {game.phase === "question" ? (
              <button
                type="button"
                className="tq-btn tq-btn-ghost"
                onClick={() => void act({ type: "lock" })}
              >
                Lock answers
              </button>
            ) : null}
            {game.phase === "lock" || game.phase === "question" ? (
              <button
                type="button"
                className="tq-btn tq-btn-primary"
                onClick={() => void act({ type: "reveal" })}
              >
                Reveal
              </button>
            ) : null}
            {game.phase === "reveal" ? (
              <>
                <button
                  type="button"
                  className="tq-btn tq-btn-primary"
                  onClick={() => void act({ type: "leaderboard" })}
                >
                  Leaderboard
                </button>
                <button
                  type="button"
                  className="tq-btn tq-btn-ghost"
                  onClick={() => void act({ type: "next" })}
                >
                  Next
                </button>
              </>
            ) : null}
            <button
              type="button"
              className="tq-btn tq-btn-ghost"
              onClick={() => void act({ type: "skip" })}
            >
              Skip
            </button>
          </div>
        </div>
      ) : null}

      {game.phase === "leaderboard" ? (
        <div className="mt-10">
          <h2 className="tq-brand">Leaderboard</h2>
          <ol className="mt-6 space-y-3">
            {leaders.map((p, i) => (
              <li
                key={p.id}
                className="flex items-center justify-between rounded-2xl bg-white/8 px-5 py-4 text-lg font-bold"
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
          <button
            type="button"
            className="tq-btn tq-btn-primary mt-6"
            onClick={() => void act({ type: "next" })}
          >
            Continue
          </button>
        </div>
      ) : null}

      {(game.phase === "podium" || game.phase === "ended") && (
        <div className="mt-12 text-center">
          <h2 className="tq-brand">Podium</h2>
          <div className="mt-8 flex flex-wrap items-end justify-center gap-4">
            {leaders.slice(0, 3).map((p, i) => (
              <div
                key={p.id}
                className="tq-rise rounded-2xl bg-white/10 px-6 py-8"
                style={{
                  order: i === 0 ? 2 : i === 1 ? 1 : 3,
                  minWidth: i === 0 ? 160 : 130,
                  paddingBottom: i === 0 ? "3.5rem" : "2rem",
                }}
              >
                <div className="text-3xl font-extrabold">#{i + 1}</div>
                <div className="mt-2 font-bold">
                  {game.settings.allowNicknames
                    ? p.nickname || p.displayName
                    : p.displayName}
                </div>
                <div className="mt-1 text-[var(--tq-accent)]">{p.score}</div>
              </div>
            ))}
          </div>
          {game.phase === "podium" ? (
            <button
              type="button"
              className="tq-btn tq-btn-ghost mt-8"
              onClick={() => void act({ type: "end" })}
            >
              Close
            </button>
          ) : (
            <a href="/apps/testquiz/library" className="tq-btn tq-btn-primary mt-8 inline-flex no-underline">
              Back to library
            </a>
          )}
        </div>
      )}
    </div>
  );
}

function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex items-center justify-between gap-2 rounded-xl bg-white/5 px-3 py-3 text-sm">
      <span>{label}</span>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
      />
    </label>
  );
}
