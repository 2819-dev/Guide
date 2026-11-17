"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { BLITZ_TYPE_LABEL, type BlitzQuestionType } from "@/lib/blitz/types";

type GameRow = {
  id: string;
  pin: string;
  quizTitle: string;
  phase: string;
  playerCount: number;
  mode?: string;
  questionCount?: number;
  createdAt: string;
  endedAt: string | null;
};

type GameDetail = {
  game: { id: string; title: string; pin: string; createdAt: string; mode: string; questionCount: number; scoredCount: number };
  players: { rank: number; name: string; score: number; correctCount: number; team: string | null }[];
  teams: { name: string; color: string; average: number; members: number }[];
  byQuestion?: { prompt: string; type: string; responses: number; accuracy: number | null }[];
  canExport: boolean;
};

type ChallengeRow = {
  id: string;
  title: string;
  classroomName: string;
  questionCount: number;
  dueAt: string | null;
  closedAt: string | null;
  createdAt: string;
  rosterCount: number;
  finishedCount: number;
  startedCount: number;
  averageAccuracy: number | null;
};

type ChallengeDetail = {
  challenge: ChallengeRow & { open: boolean; settings: { mode: string; theme: string } };
  students: {
    profileId: string;
    name: string;
    status: "not_started" | "in_progress" | "finished";
    score: number;
    correctCount: number;
    answeredCount: number;
    accuracy: number | null;
    finishedAt: string | null;
    results: ("ok" | "miss" | "na" | "none")[];
  }[];
  byQuestion: { prompt: string; type: string; responses: number; accuracy: number | null }[];
};

