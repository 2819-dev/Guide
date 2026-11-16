#!/usr/bin/env python3
"""
Blitz placeholder audio generator.

Synthesizes ORIGINAL chiptune-style music loops and sound effects with numpy,
then encodes them to small mono MP3s with ffmpeg (falls back to WAV).

Every melody here was written for Blitz; nothing imitates another game's
music. Swap any file in public/blitz/audio/ for a licensed track and keep the
file name (or update src/lib/blitz/audio.ts).

    python3 public/blitz/audio/generate_audio.py
"""

import os
import shutil
import subprocess
import wave

import numpy as np

SR = 22050
OUT = os.path.dirname(os.path.abspath(__file__))

NOTE_INDEX = {"C": 0, "C#": 1, "Db": 1, "D": 2, "D#": 3, "Eb": 3, "E": 4,
              "F": 5, "F#": 6, "Gb": 6, "G": 7, "G#": 8, "Ab": 8, "A": 9,
              "A#": 10, "Bb": 10, "B": 11}


def hz(name):
    """'A4' -> 440.0"""
    if name[1:2] in ("#", "b"):
        n, octave = name[:2], int(name[2:])
    else:
        n, octave = name[:1], int(name[1:])
    midi = 12 * (octave + 1) + NOTE_INDEX[n]
    return 440.0 * 2 ** ((midi - 69) / 12)


# ---------------------------------------------------------------- oscillators

def osc(kind, f, n, duty=0.5, vib=0.0):
    t = np.arange(n) / SR
    phase_inc = f * (1 + vib * np.sin(2 * np.pi * 5.5 * t)) / SR
    ph = np.cumsum(phase_inc) % 1.0
    if kind == "square":
        return np.where(ph < duty, 1.0, -1.0)
    if kind == "tri":
        return 4 * np.abs(ph - 0.5) - 1
    if kind == "saw":
        return 2 * ph - 1
    if kind == "sine":
        return np.sin(2 * np.pi * ph)
    raise ValueError(kind)


def env(n, a=0.005, d=0.08, s=0.6, r=0.06):
    a_n, d_n, r_n = int(a * SR), int(d * SR), int(r * SR)
    hold = max(0, n - a_n - d_n)
    e = np.concatenate([
        np.linspace(0, 1, max(a_n, 1)),
        np.linspace(1, s, max(d_n, 1)),
        np.full(hold, s),
    ])[:n]
    tail = np.linspace(s, 0, max(r_n, 1))
    return np.concatenate([e, tail])


def tone(kind, f, dur, vol=0.3, duty=0.5, a=0.005, d=0.08, s=0.6, r=0.06,
         vib=0.0, slide_to=None):
    n = int(dur * SR)
    e = env(n, a, d, s, r)
    total = len(e)
    if slide_to:
        t = np.linspace(0, 1, total)
        freqs = f * (slide_to / f) ** t
        ph = np.cumsum(freqs / SR) % 1.0
        if kind == "square":
            w = np.where(ph < duty, 1.0, -1.0)
        elif kind == "tri":
            w = 4 * np.abs(ph - 0.5) - 1
        else:
            w = np.sin(2 * np.pi * ph)
    else:
        w = osc(kind, f, total, duty, vib)
    return w * e * vol


def noise(dur, vol=0.2, decay=30.0, color=0.0):
    n = int(dur * SR)
    x = np.random.default_rng(7).uniform(-1, 1, n)
    if color:
        # simple one-pole lowpass for softer noise
        y = np.zeros(n)
        acc = 0.0
        for i in range(n):
            acc += color * (x[i] - acc)
            y[i] = acc
        x = y / (np.max(np.abs(y)) + 1e-9)
    e = np.exp(-np.arange(n) / SR * decay)
    return x * e * vol


def kick(vol=0.55):
    n = int(0.18 * SR)
    t = np.arange(n) / SR
    f = 140 * np.exp(-t * 28) + 42
    ph = np.cumsum(f / SR)
    return np.sin(2 * np.pi * ph) * np.exp(-t * 18) * vol


def snare(vol=0.22):
    n = noise(0.14, vol, decay=26)
    b = tone("tri", 190, 0.06, vol * 0.6, r=0.03)
    n[: len(b)] += b[: len(n)]
    return n


def hat(vol=0.07, open_=False):
    return noise(0.12 if open_ else 0.035, vol, decay=14 if open_ else 70)


# ---------------------------------------------------------------- sequencing

