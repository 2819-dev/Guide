"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import {
  BlitzAvatar,
  BlitzBolt,
  BlitzWordmark,
  Confetti,
  Flame,
  Sparkle,
  SpeakerIcon,
} from "@/components/blitz/brand";
import {
  CountdownNumber,
  JoinQr,
  TimerRing,
  playerLabel,
} from "@/components/blitz/live-bits";
import {
  ChoiceBoard,
  HostResults,
  RevealBars,
  isChoiceType,
} from "@/components/blitz/question-views";
import { BlitzStage } from "@/components/blitz/stage";
import { playBlitzSfx, useBlitzAudio } from "@/components/blitz/use-blitz-audio";
import { useGamePoll } from "@/components/blitz/use-game-poll";
import { musicForPhase } from "@/lib/blitz/audio";
import {
  BLITZ_MODES,
  BLITZ_THEMES,
  gameMode,
  gameTheme,
  hasPremiumPlay,
  teamStandings,
} from "@/lib/blitz/modes";
import type { BlitzPlanId } from "@/lib/blitz/plans";
import { isScoredType } from "@/lib/blitz/scoring";
import {
  BLITZ_TYPE_LABEL,
  type BlitzThemeId,
  type LiveGameState,
  type PlayerPublic,
} from "@/lib/blitz/types";

type Props = { gameId: string };