function when(iso: string) {
  return new Date(iso).toLocaleString(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}

function meterClass(pct: number) {
  return pct >= 70 ? "" : pct >= 40 ? "is-mid" : "is-low";
}

function downloadCsv(name: string, rows: (string | number)[][]) {
  const esc = (v: string | number) => `"${String(v).replace(/"/g, '""')}"`;
  const blob = new Blob([rows.map((r) => r.map(esc).join(",")).join("\n")], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  URL.revokeObjectURL(url);
}

export function BlitzReportsPanel() {
  const params = useSearchParams();
  const initialChallenge = params.get("challenge");
  const [tab, setTab] = useState<"live" | "challenges">(initialChallenge ? "challenges" : "live");
  const [games, setGames] = useState<GameRow[] | null>(null);
  const [canExport, setCanExport] = useState(false);
  const [challenges, setChallenges] = useState<ChallengeRow[] | null>(null);
  const [gameDetail, setGameDetail] = useState<GameDetail | null>(null);
  const [chDetail, setChDetail] = useState<ChallengeDetail | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      const res = await fetch("/api/blitz/reports");
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Could not load reports. Refresh to try again.");
        setGames([]);
        return;
      }
      setGames(data.games ?? []);
      setCanExport(!!data.canExport);
    })();
    void (async () => {
      const res = await fetch("/api/blitz/challenges");
      const data = await res.json().catch(() => ({}));
      setChallenges(res.ok && data.role === "teacher" ? data.challenges : []);
    })();
  }, []);

  async function openGame(id: string) {
    const res = await fetch(`/api/blitz/reports?gameId=${id}`);
    const data = await res.json();
    if (!res.ok) return setError(data.error ?? "Could not load this game.");
    setGameDetail(data);
  }

  const openChallenge = useCallback(async (id: string) => {
    const res = await fetch(`/api/blitz/challenges/${id}`, { cache: "no-store" });
    const data = await res.json();
    if (!res.ok || data.role !== "teacher") return setError(data.error ?? "Could not load this challenge.");
    setChDetail(data);
  }, []);

  useEffect(() => {
    if (initialChallenge) void openChallenge(initialChallenge);
  }, [initialChallenge, openChallenge]);

  async function toggleClosed(d: ChallengeDetail) {
    await fetch(`/api/blitz/challenges/${d.challenge.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ closed: d.challenge.open }),
    });
    void openChallenge(d.challenge.id);
  }

  return (
    <div className="bz-page">
      <p className="bz-kicker">Reports</p>
      <h1 className="bz-h1 mt-2">Results and reports</h1>

      <div className="bz-seg mt-5">
        <button type="button" aria-pressed={tab === "live"} onClick={() => setTab("live")}>
          Live games
        </button>
        <button type="button" aria-pressed={tab === "challenges"} onClick={() => setTab("challenges")}>
          Self-paced challenges
        </button>
      </div>

      {error ? <p className="bz-alert mt-4" role="alert">{error}</p> : null}

      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,340px)_minmax(0,1fr)]">
        <div className="bz-list">
          {tab === "live" ? (
            games === null ? (
              <p className="bz-muted" role="status">Loading games…</p>
            ) : games.length === 0 ? (
              <div className="bz-empty"><p className="m-0">No live games yet. Host a quiz from your library to see results here.</p></div>
            ) : (
              games.map((g) => (
                <button key={g.id} type="button" className={`bz-listrow ${gameDetail?.game.id === g.id ? "is-active" : ""}`} onClick={() => void openGame(g.id)}>
                  <span className="min-w-0">
                    <strong className="bz-h3" style={{ display: "block", fontSize: "1.05rem" }}>
                      {g.quizTitle}
                    </strong>
                    <span className="bz-faint">
                      {when(g.createdAt)} · {g.playerCount} {g.playerCount === 1 ? "player" : "players"}
                    </span>
                  </span>
                  <span className={`bz-chip ${g.mode === "team" ? "bz-chip--sun" : ""}`}>
                    {g.phase !== "ended" ? "In progress" : g.mode === "team" ? "Teams" : g.mode === "accuracy" ? "Accuracy" : "Classic"}
                  </span>
                </button>
              ))
            )
          ) : challenges === null ? (
            <p className="bz-muted" role="status">Loading challenges…</p>
          ) : challenges.length === 0 ? (
            <div className="bz-empty">
              <p className="m-0">
                No challenges yet. Select <strong>Assign</strong> on a quiz in your library to set one for a class.
              </p>
            </div>
          ) : (
            challenges.map((c) => {
              const pct = c.rosterCount ? Math.round((c.finishedCount / c.rosterCount) * 100) : 0;
              return (
                <button key={c.id} type="button" className={`bz-listrow ${chDetail?.challenge.id === c.id ? "is-active" : ""}`} onClick={() => void openChallenge(c.id)} style={{ flexDirection: "column", alignItems: "stretch" }}>
                  <span className="flex items-start justify-between gap-2">
                    <strong className="bz-h3" style={{ fontSize: "1.05rem" }}>
                      {c.title}
                    </strong>
                    <span className="bz-chip">{c.classroomName}</span>
                  </span>
                  <span className="bz-faint">
                    {c.finishedCount}/{c.rosterCount} finished
                    {c.averageAccuracy != null ? ` · ${c.averageAccuracy}% average` : ""}
                    {c.dueAt ? ` · Due ${when(c.dueAt)}` : ""}
                  </span>
                  <span className="bz-meter mt-1">
                    <i style={{ width: `${pct}%` }} />
                  </span>
                </button>
              );
            })
          )}
        </div>

        <div className="bz-card bz-card--pad" style={{ minHeight: 280 }}>
          {tab === "live" ? (
            gameDetail ? (
              <GameReport d={gameDetail} canExport={canExport} />
            ) : (
              <p className="bz-muted">Select a game to see scores and accuracy for each question.</p>
            )
          ) : chDetail ? (
            <ChallengeReport d={chDetail} canExport={canExport} onToggle={() => void toggleClosed(chDetail)} />
          ) : (
            <p className="bz-muted">Select a challenge to see who has finished and how they scored.</p>
          )}
        </div>
      </div>
    </div>
  );
}

function QuestionBreakdown({ rows }: { rows: { prompt: string; type: string; responses: number; accuracy: number | null }[] }) {
  return (
    <div className="mt-6">
      <p className="bz-kicker mb-2">By question</p>
      <div className="flex flex-col gap-2">
        {rows.map((q, i) => (
          <div key={i} className="grid items-center gap-3" style={{ gridTemplateColumns: "2rem minmax(0,1fr) minmax(5.5rem, 9rem)" }}>
            <span className="bz-qnum" style={{ width: "1.9rem", height: "1.9rem", fontSize: "0.85rem" }}>
              {i + 1}
            </span>
            <span className="min-w-0">
              <span style={{ display: "block", fontWeight: 700, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {q.prompt || "Untitled question"}
              </span>
              <span className="bz-faint">
                {BLITZ_TYPE_LABEL[q.type as BlitzQuestionType] ?? q.type} · {q.responses} {q.responses === 1 ? "response" : "responses"}
              </span>
            </span>
            {q.accuracy != null ? (
              <span className="flex items-center gap-2">
                <span className="bz-meter" style={{ flex: 1 }}>
                  <i className={meterClass(q.accuracy)} style={{ width: `${q.accuracy}%` }} />
                </span>
                <b style={{ minWidth: 38, textAlign: "right" }}>{q.accuracy}%</b>
              </span>
            ) : (
              <span className="bz-faint">Not scored</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function GameReport({ d, canExport }: { d: GameDetail; canExport: boolean }) {
  return (
    <div className="bz-rise">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="bz-h2" style={{ overflowWrap: "anywhere" }}>{d.game.title}</h2>
          <p className="bz-faint mt-1">
            {when(d.game.createdAt)} · PIN {d.game.pin} · {d.game.mode === "team" ? "Team battle" : d.game.mode === "accuracy" ? "Accuracy mode" : "Classic mode"}
          </p>
        </div>
        {canExport ? (
          <button
            type="button"
            className="bz-btn bz-btn--sm"
            onClick={() =>
              downloadCsv(`blitz-${d.game.pin}.csv`, [
                ["Rank", "Name", "Team", "Score", "Correct"],
                ...d.players.map((p) => [p.rank, p.name, p.team ?? "", p.score, p.correctCount]),
              ])
            }
          >
            Export CSV
          </button>
        ) : (
          <Link href="/apps/blitz/upgrade" className="bz-faint" style={{ color: "var(--bz-sun)" }}>
            CSV export is included with Plus
          </Link>
        )}
      </div>

      {d.teams.length ? (
        <div className="mt-5 flex flex-wrap gap-2">
          {d.teams.map((t, i) => (
            <span key={t.name} className="bz-chip" style={{ background: t.color, color: "var(--bz-ink)", borderColor: "var(--bz-ink)", fontSize: "0.9rem" }}>
              {i + 1}. {t.name} · {t.average.toLocaleString()} average
            </span>
          ))}
        </div>
      ) : null}

      <div style={{ overflowX: "auto" }}>
      <table className="bz-table mt-4">
        <thead>
          <tr>
            <th>#</th>
            <th>Player</th>
            <th style={{ textAlign: "right" }}>Correct</th>
            <th style={{ textAlign: "right" }}>Score</th>
          </tr>
        </thead>
        <tbody>
          {d.players.map((p) => (
            <tr key={p.rank}>
              <td style={{ width: 40, fontWeight: 800 }}>{p.rank}</td>
              <td>
                <strong>{p.name}</strong>
                {p.team ? <span className="bz-faint"> · {p.team}</span> : null}
              </td>
              <td style={{ textAlign: "right" }}>
                {p.correctCount}/{d.game.scoredCount}
              </td>
              <td style={{ textAlign: "right", fontWeight: 800 }}>{p.score.toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
      </div>
      {d.players.length === 0 ? <p className="bz-muted mt-3">No players joined this game.</p> : null}

      {d.byQuestion ? (
        <QuestionBreakdown rows={d.byQuestion} />
      ) : (
        <p className="bz-alert bz-alert--info mt-6">
          Accuracy for each question is included with Plus. <Link href="/apps/blitz/upgrade">See plans</Link>
        </p>
      )}
    </div>
  );
}

function ChallengeReport({ d, canExport, onToggle }: { d: ChallengeDetail; canExport: boolean; onToggle: () => void }) {
  const c = d.challenge;
  const [copied, setCopied] = useState(false);
  const link = typeof window !== "undefined" ? `${window.location.origin}/apps/blitz/challenge/${c.id}` : "";
  const finished = d.students.filter((s) => s.status === "finished").length;
  return (
    <div className="bz-rise">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="bz-h2" style={{ overflowWrap: "anywhere" }}>{c.title}</h2>
          <p className="bz-faint mt-1">
            {c.classroomName} · {c.questionCount} {c.questionCount === 1 ? "question" : "questions"} · {c.settings.mode === "accuracy" ? "Accuracy scoring" : "Speed bonus on"}
            {c.dueAt ? ` · Due ${when(c.dueAt)}` : ""}
          </p>
        </div>
        <span className={`bz-chip ${c.open ? "bz-chip--lime" : "bz-chip--coral"}`}>{c.open ? "Open" : "Closed"}</span>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          className="bz-btn bz-btn--sm"
          onClick={() =>
            void navigator.clipboard?.writeText(link).then(() => {
              setCopied(true);
              window.setTimeout(() => setCopied(false), 1500);
            })
          }
        >
          {copied ? "Link copied" : "Copy student link"}
        </button>
        <button type="button" className="bz-btn bz-btn--sm" onClick={onToggle}>
          {c.open ? "Close challenge" : "Reopen challenge"}
        </button>
        {canExport ? (
          <button
            type="button"
            className="bz-btn bz-btn--sm"
            onClick={() =>
              downloadCsv(`blitz-challenge-${c.id.slice(0, 8)}.csv`, [
                ["Name", "Status", "Score", "Correct", "Accuracy"],
                ...d.students.map((s) => [s.name, s.status === "finished" ? "Finished" : s.status === "in_progress" ? "In progress" : "Not started", s.score, s.correctCount, s.accuracy ?? ""]),
              ])
            }
          >
            Export CSV
          </button>
        ) : null}
      </div>

      <div className="bz-hero-stats mt-5">
        <div className="bz-stat">
          <b>
            {finished}/{d.students.length}
          </b>
          <span>Finished</span>
        </div>
        <div className="bz-stat">
          <b>{d.students.filter((s) => s.status === "in_progress").length}</b>
          <span>In progress</span>
        </div>
        <div className="bz-stat">
          <b>{c.averageAccuracy != null ? `${c.averageAccuracy}%` : (() => {
            const acc = d.students.filter((s) => s.status === "finished" && s.accuracy != null).map((s) => s.accuracy!);
            return acc.length ? `${Math.round(acc.reduce((a, b) => a + b, 0) / acc.length)}%` : "—";
          })()}</b>
          <span>Average accuracy</span>
        </div>
      </div>

      <div style={{ overflowX: "auto" }}>
        <table className="bz-table mt-4" style={{ minWidth: 520 }}>
          <thead>
            <tr>
              <th>Student</th>
              <th>Status</th>
              <th>Answers</th>
              <th style={{ textAlign: "right" }}>Accuracy</th>
              <th style={{ textAlign: "right" }}>Score</th>
            </tr>
          </thead>
          <tbody>
            {d.students.map((s) => (
              <tr key={s.profileId}>
                <td>
                  <strong>{s.name}</strong>
                </td>
                <td>
                  <span className={`bz-chip ${s.status === "finished" ? "bz-chip--lime" : s.status === "in_progress" ? "bz-chip--sun" : ""}`}>
                    {s.status === "finished" ? "Finished" : s.status === "in_progress" ? "In progress" : "Not started"}
                  </span>
                </td>
                <td>
                  <span className="bz-dots" aria-label={`${s.correctCount} correct`}>
                    {s.results.map((r, i) => (
                      <i key={i} className={r === "none" ? "" : `is-${r}`} />
                    ))}
                  </span>
                </td>
                <td style={{ textAlign: "right" }}>{s.accuracy != null && s.status !== "not_started" ? `${s.accuracy}%` : "—"}</td>
                <td style={{ textAlign: "right", fontWeight: 800 }}>{s.status === "not_started" ? "—" : s.score.toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {d.students.length === 0 ? <p className="bz-muted mt-3">This class has no students yet.</p> : null}
      <QuestionBreakdown rows={d.byQuestion} />
    </div>
  );
}
