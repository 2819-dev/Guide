"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { TESTQUIZ_AVATARS } from "@/lib/testquiz/avatars";
import { normalizePin } from "@/lib/testquiz/pin";

type Props = {
  realName: string;
};

export function TestQuizJoinPanel({ realName }: Props) {
  const router = useRouter();
  const params = useSearchParams();
  const initialPin = useMemo(
    () => normalizePin(params.get("pin") ?? ""),
    [params],
  );
  const [pin, setPin] = useState(initialPin);
  const [nickname, setNickname] = useState("");
  const [avatarId, setAvatarId] = useState("oak");
  const [peek, setPeek] = useState<{
    allowNicknames: boolean;
    allowAvatars: boolean;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function join() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/testquiz/games/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pin,
          nickname: nickname || null,
          avatarId,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not join");
      setPeek({
        allowNicknames: data.game.settings.allowNicknames,
        allowAvatars: data.game.settings.allowAvatars,
      });
      router.push(`/apps/testquiz/play/${data.game.id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not join");
      setBusy(false);
    }
  }

  return (
    <div className="tq-rise mx-auto max-w-lg px-5 py-10 sm:px-8">
      <div className="text-center">
        <p className="tq-badge">Play</p>
        <h1 className="tq-brand mt-2">Join a game</h1>
        <p className="mt-3 text-[var(--tq-muted)]">
          Enter the PIN on the projector. Guide login required — no guests.
        </p>
      </div>

      <div className="tq-panel mt-8 p-6 sm:p-8">
        <label className="block text-sm">
          <span className="mb-2 block text-center text-[var(--tq-muted)]">
            Game PIN
          </span>
          <input
            className="tq-input text-center text-3xl font-extrabold tracking-[0.28em]"
            inputMode="numeric"
            value={pin}
            onChange={(e) => setPin(normalizePin(e.target.value))}
            placeholder="000000"
            maxLength={6}
            aria-label="Game PIN"
          />
        </label>

        <div className="tq-soft mt-5 px-4 py-3 text-sm text-[var(--tq-muted)]">
          Playing as{" "}
          <strong className="text-[var(--tq-ink)]">{realName}</strong>
          {peek && !peek.allowNicknames
            ? " (teacher requires your Guide name)"
            : ""}
        </div>

        {(!peek || peek.allowNicknames) && (
          <label className="mt-4 block text-sm">
            <span className="mb-1 block text-[var(--tq-muted)]">
              Nickname (if allowed)
            </span>
            <input
              className="tq-input"
              value={nickname}
              onChange={(e) => setNickname(e.target.value.slice(0, 24))}
              placeholder="Optional nickname"
            />
          </label>
        )}

        {(!peek || peek.allowAvatars) && (
          <div className="mt-4">
            <p className="mb-2 text-sm text-[var(--tq-muted)]">Avatar</p>
            <div className="flex flex-wrap gap-2">
              {TESTQUIZ_AVATARS.map((a) => (
                <button
                  key={a.id}
                  type="button"
                  title={a.label}
                  className={`h-11 w-11 rounded-full border-2 transition ${
                    avatarId === a.id
                      ? "scale-110 border-white"
                      : "border-transparent opacity-80 hover:opacity-100"
                  }`}
                  style={{ background: a.color }}
                  onClick={() => setAvatarId(a.id)}
                />
              ))}
            </div>
          </div>
        )}

        {error ? (
          <p className="mt-4 rounded-xl bg-[rgba(255,107,74,0.15)] px-4 py-3 text-sm">
            {error}
          </p>
        ) : null}

        <button
          type="button"
          className="tq-btn tq-btn-primary mt-6 w-full text-lg"
          disabled={busy || pin.length !== 6}
          onClick={() => void join()}
        >
          {busy ? "Joining…" : "Enter game"}
        </button>
      </div>
    </div>
  );
}
