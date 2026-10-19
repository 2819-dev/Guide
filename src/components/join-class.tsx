"use client";

import { useState } from "react";

export function JoinClass() {
  const [code, setCode] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function join() {
    setBusy(true);
    setMessage(null);
    try {
      const res = await fetch("/api/education/classrooms", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ inviteCode: code }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not join");
      setMessage(`Joined “${data.classroom.name}”.`);
      setCode("");
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="panel flex flex-wrap items-end gap-3">
      <label className="flex-1 text-sm font-semibold text-forest-800">
        Class invite code
        <input
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          className="field mt-1 font-mono"
          placeholder="ABCD1234"
        />
      </label>
      <button
        type="button"
        disabled={busy || code.length < 4}
        onClick={() => void join()}
        className="btn-primary"
      >
        Join class
      </button>
      {message && <p className="w-full text-sm text-forest-700">{message}</p>}
    </div>
  );
}
