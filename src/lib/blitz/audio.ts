/**
 * Blitz music + sound effects.
 *
 * Every file here is an ORIGINAL placeholder synthesized by
 * public/blitz/audio/generate_audio.py. To swap in licensed audio, drop the
 * new file into public/blitz/audio/ and point the matching key at it.
 * Loops should be seamless (they are played gaplessly with Web Audio).
 */

import type { GamePhase } from "@/lib/blitz/types";

export const BLITZ_MUSIC = {
  lobby: "/blitz/audio/lobby-loop.mp3",
  question: "/blitz/audio/question-loop.mp3",
  leaderboard: "/blitz/audio/leaderboard-loop.mp3",
  podium: "/blitz/audio/podium-loop.mp3",
} as const;

/** One-shots (played once, never looped). */
export const BLITZ_SFX = {
  reveal: "/blitz/audio/reveal-sting.mp3",
  join: "/blitz/audio/sfx-join.mp3",
  tick: "/blitz/audio/sfx-tick.mp3",
  correct: "/blitz/audio/sfx-correct.mp3",
  wrong: "/blitz/audio/sfx-wrong.mp3",
  go: "/blitz/audio/sfx-go.mp3",
  timeup: "/blitz/audio/sfx-timeup.mp3",
} as const;

export type BlitzMusicKey = keyof typeof BLITZ_MUSIC;
export type BlitzSfxKey = keyof typeof BLITZ_SFX;

/** Back-compat alias: older code stored a track URL on the game state. */
export const BLITZ_AUDIO = BLITZ_MUSIC;
export type BlitzAudioKey = BlitzMusicKey;

export function audioSrc(key: BlitzMusicKey): string {
  return BLITZ_MUSIC[key];
}

/** Which loop belongs to a phase (null = silence / sting only). */
export function musicForPhase(phase: GamePhase): BlitzMusicKey | null {
  switch (phase) {
    case "lobby":
      return "lobby";
    case "countdown":
    case "question":
      return "question";
    case "leaderboard":
      return "leaderboard";
    case "podium":
      return "podium";
    default:
      return null;
  }
}
