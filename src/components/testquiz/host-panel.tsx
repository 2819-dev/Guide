"use client";

import { useMemo, useState } from "react";
import { TestQuizAudioPlayer } from "@/components/testquiz/audio-player";
import {
  CountdownDrama,
  JoinQr,
  QuestionTimerBar,
  playerLabel,
} from "@/components/testquiz/live-bits";
import { useGamePoll } from "@/components/testquiz/use-game-poll";
import { TESTQUIZ_AVATARS } from "@/lib/testquiz/avatars";
import { TESTQUIZ_TYPE_LABEL } from "@/lib/testquiz/types";

const CHOICE_CLASS = ["tq-choice-a", "tq-choice-b", "tq-choice-c", "tq-choice-d"];

type Props = { gameId: string };

export function TestQuizHostPanel({ gameId }: Props) {
  const { game, setGame, error, refresh } = useGamePoll(gameId, 1000);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  async function copyPin() {
    if (!game) return;
    try {
      await navigator.clipboard.writeText(game.pin);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      setMsg("Could not copy PIN");
    }
  }

  async function act(
    action: Record<string, unknown>,
    kind: "host" | "settings" = "host",
  ) {
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
  const activePlayers = useMemo(
    () => (game ? game.players.filter((p) => !p.kicked) : []),
    [game],
  );
  const leaders = useMemo(
    () => [...activePlayers].sort((a, b) => b.score - a.score).slice(0, 8),
    [activePlayers],
  );

  const answerCounts = useMemo(() => {
    if (!game || !question) return new Map<string, number>();
    const map = new Map<string, number>();
    for (const a of game.answers.filter((x) => x.questionId === question.id)) {
      for (const id of a.payload.choiceIds ?? []) {
        map.set(id, (map.get(id) ?? 0) + 1);
      }
    }
    return map;
  }, [game, question]);

  if (!game) {
    return (
      <p className="px-5 py-10 text-[var(--tq-muted)]">
        {error ?? "Loading host view…"}
      </p>
    );
  }

  const answered = question
    ? game.answers.filter((a) => a.questionId === question.id).length
    : 0;

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
          <h1 className="tq-brand">
            {game.phase === "lobby" ? "Lobby" : "Live host"}
          </h1>
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
        <div className="mt-8 grid gap-6 lg:grid-cols-[1.25fr_0.85fr]">
          <div className="tq-panel p-8 text-center sm:p-10">
            <p className="text-sm uppercase tracking-[0.22em] text-[var(--tq-muted)]">
              Join with PIN
            </p>
            <p className="tq-pin tq-pulse tq-glow mt-4">{game.pin}</p>
            <div className="mt-3 flex flex-wrap justify-center gap-2">
              <button
                type="button"
                className="tq-btn tq-btn-ghost text-sm"
                onClick={() => void copyPin()}
              >
                {copied ? "PIN copied" : "Copy PIN"}
              </button>
            </div>
            <p className="mt-4 text-[var(--tq-muted)]">
              Students open TestQuiz from My apps, then enter this PIN.
            </p>
            <div className="mt-8 flex flex-wrap items-start justify-center gap-8">
              <JoinQr pin={game.pin} />
              <div className="max-w-xs text-left text-sm text-[var(--tq-muted)]">
                <p className="font-semibold text-[var(--tq-ink)]">Projector tip</p>
                <p className="mt-1">
                  Keep this screen up. Students can scan the QR or type the PIN.
                </p>
                <div className="mt-4 grid grid-cols-2 gap-2">
                  <div className="tq-stat">
                    <strong>{activePlayers.length}</strong>
                    <span className="text-xs text-[var(--tq-muted)]">Players</span>
                  </div>
                  <div className="tq-stat">
                    <strong>{game.questions.length}</strong>
                    <span className="text-xs text-[var(--tq-muted)]">Questions</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="mt-10 flex flex-wrap justify-center gap-3">
              <button
                type="button"
                className="tq-btn tq-btn-primary min-w-[10rem] text-lg"
                disabled={busy || activePlayers.length === 0}
                onClick={() => void act({ type: "start" })}
              >
                Start game
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
            <p className="mt-6 text-xs text-[var(--tq-muted)]">
              {game.questions.length} questions in this quiz
            </p>
          </div>
          <div className="tq-panel p-6">
            <h2 className="text-lg font-bold">
              Players{" "}
              <span className="text-[var(--tq-accent)]">
                ({activePlayers.length})
              </span>
            </h2>
            {activePlayers.length === 0 ? (
              <p className="mt-6 text-sm text-[var(--tq-muted)]">
                Waiting for students to join…
              </p>
            ) : (
              <ul className="mt-4 flex max-h-[55vh] flex-wrap gap-2 overflow-auto">
                {activePlayers.map((p) => {
                  const avatar = TESTQUIZ_AVATARS.find(
                    (a) => a.id === p.avatarId,
                  );
                  return (
                    <li key={p.id} className="tq-lobby-chip">
                      {game.settings.allowAvatars ? (
                        <span
                          className="tq-avatar-dot"
                          style={{ background: avatar?.color ?? "#3ecf8e" }}
                        />
                      ) : null}
                      <span>
                        {playerLabel(p, game.settings.allowNicknames)}
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
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      ) : null}

      {game.phase === "countdown" ? (
        <div className="mt-16 text-center">
          <p className="text-sm uppercase tracking-[0.2em] text-[var(--tq-muted)]">
            Get ready
          </p>
          <CountdownDrama phaseStartedAtMs={game.phaseStartedAtMs} />
          <p className="mt-6 text-2xl font-semibold sm:text-3xl">
            {question?.prompt}
          </p>
          <p className="mt-3 text-sm text-[var(--tq-muted)]">
            Q{game.questionIndex + 1} of {game.questions.length}
            {question ? ` · ${TESTQUIZ_TYPE_LABEL[question.type]}` : ""}
          </p>
        </div>
      ) : null}

      {(game.phase === "question" ||
        game.phase === "lock" ||
        game.phase === "reveal") &&
      question ? (
        <div className="mt-8">
          <div className="tq-progress mb-4" aria-hidden>
            {game.questions.map((q, i) => (
              <span
                key={q.id}
                className={`tq-progress-dot ${
                  i < game.questionIndex
                    ? "is-done"
                    : i === game.questionIndex
                      ? "is-current"
                      : ""
                }`}
              />
            ))}
          </div>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-[var(--tq-muted)]">
              Q{game.questionIndex + 1} of {game.questions.length} ·{" "}
              {TESTQUIZ_TYPE_LABEL[question.type]} · {answered}/
              {activePlayers.length} answered
            </p>
            {game.phase === "question" ? (
              <div className="w-full max-w-xs sm:w-48">
                <QuestionTimerBar
                  startedAtMs={game.questionStartedAtMs}
                  limitSec={question.timeLimitSec}
                />
              </div>
            ) : null}
          </div>
          <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl lg:text-5xl">
            {question.prompt}
          </h2>
          {question.mediaUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={question.mediaUrl}
              alt=""
              className="mt-5 max-h-56 rounded-2xl object-contain"
            />
          ) : null}

          {(question.choices ?? []).length > 0 ? (
            <div className="tq-choices mt-8">
              {(question.choices ?? []).map((c, i) => {
                const count = answerCounts.get(c.id) ?? 0;
                const pct =
                  activePlayers.length > 0
                    ? Math.round((count / activePlayers.length) * 100)
                    : 0;
                const showBars =
                  game.phase === "reveal" || game.phase === "lock";
                return (
                  <div key={c.id} className="space-y-2">
                    <div
                      className={`tq-choice ${CHOICE_CLASS[i % 4]} ${
                        game.phase === "reveal" && c.correct
                          ? "tq-choice-correct"
                          : game.phase === "reveal" && !c.correct
                            ? "tq-choice-miss"
                            : ""
                      }`}
                    >
                      <span
                        className={`tq-shape ${["tq-shape-tri", "tq-shape-dia", "tq-shape-cir", "tq-shape-sq"][i % 4]}`}
                        aria-hidden
                      />
                      <span>
                        {c.text || `Option ${i + 1}`}
                        {game.phase === "reveal" && c.correct ? " · correct" : ""}
                      </span>
                    </div>
                    {showBars ? (
                      <div className="tq-bar-row px-1">
                        <span className="text-xs font-bold text-[var(--tq-muted)]">
                          {String.fromCharCode(65 + i)}
                        </span>
                        <div className="tq-bar-track">
                          <div
                            className={`tq-bar-fill ${CHOICE_CLASS[i % 4]}`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <span className="text-xs font-bold tabular-nums">
                          {count}
                        </span>
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>
          ) : question.type === "word_cloud" ||
            question.type === "brainstorm" ||
            question.type === "open_ended" ||
            question.type === "type_answer" ? (
            <div className="tq-cloud mt-8">
              {game.answers
                .filter((a) => a.questionId === question.id && a.payload.text)
                .map((a, i) => (
                  <span
                    key={`${a.playerId}-${i}`}
                    className="tq-cloud-word"
                    style={{
                      fontSize: `${Math.min(1.6, 0.9 + (a.payload.text?.length ?? 0) * 0.02)}rem`,
                      animationDelay: `${i * 40}ms`,
                    }}
                  >
                    {a.payload.text}
                  </span>
                ))}
              {game.answers.filter((a) => a.questionId === question.id).length ===
              0 ? (
                <p className="text-[var(--tq-muted)]">
                  Waiting for typed responses…
                </p>
              ) : null}
            </div>
          ) : (
            <p className="tq-soft mt-8 px-5 py-8 text-center text-[var(--tq-muted)]">
              Students are answering on their devices…
            </p>
          )}

          <div className="mt-8 flex flex-wrap gap-2">
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
                  Next question
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
                className="tq-pop tq-soft flex items-center justify-between px-5 py-4 text-lg font-bold"
                style={{ animationDelay: `${i * 60}ms` }}
              >
                <span className="flex items-center gap-3">
                  <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-sm">
                    {i + 1}
                  </span>
                  {playerLabel(p, game.settings.allowNicknames)}
                  {(p.streak ?? 0) >= 2 ? (
                    <span className="tq-streak">Streak {p.streak}</span>
                  ) : null}
                </span>
                <span className="tabular-nums text-[var(--tq-accent)]">
                  {p.score}
                </span>
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
          <p className="mt-2 text-[var(--tq-muted)]">{game.quizTitle}</p>
          <div className="mt-10 flex flex-wrap items-end justify-center gap-4">
            {leaders.slice(0, 3).map((p, i) => (
              <div
                key={p.id}
                className={`tq-podium-slot tq-pop ${i === 0 ? "is-first" : ""}`}
                style={{
                  order: i === 0 ? 2 : i === 1 ? 1 : 3,
                  minWidth: i === 0 ? 170 : 140,
                  paddingBottom: i === 0 ? "3.25rem" : "1.75rem",
                  animationDelay: `${i * 90}ms`,
                }}
              >
                <div className="text-3xl font-extrabold">#{i + 1}</div>
                <div className="mt-2 text-lg font-bold">
                  {playerLabel(p, game.settings.allowNicknames)}
                </div>
                <div className="mt-1 text-xl text-[var(--tq-accent)]">
                  {p.score}
                </div>
              </div>
            ))}
          </div>
          {game.phase === "podium" ? (
            <button
              type="button"
              className="tq-btn tq-btn-ghost mt-10"
              onClick={() => void act({ type: "end" })}
            >
              Close
            </button>
          ) : (
            <a
              href="/apps/testquiz/library"
              className="tq-btn tq-btn-primary mt-10 inline-flex no-underline"
            >
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
    <label className="tq-soft flex items-center justify-between gap-2 px-3 py-3 text-sm">
      <span className="font-semibold">{label}</span>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
      />
    </label>
  );
}
