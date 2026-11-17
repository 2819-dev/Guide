"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AdminDeleteButton } from "@/components/admin-delete-button";

type Status = "ai" | "waiting" | "agent" | "closed";
type Summary = {
  id: string;
  status: Status;
  visitorName: string | null;
  visitorRole: string | null;
  contactEmail: string | null;
  page: string | null;
  agentName: string | null;
  handoffReason: string | null;
  createdAt: string;
  lastMessageAt: string;
  lastMessage: string | null;
  unread: boolean;
};
type Msg = {
  id: number;
  sender: "user" | "assistant" | "agent" | "system";
  authorName: string | null;
  body: string;
  createdAt: string;
};
type Settings = {
  aiEnabled: boolean;
  greeting: string;
  knowledge: string;
  notifyEmails: string;
  offlineMessage: string;
};

const FILTERS: { id: "open" | Status | "all"; label: string }[] = [
  { id: "open", label: "Open" },
  { id: "waiting", label: "Needs a person" },
  { id: "agent", label: "With team" },
  { id: "ai", label: "Guide Assistant" },
  { id: "closed", label: "Closed" },
  { id: "all", label: "All" },
];

const STATUS_LABEL: Record<Status, string> = {
  waiting: "Needs a person",
  agent: "With team",
  ai: "Guide Assistant",
  closed: "Closed",
};

function ago(isoDate: string) {
  const s = Math.max(0, (Date.now() - new Date(isoDate).getTime()) / 1000);
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return new Date(isoDate).toLocaleDateString();
}

function who(c: Pick<Summary, "visitorName" | "visitorRole">) {
  return c.visitorName ? `${c.visitorName}${c.visitorRole ? ` · ${c.visitorRole}` : ""}` : "Visitor (not signed in)";
}

