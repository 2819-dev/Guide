"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import {
  BlitzAvatar,
  BlitzBolt,
  Confetti,
  Flame,
  SpeakerIcon,
} from "@/components/blitz/brand";
import { CountdownNumber, TimerBar, ordinal, playerLabel } from "@/components/blitz/live-bits";
import {
  PlayerAnswerInput,
  correctAnswerText,
} from "@/components/blitz/question-views";
import { BlitzStage } from "@/components/blitz/stage";
import { playBlitzSfx, useBlitzAudio } from "@/components/blitz/use-blitz-audio";
import { useGamePoll } from "@/components/blitz/use-game-poll";
import { gameMode, gameTheme, teamStandings } from "@/lib/blitz/modes";
import { isScoredType } from "@/lib/blitz/scoring";
import {
  BLITZ_TYPE_LABEL,
  type LiveAnswerPayload,
  type LiveGameState,
} from "@/lib/blitz/types";

type Props = { gameId: string; playerId: string };

const LINES = {
  correct: ["Nailed it!", "Zap!", "On fire!", "Brilliant!", "Yes!!"],
  wrong: ["Not quite", "So close", "Shake it off", "Next one’s yours"],
  late: ["Too slow!", "Time’s up!"],
  neutral: ["Got it!", "Noted!", "Thanks!"],
};

function pick(list: string[], n: number) {
  return list[n % list.length]!;
}