class Track:
    def __init__(self, bpm, bars, beats_per_bar=4, tail=1.5):
        self.bpm = bpm
        self.beat = 60.0 / bpm
        self.length = bars * beats_per_bar * self.beat
        self.n = int(round(self.length * SR))
        self.buf = np.zeros(self.n + int(tail * SR))

    def put(self, at_beats, sig):
        i = int(round(at_beats * self.beat * SR))
        end = min(len(self.buf), i + len(sig))
        self.buf[i:end] += sig[: end - i]

    def seq(self, notes, kind="square", vol=0.2, step=0.5, start=0.0,
            duty=0.5, gate=0.85, **kw):
        """notes: list of names / None (rest) / (name, steps)."""
        pos = start
        for item in notes:
            length = 1
            if isinstance(item, tuple):
                item, length = item
            if item is not None:
                f = hz(item) if isinstance(item, str) else item
                self.put(pos, tone(kind, f, step * self.beat * length * gate,
                                   vol, duty=duty, **kw))
            pos += step * length
        return pos

    def chord(self, at, names, dur_beats, kind="square", vol=0.06, duty=0.25,
              **kw):
        for nm in names:
            self.put(at, tone(kind, hz(nm), dur_beats * self.beat, vol,
                              duty=duty, **kw))

    def loop_mix(self):
        """Fold the release tail back onto the start so the loop is seamless."""
        out = self.buf[: self.n].copy()
        tail = self.buf[self.n:]
        out[: len(tail)] += tail[: self.n]
        return out

    def oneshot(self):
        return self.buf.copy()


def master(x, peak=0.82):
    x = np.tanh(x * 1.15)
    m = np.max(np.abs(x)) + 1e-9
    return x / m * peak


# ---------------------------------------------------------------- music

def lobby():
    """Bouncy, sunny groove in F. 8 bars at 118 bpm (~16.3s loop)."""
    t = Track(118, 8)
    prog = [("F2", ["A3", "C4", "F4"]), ("D2", ["A3", "D4", "F4"]),
            ("Bb1", ["Bb3", "D4", "F4"]), ("C2", ["G3", "C4", "E4"])]
    for bar in range(8):
        root, ch = prog[bar % 4]
        b0 = bar * 4
        # bass: root - octave - fifth hop, syncopated
        r = hz(root)
        for k, (off, mul, ln) in enumerate([(0, 1, 0.75), (0.75, 2, 0.25),
                                            (1.5, 1, 0.5), (2, 1.5, 0.5),
                                            (2.75, 2, 0.25), (3, 1, 0.5),
                                            (3.5, 1.5, 0.5)]):
            t.put(b0 + off, tone("tri", r * mul, ln * t.beat * 0.9, 0.34,
                                 r=0.03))
        # off-beat chord stabs
        for off in (0.5, 1.5, 2.5, 3.5):
            t.chord(b0 + off, ch, 0.22, vol=0.045, duty=0.25, r=0.04)
        # drums
        t.put(b0, kick()); t.put(b0 + 2, kick()); t.put(b0 + 2.75, kick(0.35))
        t.put(b0 + 1, snare()); t.put(b0 + 3, snare())
        for h in range(8):
            t.put(b0 + h * 0.5, hat(0.05 if h % 2 else 0.035))
    # lead melody (original): two 4-bar phrases, 8th-note grid
    a = ["C5", None, "A4", "C5", "D5", None, "C5", "A4",
         "F4", None, "G4", "A4", ("C5", 2), None, None,
         "D5", None, "F5", "D5", "C5", None, "A4", None,
         "Bb4", "A4", "G4", None, ("E4", 2), "G4", None]
    b = ["A4", "C5", "F5", None, "E5", "D5", "C5", None,
         "D5", None, "A4", "D5", ("F5", 2), "E5", "D5",
         "Bb4", None, "D5", "F5", "G5", None, "F5", "D5",
         ("E5", 3), None, "G5", None, None, None]
    t.seq(a, "square", 0.13, step=0.5, start=0, duty=0.25, vib=0.004)
    t.seq(b, "square", 0.13, step=0.5, start=16, duty=0.25, vib=0.004)
    # echo layer
    t.seq(a, "square", 0.04, step=0.5, start=0.75, duty=0.125)
    t.seq(b, "square", 0.04, step=0.5, start=16.75, duty=0.125)
    return master(t.loop_mix())


def question():
    """Tense, driving minor ostinato. 4 bars at 150 bpm (~6.4s loop)."""
    t = Track(150, 4)
    roots = ["D2", "D2", "Bb1", "C2"]
    for bar in range(4):
        b0 = bar * 4
        r = hz(roots[bar])
        for s in range(16):
            mul = 2 if s % 4 == 2 else 1
            t.put(b0 + s * 0.25, tone("square", r * mul, 0.2 * t.beat, 0.12,
                                      duty=0.5, r=0.02))
        t.put(b0, kick(0.5)); t.put(b0 + 1.5, kick(0.4)); t.put(b0 + 2, kick(0.5))
        t.put(b0 + 1, snare(0.16)); t.put(b0 + 3, snare(0.16))
        for h in range(16):
            t.put(b0 + h * 0.25, hat(0.05 if h % 4 == 2 else 0.025))
    # rising arpeggio that never resolves
    arp = ["D4", "F4", "A4", "D5", "E4", "G4", "A4", "E5",
           "D4", "F4", "Bb4", "D5", "E4", "G4", "C5", "E5"]
    for bar in range(4):
        notes = arp[bar * 4: bar * 4 + 4] * 2
        t.seq(notes, "square", 0.075, step=0.5, start=bar * 4, duty=0.125,
              gate=0.6)
    # high pulse every bar
    for bar in range(4):
        t.put(bar * 4 + 3.5, tone("sine", hz("A5"), 0.12, 0.08, r=0.05))
    return master(t.loop_mix(), 0.78)