export function BlitzHostPanel({ gameId }: Props) {
  const { game, setGame, error, refresh, skewMs } = useGamePoll(gameId, 1000);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [planId, setPlanId] = useState<string>("free");
  const [planMusic, setPlanMusic] = useState(false);

  useEffect(() => {
    void fetch("/api/blitz/entitlements")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d?.plan) {
          setPlanId(d.plan.id ?? "free");
          setPlanMusic(!!d.plan.music);
        }
      })
      .catch(() => undefined);
  }, []);

  const music = game && game.settings.musicEnabled ? musicForPhase(game.phase) : null;
  const { muted, setMuted, blocked } = useBlitzAudio(music);

  const act = useCallback(
    async (action: Record<string, unknown>, kind: "host" | "settings" = "host") => {
      setBusy(true);
      setMsg(null);
      try {
        const res = await fetch(`/api/blitz/games/${gameId}/action`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(
            kind === "settings" ? { kind: "settings", settings: action } : { kind: "host", action },
          ),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Action failed");
        setGame(data.game);
        void refresh();
      } catch (e) {
        setMsg(e instanceof Error ? e.message : "Action failed");
      } finally {
        setBusy(false);
      }
    },
    [gameId, refresh, setGame],
  );

  const activePlayers = useMemo(
    () => (game ? game.players.filter((p) => !p.kicked) : []),
    [game],
  );

  // --- sound cues
  const prevCount = useRef(0);
  const prevPhase = useRef<string | null>(null);
  useEffect(() => {
    if (!game) return;
    if (game.phase === "lobby" && activePlayers.length > prevCount.current && prevCount.current > 0) {
      playBlitzSfx("join", 0.7);
    }
    prevCount.current = activePlayers.length;
  }, [activePlayers.length, game]);
  useEffect(() => {
    if (!game) return;
    if (prevPhase.current && prevPhase.current !== game.phase) {
      if (game.phase === "reveal") playBlitzSfx("reveal", 0.9);
      if (game.phase === "question") playBlitzSfx("go", 0.6);
    }
    prevPhase.current = game.phase;
  }, [game]);

  // --- keyboard: space / enter / → advances
  const advanceLabel = game ? nextLabel(game) : null;
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "SELECT" || tag === "TEXTAREA" || tag === "BUTTON") return;
      if (e.key === " " || e.key === "Enter" || e.key === "ArrowRight") {
        if (!game || busy || !advanceLabel) return;
        if (game.phase === "lobby" && activePlayers.length === 0) return;
        e.preventDefault();
        void act({ type: "advance" });
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [act, activePlayers.length, advanceLabel, busy, game]);

  if (!game) {
    return (
      <BlitzStage>
        <div className="bz-center">
          <BlitzBolt size={64} className="bz-spinner-bolt" />
          <p className="bz-muted">{error ?? "Warming up the stage…"}</p>
        </div>
      </BlitzStage>
    );
  }

  const theme = gameTheme(game.settings);
  const mode = gameMode(game.settings);
  const question = game.questions[game.questionIndex];
  const premium = hasPremiumPlay({ id: planId as BlitzPlanId });
  const modeInfo = BLITZ_MODES.find((m) => m.id === mode);

  return (
    <BlitzStage theme={theme}>
      <header className="bz-topbar">
        <div className="bz-topbar-group">
          <BlitzWordmark size="sm" />
          <span className="bz-title-trunc hidden sm:inline">{game.quizTitle}</span>
        </div>
        <div className="bz-topbar-group">
          {game.phase !== "lobby" && game.phase !== "podium" && game.phase !== "ended" ? (
            <span className="bz-pill">
              {game.questionIndex + 1} / {game.questions.length}
            </span>
          ) : null}
          <span className="bz-pill hidden md:inline-flex">{modeInfo?.label ?? "Classic"}</span>
          <button
            type="button"
            className="bz-iconbtn"
            aria-pressed={muted}
            aria-label={muted ? "Unmute sound" : "Mute sound"}
            title={
              !planMusic
                ? "Sound effects only — music is a Plus feature"
                : muted
                  ? "Unmute"
                  : "Mute"
            }
            onClick={() => setMuted(!muted)}
          >
            <SpeakerIcon off={muted} />
          </button>
          {game.phase !== "ended" ? (
            <button
              type="button"
              className="bz-btn bz-btn--danger bz-btn--sm"
              disabled={busy}
              onClick={() => {
                if (window.confirm("End this game for everyone?")) void act({ type: "end" });
              }}
            >
              End
            </button>
          ) : null}
        </div>
      </header>

      {msg ? (
        <div className="px-4 sm:px-7">
          <p className="bz-alert" role="alert">
            {msg}
            {/plan|Plus|Ultra/i.test(msg) ? (
              <Link href="/apps/blitz/upgrade" style={{ color: "var(--bz-sun)", marginLeft: 6 }}>
                See plans →
              </Link>
            ) : null}
          </p>
        </div>
      ) : null}

      {game.phase === "lobby" ? (
        <HostLobby
          game={game}
          players={activePlayers}
          busy={busy}
          premium={premium}
          planMusic={planMusic}
          onKick={(id) => void act({ type: "kick", playerId: id })}
          onSettings={(patch) => void act(patch, "settings")}
          onShuffle={() => void act({ type: "shuffle_teams" })}
        />
      ) : null}

      {game.phase === "countdown" && question ? (
        <div className="bz-hq">
          <div className="bz-center">
            <span className="bz-pill bz-pill--accent">
              {BLITZ_TYPE_LABEL[question.type]}
              {question.points === 2000 ? " · Double points" : ""}
            </span>
            <CountdownNumber phaseStartedAtMs={game.phaseStartedAtMs} sound />
            <div className="bz-prompt-card" style={{ maxWidth: 1100, width: "100%" }}>
              <span className="bz-prompt-tape" aria-hidden />
              {question.prompt}
            </div>
          </div>
        </div>
      ) : null}

      {(game.phase === "question" || game.phase === "lock" || game.phase === "reveal") && question ? (
        <HostQuestionView game={game} players={activePlayers} skewMs={skewMs} />
      ) : null}

      {game.phase === "leaderboard" ? <HostLeaderboard game={game} players={activePlayers} /> : null}

      {game.phase === "podium" || game.phase === "ended" ? (
        <HostPodium game={game} players={activePlayers} />
      ) : null}

      {/* Dock: one big "next" button, always in the same place */}
      {game.phase !== "lobby" ? (
        <div className="bz-dock">
          <div className="bz-dock-group">
            {game.phase === "question" ? (
              <span className="bz-pill">
                Space = show results
              </span>
            ) : null}
          </div>
          <div className="bz-dock-group">
            {game.phase === "ended" ? (
              <>
                <Link href="/apps/blitz/reports" className="bz-btn bz-btn--lg no-underline">
                  View report
                </Link>
                <Link href="/apps/blitz/library" className="bz-btn bz-btn--primary bz-btn--lg no-underline">
                  Back to library
                </Link>
              </>
            ) : advanceLabel ? (
              <button
                type="button"
                className="bz-btn bz-btn--accent bz-btn--lg"
                disabled={busy}
                onClick={() => void act({ type: "advance" })}
              >
                {advanceLabel} <span aria-hidden>→</span>
              </button>
            ) : null}
          </div>
        </div>
      ) : (
        <div className="bz-dock">
          <div className="bz-dock-group">
            <span className="bz-pill">
              {game.questions.length} questions · {modeInfo?.label}
            </span>
          </div>
          <div className="bz-dock-group">
            <button
              type="button"
              className="bz-btn bz-btn--accent bz-btn--xl"
              disabled={busy || activePlayers.length === 0}
              onClick={() => void act({ type: "advance" })}
            >
              {activePlayers.length === 0 ? "Waiting for players…" : "Start Blitz"}
              {activePlayers.length > 0 ? <BlitzBolt size={30} color="var(--bz-sun)" /> : null}
            </button>
          </div>
        </div>
      )}

      {blocked ? (
        <button type="button" className="bz-btn bz-btn--paper bz-soundgate">
          Tap anywhere to turn the sound on
        </button>
      ) : null}
      {game.planWatermark ? (
        <div className="bz-watermark">
          <BlitzBolt size={14} /> Blitz Free
        </div>
      ) : null}
    </BlitzStage>
  );
}

