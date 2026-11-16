"use client";

import qrcode from "qrcode-generator";
import { useEffect, useState, type CSSProperties } from "react";
import { playBlitzSfx } from "@/components/blitz/use-blitz-audio";

/** Seconds left on a server-started clock (updates 10×/s). */
export function useSecondsLeft(
  startedAtMs: number | null,
  limitSec: number,
  /** Server clock minus client clock, if known. */
  skewMs = 0,
): { left: number; fraction: number } {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 100);
    return () => window.clearInterval(id);
  }, []);
  if (!startedAtMs) return { left: limitSec, fraction: 1 };
  const elapsed = now + skewMs - startedAtMs;
  const leftMs = Math.max(0, limitSec * 1000 - elapsed);
  return { left: Math.ceil(leftMs / 1000), fraction: leftMs / (limitSec * 1000) };
}

/** Big ring timer with the seconds in the middle. Ticks in the last 5s. */
export function TimerRing({
  startedAtMs,
  limitSec,
  size = 120,
  tick = false,
  skewMs = 0,
}: {
  startedAtMs: number | null;
  limitSec: number;
  size?: number;
  tick?: boolean;
  skewMs?: number;
}) {
  const { left, fraction } = useSecondsLeft(startedAtMs, limitSec, skewMs);
  const r = 44;
  const c = 2 * Math.PI * r;
  const urgent = left <= 5;

  useEffect(() => {
    if (tick && startedAtMs && left > 0 && left <= 5) playBlitzSfx("tick", 0.8);
  }, [left, tick, startedAtMs]);

  return (
    <div
      className={`bz-timer ${urgent ? "is-urgent" : ""}`}
      style={{ width: size, height: size, "--sz": `${size}px` } as CSSProperties}
      role="timer"
      aria-label={`${left} seconds left`}
    >
      <svg viewBox="0 0 100 100" aria-hidden>
        <circle cx="50" cy="50" r={r} className="bz-timer-track" />
        <circle
          cx="50"
          cy="50"
          r={r}
          className="bz-timer-fill"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - fraction)}
        />
      </svg>
      <span className="bz-timer-num" key={left}>
        {left}
      </span>
    </div>
  );
}

/** Thin bar version for phones. */
export function TimerBar({
  startedAtMs,
  limitSec,
  skewMs = 0,
}: {
  startedAtMs: number | null;
  limitSec: number;
  skewMs?: number;
}) {
  const { fraction, left } = useSecondsLeft(startedAtMs, limitSec, skewMs);
  return (
    <div className={`bz-timerbar ${left <= 5 ? "is-urgent" : ""}`} aria-hidden>
      <div style={{ transform: `scaleX(${fraction})` }} />
    </div>
  );
}

/** 3-2-1 based on phase start. */
export function CountdownNumber({
  phaseStartedAtMs,
  seconds = 3,
  sound = false,
}: {
  phaseStartedAtMs: number;
  seconds?: number;
  sound?: boolean;
}) {
  const [n, setN] = useState(seconds);
  useEffect(() => {
    const tick = () => {
      const elapsed = Date.now() - phaseStartedAtMs;
      setN(Math.max(1, seconds - Math.floor(elapsed / 1000)));
    };
    tick();
    const id = window.setInterval(tick, 100);
    return () => window.clearInterval(id);
  }, [phaseStartedAtMs, seconds]);
  useEffect(() => {
    if (sound) playBlitzSfx("tick");
  }, [n, sound]);
  return (
    <div className="bz-count" aria-live="polite">
      <span className="bz-count-ring" key={`r${n}`} />
      <span className="bz-count-num" key={`n${n}`}>
        {n}
      </span>
    </div>
  );
}

/** QR for the join URL, drawn locally as SVG (no outside service). */
export function JoinQr({ pin, size = 168 }: { pin: string; size?: number }) {
  const [origin, setOrigin] = useState("");
  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);
  if (!origin) {
    return <div className="bz-qr bz-qr--empty" style={{ width: size, height: size }} />;
  }
  const joinUrl = `${origin}/apps/blitz/join?pin=${encodeURIComponent(pin)}`;
  const qr = qrcode(0, "M");
  qr.addData(joinUrl);
  qr.make();
  const n = qr.getModuleCount();
  let d = "";
  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      if (qr.isDark(r, c)) d += `M${c} ${r}h1v1h-1z`;
    }
  }
  return (
    <div className="bz-qr">
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${n} ${n}`}
        shapeRendering="crispEdges"
        role="img"
        aria-label={`QR code to join with PIN ${pin}`}
      >
        <rect width={n} height={n} fill="#fffaf0" />
        <path d={d} fill="#15123b" />
      </svg>
    </div>
  );
}

export function playerLabel(
  p: { displayName: string; nickname: string | null },
  allowNicknames: boolean,
): string {
  return allowNicknames ? p.nickname || p.displayName : p.displayName;
}

export function ordinal(n: number): string {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return `${n}${s[(v - 20) % 10] ?? s[v] ?? s[0]}`;
}
