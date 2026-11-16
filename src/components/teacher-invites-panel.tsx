"use client";

import { useEffect, useState } from "react";

type Invite = {
  id: string;
  email: string;
  schoolName: string;
  status: string;
  token?: string;
  sentAt: string | null;
  createdAt: string;
};

export function TeacherInvitesPanel() {
  const [emailText, setEmailText] = useState("");
  const [invites, setInvites] = useState<Invite[]>([]);
  const [emailConfigured, setEmailConfigured] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  async function copyLink(inv: Invite) {
    if (!inv.token) return;
    const url = `${window.location.origin}/invite/teacher/${inv.token}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopiedId(inv.id);
      setTimeout(() => setCopiedId((id) => (id === inv.id ? null : id)), 2000);
    } catch {
      window.prompt("Copy this setup link and send it to the teacher:", url);
    }
  }

  async function load() {
    const res = await fetch("/api/education/teacher-invites");
    if (!res.ok) return;
    const data = await res.json();
    setInvites(data.invites ?? []);
    setEmailConfigured(Boolean(data.emailConfigured));
  }

  useEffect(() => {
    void load();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function send() {
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      const res = await fetch("/api/education/teacher-invites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emailText }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not send invites");
      setEmailText("");
      setNotice(data.message ?? "Invites sent.");
      setEmailConfigured(Boolean(data.emailConfigured));
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not send invites");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section id="teachers" className="space-y-4">
      <div>
        <h2 className="portal-section-title">Invite teachers</h2>
        <p className="-mt-2 text-sm text-ink-muted">
          Add work emails (one per line or comma-separated). Each teacher gets a
          setup link to create their password.
        </p>
      </div>

      <div className="portal-panel space-y-3">
        {!emailConfigured ? (
          <p className="rounded-[10px] border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-950">
            Invite emails aren’t turned on yet. After you add teachers, use
            “Copy setup link” and send it to them yourself.
          </p>
        ) : null}

        <label className="block text-sm font-semibold text-forest-900">
          Teacher emails
          <textarea
            value={emailText}
            onChange={(e) => setEmailText(e.target.value)}
            className="field mt-1.5 min-h-[110px] font-mono text-sm"
            placeholder={"teacher1@school.org\nteacher2@school.org"}
          />
        </label>

        {error ? (
          <p className="rounded-[10px] border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
            {error}
          </p>
        ) : null}
        {notice ? (
          <p className="rounded-[10px] border border-forest-200 bg-forest-100 px-3 py-2 text-sm text-forest-900">
            {notice}
          </p>
        ) : null}

        <button
          type="button"
          disabled={busy || emailText.trim().length < 5}
          onClick={() => void send()}
          className="btn-primary"
        >
          {busy ? "Saving…" : emailConfigured ? "Send invites" : "Add teachers"}
        </button>
      </div>

      {invites.length === 0 ? (
        <div className="portal-empty">
          <p className="portal-empty__title">Ready to invite your team</p>
          <p className="portal-empty__body">
            Paste work emails above. Each teacher creates a password from the
            setup link, then opens their Teacher Portal.
          </p>
        </div>
      ) : (
        <div className="portal-panel overflow-x-auto">
          <table className="w-full min-w-[420px] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-line text-forest-700">
                <th className="py-2 pr-3 font-semibold">Email</th>
                <th className="py-2 pr-3 font-semibold">Status</th>
                <th className="py-2 pr-3 font-semibold">Sent</th>
                <th className="py-2 font-semibold">
                  <span className="sr-only">Setup link</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {invites.map((inv) => (
                <tr key={inv.id} className="border-b border-line/70">
                  <td className="py-2.5 pr-3 font-medium text-forest-950">
                    {inv.email}
                  </td>
                  <td className="py-2.5 pr-3">
                    <span className={`status-chip status-chip--${inv.status}`}>
                      {inv.status === "sent"
                        ? "Sent"
                        : inv.status === "accepted"
                          ? "Joined"
                          : inv.status === "queued" || inv.status === "pending"
                            ? "Not joined yet"
                            : inv.status}
                    </span>
                  </td>
                  <td className="py-2.5 pr-3 text-ink-muted">
                    {new Date(inv.sentAt ?? inv.createdAt).toLocaleDateString()}
                  </td>
                  <td className="py-2.5 text-right">
                    {inv.status !== "accepted" && inv.token ? (
                      <button
                        type="button"
                        onClick={() => void copyLink(inv)}
                        className="text-sm font-semibold text-forest-800 hover:underline"
                      >
                        {copiedId === inv.id ? "Copied ✓" : "Copy setup link"}
                      </button>
                    ) : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
