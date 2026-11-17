"use client";

import { useEffect, useState } from "react";
import {
  MessagesBubble,
  MessagesInbox,
  MessagesThreadButton,
} from "@/components/messages-inbox";

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

/** Teacher inbox — reply to student threads. */
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
      (data.threads ?? []).filter(
        (t: Thread & { isStudent?: boolean }) => !t.isStudent,
      ),
    );
  }

  async function openThread(id: string) {
    setActiveId(id);
    const res = await fetch(`/api/messages?threadId=${encodeURIComponent(id)}`);
    if (!res.ok) {
      setError("This conversation couldn’t be opened. Try again.");
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
      if (!res.ok) throw new Error(data.error ?? "Your reply wasn’t sent. Try again.");
      setDraft("");
      await openThread(activeId);
      await load();
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Your reply wasn’t sent. Try again.",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <section id="messages" className="space-y-4">
      <div>
        <h2 className="portal-section-title">Messages</h2>
        <p className="portal-section-lede">
          Read and reply to messages from students in your classes.
        </p>
      </div>
      {error ? (
        <p className="form-alert form-alert--error" role="alert">
          {error}
        </p>
      ) : null}
      {threads.length === 0 ? (
        <div className="portal-empty">
          <p className="portal-empty__title">No messages yet</p>
          <p className="portal-empty__body">
            When students in your classes message you, conversations appear
            here.
          </p>
        </div>
      ) : (
        <MessagesInbox
          sidebar={
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
          }
        >
          {!activeId ? (
            <div className="portal-empty !border-0 !bg-transparent !shadow-none">
              <p className="portal-empty__title">Select a conversation</p>
              <p className="portal-empty__body">
                Choose a conversation to read and reply.
              </p>
            </div>
          ) : (
            <div className="msg-conversation">
              <header className="msg-conversation__head">
                <p className="portal-eyebrow">{otherName}</p>
                <h3 className="mt-1 text-xl font-semibold tracking-tight text-forest-950">
                  {subject || "Conversation"}
                </h3>
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
                  placeholder="Write a reply"
                />
                <button
                  type="button"
                  disabled={busy || draft.trim().length < 1}
                  onClick={() => void reply()}
                  className="btn-primary"
                >
                  {busy ? "Sending…" : "Reply"}
                </button>
              </div>
            </div>
          )}
        </MessagesInbox>
      )}
    </section>
  );
}
