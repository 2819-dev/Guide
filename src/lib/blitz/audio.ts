/**
 * Placeholder music tracks for lobby / play.
 * REPLACE_ME: swap files under /public/blitz/audio with licensed loops.
 */

export const BLITZ_AUDIO = {
  lobby: "/blitz/audio/lobby-loop.wav", // REPLACE_ME
  play: "/blitz/audio/play-loop.wav", // REPLACE_ME
  podium: "/blitz/audio/podium-sting.wav", // REPLACE_ME
} as const;

export type BlitzAudioKey = keyof typeof BLITZ_AUDIO;

export function audioSrc(key: BlitzAudioKey): string {
  return BLITZ_AUDIO[key];
}
