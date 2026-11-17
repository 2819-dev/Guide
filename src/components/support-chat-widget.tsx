"use client";

import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

type Msg = {
  id: number;
  sender: "user" | "assistant" | "agent" | "system";
  authorName: string | null;
  body: string;
  createdAt: string;
};
type Status = "ai" | "waiting" | "agent" | "closed";
type Stored = { chatId: string; token: string };

const STORE_KEY = "guide:support-chat";

/** Full-screen game views where a floating bubble would get in the way. */
function hiddenOn(pathname: string) {
  return (
    pathname === "/admin" ||
    pathname.startsWith("/apps/blitz/host") ||
    pathname.startsWith("/apps/blitz/play") ||
    pathname.startsWith("/apps/blitz/join") ||
    pathname.startsWith("/apps/blitz/challenge")
  );
}

function readStored(): Stored | null {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    const v = raw ? (JSON.parse(raw) as Stored) : null;
    return v?.chatId && v?.token ? v : null;
  } catch {
    return null;
  }
}
function writeStored(v: Stored | null) {
  try {
    if (v) localStorage.setItem(STORE_KEY, JSON.stringify(v));
    else localStorage.removeItem(STORE_KEY);
  } catch {
    /* private mode: chat still works for this page view */
  }
}

function statusLine(status: Status, agentName: string | null) {
  if (status === "agent") return agentName && agentName !== "Guide team" ? `${agentName}, Guide team` : "Guide team";
  if (status === "waiting") return "Waiting for a team member";
  return "AI assistant · Ask for a person anytime";
}

function ChatGlyph() {
  return (
    <svg viewBox="0 0 24 24" width="26" height="26" aria-hidden="true">
      <path
        d="M4 5.5A2.5 2.5 0 0 1 6.5 3h11A2.5 2.5 0 0 1 20 5.5v8a2.5 2.5 0 0 1-2.5 2.5H10l-4.2 3.6A.5.5 0 0 1 5 19.2V16h-.5A.5.5 0 0 1 4 15.5z"
        fill="currentColor"
      />
      <circle cx="9" cy="9.75" r="1.15" fill="var(--forest-700)" />
      <circle cx="12" cy="9.75" r="1.15" fill="var(--forest-700)" />
      <circle cx="15" cy="9.75" r="1.15" fill="var(--forest-700)" />
    </svg>
  );
}

function Avatar({ kind }: { kind: "assistant" | "agent" }) {
  return (
    <span className={`gchat-avatar gchat-avatar--${kind}`} aria-hidden="true">
      {kind === "assistant" ? (
        <svg viewBox="0 0 24 24" width="16" height="16">
          <path
            d="M12 2.5l1.9 5.1 5.1 1.9-5.1 1.9L12 16.5l-1.9-5.1L5 9.5l5.1-1.9z"
            fill="currentColor"
          />
          <path d="M18.5 14.5l.8 2.2 2.2.8-2.2.8-.8 2.2-.8-2.2-2.2-.8 2.2-.8z" fill="currentColor" />
        </svg>
      ) : (
        <svg viewBox="0 0 24 24" width="16" height="16">
          <circle cx="12" cy="8" r="4" fill="currentColor" />
          <path d="M4 20c.8-4 4-6 8-6s7.2 2 8 6z" fill="currentColor" />
        </svg>
      )}
    </span>
  );
}