def reveal():
    """Short drumroll into a bright rising sting (one-shot, ~2.4s)."""
    t = Track(140, 2, tail=1.6)
    for i in range(12):
        t.put(i * 0.125, snare(0.06 + i * 0.008))
    for k, nm in enumerate(["C5", "E5", "G5", "C6"]):
        t.put(1.5 + k * 0.18, tone("square", hz(nm), 0.28, 0.14, duty=0.25,
                                   r=0.2))
    t.chord(2.3, ["C4", "E4", "G4", "C5"], 2.0, vol=0.08, duty=0.5, r=0.5)
    t.put(2.3, kick(0.5)); t.put(2.3, noise(1.2, 0.12, decay=4))
    return master(t.oneshot()[: int(3.4 * SR)], 0.8)


def leaderboard():
    """Swingy, cheeky shuffle in G. 4 bars at 104 bpm (~9.2s loop)."""
    t = Track(104, 4)
    prog = [("G2", ["B3", "D4", "G4"]), ("E2", ["B3", "E4", "G4"]),
            ("C2", ["C4", "E4", "G4"]), ("D2", ["A3", "D4", "F#4"])]
    swing = 0.62
    for bar in range(4):
        root, ch = prog[bar]
        b0 = bar * 4
        r = hz(root)
        for beat in range(4):
            t.put(b0 + beat, tone("tri", r * (1 if beat % 2 == 0 else 1.5),
                                  0.55 * t.beat, 0.33, r=0.03))
            t.put(b0 + beat + swing, tone("tri", r * 2, 0.25 * t.beat, 0.18,
                                          r=0.02))
        t.chord(b0 + 1 + swing, ch, 0.3, vol=0.05)
        t.chord(b0 + 3 + swing, ch, 0.3, vol=0.05)
        t.put(b0, kick(0.45)); t.put(b0 + 2, kick(0.45))
        t.put(b0 + 1, snare(0.15)); t.put(b0 + 3, snare(0.15))
        for beat in range(4):
            t.put(b0 + beat, hat(0.04)); t.put(b0 + beat + swing, hat(0.03))
    mel = [("B4", 1), ("D5", 1), ("G5", 2), ("F#5", 1), ("E5", 1), ("D5", 2),
           ("E5", 1), ("G5", 1), ("B5", 2), ("A5", 1), ("G5", 1), ("E5", 2),
           ("C5", 1), ("E5", 1), ("G5", 1), ("E5", 1), ("A5", 2), ("G5", 2),
           ("F#5", 1), ("A5", 1), ("D6", 2), ("C6", 1), ("A5", 1), ("F#5", 2)]
    pos = 0.0
    for nm, ln in mel:
        dur = ln * 0.5 * (swing / 0.5 if ln == 1 and (pos % 1) == 0 else 1)
        t.put(pos, tone("square", hz(nm), ln * 0.5 * t.beat * 0.8, 0.1,
                        duty=0.25, r=0.05))
        pos += ln * 0.5
        del dur
    return master(t.loop_mix())


