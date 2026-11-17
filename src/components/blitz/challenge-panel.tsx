"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { BlitzBolt, BlitzWordmark, Confetti, Flame } from "@/components/blitz/brand";
import { formatDue } from "@/components/blitz/join-panel";
import { TimerBar, useSecondsLeft } from "@/components/blitz/live-bits";
import {
  PlayerAnswerInput,
  correctAnswerText,
  payloadText,
} from "@/components/blitz/question-views";
import { BlitzStage } from "@/components/blitz/stage";
import { playBlitzSfx } from "@/components/blitz/use-blitz-audio";
import type { ChallengeAnswer, StudentChallengeView } from "@/lib/blitz/challenge";
import { isScoredType } from "@/lib/blitz/scoring";
import {
  BLITZ_TYPE_LABEL,
  type BlitzQuestion,
  type LiveAnswerPayload,
} from "@/lib/blitz/types";

type Feedback = {
  result: ChallengeAnswer & { streak: number };
  revealed: BlitzQuestion;
};

export function BlitzChallengePanel({ challengeId }: { challengeId: string }) {
  const [view, setView] = useState<StudentChallengeView | null>(null);
  const [teacher, setTeacher] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [skew, setSkew] = useState(0);

  const accept = useCallback((v: StudentChallengeView) => {
    setView(v);
    setSkew(v.serverNowMs - Date.now());
  }, []);

  useEffect(() => {
    void (async () => {
      const res = await fetch(`/api/blitz/challenges/${challengeId}`, { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "We couldn’t find this challenge.");
        return;
      }
      if (data.role === "teacher") {
        setTeacher(true);
        return;
      }
      accept(data.view);
    })();
  }, [accept, challengeId]);

  async function begin() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/blitz/challenges/${challengeId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind: "begin" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not start the challenge. Try again.");
      setFeedback(null);
      accept(data.view);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not start the challenge. Try again.");
    } finally {
      setBusy(false);
    }
  }

  const submitting = useRef(false);
  const answer = useCallback(
    async (payload: LiveAnswerPayload) => {
      if (!view?.question || submitting.current) return;
      submitting.current = true;
      setBusy(true);
      setError(null);
      try {
        const res = await fetch(`/api/blitz/challenges/${challengeId}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ kind: "answer", questionId: view.question.id, payload }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Could not submit your answer. Try again.");
        setFeedback({ result: data.result, revealed: data.revealed });
        accept(data.view);
        if (data.result.correct === true) playBlitzSfx("correct");
        else if (data.result.correct === false) playBlitzSfx("wrong", 0.8);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Could not submit your answer. Try again.");
      } finally {
        submitting.current = false;
        setBusy(false);
      }
    },
    [accept, challengeId, view?.question],
  );

  if (teacher) {
    return (
      <BlitzStage>
        <div className="bz-phone">
          <div className="bz-center">
            <BlitzWordmark size="lg" />
            <h1 className="bz-h2">You assigned this challenge</h1>
            <p className="bz-muted">Share this page’s link with your class. Results appear in Reports as students finish.</p>
            <Link href={`/apps/blitz/reports?challenge=${challengeId}`} className="bz-btn bz-btn--primary bz-btn--lg no-underline">
              View results
            </Link>
          </div>
        </div>
      </BlitzStage>
    );
  }

  if (!view) {
    return (
      <BlitzStage>
        <div className="bz-phone">
          <div className="bz-center">
            <BlitzBolt size={64} className="bz-spinner-bolt" />
            <p className="bz-muted">{error ?? "Loading your challenge…"}</p>
            {error ? (
              <Link href="/apps/blitz/join" className="bz-btn bz-btn--primary no-underline">
                Back to Blitz
              </Link>
            ) : null}
          </div>
        </div>
      </BlitzStage>
    );
  }

  const c = view.challenge;
  const tone = feedback
    ? feedback.result.timedOut
      ? "late"
      : feedback.result.correct === true
        ? "correct"
        : feedback.result.correct === false
          ? "wrong"
          : "neutral"
    : null;

  return (
    <BlitzStage theme={c.settings.theme} tone={tone}>
      <div className="bz-phone">
        <div className="bz-phone-top">
          <Link href="/apps/blitz/join" className="bz-btn bz-btn--quiet bz-btn--sm no-underline" style={tone ? { color: "var(--bz-ink)" } : undefined}>
            ← Blitz
          </Link>
          <span className="flex items-center gap-2">
            {view.streak >= 2 ? (
              <span className="bz-streak">
                <Flame size={16} />
                {view.streak}
              </span>
            ) : null}
            <span className="bz-pill" style={tone ? { background: "rgba(255,255,255,.45)", color: "var(--bz-ink)", borderColor: "var(--bz-ink)" } : undefined}>
              {view.score.toLocaleString()} points
            </span>
          </span>
        </div>

        {error ? <p className="bz-alert" role="alert">{error}</p> : null}

        {view.status === "not_started" ? (
          <div className="bz-center">
            <span className="bz-chip bz-chip--cyan">Self-paced challenge</span>
            <h1 className="bz-h1">{c.title}</h1>
            <p className="bz-feedback-sub">
              {c.classroomName} · {view.total} questions · {c.settings.mode === "accuracy" ? "Accuracy scoring" : "Faster answers score more"}
            </p>
            {c.dueAt ? <p className="bz-faint">Due {formatDue(c.dueAt)}</p> : null}
            {c.open ? (
              <button type="button" className="bz-btn bz-btn--primary bz-btn--xl" disabled={busy} onClick={() => void begin()}>
                Start <BlitzBolt size={28} color="var(--bz-sun)" />
              </button>
            ) : (
              <p className="bz-alert">This challenge is closed.</p>
            )}
            <p className="bz-faint">You get one attempt. Each question is timed, and the timer keeps running if you leave the page.</p>
          </div>
        ) : null}

        {view.status !== "not_started" && feedback ? (
          <ChallengeFeedback
            feedback={feedback}
            last={view.status === "finished"}
            busy={busy}
            onNext={() => (view.status === "finished" ? setFeedback(null) : void begin())}
          />
        ) : null}

        {view.status === "in_progress" && !feedback ? (
          view.question && view.questionStartedAtMs ? (
            <ChallengeQuestion
              key={view.question.id}
              view={view}
              skew={skew}
              busy={busy}
              onAnswer={(p) => void answer(p)}
            />
          ) : (
            <div className="bz-center">
              <p className="bz-kicker">
                Question {view.index + 1} of {view.total}
              </p>
              <h1 className="bz-h1">Ready for the next question?</h1>
              <button type="button" className="bz-btn bz-btn--primary bz-btn--xl" disabled={busy} onClick={() => void begin()}>
                Continue
              </button>
            </div>
          )
        ) : null}

        {view.status === "finished" && !feedback ? <ChallengeSummary view={view} /> : null}
      </div>
    </BlitzStage>
  );
}

function ChallengeQuestion({
  view,
  skew,
  busy,
  onAnswer,
}: {
  view: StudentChallengeView;
  skew: number;
  busy: boolean;
  onAnswer: (p: LiveAnswerPayload) => void;
}) {
  const q = view.question!;
  const { left } = useSecondsLeft(view.questionStartedAtMs, q.timeLimitSec, skew);
  const fired = useRef(false);
  useEffect(() => {
    if (left <= 0 && !fired.current) {
      fired.current = true;
      onAnswer({});
    }
  }, [left, onAnswer]);
  return (
    <>
      <TimerBar startedAtMs={view.questionStartedAtMs} limitSec={q.timeLimitSec} skewMs={skew} />
      <div className="flex items-center justify-between gap-2">
        <span className="bz-kicker">
          Question {view.index + 1} of {view.total} · {BLITZ_TYPE_LABEL[q.type]}
        </span>
        <span className="bz-pill">{left}s</span>
      </div>
      <div className="bz-prompt-card bz-prompt-card--sm">{q.prompt}</div>
      {q.mediaUrl && q.type !== "pin_answer" && q.type !== "drop_pin" ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={q.mediaUrl} alt="" style={{ maxHeight: "28dvh", objectFit: "contain", borderRadius: 18, border: "3px solid var(--bz-ink)", background: "var(--bz-paper)" }} />
      ) : null}
      <PlayerAnswerInput question={q} busy={busy} onSubmit={onAnswer} />
    </>
  );
}

function ChallengeFeedback({
  feedback,
  last,
  busy,
  onNext,
}: {
  feedback: Feedback;
  last: boolean;
  busy: boolean;
  onNext: () => void;
}) {
  const r = feedback.result;
  const right = correctAnswerText(feedback.revealed);
  const title = r.timedOut
    ? "Time’s up"
    : r.correct === true
      ? "Correct!"
      : r.correct === false
        ? "Not quite"
        : "Answer received";
  return (
    <div className={`bz-center ${r.correct === false && !r.timedOut ? "bz-shake" : ""}`}>
      <h1 className="bz-feedback-title">{title}</h1>
      {r.points > 0 ? <span className="bz-points">+{r.points.toLocaleString()}</span> : null}
      {r.streakBonus ? (
        <span className="bz-chip" style={{ background: "var(--bz-paper)", color: "var(--bz-ink)", borderColor: "var(--bz-ink)" }}>
          <Flame size={16} /> Streak bonus +{r.streakBonus}
        </span>
      ) : null}
      {r.correct !== true && right ? (
        <div className="bz-feedback-card">
          The answer was
          <strong>{right}</strong>
        </div>
      ) : null}
      <button type="button" className="bz-btn bz-btn--paper bz-btn--lg" disabled={busy} onClick={onNext}>
        {last ? "See my results" : "Next question"}
      </button>
    </div>
  );
}

function ChallengeSummary({ view }: { view: StudentChallengeView }) {
  const review = view.review ?? [];
  const scored = review.filter((r) => isScoredType(r.question.type));
  const right = scored.filter((r) => r.answer?.correct === true).length;
  const pct = scored.length ? Math.round((right / scored.length) * 100) : null;
  return (
    <div className="flex flex-col gap-4 pb-6">
      {pct != null && pct >= 70 ? <Confetti pieces={36} /> : null}
      <div className="bz-center" style={{ flex: "none", paddingBottom: 0 }}>
        <p className="bz-kicker">Challenge complete</p>
        <h1 className="bz-feedback-title" style={{ color: "var(--bz-accent)" }}>
          {view.score.toLocaleString()}
        </h1>
        <p className="bz-feedback-sub">
          points{pct != null ? ` · ${right}/${scored.length} correct (${pct}%)` : ""}
        </p>
      </div>
      <ul className="bz-list">
        {review.map(({ question, answer }, i) => (
          <li key={question.id} className="bz-listrow" style={{ alignItems: "flex-start" }}>
            <span className="min-w-0">
              <span className="bz-faint">
                {i + 1}. {BLITZ_TYPE_LABEL[question.type]}
              </span>
              <strong style={{ display: "block", lineHeight: 1.25 }}>{question.prompt}</strong>
              <span className="bz-faint" style={{ display: "block", marginTop: 4 }}>
                Your answer: {answer?.timedOut ? "Ran out of time" : payloadText(question, answer?.payload)}
                {answer?.correct === false && correctAnswerText(question) ? ` · Answer: ${correctAnswerText(question)}` : ""}
              </span>
            </span>
            <span
              className={`bz-chip ${answer?.correct === true ? "bz-chip--lime" : answer?.correct === false ? "bz-chip--coral" : "bz-chip--cyan"}`}
            >
              {answer?.correct === true ? `+${answer.points}` : answer?.correct === false ? "Incorrect" : "Answered"}
            </span>
          </li>
        ))}
      </ul>
      <Link href="/apps/blitz/join" className="bz-btn bz-btn--primary bz-btn--lg no-underline">
        Back to Blitz
      </Link>
    </div>
  );
}
