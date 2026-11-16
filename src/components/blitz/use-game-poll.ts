"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { LiveGameState } from "@/lib/blitz/types";

/** Polls a live game. Also estimates server-minus-client clock skew. */
export function useGamePoll(gameId: string | null, intervalMs = 1200) {
  const [game, setGame] = useState<LiveGameState | null>(null);
  const [role, setRole] = useState<"host" | "player" | null>(null);
  const [playerId, setPlayerId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [skewMs, setSkewMs] = useState(0);
  const inFlight = useRef(false);

  const refresh = useCallback(async () => {
    if (!gameId || inFlight.current) return;
    inFlight.current = true;
    const sent = Date.now();
    try {
      const res = await fetch(`/api/blitz/games/${gameId}`, { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Could not load game");
        return;
      }
      if (typeof data.serverNowMs === "number") {
        const got = Date.now();
        const est = data.serverNowMs - (sent + got) / 2;
        setSkewMs((prev) => (Math.abs(prev - est) > 150 ? est : prev));
      }
      setGame(data.game);
      setRole(data.role);
      setPlayerId(data.playerId ?? null);
      setError(null);
    } catch {
      setError("Connection hiccup — retrying…");
    } finally {
      inFlight.current = false;
    }
  }, [gameId]);

  useEffect(() => {
    void refresh();
    if (!gameId) return;
    const t = setInterval(() => void refresh(), intervalMs);
    return () => clearInterval(t);
  }, [gameId, intervalMs, refresh]);

  return { game, setGame, role, playerId, error, refresh, skewMs };
}
