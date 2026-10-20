"use client";

import { useEffect, useState } from "react";

type Thread = {
  id: string;
  subject: string;
  updatedAt: string;
  otherName: string;
};

type Msg = {
  id: string;
  body: string;
  senderName: string;
  createdAt: string;
};

/** Rebbe inbox — reply to student threads. */
export function TeacherMessages() {
  const [threads, setThreads] = useState<Thread[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [subject, setSubject] = useState("");
  const [otherName, setOtherName] = useState("");
  const [draft, setDraft] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function load() {
    const res = await fetch("/api/messages");
    if (!res.ok) return;
    const data = await res.json();
    setThreads(
      (data.threads ?? []).filter((t: Thread & { isStudent?: boolean }) => !t.isStudent),
    );
  }

  async function openThread(id: string) {
    setActiveId(id);
    const res = await fetch(`/api/messages?threadId=${encodeURIComponent(id)}`);
    if (!res.ok) {
      setError("Could not open conversation");
      return;
    }
    const data = await res.json();
    setMsgs(data.messages ?? []);
    setOtherName(data.thread?.otherParty?.displayName ?? "Student");
    setSubject(data.thread?.subject ?? "");
  }

  useEffect(() => {
    void load();
  }, []);

  async function reply() {
    if (!activeId || draft.trim().length < 1) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ threadId: activeId, body: draft.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Send failed");
      setDraft("");
      await openThread(activeId);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Send failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="display text-2xl font-semibold text-forest-900">
          Student messages
        </h2>
        <p className="mt-1 text-sm text-ink-muted">
          Replies from students who joined your classes.
        </p>
      </div>
      {error && <p className="text-sm text-red-700">{error}</p>}
      {threads.length === 0 ? (
        <p className="panel text-ink-muted">No student messages yet.</p>
      ) : (
        <div className="grid gap-4 lg:grid-cols-[14rem_1fr]">
          <ul className="divide-y divide-line rounded-xl border border-line">
            {threads.map((t) => (
              <li key={t.id}>
                <button
                  type="button"
                  onClick={() => void openThread(t.id)}
                  className={`w-full px-3 py-3 text-left text-sm hover:bg-forest-100 ${
                    activeId === t.id ? "bg-forest-100" : ""
                  }`}
                >
                  <span className="font-semibold text-forest-950">
                    {t.otherName}
                  </span>
                  <span className="mt-0.5 block truncate text-xs text-ink-muted">
                    {t.subject}
                  </span>
                </button>
              </li>
            ))}
          </ul>
          <div className="rounded-xl border border-line px-4 py-4">
            {!activeId ? (
              <p className="text-sm text-ink-muted">Select a conversation.</p>
            ) : (
              <>
                <p className="text-sm font-semibold text-forest-700">
                  {otherName}
                </p>
                <p className="font-semibold text-forest-950">{subject}</p>
                <ul className="mt-3 max-h-64 space-y-2 overflow-y-auto text-sm">
                  {msgs.map((m) => (
                    <li key={m.id}>
                      <span className="font-semibold">{m.senderName}</span>
                      <span className="ml-2 text-xs text-ink-muted">
                        {new Date(m.createdAt).toLocaleString()}
                      </span>
                      <p className="mt-0.5 whitespace-pre-wrap">{m.body}</p>
                    </li>
                  ))}
                </ul>
                <textarea
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  rows={3}
                  className="field mt-3"
                  placeholder="Reply…"
                />
                <button
                  type="button"
                  disabled={busy || draft.trim().length < 1}
                  onClick={() => void reply()}
                  className="btn-primary mt-2"
                >
                  {busy ? "Sending…" : "Reply"}
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
