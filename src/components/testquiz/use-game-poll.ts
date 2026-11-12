"use client";

import { useCallback, useEffect, useState } from "react";
import type { LiveGameState } from "@/lib/testquiz/types";

export function useGamePoll(gameId: string | null, intervalMs = 1200) {
  const [game, setGame] = useState<LiveGameState | null>(null);
  const [role, setRole] = useState<"host" | "player" | null>(null);
  const [playerId, setPlayerId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!gameId) return;
    try {
      const res = await fetch(`/api/testquiz/games/${gameId}`, {
        cache: "no-store",
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Could not load game");
        return;
      }
      setGame(data.game);
      setRole(data.role);
      setPlayerId(data.playerId ?? null);
      setError(null);
    } catch {
      setError("Connection issue");
    }
  }, [gameId]);

  useEffect(() => {
    void refresh();
    if (!gameId) return;
    const t = setInterval(() => void refresh(), intervalMs);
    return () => clearInterval(t);
  }, [gameId, intervalMs, refresh]);

  return { game, setGame, role, playerId, error, refresh };
}
