"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function JoinClass() {
  const [code, setCode] = useState("");
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(
    null,
  );
  const [busy, setBusy] = useState(false);
  const router = useRouter();

  async function join() {
    setBusy(true);
    setMessage(null);
    try {
      const res = await fetch("/api/education/classrooms", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ inviteCode: code }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(
          data.error ?? "We couldn’t join that class. Check the code and try again.",
        );
      }
      setMessage({ ok: true, text: `You joined ${data.classroom.name}.` });
      setCode("");
      router.refresh();
    } catch (e) {
      setMessage({
        ok: false,
        text:
          e instanceof Error
            ? e.message
            : "We couldn’t join that class. Check the code and try again.",
      });
    } finally {
      setBusy(false);
    }
  }

  return (
    <form
      className="portal-panel space-y-3"
      onSubmit={(e) => {
        e.preventDefault();
        if (!busy && code.length >= 4) void join();
      }}
    >
      <div>
        <h3 className="text-base font-semibold text-forest-950">Join a class</h3>
        <p className="mt-0.5 text-sm text-ink-muted">
          Enter the class code your teacher gave you.
        </p>
      </div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <label className="block flex-1 text-sm font-semibold text-forest-900">
          Class code
          <input
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            className="field mt-1.5 font-mono tracking-wider"
            placeholder="ABCD1234"
            autoCapitalize="characters"
            autoComplete="off"
            spellCheck={false}
          />
        </label>
        <button
          type="submit"
          disabled={busy || code.length < 4}
          className="btn-primary sm:shrink-0"
        >
          {busy ? "Joining…" : "Join class"}
        </button>
      </div>
      {message ? (
        <p
          className={`form-alert ${message.ok ? "form-alert--success" : "form-alert--error"}`}
          role={message.ok ? "status" : "alert"}
        >
          {message.text}
        </p>
      ) : null}
    </form>
  );
}