export function BlitzPlayPanel({ gameId, playerId }: Props) {
  const { game, setGame, error, skewMs } = useGamePoll(gameId, 900);
  const [busy, setBusy] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const { muted, setMuted } = useBlitzAudio(null);

  const question = game?.questions[game.questionIndex];
  const myAnswer = useMemo(
    () =>
      game && question
        ? game.answers.find((a) => a.playerId === playerId && a.questionId === question.id) ?? null
        : null,
    [game, question, playerId],
  );
  const me = game?.players.find((p) => p.id === playerId);

  // Sound on reveal
  const lastRevealed = useRef<string | null>(null);
  useEffect(() => {
    if (!game || !question || game.phase !== "reveal") return;
    if (lastRevealed.current === question.id) return;
    lastRevealed.current = question.id;
    if (myAnswer?.correct === true) playBlitzSfx("correct");
    else if (myAnswer?.correct === false || (!myAnswer && isScoredType(question.type))) playBlitzSfx("wrong", 0.8);
  }, [game, question, myAnswer]);

  async function submit(payload: LiveAnswerPayload) {
    if (busy || myAnswer) return;
    setBusy(true);
    setSubmitError(null);
    try {
      const res = await fetch(`/api/blitz/games/${gameId}/action`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind: "answer", payload }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not submit");
      if (data.game) setGame(data.game);
    } catch (e) {
      setSubmitError(e instanceof Error ? e.message : "Submit failed");
    } finally {
      setBusy(false);
    }
  }

  if (!game) {
    return (
      <BlitzStage>
        <div className="bz-center">
          <BlitzBolt size={64} className="bz-spinner-bolt" />
          <p className="bz-muted">{error ?? "Joining…"}</p>
          {error ? (
            <Link href="/apps/blitz/join" className="bz-btn bz-btn--primary no-underline">
              Back to join
            </Link>
          ) : null}
        </div>
      </BlitzStage>
    );
  }

  const theme = gameTheme(game.settings);

  if (me?.kicked) {
    return (
      <BlitzStage theme={theme}>
        <div className="bz-phone">
          <div className="bz-center">
            <h1 className="bz-h1">You’re out of this one</h1>
            <p className="bz-muted">The host removed you from the game.</p>
            <Link href="/apps/blitz/join" className="bz-btn bz-btn--primary no-underline">
              Join another game
            </Link>
          </div>
        </div>
      </BlitzStage>
    );
  }

  const ranked = [...game.players].filter((p) => !p.kicked).sort((a, b) => b.score - a.score);
  const myRank = ranked.findIndex((p) => p.id === playerId) + 1;
  const ahead = myRank > 1 ? ranked[myRank - 2] : null;
  const team = me?.teamId ? game.teams?.find((t) => t.id === me.teamId) : null;
  const name = me ? playerLabel(me, game.settings.allowNicknames) : "You";

  let tone: "correct" | "wrong" | "neutral" | "late" | null = null;
  if (game.phase === "reveal" && question) {
    if (!myAnswer) tone = isScoredType(question.type) ? "late" : "neutral";
    else if (myAnswer.correct === true) tone = "correct";
    else if (myAnswer.correct === false) tone = "wrong";
    else tone = "neutral";
  }

  return (
    <BlitzStage theme={theme} tone={tone}>
      <div className="bz-phone">
        <div className="bz-phone-top">
          <span className="bz-scorechip">
            {game.settings.allowAvatars ? <BlitzAvatar id={me?.avatarId} seed={playerId} size={30} /> : null}
            <span>{name}</span>
          </span>
          <span className="flex items-center gap-2">
            {(me?.streak ?? 0) >= 2 ? (
              <span className="bz-streak">
                <Flame size={16} />
                {me?.streak}
              </span>
            ) : null}
            <span className="bz-pill" style={tone ? { background: "rgba(255,255,255,.45)", color: "var(--bz-ink)", borderColor: "var(--bz-ink)" } : undefined}>
              {(me?.score ?? 0).toLocaleString()}
            </span>
            <button
              type="button"
              className="bz-iconbtn"
              style={{ width: 38, height: 38 }}
              aria-pressed={muted}
              aria-label={muted ? "Unmute sounds" : "Mute sounds"}
              onClick={() => setMuted(!muted)}
            >
              <SpeakerIcon off={muted} />
            </button>
          </span>
        </div>

        {game.phase === "lobby" ? (
          <div className="bz-center">
            <div className="bz-bigavatar">
              <BlitzAvatar id={me?.avatarId} seed={playerId} size={150} />
            </div>
            <h1 className="bz-h1">You’re in!</h1>
            <p className="bz-feedback-sub">
              Look for <strong>{name}</strong> on the big screen.
            </p>
            {team ? (
              <span className="bz-chip" style={{ background: team.color, color: "var(--bz-ink)", borderColor: "var(--bz-ink)" }}>
                You’re on {team.name}
              </span>
            ) : null}
            <p className="bz-faint">
              {game.players.filter((p) => !p.kicked).length} players · {game.questions.length} questions ·{" "}
              {gameMode(game.settings) === "accuracy" ? "Accuracy mode" : gameMode(game.settings) === "team" ? "Team battle" : "Classic"}
            </p>
          </div>
        ) : null}

        {game.phase === "countdown" && question ? (
          <div className="bz-center">
            <span className="bz-pill bz-pill--accent">
              Question {game.questionIndex + 1} · {BLITZ_TYPE_LABEL[question.type]}
            </span>
            <CountdownNumber phaseStartedAtMs={game.phaseStartedAtMs} />
            <p className="bz-feedback-sub">{question.prompt}</p>
          </div>
        ) : null}

        {game.phase === "question" && question ? (
          myAnswer ? (
            <div className="bz-center">
              <BlitzBolt size={96} className="bz-spinner-bolt" />
              <h1 className="bz-h1">Locked in!</h1>
              <p className="bz-feedback-sub">
                {myAnswer.responseMs < question.timeLimitSec * 300 ? "Lightning fingers. " : ""}
                Eyes on the big screen…
              </p>
            </div>
          ) : (
            <>
              <TimerBar startedAtMs={game.questionStartedAtMs} limitSec={question.timeLimitSec} skewMs={skewMs} />
              <div className="flex items-center justify-between gap-2">
                <span className="bz-kicker">
                  {game.questionIndex + 1}/{game.questions.length} · {BLITZ_TYPE_LABEL[question.type]}
                </span>
                {question.points === 2000 ? <span className="bz-chip bz-chip--sun">Double points</span> : null}
              </div>
              <div className="bz-prompt-card bz-prompt-card--sm">{question.prompt}</div>
              {submitError ? <p className="bz-alert">{submitError}</p> : null}
              <PlayerAnswerInput key={question.id} question={question} busy={busy} onSubmit={(p) => void submit(p)} />
            </>
          )
        ) : null}

        {game.phase === "lock" ? (
          <div className="bz-center">
            <BlitzBolt size={80} className="bz-spinner-bolt" />
            <h1 className="bz-h1">Pencils down</h1>
            <p className="bz-feedback-sub">Results coming up…</p>
          </div>
        ) : null}

        {game.phase === "reveal" && question ? (
          <RevealCard game={game} tone={tone!} myRank={myRank} aheadName={ahead ? playerLabel(ahead, game.settings.allowNicknames) : null} aheadGap={ahead && me ? ahead.score - me.score : 0} />
        ) : null}

        {game.phase === "leaderboard" ? (
          <div className="bz-center">
            <p className="bz-kicker">You’re in</p>
            <p className="bz-feedback-title" style={{ color: "var(--bz-accent)" }}>
              {ordinal(myRank)}
            </p>
            <p className="bz-feedback-sub">
              {ahead && me ? (
                <>
                  {(ahead.score - me.score).toLocaleString()} pts behind <strong>{playerLabel(ahead, game.settings.allowNicknames)}</strong>
                </>
              ) : (
                "Top of the board. Hold on to it!"
              )}
            </p>
            {team ? <TeamLine game={game} teamId={team.id} /> : null}
          </div>
        ) : null}

        {game.phase === "podium" || game.phase === "ended" ? (
          <FinalCard game={game} playerId={playerId} myRank={myRank} />
        ) : null}
      </div>
    </BlitzStage>
  );
}

