# Blitz audio

Every file here is an **original placeholder** made by `generate_audio.py`
(numpy synth → ffmpeg MP3, 22 kHz mono). Nothing imitates another game's music.

| File | Used for |
| --- | --- |
| `lobby-loop.mp3` | Host lobby (loops) |
| `question-loop.mp3` | Countdown + question timer (loops) |
| `leaderboard-loop.mp3` | Leaderboard between questions (loops) |
| `podium-loop.mp3` | Final podium (loops) |
| `reveal-sting.mp3` | Answer reveal (one-shot) |
| `sfx-*.mp3` | Join pop, timer tick, correct, wrong, go, time up |

Music plays on the host screen only and only on plans with `music`;
SFX play on host and phones. To swap in licensed tracks keep the file names,
or point the keys in `src/lib/blitz/audio.ts` at new files. Loops are played
gaplessly with Web Audio, so trim them to exact bar lengths.

Regenerate: `python3 public/blitz/audio/generate_audio.py`