export function AdminLiveChatPanel() {
  const [chats, setChats] = useState<Summary[]>([]);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [aiConfigured, setAiConfigured] = useState(true);
  const [canEdit, setCanEdit] = useState(false);
  const [filter, setFilter] = useState<(typeof FILTERS)[number]["id"]>("open");
  const [activeId, setActiveId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [reply, setReply] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedNote, setSavedNote] = useState<string | null>(null);
  const listEnd = useRef<HTMLDivElement>(null);

  const loadList = useCallback(async () => {
    const res = await fetch("/api/admin/chats");
    if (!res.ok) {
      setError("Live chats could not be loaded. Refresh the page to try again.");
      return;
    }
    const data = await res.json();
    setChats(data.chats);
    setAiConfigured(data.aiConfigured);
    setCanEdit(data.canEditSettings);
    setSettings((prev) => prev ?? data.settings);
    setError(null);
  }, []);

  const loadChat = useCallback(async (id: string) => {
    const res = await fetch(`/api/admin/chats?id=${id}`);
    if (!res.ok) return;
    const data = await res.json();
    setMessages((prev) =>
      prev.length === data.messages.length && prev.at(-1)?.id === data.messages.at(-1)?.id
        ? prev
        : data.messages,
    );
  }, []);

  useEffect(() => {
    void loadList();
    const t = window.setInterval(() => {
      if (!document.hidden) void loadList();
    }, 8000);
    return () => window.clearInterval(t);
  }, [loadList]);

  useEffect(() => {
    if (!activeId) return;
    setMessages([]);
    void loadChat(activeId);
    const t = window.setInterval(() => {
      if (!document.hidden) void loadChat(activeId);
    }, 3500);
    return () => window.clearInterval(t);
  }, [activeId, loadChat]);

  useEffect(() => {
    listEnd.current?.scrollIntoView({ block: "nearest" });
  }, [messages]);

  const active = chats.find((c) => c.id === activeId) ?? null;
  const shown = chats.filter((c) =>
    filter === "all" ? true : filter === "open" ? c.status !== "closed" : c.status === filter,
  );
  const waitingCount = chats.filter((c) => c.status === "waiting").length;

  async function act(body: Record<string, unknown>) {
    if (!activeId) return;
    setBusy(true);
    try {
      const res = await fetch("/api/admin/chats", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chatId: activeId, ...body }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        setError(d.error ?? "The action could not be completed. Please try again.");
        return false;
      }
      await Promise.all([loadChat(activeId), loadList()]);
      return true;
    } finally {
      setBusy(false);
    }
  }

  async function sendReply(e?: React.FormEvent) {
    e?.preventDefault();
    const body = reply.trim();
    if (!body) return;
    if (await act({ action: "reply", body })) setReply("");
  }

  async function saveSettings(e: React.FormEvent) {
    e.preventDefault();
    if (!settings) return;
    setSavedNote(null);
    const res = await fetch("/api/admin/chats", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(settings),
    });
    setSavedNote(res.ok ? "Settings saved." : "Settings could not be saved. Check the fields and try again.");
  }

  return (
    <div className="space-y-4">
      {!aiConfigured ? (
        <p className="rounded-[10px] border border-amber-300 bg-amber-50 px-3.5 py-3 text-sm leading-snug text-amber-900">
          Guide Assistant is not connected. Add the <code>ANTHROPIC_API_KEY</code> secret in Cloudflare
          Pages to turn it on. Until then, every chat goes directly to the Guide team.
        </p>
      ) : null}
      {error ? (
        <p className="rounded-[10px] border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">{error}</p>
      ) : null}

      <div className="official-stat-row">
        <div className="official-stat">
          <p className="official-stat__value">{waitingCount}</p>
          <p className="official-stat__label">Need a person</p>
        </div>
        <div className="official-stat">
          <p className="official-stat__value">{chats.filter((c) => c.status === "agent").length}</p>
          <p className="official-stat__label">With the team</p>
        </div>
        <div className="official-stat">
          <p className="official-stat__value">{chats.filter((c) => c.status === "ai").length}</p>
          <p className="official-stat__label">With Guide Assistant</p>
        </div>
      </div>

      <div className={`lchat${active ? " lchat--open" : ""}`}>
        <div className="lchat-list">
          <div className="lchat-filters" role="tablist" aria-label="Filter chats">
            {FILTERS.map((f) => (
              <button
                key={f.id}
                type="button"
                role="tab"
                aria-selected={filter === f.id}
                className={`lchat-filter${filter === f.id ? " lchat-filter--on" : ""}`}
                onClick={() => setFilter(f.id)}
              >
                {f.label}
                {f.id === "waiting" && waitingCount ? <span className="lchat-count">{waitingCount}</span> : null}
              </button>
            ))}
          </div>
          {shown.length === 0 ? (
            <div className="portal-empty">
              <p className="portal-empty__title">No chats here</p>
              <p className="portal-empty__body">Conversations from the chat button on Guide pages appear here.</p>
            </div>
          ) : (
            <ul className="lchat-items">
              {shown.map((c) => (
                <li key={c.id}>
                  <button
                    type="button"
                    className={`lchat-item${c.id === activeId ? " lchat-item--on" : ""}`}
                    onClick={() => setActiveId(c.id)}
                  >
                    <span className="lchat-item__top">
                      <span className="lchat-item__who">
                        {c.unread && c.status !== "ai" ? <span className="lchat-unread" aria-label="Unread" /> : null}
                        {who(c)}
                      </span>
                      <span className="lchat-item__time">{ago(c.lastMessageAt)}</span>
                    </span>
                    <span className={`lchat-pill lchat-pill--${c.status}`}>{STATUS_LABEL[c.status]}</span>
                    <span className="lchat-item__preview">{c.lastMessage ?? ""}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="lchat-convo">
          {!active ? (
            <div className="portal-empty">
              <p className="portal-empty__title">No conversation selected</p>
              <p className="portal-empty__body">Select a conversation to read it. Replying takes over from Guide Assistant.</p>
            </div>
          ) : (
            <>
              <div className="lchat-convo__head">
                <button type="button" className="lchat-back" onClick={() => setActiveId(null)}>
                  ← All chats
                </button>
                <p className="text-base font-semibold text-forest-950">{who(active)}</p>
                <p className="text-xs leading-relaxed text-ink-muted">
                  <span className={`lchat-pill lchat-pill--${active.status}`}>{STATUS_LABEL[active.status]}</span>{" "}
                  Started {new Date(active.createdAt).toLocaleString()}
                  {active.page ? ` on ${active.page}` : ""}
                  {active.contactEmail ? ` · email ${active.contactEmail}` : ""}
                </p>
                {active.handoffReason && active.status !== "ai" ? (
                  <p className="mt-1 text-sm text-forest-900">
                    <strong>Why:</strong> {active.handoffReason}
                  </p>
                ) : null}
                <div className="mt-2 flex flex-wrap gap-2">
                  {active.status !== "agent" ? (
                    <button type="button" className="btn-primary !min-h-10 !px-3 !text-sm" disabled={busy} onClick={() => void act({ action: "status", status: "agent" })}>
                      Take over
                    </button>
                  ) : null}
                  {active.status !== "ai" ? (
                    <button type="button" className="btn-secondary !min-h-10 !px-3 !text-sm" disabled={busy} onClick={() => void act({ action: "status", status: "ai" })}>
                      Hand back to Guide Assistant
                    </button>
                  ) : null}
                  {active.status !== "closed" ? (
                    <button type="button" className="btn-secondary !min-h-10 !px-3 !text-sm" disabled={busy} onClick={() => void act({ action: "status", status: "closed" })}>
                      Close chat
                    </button>
                  ) : null}
                  <AdminDeleteButton
                    url={`/api/admin/chats?id=${active.id}`}
                    what="this chat"
                    onDeleted={() => {
                      setActiveId(null);
                      void loadList();
                    }}
                  />
                </div>
              </div>

              <div className="lchat-messages" aria-live="polite">
                {messages.map((m) =>
                  m.sender === "system" ? (
                    <p key={m.id} className="gchat-note">{m.body}</p>
                  ) : (
                    <div key={m.id} className={`gchat-row ${m.sender === "user" ? "gchat-row--them" : "gchat-row--me"}`}>
                      <div>
                        <p className="gchat-author">
                          {m.sender === "user"
                            ? active.visitorName ?? "Visitor"
                            : m.sender === "assistant"
                              ? "Guide Assistant (AI)"
                              : `${m.authorName ?? "Guide team"} (team)`}{" "}
                          · {new Date(m.createdAt).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}
                        </p>
                        <div className={`gchat-bubble${m.sender === "assistant" ? " lchat-bubble--ai" : ""}`}>{m.body}</div>
                      </div>
                    </div>
                  ),
                )}
                <div ref={listEnd} />
              </div>

              <form className="gchat-compose lchat-compose" onSubmit={sendReply}>
                <label htmlFor="lchat-reply" className="sr-only">Reply</label>
                <textarea
                  id="lchat-reply"
                  rows={2}
                  maxLength={4000}
                  placeholder={active.status === "agent" ? "Reply…" : "Reply to take over from Guide Assistant…"}
                  value={reply}
                  onChange={(e) => setReply(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
                      e.preventDefault();
                      void sendReply();
                    }
                  }}
                />
                <button type="submit" className="gchat-send" disabled={!reply.trim() || busy} aria-label="Send reply">
                  <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
                    <path d="M4 12l16-8-6 16-2.5-6.5z" fill="currentColor" />
                  </svg>
                </button>
              </form>
            </>
          )}
        </div>
      </div>

      {settings ? (
        <details className="portal-panel">
          <summary className="cursor-pointer text-base font-semibold text-forest-950">
            Guide Assistant settings
          </summary>
          <form onSubmit={saveSettings} className="mt-4 space-y-4">
            <fieldset disabled={!canEdit} className="space-y-4">
              {!canEdit ? (
                <p className="text-sm text-ink-muted">Only Guide Official administrators can change these settings.</p>
              ) : null}
              <label className="flex items-center gap-3 text-sm font-semibold text-forest-950">
                <input
                  type="checkbox"
                  className="h-5 w-5"
                  checked={settings.aiEnabled}
                  onChange={(e) => setSettings({ ...settings, aiEnabled: e.target.checked })}
                />
                Guide Assistant answers first (when off, every chat goes directly to the Guide team)
              </label>
              <label className="block text-sm font-semibold text-forest-950">
                Greeting
                <textarea className="field mt-1 !min-h-20" maxLength={500} value={settings.greeting} onChange={(e) => setSettings({ ...settings, greeting: e.target.value })} />
              </label>
              <label className="block text-sm font-semibold text-forest-950">
                Team notes for Guide Assistant
                <span className="block text-xs font-normal text-ink-muted">
                  Facts, answers, or guidance the assistant should use, such as support hours or known issues. These take priority over its built-in information.
                </span>
                <textarea className="field mt-1 !min-h-32" maxLength={8000} value={settings.knowledge} onChange={(e) => setSettings({ ...settings, knowledge: e.target.value })} />
              </label>
              <label className="block text-sm font-semibold text-forest-950">
                Message when a chat goes to the team
                <textarea className="field mt-1 !min-h-20" maxLength={500} value={settings.offlineMessage} onChange={(e) => setSettings({ ...settings, offlineMessage: e.target.value })} />
              </label>
              <label className="block text-sm font-semibold text-forest-950">
                Email alerts go to
                <span className="block text-xs font-normal text-ink-muted">
                  Separate addresses with commas. If empty, alerts go to the Guide Official @guidelearning.org addresses.
                </span>
                <input className="field mt-1" maxLength={500} value={settings.notifyEmails} onChange={(e) => setSettings({ ...settings, notifyEmails: e.target.value })} />
              </label>
              <div className="flex items-center gap-3">
                <button type="submit" className="btn-primary">Save settings</button>
                {savedNote ? <span className="text-sm text-ink-muted" role="status">{savedNote}</span> : null}
              </div>
            </fieldset>
          </form>
        </details>
      ) : null}
    </div>
  );
}