export function SupportChatWidget() {
  const pathname = usePathname() ?? "";
  const [open, setOpen] = useState(false);
  const [greeting, setGreeting] = useState<string | null>(null);
  const [stored, setStored] = useState<Stored | null>(null);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [status, setStatus] = useState<Status>("ai");
  const [agentName, setAgentName] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [unread, setUnread] = useState(false);
  const [signedIn, setSignedIn] = useState<boolean | null>(null);
  const [email, setEmail] = useState("");
  const [emailSaved, setEmailSaved] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const lastId = useRef(0);
  const openRef = useRef(open);
  useEffect(() => {
    openRef.current = open;
  }, [open]);

  const merge = useCallback((incoming: Msg[]) => {
    if (!incoming.length) return;
    setMessages((prev) => {
      const seen = new Set(prev.map((m) => m.id));
      const next = [...prev, ...incoming.filter((m) => !seen.has(m.id))];
      lastId.current = next.reduce((max, m) => Math.max(max, m.id), lastId.current);
      return next;
    });
    if (!openRef.current && incoming.some((m) => m.sender === "agent")) setUnread(true);
  }, []);

  const apply = useCallback(
    (data: { status?: Status; agentName?: string | null; messages?: Msg[] }) => {
      if (data.status) setStatus(data.status);
      if (data.agentName !== undefined) setAgentName(data.agentName);
      if (data.messages) merge(data.messages);
    },
    [merge],
  );

  // Restore an open chat from this device.
  useEffect(() => {
    const s = readStored();
    if (!s) return;
    setStored(s);
    fetch(`/api/support/chat?chatId=${s.chatId}&token=${s.token}`)
      .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
      .then(apply)
      .catch((code) => {
        if (code === 404) {
          writeStored(null);
          setStored(null);
        }
      });
  }, [apply]);

  // Greeting + signed-in state, loaded the first time the window opens.
  useEffect(() => {
    if (!open) return;
    if (greeting === null) {
      fetch("/api/support/chat")
        .then((r) => r.json())
        .then((d) => setGreeting(d.greeting ?? ""))
        .catch(() => setGreeting(""));
    }
    if (signedIn === null) {
      fetch("/api/me")
        .then((r) => r.json())
        .then((d) => setSignedIn(Boolean(d.profile)))
        .catch(() => setSignedIn(false));
    }
    setUnread(false);
    const t = window.setTimeout(() => inputRef.current?.focus(), 60);
    return () => window.clearTimeout(t);
  }, [open, greeting, signedIn]);

  // Poll for Guide team replies while a person is involved.
  useEffect(() => {
    if (!stored || (status !== "waiting" && status !== "agent")) return;
    const every = open ? 3500 : 15000;
    const id = window.setInterval(() => {
      if (document.hidden) return;
      fetch(`/api/support/chat?chatId=${stored.chatId}&token=${stored.token}&after=${lastId.current}`)
        .then((r) => (r.ok ? r.json() : null))
        .then((d) => d && apply(d))
        .catch(() => {});
    }, every);
    return () => window.clearInterval(id);
  }, [stored, status, open, apply]);

  useEffect(() => {
    const el = listRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, sending, open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  async function post(payload: Record<string, unknown>) {
    const res = await fetch("/api/support/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...payload, after: lastId.current }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error ?? "Your message could not be sent. Please try again.");
    return data;
  }

  async function send(e?: React.FormEvent) {
    e?.preventDefault();
    const body = draft.trim();
    if (!body || sending) return;
    setSending(true);
    setError(null);
    setDraft("");
    // Show the message right away; the server copy replaces it.
    const temp: Msg = { id: -Date.now(), sender: "user", authorName: null, body, createdAt: new Date().toISOString() };
    setMessages((prev) => [...prev, temp]);
    try {
      const data = await post({
        action: "send",
        chatId: stored?.chatId,
        token: stored?.token,
        body,
        page: pathname,
      });
      if (!stored || stored.chatId !== data.chatId) {
        const s = { chatId: data.chatId, token: data.token };
        writeStored(s);
        setStored(s);
      }
      setMessages((prev) => prev.filter((m) => m.id !== temp.id));
      apply(data);
    } catch (err) {
      setMessages((prev) => prev.filter((m) => m.id !== temp.id));
      setDraft(body);
      setError(err instanceof Error ? err.message : "Could not send.");
    } finally {
      setSending(false);
      inputRef.current?.focus();
    }
  }

  async function askForPerson() {
    if (!stored || sending) return;
    setSending(true);
    setError(null);
    try {
      apply(await post({ action: "human", chatId: stored.chatId, token: stored.token }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "We could not reach the Guide team. Please try again.");
    } finally {
      setSending(false);
    }
  }

  async function saveEmail(e: React.FormEvent) {
    e.preventDefault();
    if (!stored || !email.trim()) return;
    try {
      await post({ action: "email", chatId: stored.chatId, token: stored.token, email });
      setEmailSaved(true);
    } catch {
      setError("Enter a valid email address.");
    }
  }

  function newChat() {
    writeStored(null);
    setStored(null);
    setMessages([]);
    setStatus("ai");
    setAgentName(null);
    setEmailSaved(false);
    lastId.current = 0;
    inputRef.current?.focus();
  }

  if (hiddenOn(pathname)) return null;

  const onStudentTabs = pathname === "/student" || pathname.startsWith("/student/");
  const hasUserMessage = messages.some((m) => m.sender === "user" && m.id > 0);
  const showEmailAsk =
    status === "waiting" && signedIn === false && !emailSaved && hasUserMessage;

  return (
    <div className={`gchat${onStudentTabs ? " gchat--above-tabs" : ""}`}>
      {open ? (
        <section className="gchat-panel" role="dialog" aria-label="Guide live chat">
          <header className="gchat-head">
            <Avatar kind={status === "agent" ? "agent" : "assistant"} />
            <div className="gchat-head__text">
              <p className="gchat-head__title">
                {status === "agent" ? agentName ?? "Guide team" : "Guide Assistant"}
              </p>
              <p className="gchat-head__sub">
                <span className={`gchat-dot gchat-dot--${status}`} aria-hidden="true" />
                {statusLine(status, agentName)}
              </p>
            </div>
            {hasUserMessage ? (
              <button type="button" className="gchat-iconbtn gchat-iconbtn--text" onClick={newChat}>
                New chat
              </button>
            ) : null}
            <button
              type="button"
              className="gchat-iconbtn"
              aria-label="Close chat"
              onClick={() => setOpen(false)}
            >
              <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
                <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
              </svg>
            </button>
          </header>

          <div className="gchat-list" ref={listRef} aria-live="polite">
            <div className="gchat-row gchat-row--them">
              <Avatar kind="assistant" />
              <div className="gchat-bubble">
                {greeting === null ? "…" : greeting || "Hello. How can I help you with Guide today?"}
              </div>
            </div>
            {messages.map((m) =>
              m.sender === "system" ? (
                <p key={m.id} className="gchat-note">{m.body}</p>
              ) : m.sender === "user" ? (
                <div key={m.id} className="gchat-row gchat-row--me">
                  <div className="gchat-bubble">{m.body}</div>
                </div>
              ) : (
                <div key={m.id} className="gchat-row gchat-row--them">
                  <Avatar kind={m.sender === "agent" ? "agent" : "assistant"} />
                  <div>
                    {m.sender === "agent" ? (
                      <p className="gchat-author">{m.authorName && m.authorName !== "Guide team" ? `${m.authorName} · Guide team` : "Guide team"}</p>
                    ) : null}
                    <div className="gchat-bubble">{m.body}</div>
                  </div>
                </div>
              ),
            )}
            {sending ? (
              <div className="gchat-row gchat-row--them" aria-label="Guide Assistant is typing">
                <Avatar kind="assistant" />
                <div className="gchat-bubble gchat-typing">
                  <span /><span /><span />
                </div>
              </div>
            ) : null}
            {showEmailAsk ? (
              <form className="gchat-email" onSubmit={saveEmail}>
                <label htmlFor="gchat-email">Email address (optional). We'll follow up by email if you've left the chat.</label>
                <div className="gchat-email__row">
                  <input
                    id="gchat-email"
                    type="email"
                    autoComplete="email"
                    placeholder="you@school.org"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                  <button type="submit">Save</button>
                </div>
              </form>
            ) : null}
            {emailSaved && status === "waiting" ? (
              <p className="gchat-note">Thank you. We&apos;ll follow up by email if you&apos;ve left the chat.</p>
            ) : null}
          </div>

          {error ? <p className="gchat-error" role="alert">{error}</p> : null}

          {status === "ai" && hasUserMessage ? (
            <button type="button" className="gchat-human" onClick={askForPerson} disabled={sending}>
              Talk to a person
            </button>
          ) : null}

          <form className="gchat-compose" onSubmit={send}>
            <label htmlFor="gchat-input" className="sr-only">Message</label>
            <textarea
              id="gchat-input"
              ref={inputRef}
              rows={1}
              maxLength={2000}
              placeholder={status === "agent" ? "Type a reply…" : "Type your question…"}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
                  e.preventDefault();
                  void send();
                }
              }}
            />
            <button type="submit" className="gchat-send" disabled={!draft.trim() || sending} aria-label="Send">
              <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
                <path d="M4 12l16-8-6 16-2.5-6.5z" fill="currentColor" />
              </svg>
            </button>
          </form>
          <p className="gchat-foot">Guide Assistant uses AI and can make mistakes.</p>
        </section>
      ) : null}

      <button
        type="button"
        className={`gchat-launcher${open ? " gchat-launcher--open" : ""}`}
        aria-label={open ? "Close chat" : "Chat with Guide Assistant"}
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
      >
        {open ? (
          <svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true">
            <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2.4" fill="none" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        ) : (
          <ChatGlyph />
        )}
        {unread && !open ? <span className="gchat-launcher__badge" aria-label="New reply" /> : null}
      </button>
    </div>
  );
}