function RevealCard({
  game,
  tone,
  myRank,
  aheadName,
  aheadGap,
}: {
  game: LiveGameState;
  tone: "correct" | "wrong" | "neutral" | "late";
  myRank: number;
  aheadName: string | null;
  aheadGap: number;
}) {
  const question = game.questions[game.questionIndex]!;
  const mine = game.answers.find((a) => a.questionId === question.id);
  const right = correctAnswerText(question);
  const n = game.questionIndex;
  const title =
    tone === "correct"
      ? pick(LINES.correct, n)
      : tone === "wrong"
        ? pick(LINES.wrong, n)
        : tone === "late"
          ? pick(LINES.late, n)
          : pick(LINES.neutral, n);
  return (
    <div className={`bz-center ${tone === "wrong" ? "bz-shake" : ""}`}>
      <FeedbackGlyph tone={tone} />
      <h1 className="bz-feedback-title">{title}</h1>
      {mine && mine.pointsAwarded > 0 ? (
        <span className="bz-points">+{mine.pointsAwarded.toLocaleString()}</span>
      ) : null}
      {mine?.streakBonus ? (
        <span className="bz-chip" style={{ background: "var(--bz-paper)", color: "var(--bz-ink)", borderColor: "var(--bz-ink)" }}>
          <Flame size={16} /> Streak bonus +{mine.streakBonus}
        </span>
      ) : null}
      {(tone === "wrong" || tone === "late") && right ? (
        <div className="bz-feedback-card">
          The answer was
          <strong>{right}</strong>
        </div>
      ) : null}
      {isScoredType(question.type) ? (
        <p className="bz-rankline">
          {ordinal(myRank)} place
          {aheadName ? (
            <span style={{ display: "block", fontSize: "0.85rem", fontWeight: 700, opacity: 0.8 }}>
              {aheadGap.toLocaleString()} behind {aheadName}
            </span>
          ) : null}
        </p>
      ) : null}
    </div>
  );
}

