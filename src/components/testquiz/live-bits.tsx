"use client";

import { useEffect, useState } from "react";

/** Live countdown 3 → 2 → 1 based on phase start. */
export function CountdownDrama({
  phaseStartedAtMs,
  seconds = 3,
}: {
  phaseStartedAtMs: number;
  seconds?: number;
}) {
  const [n, setN] = useState(seconds);

  useEffect(() => {
    const tick = () => {
      const elapsed = Date.now() - phaseStartedAtMs;
      const left = Math.max(1, seconds - Math.floor(elapsed / 1000));
      setN(left);
    };
    tick();
    const id = window.setInterval(tick, 100);
    return () => window.clearInterval(id);
  }, [phaseStartedAtMs, seconds]);

  return (
    <p className="tq-countdown-num" key={`${phaseStartedAtMs}-${n}`}>
      {n}
    </p>
  );
}

/** Shrinking question timer bar. */
export function QuestionTimerBar({
  startedAtMs,
  limitSec,
}: {
  startedAtMs: number | null;
  limitSec: number;
}) {
  const [pct, setPct] = useState(100);

  useEffect(() => {
    if (!startedAtMs) {
      setPct(100);
      return;
    }
    const tick = () => {
      const elapsed = Date.now() - startedAtMs;
      const left = Math.max(0, 1 - elapsed / (limitSec * 1000));
      setPct(left * 100);
    };
    tick();
    const id = window.setInterval(tick, 100);
    return () => window.clearInterval(id);
  }, [startedAtMs, limitSec]);

  const urgent = pct < 25;

  return (
    <div className="tq-timer-track" aria-hidden>
      <div
        className={`tq-timer-fill ${urgent ? "is-urgent" : ""}`}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

/** Optional QR for join URL (external QR image — easy projector aid). */
export function JoinQr({ pin, size = 168 }: { pin: string; size?: number }) {
  const [origin, setOrigin] = useState("");
  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);
  if (!origin) {
    return (
      <div
        className="mx-auto rounded-2xl bg-white/10"
        style={{ width: size, height: size }}
      />
    );
  }
  const joinUrl = `${origin}/apps/testquiz/join?pin=${encodeURIComponent(pin)}`;
  const src = `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(joinUrl)}&bgcolor=ffffff&color=071a14&margin=8`;
  return (
    <div className="tq-pop inline-block rounded-2xl bg-white p-2 shadow-lg">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        width={size}
        height={size}
        alt={`QR code to join with PIN ${pin}`}
        className="block rounded-xl"
      />
    </div>
  );
}

export function playerLabel(
  p: { displayName: string; nickname: string | null },
  allowNicknames: boolean,
): string {
  return allowNicknames ? p.nickname || p.displayName : p.displayName;
}
