"use client";

import { useEffect, useRef } from "react";

type Props = {
  src: string | null;
  enabled: boolean;
};

/** Loops placeholder tracks; fails quietly if file missing. */
export function TestQuizAudioPlayer({ src, enabled }: Props) {
  const ref = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (!enabled || !src) {
      el.pause();
      return;
    }
    if (el.src !== new URL(src, window.location.origin).href) {
      el.src = src;
    }
    el.loop = true;
    el.volume = 0.35;
    void el.play().catch(() => {
      /* autoplay may be blocked until user gesture */
    });
  }, [src, enabled]);

  return <audio ref={ref} preload="auto" aria-hidden />;
}
