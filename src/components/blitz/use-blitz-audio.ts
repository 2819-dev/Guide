"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  BLITZ_MUSIC,
  BLITZ_SFX,
  type BlitzMusicKey,
  type BlitzSfxKey,
} from "@/lib/blitz/audio";

/**
 * Tiny Web Audio engine: gapless music loops with crossfades + one-shot SFX.
 * One AudioContext per page; buffers are fetched lazily and cached.
 */

type Engine = {
  ctx: AudioContext;
  musicGain: GainNode;
  sfxGain: GainNode;
  buffers: Map<string, Promise<AudioBuffer | null>>;
  current: { key: string; src: AudioBufferSourceNode; gain: GainNode } | null;
};

let engine: Engine | null = null;

function getEngine(): Engine | null {
  if (typeof window === "undefined") return null;
  if (engine) return engine;
  const Ctx =
    window.AudioContext ??
    (window as unknown as { webkitAudioContext?: typeof AudioContext })
      .webkitAudioContext;
  if (!Ctx) return null;
  const ctx = new Ctx();
  const musicGain = ctx.createGain();
  musicGain.gain.value = 0.42;
  musicGain.connect(ctx.destination);
  const sfxGain = ctx.createGain();
  sfxGain.gain.value = 0.7;
  sfxGain.connect(ctx.destination);
  engine = { ctx, musicGain, sfxGain, buffers: new Map(), current: null };
  return engine;
}

function load(e: Engine, url: string): Promise<AudioBuffer | null> {
  let p = e.buffers.get(url);
  if (!p) {
    p = fetch(url)
      .then((r) => (r.ok ? r.arrayBuffer() : Promise.reject(new Error("missing"))))
      .then((ab) => e.ctx.decodeAudioData(ab))
      .catch(() => null);
    e.buffers.set(url, p);
  }
  return p;
}

function stopMusic(e: Engine, fade = 0.35) {
  const cur = e.current;
  if (!cur) return;
  e.current = null;
  const t = e.ctx.currentTime;
  cur.gain.gain.cancelScheduledValues(t);
  cur.gain.gain.setValueAtTime(cur.gain.gain.value, t);
  cur.gain.gain.linearRampToValueAtTime(0, t + fade);
  cur.src.stop(t + fade + 0.05);
}

async function startMusic(e: Engine, key: BlitzMusicKey) {
  const url = BLITZ_MUSIC[key];
  if (e.current?.key === url) return;
  stopMusic(e);
  const buf = await load(e, url);
  if (!buf) return;
  // Another call may have started something meanwhile.
  if (e.current) stopMusic(e, 0.2);
  const src = e.ctx.createBufferSource();
  src.buffer = buf;
  src.loop = true;
  const gain = e.ctx.createGain();
  gain.gain.value = 0;
  src.connect(gain).connect(e.musicGain);
  const t = e.ctx.currentTime;
  gain.gain.linearRampToValueAtTime(1, t + 0.4);
  src.start();
  e.current = { key: url, src, gain };
}

export function playBlitzSfx(key: BlitzSfxKey, volume = 1) {
  const e = getEngine();
  if (!e || readMuted()) return;
  if (e.ctx.state === "suspended") void e.ctx.resume();
  void load(e, BLITZ_SFX[key]).then((buf) => {
    if (!buf) return;
    const src = e.ctx.createBufferSource();
    src.buffer = buf;
    const g = e.ctx.createGain();
    g.gain.value = volume;
    src.connect(g).connect(e.sfxGain);
    src.start();
  });
}

const MUTE_KEY = "blitz:muted";

function readMuted(): boolean {
  try {
    return window.localStorage.getItem(MUTE_KEY) === "1";
  } catch {
    return false;
  }
}

/**
 * Drives music for a screen. `music` = which loop should be playing now
 * (null = silence). Returns mute state + whether the browser is blocking
 * audio until a tap.
 */
export function useBlitzAudio(music: BlitzMusicKey | null) {
  const [muted, setMutedState] = useState(false);
  const [blocked, setBlocked] = useState(false);
  const musicRef = useRef(music);
  musicRef.current = music;

  useEffect(() => {
    setMutedState(readMuted());
  }, []);

  const sync = useCallback(() => {
    const e = getEngine();
    if (!e) return;
    const want = musicRef.current;
    if (muted || !want) {
      stopMusic(e);
      return;
    }
    if (e.ctx.state === "suspended") {
      e.ctx
        .resume()
        .then(() => setBlocked(e.ctx.state !== "running"))
        .catch(() => setBlocked(true));
      // Some browsers resolve resume() without running until a gesture.
      window.setTimeout(() => setBlocked(e.ctx.state !== "running"), 300);
    }
    void startMusic(e, want);
  }, [muted]);

  useEffect(() => {
    sync();
  }, [music, sync]);

  useEffect(() => {
    // First gesture anywhere unlocks audio.
    const unlock = () => {
      const e = getEngine();
      if (!e) return;
      void e.ctx.resume().then(() => {
        setBlocked(false);
        sync();
      });
    };
    window.addEventListener("pointerdown", unlock);
    window.addEventListener("keydown", unlock);
    return () => {
      window.removeEventListener("pointerdown", unlock);
      window.removeEventListener("keydown", unlock);
    };
  }, [sync]);

  useEffect(
    () => () => {
      const e = engine;
      if (e) stopMusic(e, 0.2);
    },
    [],
  );

  const setMuted = useCallback((m: boolean) => {
    setMutedState(m);
    try {
      window.localStorage.setItem(MUTE_KEY, m ? "1" : "0");
    } catch {
      /* private mode */
    }
  }, []);

  return { muted, setMuted, blocked: blocked && !muted && !!music };
}
