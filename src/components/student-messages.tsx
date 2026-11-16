"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  MessagesBubble,
  MessagesInbox,
  MessagesThreadButton,
} from "@/components/messages-inbox";

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
    <MessagesInbox
      sidebar={
        <>
          <button
            type="button"
            onClick={() => {
              setActiveId(null);
              setMsgs([]);
              setComposing(true);
              setDraft("");
            }}
            className="btn-primary w-full"
          >
            New message
          </button>
          {threads.length === 0 ? (
            <div className="portal-empty !py-6">
              <p className="portal-empty__title">No conversations yet</p>
              <p className="portal-empty__body">
                Message a teacher after you join a class from Account.
              </p>
            </div>
          ) : (
            <ul className="msg-thread-list">
              {threads.map((t) => (
                <li key={t.id}>
                  <MessagesThreadButton
                    active={activeId === t.id}
                    title={t.otherName}
                    subtitle={t.subject}
                    onClick={() => void openThread(t.id)}
                  />
                </li>
              ))}
            </ul>
          )}
        </>
      }
    >
      {error ? (
        <p className="mb-3 rounded-[10px] border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
          {error}
        </p>
      ) : null}

      {composing ? (
        <div className="space-y-4">
          <header>
            <p className="portal-eyebrow">Compose</p>
            <h2 className="mt-1 text-xl font-semibold tracking-tight text-forest-950">
              New message
            </h2>
          </header>
          {teachers.length === 0 ? (
            <div className="portal-empty">
              <p className="portal-empty__title">Join a class first</p>
              <p className="portal-empty__body">
                Open{" "}
                <Link href="/account" className="font-semibold text-forest-800">
                  Account
                </Link>{" "}
                and enter your teacher’s invite code, then write them here.
              </p>
            </div>
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
                  placeholder="Write to your teacher…"
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
        <div className="msg-conversation">
          <header className="msg-conversation__head">
            <p className="portal-eyebrow">{otherName}</p>
            <h2 className="mt-1 text-xl font-semibold tracking-tight text-forest-950">
              {subject || "Conversation"}
            </h2>
          </header>
          <ul className="msg-conversation__list">
            {msgs.map((m) => (
              <MessagesBubble
                key={m.id}
                name={m.senderName}
                when={new Date(m.createdAt).toLocaleString()}
                body={m.body}
              />
            ))}
          </ul>
          <div className="msg-conversation__compose">
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
        <div className="portal-empty !border-0 !bg-transparent !shadow-none">
          <p className="portal-empty__title">Select a conversation</p>
          <p className="portal-empty__body">
            Or start a new message to a teacher of a class you joined.
          </p>
        </div>
      )}
    </MessagesInbox>
  );
}
