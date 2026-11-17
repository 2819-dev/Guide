"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { BlitzAvatar, BlitzBolt, BlitzWordmark } from "@/components/blitz/brand";
import { BlitzStage } from "@/components/blitz/stage";
import { BLITZ_AVATARS, DEFAULT_AVATAR_ID } from "@/lib/blitz/avatars";
import { normalizePin } from "@/lib/blitz/pin";
import type { BlitzThemeId } from "@/lib/blitz/types";

type Props = {
  realName: string;
  isTeacher: boolean;
};

type Peek = {
  id: string;
  quizTitle: string;
  phase: string;
  allowNicknames: boolean;
  allowAvatars: boolean;
  mode: string;
  theme: BlitzThemeId;
  playerCount: number;
};

type StudentChallenge = {
  id: string;
  title: string;
  classroomName: string;
  questionCount: number;
  dueAt: string | null;
  open: boolean;
  status: "not_started" | "in_progress" | "finished";
  score: number | null;
};

const AVATAR_KEY = "blitz:avatar";
const NICK_KEY = "blitz:nickname";

export function BlitzJoinPanel({ realName, isTeacher }: Props) {
  const router = useRouter();
  const params = useSearchParams();
  const initialPin = useMemo(() => normalizePin(params.get("pin") ?? ""), [params]);
  const [pin, setPin] = useState(initialPin);
  const [peek, setPeek] = useState<Peek | null>(null);
  const [nickname, setNickname] = useState("");
  const [avatarId, setAvatarId] = useState(DEFAULT_AVATAR_ID);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [challenges, setChallenges] = useState<StudentChallenge[]>([]);

  useEffect(() => {
    try {
      const a = window.localStorage.getItem(AVATAR_KEY);
      const n = window.localStorage.getItem(NICK_KEY);
      if (a && BLITZ_AVATARS.some((x) => x.id === a)) setAvatarId(a);
      if (n) setNickname(n.slice(0, 24));
    } catch {
      /* ignore */
    }
    if (!isTeacher) {
      void fetch("/api/blitz/challenges")
        .then((r) => (r.ok ? r.json() : null))
        .then((d) => {
          if (d?.role === "student") setChallenges(d.challenges ?? []);
        })
        .catch(() => undefined);
    }
  }, [isTeacher]);

  const lookUp = useCallback(async (value: string) => {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/blitz/games/peek?pin=${encodeURIComponent(value)}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "No game found with that PIN.");
      setPeek(data.game);
    } catch (e) {
      setError(e instanceof Error ? e.message : "No game found with that PIN.");
      setPeek(null);
    } finally {
      setBusy(false);
    }
  }, []);

  useEffect(() => {
    if (initialPin.length === 6) void lookUp(initialPin);
  }, [initialPin, lookUp]);

  async function join() {
    if (!peek) return;
    setBusy(true);
    setError(null);
    try {
      try {
        window.localStorage.setItem(AVATAR_KEY, avatarId);
        window.localStorage.setItem(NICK_KEY, nickname);
      } catch {
        /* ignore */
      }
      const res = await fetch("/api/blitz/games/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin, nickname: nickname.trim() || null, avatarId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not join the game. Try again.");
      router.push(`/apps/blitz/play/${data.game.id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not join the game. Try again.");
      setBusy(false);
    }
  }

  const openChallenges = challenges.filter((c) => c.open && c.status !== "finished");
  const doneChallenges = challenges.filter((c) => !c.open || c.status === "finished");

  return (
    <BlitzStage theme={peek?.theme ?? "night"}>
      <header className="bz-topbar">
        <Link href={isTeacher ? "/apps/blitz/library" : "/apps"} className="bz-btn bz-btn--quiet bz-btn--sm no-underline">
          ← {isTeacher ? "Library" : "My apps"}
        </Link>
        <span className="bz-faint min-w-0 truncate">Playing as {realName}</span>
      </header>
      <div className="bz-join">
        <BlitzWordmark size="xl" />

        {!peek ? (
          <form
            className="bz-join-card"
            onSubmit={(e) => {
              e.preventDefault();
              if (pin.length === 6) void lookUp(pin);
            }}
          >
            <label htmlFor="bz-pin" className="bz-kicker" style={{ display: "block", textAlign: "center", marginBottom: "0.7rem" }}>
              Game PIN
            </label>
            <input
              id="bz-pin"
              className="bz-pin-input"
              inputMode="numeric"
              autoComplete="off"
              autoFocus
              value={pin}
              onChange={(e) => {
                const v = normalizePin(e.target.value);
                setPin(v);
                setError(null);
                if (v.length === 6) void lookUp(v);
              }}
              placeholder="000000"
              maxLength={6}
            />
            {error ? (
              <p className="bz-alert mt-3" role="alert" style={{ color: "#8a1d22", background: "#ffe1e2" }}>
                {error}
              </p>
            ) : null}
            <button type="submit" className="bz-btn bz-btn--primary bz-btn--block bz-btn--lg mt-4" disabled={busy || pin.length !== 6}>
              {busy ? "Checking…" : "Continue"}
            </button>
            <p className="bz-faint mt-3 text-center" style={{ color: "#5b5490" }}>
              Find the 6-digit PIN on your teacher’s screen.
            </p>
          </form>
        ) : (
          <div className="bz-join-card">
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0">
                <p className="bz-kicker">You’re joining</p>
                <p className="bz-h3 mt-1" style={{ overflowWrap: "anywhere" }}>
                  {peek.quizTitle}
                </p>
              </div>
              <button
                type="button"
                className="bz-btn bz-btn--sm"
                style={{ color: "var(--bz-ink)", borderColor: "var(--bz-ink)", background: "transparent" }}
                onClick={() => {
                  setPeek(null);
                  setPin("");
                }}
              >
                Change
              </button>
            </div>

            {peek.allowAvatars ? (
              <div className="mt-4 flex justify-center">
                <BlitzAvatar id={avatarId} size={104} className="bz-bigavatar" />
              </div>
            ) : null}

            {peek.allowNicknames ? (
              <label className="mt-4 block">
                <span className="bz-label">Nickname</span>
                <input
                  className="bz-input"
                  value={nickname}
                  maxLength={24}
                  onChange={(e) => setNickname(e.target.value.slice(0, 24))}
                  placeholder={realName}
                />
              </label>
            ) : (
              <p className="mt-4 text-sm font-semibold" style={{ color: "#5b5490" }}>
                Your teacher is using real names. You’ll appear as <strong>{realName}</strong>.
              </p>
            )}

            {peek.allowAvatars ? (
              <div className="mt-4">
                <span className="bz-label">Choose an avatar</span>
                <div className="bz-avatar-grid">
                  {BLITZ_AVATARS.map((a) => (
                    <button
                      key={a.id}
                      type="button"
                      className="bz-avatar-opt"
                      aria-pressed={avatarId === a.id}
                      aria-label={a.label}
                      title={a.label}
                      onClick={() => setAvatarId(a.id)}
                    >
                      <BlitzAvatar id={a.id} size={52} />
                    </button>
                  ))}
                </div>
              </div>
            ) : null}

            {error ? (
              <p className="bz-alert mt-3" role="alert" style={{ color: "#8a1d22", background: "#ffe1e2" }}>
                {error}
              </p>
            ) : null}

            <button type="button" className="bz-btn bz-btn--primary bz-btn--block bz-btn--lg mt-5" disabled={busy} onClick={() => void join()}>
              {busy ? "Joining…" : "Join game"} <BlitzBolt size={22} color="var(--bz-sun)" />
            </button>
            <p className="bz-faint mt-3 text-center" style={{ color: "#5b5490" }}>
              {peek.playerCount} {peek.playerCount === 1 ? "player" : "players"} joined · {peek.mode === "team" ? "Team battle" : peek.mode === "accuracy" ? "Accuracy mode" : "Classic mode"}
            </p>
          </div>
        )}

        {!isTeacher && challenges.length > 0 ? (
          <section className="w-full">
            <p className="bz-kicker mb-2">Your challenges</p>
            <ul className="bz-list">
              {openChallenges.map((c) => (
                <li key={c.id}>
                  <Link href={`/apps/blitz/challenge/${c.id}`} className="bz-listrow no-underline">
                    <span className="min-w-0">
                      <strong className="bz-h3" style={{ display: "block" }}>
                        {c.title}
                      </strong>
                      <span className="bz-faint">
                        {c.classroomName} · {c.questionCount} {c.questionCount === 1 ? "question" : "questions"}
                        {c.dueAt ? ` · Due ${formatDue(c.dueAt)}` : ""}
                      </span>
                    </span>
                    <span className="bz-btn bz-btn--primary bz-btn--sm">{c.status === "in_progress" ? "Resume" : "Play"}</span>
                  </Link>
                </li>
              ))}
              {doneChallenges.slice(0, 4).map((c) => (
                <li key={c.id}>
                  <Link href={`/apps/blitz/challenge/${c.id}`} className="bz-listrow no-underline" style={{ opacity: 0.75 }}>
                    <span className="min-w-0">
                      <strong style={{ display: "block" }}>{c.title}</strong>
                      <span className="bz-faint">
                        {c.status === "finished" ? `Finished · ${c.score?.toLocaleString() ?? 0} points` : "Closed"}
                      </span>
                    </span>
                    <span className="bz-chip">{c.status === "finished" ? "Review" : "Closed"}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        <p className="bz-faint flex items-center gap-1">
          <BlitzBolt size={14} /> You’re signed in with Guide, so your scores stay with your class.
        </p>
      </div>
    </BlitzStage>
  );
}

export function formatDue(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString(undefined, { weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}