function nextLabel(game: LiveGameState): string | null {
  const q = game.questions[game.questionIndex];
  const last = game.questionIndex >= game.questions.length - 1;
  switch (game.phase) {
    case "lobby":
      return "Start";
    case "countdown":
    case "question":
    case "lock":
      return "Show results";
    case "reveal":
      if (last) return "Final podium";
      return q && isScoredType(q.type) ? "Leaderboard" : "Next question";
    case "leaderboard":
      return "Next question";
    case "podium":
      return "Finish game";
    default:
      return null;
  }
}

/* ------------------------------------------------------------------ lobby */

function HostLobby({
  game,
  players,
  busy,
  premium,
  planMusic,
  onKick,
  onSettings,
  onShuffle,
}: {
  game: LiveGameState;
  players: PlayerPublic[];
  busy: boolean;
  premium: boolean;
  planMusic: boolean;
  onKick: (id: string) => void;
  onSettings: (patch: Record<string, unknown>) => void;
  onShuffle: () => void;
}) {
  const [host, setHost] = useState("");
  useEffect(() => setHost(window.location.host), []);
  const mode = gameMode(game.settings);
  const theme = gameTheme(game.settings);
  const teams = game.teams ?? [];

  return (
    <div className="bz-lobby">
      <div className="flex flex-col gap-5">
        <div className="bz-joinbox">
          <div className="bz-joinbox-row">
            <div className="min-w-0">
              <p className="bz-joinurl">
                Join at <strong>{host || "guide"}/apps/blitz/join</strong>
                <br />
                <span className="bz-sub">
                  or open Blitz from My apps
                </span>
              </p>
              <p className="bz-kicker" style={{ marginTop: "1.1rem" }}>
                Game PIN
              </p>
              <div className="bz-pin-digits" aria-label={`Game PIN ${game.pin}`}>
                {game.pin.split("").map((d, i) => (
                  <span key={i} className="bz-key" style={{ "--k": i } as CSSProperties}>
                    {d}
                  </span>
                ))}
              </div>
            </div>
            <JoinQr pin={game.pin} size={150} />
          </div>
        </div>

        <div className="bz-card bz-card--pad">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="bz-kicker">Stage theme</p>
            {!premium ? (
              <Link href="/apps/blitz/upgrade" className="bz-faint" style={{ color: "var(--bz-sun)" }}>
                More themes with Plus →
              </Link>
            ) : null}
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {BLITZ_THEMES.map((t) => {
              const locked = t.premium && !premium;
              return (
                <button
                  key={t.id}
                  type="button"
                  className="bz-filter"
                  aria-pressed={theme === t.id}
                  disabled={busy || locked}
                  title={locked ? "Plus theme" : t.blurb}
                  onClick={() => onSettings({ theme: t.id as BlitzThemeId })}
                  style={{ opacity: locked ? 0.5 : 1 }}
                >
                  <span
                    aria-hidden
                    style={{
                      display: "inline-block",
                      width: 12,
                      height: 12,
                      borderRadius: 4,
                      marginRight: 6,
                      background: `linear-gradient(135deg, ${t.swatch[0]}, ${t.swatch[1]} 60%, ${t.swatch[2]})`,
                      border: "1.5px solid #07061a",
                      verticalAlign: "-1px",
                    }}
                  />
                  {t.label}
                </button>
              );
            })}
          </div>
          <div className="mt-4 flex flex-wrap gap-x-6 gap-y-3">
            <Switch label="Nicknames" checked={game.settings.allowNicknames} disabled={busy} onChange={(v) => onSettings({ allowNicknames: v })} />
            <Switch label="Critter avatars" checked={game.settings.allowAvatars} disabled={busy} onChange={(v) => onSettings({ allowAvatars: v })} />
            <Switch
              label={planMusic ? "Music" : "Music (Plus)"}
              checked={game.settings.musicEnabled}
              disabled={busy || !planMusic}
              onChange={(v) => onSettings({ musicEnabled: v })}
            />
          </div>
          {mode === "team" ? (
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <span className="bz-label" style={{ margin: 0 }}>
                Teams
              </span>
              <div className="bz-seg">
                {[2, 3, 4].map((n) => (
                  <button
                    key={n}
                    type="button"
                    aria-pressed={(game.settings.teamCount ?? 2) === n}
                    disabled={busy}
                    onClick={() => onSettings({ teamCount: n })}
                  >
                    {n}
                  </button>
                ))}
              </div>
              <button type="button" className="bz-btn bz-btn--sm" disabled={busy} onClick={onShuffle}>
                Shuffle teams
              </button>
            </div>
          ) : null}
        </div>
      </div>

      <div className="bz-lobby-side">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div className="bz-lobby-count">
            <b>{players.length}</b>
            <span>{players.length === 1 ? "player" : "players"} in</span>
          </div>
          <span className="bz-pill">{game.quizTitle}</span>
        </div>
        {mode === "team" && teams.length ? (
          <div className="bz-crowd-teams">
            {teams.map((t) => {
              const members = players.filter((p) => p.teamId === t.id);
              return (
                <div key={t.id} className="bz-team-col" style={{ "--team": t.color } as CSSProperties}>
                  <h3>
                    {t.name} <span className="bz-chip">{members.length}</span>
                  </h3>
                  <div className="bz-crowd">
                    {members.map((p, i) => (
                      <PlayerChip key={p.id} p={p} i={i} game={game} onKick={onKick} />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        ) : players.length === 0 ? (
          <div className="bz-crowd bz-crowd--empty">
            <div>
              <Sparkle className="mx-auto mb-2" style={{ width: 36, height: 36, color: "var(--bz-accent)" }} />
              Players pop up here as they join.
              <br />
              <span className="bz-faint">Start whenever you’re ready.</span>
            </div>
          </div>
        ) : (
          <div className="bz-crowd">
            {players.map((p, i) => (
              <PlayerChip key={p.id} p={p} i={i} game={game} onKick={onKick} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function PlayerChip({
  p,
  i,
  game,
  onKick,
}: {
  p: PlayerPublic;
  i: number;
  game: LiveGameState;
  onKick: (id: string) => void;
}) {
  const name = playerLabel(p, game.settings.allowNicknames);
  return (
    <span className="bz-player" style={{ "--r": `${((i * 47) % 7) - 3}deg` } as CSSProperties}>
      {game.settings.allowAvatars ? <BlitzAvatar id={p.avatarId} seed={p.id} size={34} /> : null}
      {name}
      <button type="button" aria-label={`Remove ${name}`} title="Remove" onClick={() => onKick(p.id)}>
        ✕
      </button>
    </span>
  );
}

function Switch({
  label,
  checked,
  disabled,
  onChange,
}: {
  label: string;
  checked: boolean;
  disabled?: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="bz-switch">
      <input type="checkbox" checked={checked} disabled={disabled} onChange={(e) => onChange(e.target.checked)} />
      <span className="bz-switch-track" aria-hidden />
      {label}
    </label>
  );
}

/* ------------------------------------------------------------------ question */

function HostQuestionView({
  game,
  players,
  skewMs,
}: {
  game: LiveGameState;
  players: PlayerPublic[];
  skewMs: number;
}) {
  const question = game.questions[game.questionIndex]!;
  const answers = game.answers.filter((a) => a.questionId === question.id);
  const reveal = game.phase === "reveal";
  const choice = isChoiceType(question.type);
  const graded = answers.filter((a) => a.correct !== null);
  const right = graded.filter((a) => a.correct).length;

  return (
    <div className="bz-hq">
      <div className="bz-prompt-card" key={question.id}>
        <span className="bz-prompt-tape" aria-hidden />
        {question.prompt || BLITZ_TYPE_LABEL[question.type]}
      </div>

      <div className="bz-hq-mid">
        <div>
          {game.phase === "question" ? (
            <TimerRing startedAtMs={game.questionStartedAtMs} limitSec={question.timeLimitSec} size={128} tick skewMs={skewMs} />
          ) : (
            <div className="bz-answered" style={{ width: 128, height: 128 }}>
              <div>
                {reveal && isScoredType(question.type) && graded.length ? (
                  <>
                    <b>{Math.round((right / graded.length) * 100)}%</b>
                    got it
                  </>
                ) : (
                  <>
                    <b>{answers.length}</b>
                    answers
                  </>
                )}
              </div>
            </div>
          )}
        </div>
        <div className="bz-hq-media">
          {reveal && choice ? (
            <RevealBars question={question} answers={answers} />
          ) : question.mediaUrl && choice ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={question.mediaUrl} alt="" />
          ) : !choice && !reveal && answers.length === 0 && question.type !== "pin_answer" && question.type !== "drop_pin" ? (
            <div className="bz-type-art">
              <Sparkle />
              <span>{typeHint(question.type)}</span>
            </div>
          ) : null}
        </div>
        <div className="bz-answered">
          <div>
            <b>
              {answers.length}
              <span style={{ fontSize: "0.5em", color: "var(--bz-muted)" }}>/{players.length}</span>
            </b>
            answered
          </div>
        </div>
      </div>

      {choice ? (
        <ChoiceBoard question={question} reveal={reveal} answers={answers} size={question.type === "true_false" ? "xl" : "lg"} />
      ) : (
        <HostResults question={question} answers={answers} reveal={reveal} />
      )}
    </div>
  );
}

function typeHint(type: string): string {
  switch (type) {
    case "type_answer":
      return "Type the answer on your device";
    case "word_cloud":
      return "Send a word — watch the cloud grow";
    case "brainstorm":
      return "Throw your ideas in";
    case "open_ended":
      return "Share your thinking";
    case "slider":
      return "Slide to your best guess";
    case "scale":
    case "nps_scale":
      return "Pick a number on your device";
    case "puzzle":
      return "Put the blocks in order";
    default:
      return "Answer on your device";
  }
}

/* ------------------------------------------------------------------ leaderboard */

function roundPoints(game: LiveGameState): Map<string, number> {
  const q = game.questions[game.questionIndex];
  const m = new Map<string, number>();
  if (!q) return m;
  for (const a of game.answers) if (a.questionId === q.id) m.set(a.playerId, a.pointsAwarded);
  return m;
}

function HostLeaderboard({ game, players }: { game: LiveGameState; players: PlayerPublic[] }) {
  const pts = roundPoints(game);
  const ranked = [...players].sort((a, b) => b.score - a.score);
  const before = [...players].sort(
    (a, b) => b.score - (pts.get(b.id) ?? 0) - (a.score - (pts.get(a.id) ?? 0)),
  );
  const prevRank = new Map(before.map((p, i) => [p.id, i]));
  const mode = gameMode(game.settings);
  const standings = teamStandings(game.teams, game.players);
  const topTeam = Math.max(1, ...standings.map((t) => t.average));
  const teamOf = new Map((game.teams ?? []).map((t) => [t.id, t]));

  return (
    <div className="bz-hq">
      <div className="bz-center" style={{ flex: "none", padding: "0.5rem 0 0" }}>
        <h2 className="bz-h1">{mode === "team" ? "Team standings" : "Leaderboard"}</h2>
      </div>
      {mode === "team" && standings.length ? (
        <div className="bz-teambars">
          {standings.map((t, i) => (
            <div key={t.id} className="bz-teambar" style={{ "--team": t.color } as CSSProperties}>
              <span style={{ color: t.color }}>
                {i + 1}. {t.name}
              </span>
              <div className="bz-teambar-track">
                <div className="bz-teambar-fill" style={{ "--w": t.average / topTeam } as CSSProperties} />
              </div>
              <span>{t.average.toLocaleString()}</span>
            </div>
          ))}
          <p className="bz-faint" style={{ textAlign: "center" }}>
            Team score = average points per player
          </p>
        </div>
      ) : null}
      <div className="bz-lb">
        {ranked.slice(0, mode === "team" ? 3 : 5).map((p, i) => {
          const moved = (prevRank.get(p.id) ?? i) - i;
          const team = p.teamId ? teamOf.get(p.teamId) : null;
          return (
            <div key={p.id} className={`bz-lb-row ${i === 0 ? "is-first" : ""}`} style={{ "--n": i } as CSSProperties}>
              <span className="bz-lb-rank">{i + 1}</span>
              <BlitzAvatar id={p.avatarId} seed={p.id} size={46} />
              <span className="bz-lb-name">
                {playerLabel(p, game.settings.allowNicknames)}{" "}
                {(p.streak ?? 0) >= 2 ? (
                  <span className="bz-streak">
                    <Flame size={16} />
                    {p.streak}
                  </span>
                ) : null}
                <small>
                  {team ? <span style={{ color: team.color }}>{team.name} · </span> : null}
                  {moved > 0 ? <span className="bz-move">▲ {moved}</span> : moved < 0 ? <span className="bz-move is-down">▼ {-moved}</span> : "holding steady"}
                </small>
              </span>
              <span className="bz-lb-score">
                {(pts.get(p.id) ?? 0) > 0 ? <span className="bz-delta">+{pts.get(p.id)}</span> : null}
                {p.score.toLocaleString()}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ podium */

function Crown() {
  return (
    <svg viewBox="0 0 54 36" className="bz-crown" aria-hidden>
      <path d="M4 30 2 8l13 10L27 2l12 16L52 8l-2 22Z" fill="currentColor" stroke="#15123b" strokeWidth="3" strokeLinejoin="round" />
      <circle cx="27" cy="22" r="3.5" fill="#ff6166" stroke="#15123b" strokeWidth="2" />
    </svg>
  );
}

function HostPodium({ game, players }: { game: LiveGameState; players: PlayerPublic[] }) {
  const ranked = [...players].sort((a, b) => b.score - a.score);
  const top = ranked.slice(0, 3);
  const mode = gameMode(game.settings);
  const standings = teamStandings(game.teams, game.players);
  const winner = mode === "team" ? standings[0] : null;

  return (
    <div className="bz-hq">
      <Confetti />
      <div className="bz-center" style={{ flex: "none", padding: "0.25rem 0 0", gap: "0.5rem" }}>
        {winner ? (
          <>
            <p className="bz-kicker">Winning team</p>
            <h2 className="bz-h1" style={{ color: winner.color }}>
              {winner.name}
            </h2>
            <p className="bz-muted">
              {winner.average.toLocaleString()} avg points · {winner.members} {winner.members === 1 ? "player" : "players"}
            </p>
          </>
        ) : (
          <h2 className="bz-h1">
            {!game.questions.some((q) => isScoredType(q.type))
              ? "That’s a wrap — thanks, everyone!"
              : game.phase === "ended"
                ? "Final results"
                : "And the winner is…"}
          </h2>
        )}
      </div>
      <div className="bz-podium">
        {top.map((p, i) => (
          <div key={p.id} className={`bz-step bz-step--${i + 1}`}>
            <div className="bz-step-who">
              {i === 0 ? <Crown /> : null}
              <BlitzAvatar id={p.avatarId} seed={p.id} size={i === 0 ? 96 : 76} />
              <span className="bz-step-name">{playerLabel(p, game.settings.allowNicknames)}</span>
              <span className="bz-step-score">{p.score.toLocaleString()} pts</span>
            </div>
            <div className="bz-step-block">{i + 1}</div>
          </div>
        ))}
      </div>
      {ranked.length > 3 ? (
        <p className="bz-faint" style={{ textAlign: "center" }}>
          Everyone else: {ranked.slice(3, 12).map((p) => playerLabel(p, game.settings.allowNicknames)).join(" · ")}
          {ranked.length > 12 ? " …" : ""}
        </p>
      ) : null}
    </div>
  );
}
