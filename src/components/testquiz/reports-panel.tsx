"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type GameRow = {
  id: string;
  pin: string;
  quizTitle: string;
  phase: string;
  playerCount: number;
  createdAt: string;
  endedAt: string | null;
};

export function TestQuizReportsPanel() {
  const [games, setGames] = useState<GameRow[]>([]);
  const [detail, setDetail] = useState<{
    players: { rank: number; name: string; score: number; correctCount: number }[];
    byQuestion?: { prompt: string; type: string; responses: number; accuracy: number | null }[];
    canExport: boolean;
    game: { title: string; pin: string };
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      const res = await fetch("/api/testquiz/reports");
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Could not load reports");
        return;
      }
      setGames(data.games ?? []);
    })();
  }, []);

  async function openGame(id: string) {
    const res = await fetch(`/api/testquiz/reports?gameId=${id}`);
    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "Could not load game");
      return;
    }
    setDetail(data);
  }

  function exportCsv() {
    if (!detail?.canExport) return;
    const lines = [
      "rank,name,score,correct",
      ...detail.players.map(
        (p) => `${p.rank},"${p.name.replace(/"/g, '""')}",${p.score},${p.correctCount}`,
      ),
    ];
    const blob = new Blob([lines.join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `testquiz-${detail.game.pin}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="tq-rise mx-auto max-w-5xl px-5 py-8 sm:px-8">
      <Link
        href="/apps/testquiz/library"
        className="text-sm text-[var(--tq-muted)] no-underline hover:underline"
      >
        ← Library
      </Link>
      <h1 className="tq-brand mt-3">Reports</h1>
      <p className="mt-2 text-[var(--tq-muted)]">
        Recent live games and basic score summaries.
      </p>

      {error ? (
        <p className="mt-4 rounded-xl bg-[rgba(255,107,74,0.15)] px-4 py-3 text-sm">
          {error}
        </p>
      ) : null}

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <div className="space-y-2">
          {games.length === 0 ? (
            <p className="text-[var(--tq-muted)]">No games yet.</p>
          ) : (
            games.map((g) => (
              <button
                key={g.id}
                type="button"
                className="tq-tile w-full text-left"
                onClick={() => void openGame(g.id)}
              >
                <div className="font-bold">{g.quizTitle}</div>
                <div className="mt-1 text-sm text-[var(--tq-muted)]">
                  PIN {g.pin} · {g.playerCount} players · {g.phase}
                </div>
              </button>
            ))
          )}
        </div>

        <div className="rounded-2xl border border-white/10 bg-black/20 p-5">
          {!detail ? (
            <p className="text-[var(--tq-muted)]">Select a game.</p>
          ) : (
            <>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-xl font-bold">{detail.game.title}</h2>
                  <p className="text-sm text-[var(--tq-muted)]">
                    PIN {detail.game.pin}
                  </p>
                </div>
                {detail.canExport ? (
                  <button
                    type="button"
                    className="tq-btn tq-btn-ghost text-sm"
                    onClick={exportCsv}
                  >
                    Export CSV
                  </button>
                ) : (
                  <span className="text-xs text-[var(--tq-muted)]">
                    Export on Plus/Ultra
                  </span>
                )}
              </div>
              <ol className="mt-4 space-y-2">
                {detail.players.map((p) => (
                  <li
                    key={p.rank}
                    className="flex justify-between rounded-xl bg-white/5 px-3 py-2 text-sm"
                  >
                    <span>
                      {p.rank}. {p.name}
                    </span>
                    <span>
                      {p.score} pts · {p.correctCount} correct
                    </span>
                  </li>
                ))}
              </ol>
              {detail.byQuestion ? (
                <div className="mt-6">
                  <h3 className="font-semibold">By question</h3>
                  <ul className="mt-2 space-y-2 text-sm">
                    {detail.byQuestion.map((q, i) => (
                      <li key={i} className="rounded-xl bg-white/5 px-3 py-2">
                        <div className="font-medium">{q.prompt || q.type}</div>
                        <div className="text-[var(--tq-muted)]">
                          {q.responses} responses
                          {q.accuracy != null ? ` · ${q.accuracy}% accuracy` : ""}
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
