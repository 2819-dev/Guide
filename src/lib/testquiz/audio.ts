/**
 * Placeholder music tracks for lobby / play.
 * REPLACE_ME: swap files under /public/testquiz/audio with licensed loops.
 */

export const TESTQUIZ_AUDIO = {
  lobby: "/testquiz/audio/lobby-loop.wav", // REPLACE_ME
  play: "/testquiz/audio/play-loop.wav", // REPLACE_ME
  podium: "/testquiz/audio/podium-sting.wav", // REPLACE_ME
} as const;

export type TestQuizAudioKey = keyof typeof TESTQUIZ_AUDIO;

export function audioSrc(key: TestQuizAudioKey): string {
  return TESTQUIZ_AUDIO[key];
}
