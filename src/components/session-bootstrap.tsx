"use client";

import { useEffect } from "react";

/** Ensures an anonymous learner cookie exists via the Node API route. */
export function SessionBootstrap() {
  useEffect(() => {
    void fetch("/api/session").catch(() => undefined);
  }, []);
  return null;
}