function FeedbackGlyph({ tone }: { tone: "correct" | "wrong" | "neutral" | "late" }) {
  const common = { width: 120, height: 120, viewBox: "0 0 120 120", "aria-hidden": true } as const;
  if (tone === "correct") {
    return (
      <svg {...common} className="bz-rise">
        <circle cx="60" cy="60" r="52" fill="#fffaf0" stroke="#15123b" strokeWidth="6" />
        <path d="M34 62 52 80 88 40" fill="none" stroke="#15123b" strokeWidth="11" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }
  if (tone === "wrong") {
    return (
      <svg {...common} className="bz-rise">
        <circle cx="60" cy="60" r="52" fill="#fffaf0" stroke="#15123b" strokeWidth="6" />
        <path d="M40 40 80 80M80 40 40 80" stroke="#15123b" strokeWidth="11" strokeLinecap="round" />
      </svg>
    );
  }
  if (tone === "late") {
    return (
      <svg {...common} className="bz-rise">
        <circle cx="60" cy="64" r="46" fill="#fffaf0" stroke="#15123b" strokeWidth="6" />
        <path d="M60 64V38M60 64l16 10" stroke="#15123b" strokeWidth="8" strokeLinecap="round" />
        <path d="M46 10h28" stroke="#15123b" strokeWidth="8" strokeLinecap="round" />
      </svg>
    );
  }
  return <BlitzBolt size={110} color="var(--bz-sun)" />;
}

function TeamLine({ game, teamId }: { game: LiveGameState; teamId: string }) {
  const standings = teamStandings(game.teams, game.players);
  const i = standings.findIndex((t) => t.id === teamId);
  const t = standings[i];
  if (!t) return null;
  return (
    <span className="bz-chip" style={{ background: t.color, color: "var(--bz-ink)", borderColor: "var(--bz-ink)", fontSize: "0.95rem" }}>
      {t.name} is {ordinal(i + 1)} · {t.average.toLocaleString()} avg
    </span>
  );
}

function FinalCard({ game, playerId, myRank }: { game: LiveGameState; playerId: string; myRank: number }) {
  const me = game.players.find((p) => p.id === playerId);
  const mine = game.answers.filter((a) => a.playerId === playerId);
  const scoredIds = new Set(game.questions.filter((q) => isScoredType(q.type)).map((q) => q.id));
  const correct = mine.filter((a) => a.correct === true).length;
  const medal = myRank === 1 ? "var(--bz-sun)" : myRank === 2 ? "var(--bz-cyan)" : myRank === 3 ? "var(--bz-coral)" : "var(--bz-paper)";
  const standings = teamStandings(game.teams, game.players);
  const myTeam = me?.teamId ? standings.find((t) => t.id === me.teamId) : null;
  const teamWon = myTeam && standings[0]?.id === myTeam.id;
  return (
    <div className="bz-center">
      {myRank > 0 && myRank <= 3 ? <Confetti pieces={40} /> : null}
      <p className="bz-kicker">Final rank</p>
      <div
        className="bz-rise"
        style={{
          display: "grid",
          placeItems: "center",
          width: 170,
          height: 170,
          borderRadius: "50%",
          background: medal,
          color: "var(--bz-ink)",
          border: "5px solid var(--bz-ink)",
          boxShadow: "0 8px 0 var(--bz-ink-deep)",
          fontFamily: "var(--bz-display)",
          fontWeight: 800,
          fontStretch: "75%",
          fontSize: "4.4rem",
          lineHeight: 1,
          "--rot": "-4deg",
        } as CSSProperties}
      >
        {ordinal(myRank || 0)}
      </div>
      <p className="bz-feedback-sub">
        <strong style={{ fontSize: "1.5rem" }}>{(me?.score ?? 0).toLocaleString()}</strong> points
        {scoredIds.size ? (
          <>
            {" "}· {correct}/{scoredIds.size} correct
          </>
        ) : null}
      </p>
      {myTeam ? (
        <span className="bz-chip" style={{ background: myTeam.color, color: "var(--bz-ink)", borderColor: "var(--bz-ink)", fontSize: "1rem" }}>
          {teamWon ? `${myTeam.name} wins!` : `${myTeam.name} finished ${ordinal(standings.findIndex((t) => t.id === myTeam.id) + 1)}`}
        </span>
      ) : null}
      <Link href="/apps/blitz/join" className="bz-btn bz-btn--primary bz-btn--lg no-underline">
        Play another
      </Link>
    </div>
  );
}