def podium():
    """Triumphant fanfare + celebratory loop in Bb. 8 bars at 128 bpm."""
    t = Track(128, 8)
    prog = [("Bb1", ["D4", "F4", "Bb4"]), ("Eb2", ["Eb4", "G4", "Bb4"]),
            ("G1", ["D4", "G4", "Bb4"]), ("F2", ["C4", "F4", "A4"])]
    for bar in range(8):
        root, ch = prog[bar % 4]
        b0 = bar * 4
        r = hz(root)
        for s in range(8):
            t.put(b0 + s * 0.5, tone("tri", r * (2 if s % 2 else 1),
                                     0.45 * t.beat, 0.3, r=0.03))
        t.chord(b0, ch, 1.6, vol=0.05, duty=0.5, r=0.2)
        t.chord(b0 + 2, ch, 1.6, vol=0.05, duty=0.5, r=0.2)
        t.put(b0, kick()); t.put(b0 + 1, kick(0.3)); t.put(b0 + 2, kick())
        t.put(b0 + 3, kick(0.3))
        t.put(b0 + 1, snare()); t.put(b0 + 3, snare())
        t.put(b0 + 3.5, snare(0.1))
        for h in range(8):
            t.put(b0 + h * 0.5, hat(0.04, open_=(h == 7)))
    fan = [("Bb4", 1), ("Bb4", 1), ("D5", 1), ("F5", 3), ("Eb5", 1), ("G5", 1),
           ("Bb5", 4), ("A5", 1), ("G5", 1), ("F5", 2), ("D5", 2), ("Eb5", 1),
           ("F5", 1), ("G5", 1), ("A5", 1), ("Bb5", 4),
           ("F5", 1), ("G5", 1), ("Bb5", 2), ("C6", 2), ("Bb5", 1), ("G5", 1),
           ("Eb5", 2), ("F5", 2), ("D5", 1), ("F5", 1), ("Bb5", 2), ("A5", 2),
           ("C6", 2), ("Bb5", 4)]
    pos = 0.0
    for nm, ln in fan:
        t.put(pos, tone("square", hz(nm), ln * 0.5 * t.beat * 0.88, 0.12,
                        duty=0.25, vib=0.006, r=0.06))
        t.put(pos, tone("square", hz(nm) / 2, ln * 0.5 * t.beat * 0.88, 0.05,
                        duty=0.5, r=0.06))
        pos += ln * 0.5
    return master(t.loop_mix())


# ---------------------------------------------------------------- sfx

def sfx_join():
    a = tone("square", hz("E5"), 0.05, 0.25, duty=0.25, r=0.02)
    b = tone("square", hz("B5"), 0.09, 0.25, duty=0.25, r=0.06)
    out = np.zeros(int(0.22 * SR))
    out[: len(a)] += a
    i = int(0.045 * SR)
    out[i: i + len(b)] += b[: len(out) - i]
    return master(out, 0.7)


def sfx_tick():
    out = tone("sine", 1800, 0.012, 0.6, a=0.001, d=0.01, s=0.2, r=0.02)
    out = np.concatenate([out, np.zeros(int(0.03 * SR))])
    return master(out + np.resize(noise(0.01, 0.2, 200), len(out)), 0.55)


def sfx_correct():
    out = np.zeros(int(0.7 * SR))
    for k, nm in enumerate(["G5", "B5", "D6", "G6"]):
        s = tone("square", hz(nm), 0.09 if k < 3 else 0.35, 0.2, duty=0.25,
                 r=0.12)
        i = int(k * 0.07 * SR)
        out[i: i + len(s)] += s[: len(out) - i]
    return master(out, 0.75)


def sfx_wrong():
    a = tone("square", hz("Eb3"), 0.16, 0.25, duty=0.5, r=0.03,
             slide_to=hz("D3"))
    b = tone("square", hz("A2"), 0.32, 0.25, duty=0.5, r=0.12,
             slide_to=hz("Ab2"))
    out = np.zeros(int(0.62 * SR))
    out[: len(a)] += a
    i = int(0.17 * SR)
    out[i: i + len(b)] += b[: len(out) - i]
    return master(out, 0.62)


def sfx_go():
    """Countdown 'go' whoosh-up."""
    s = tone("square", 220, 0.35, 0.18, duty=0.25, slide_to=880, r=0.1)
    return master(s + np.resize(noise(0.45, 0.1, decay=6), len(s)), 0.7)


def sfx_timeup():
    out = np.zeros(int(0.7 * SR))
    for k in range(3):
        s = tone("square", hz("C4"), 0.12, 0.2, duty=0.5, r=0.03)
        i = int(k * 0.16 * SR)
        out[i: i + len(s)] += s
    return master(out, 0.6)


# ---------------------------------------------------------------- write

def write(name, data):
    pcm = (np.clip(data, -1, 1) * 32767).astype(np.int16)
    wav = os.path.join(OUT, f"{name}.wav")
    with wave.open(wav, "wb") as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes(pcm.tobytes())
    if shutil.which("ffmpeg"):
        mp3 = os.path.join(OUT, f"{name}.mp3")
        subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", wav,
                        "-ac", "1", "-codec:a", "libmp3lame", "-b:a", "64k",
                        mp3], check=True)
        os.remove(wav)
        print("wrote", mp3, os.path.getsize(mp3))
    else:
        print("wrote", wav, os.path.getsize(wav))


if __name__ == "__main__":
    write("lobby-loop", lobby())
    write("question-loop", question())
    write("reveal-sting", reveal())
    write("leaderboard-loop", leaderboard())
    write("podium-loop", podium())
    write("sfx-join", sfx_join())
    write("sfx-tick", sfx_tick())
    write("sfx-correct", sfx_correct())
    write("sfx-wrong", sfx_wrong())
    write("sfx-go", sfx_go())
    write("sfx-timeup", sfx_timeup())
