"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type Teacher = {
  id: string;
  name: string;
  classrooms: { id: string; name: string }[];
};

type Thread = {
  id: string;
  subject: string;
  updatedAt: string;
  otherName: string;
  isStudent: boolean;
};

type Msg = {
  id: string;
  body: string;
  senderId: string;
  senderName: string;
  createdAt: string;
};

export function StudentMessages() {
  const [threads, setThreads] = useState<Thread[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [otherName, setOtherName] = useState("");
  const [subject, setSubject] = useState("");
  const [teacherId, setTeacherId] = useState("");
  const [draft, setDraft] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [composing, setComposing] = useState(false);

  async function loadList() {
    const res = await fetch("/api/messages");
    if (!res.ok) {
      setError("Could not load messages");
      return;
    }
    const data = await res.json();
    setThreads(data.threads ?? []);
    setTeachers(data.teachers ?? []);
    if (!teacherId && data.teachers?.[0]) {
      setTeacherId(data.teachers[0].id);
    }
  }

  async function openThread(id: string) {
    setError(null);
    setComposing(false);
    setActiveId(id);
    const res = await fetch(`/api/messages?threadId=${encodeURIComponent(id)}`);
    if (!res.ok) {
      setError("Could not open conversation");
      return;
    }
    const data = await res.json();
    setMsgs(data.messages ?? []);
    setOtherName(data.thread?.otherParty?.displayName ?? "Teacher");
    setSubject(data.thread?.subject ?? "");
  }

  useEffect(() => {
    void loadList();
  }, []);

  async function sendReply() {
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
      await loadList();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Send failed");
    } finally {
      setBusy(false);
    }
  }

  async function startThread() {
    if (!teacherId || draft.trim().length < 1) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          teacherId,
          body: draft.trim(),
          subject: subject.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Send failed");
      setDraft("");
      setSubject("");
      setComposing(false);
      await loadList();
      if (data.threadId) await openThread(data.threadId);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Send failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,14rem)_1fr]">
      <aside className="space-y-3">
        <button
          type="button"
          onClick={() => {
            setActiveId(null);
            setMsgs([]);
            setComposing(true);
            setDraft("");
          }}
          className="btn-primary w-full !py-2.5 text-sm"
        >
          New message
        </button>
        {threads.length === 0 ? (
          <p className="text-sm text-ink-muted">No conversations yet.</p>
        ) : (
          <ul className="divide-y divide-line rounded-xl border border-line">
            {threads.map((t) => (
              <li key={t.id}>
                <button
                  type="button"
                  onClick={() => void openThread(t.id)}
                  className={`w-full px-3 py-3 text-left transition hover:bg-forest-100 ${
                    activeId === t.id ? "bg-forest-100" : ""
                  }`}
                >
                  <span className="block text-sm font-semibold text-forest-950">
                    {t.otherName}
                  </span>
                  <span className="mt-0.5 block truncate text-xs text-ink-muted">
                    {t.subject}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </aside>

      <section className="min-h-[20rem] rounded-2xl border border-line bg-surface px-5 py-5 sm:px-6">
        {error && <p className="mb-3 text-sm text-red-700">{error}</p>}

        {composing ? (
          <div className="space-y-4">
            <h2 className="display text-xl text-forest-950">New message</h2>
            {teachers.length === 0 ? (
              <p className="text-sm text-ink-muted">
                Join a class from{" "}
                <Link href="/account" className="font-semibold text-forest-800">
                  Account
                </Link>{" "}
                with your Rebbe’s invite code, then you can message them here.
              </p>
            ) : (
              <>
                <label className="block text-sm font-semibold text-forest-900">
                  Teacher
                  <select
                    value={teacherId}
                    onChange={(e) => setTeacherId(e.target.value)}
                    className="field mt-1.5"
                  >
                    {teachers.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name}
                        {t.classrooms[0] ? ` · ${t.classrooms[0].name}` : ""}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block text-sm font-semibold text-forest-900">
                  Subject (optional)
                  <input
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="field mt-1.5"
                    placeholder="What’s this about?"
                  />
                </label>
                <label className="block text-sm font-semibold text-forest-900">
                  Message
                  <textarea
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    rows={5}
                    className="field mt-1.5"
                    placeholder="Write to your Rebbe…"
                  />
                </label>
                <button
                  type="button"
                  disabled={busy || !teacherId || draft.trim().length < 1}
                  onClick={() => void startThread()}
                  className="btn-primary"
                >
                  {busy ? "Sending…" : "Send"}
                </button>
              </>
            )}
          </div>
        ) : activeId ? (
          <div className="flex h-full flex-col">
            <header className="border-b border-line pb-3">
              <p className="text-sm font-semibold text-forest-700">
                {otherName}
              </p>
              <h2 className="display mt-0.5 text-xl text-forest-950">
                {subject || "Conversation"}
              </h2>
            </header>
            <ul className="mt-4 max-h-[22rem] flex-1 space-y-3 overflow-y-auto">
              {msgs.map((m) => (
                <li key={m.id} className="text-sm">
                  <p className="font-semibold text-forest-900">
                    {m.senderName}
                    <span className="ml-2 font-normal text-ink-muted">
                      {new Date(m.createdAt).toLocaleString()}
                    </span>
                  </p>
                  <p className="mt-1 whitespace-pre-wrap text-ink">{m.body}</p>
                </li>
              ))}
            </ul>
            <div className="mt-4 space-y-2 border-t border-line pt-4">
              <textarea
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                rows={3}
                className="field"
                placeholder="Reply…"
              />
              <button
                type="button"
                disabled={busy || draft.trim().length < 1}
                onClick={() => void sendReply()}
                className="btn-primary"
              >
                {busy ? "Sending…" : "Reply"}
              </button>
            </div>
          </div>
        ) : (
          <p className="text-ink-muted">
            Select a conversation or start a new message to your teacher.
          </p>
        )}
      </section>
    </div>
  );
}
