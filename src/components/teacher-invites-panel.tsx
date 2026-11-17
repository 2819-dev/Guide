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
      window.prompt("Copy this setup link and send it to the teacher.", url);
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
      if (!res.ok) {
        throw new Error(data.error ?? "Invites weren’t sent. Try again.");
      }
      setEmailText("");
      setNotice(data.message ?? "Invites sent.");
      setEmailConfigured(Boolean(data.emailConfigured));
      await load();
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Invites weren’t sent. Try again.",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <section id="teachers" className="space-y-4">
      <div>
        <h2 className="portal-section-title">Invite teachers</h2>
        <p className="portal-section-lede">
          Enter teachers’ work emails, one per line or separated by commas.
          Each teacher gets a setup link to create their account.
        </p>
      </div>

      <div className="portal-panel space-y-3">
        {!emailConfigured ? (
          <p className="form-alert form-alert--warning">
            Guide can’t email invites right now. After you add teachers, use
            Copy setup link and send each link yourself.
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
          <p className="form-alert form-alert--error" role="alert">
            {error}
          </p>
        ) : null}
        {notice ? (
          <p className="form-alert form-alert--success" role="status">
            {notice}
          </p>
        ) : null}

        <button
          type="button"
          disabled={busy || emailText.trim().length < 5}
          onClick={() => void send()}
          className="btn-primary"
        >
          {busy ? "Sending…" : emailConfigured ? "Send invites" : "Add teachers"}
        </button>
      </div>

      {invites.length === 0 ? (
        <div className="portal-empty">
          <p className="portal-empty__title">No teachers invited yet</p>
          <p className="portal-empty__body">
            Invited teachers appear here so you can see who has joined.
          </p>
        </div>
      ) : (
        <div className="portal-panel">
          <table className="portal-table">
            <thead>
              <tr>
                <th>Email</th>
                <th>Status</th>
                <th className="hidden sm:table-cell">Invited</th>
                <th>
                  <span className="sr-only">Setup link</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {invites.map((inv) => (
                <tr key={inv.id}>
                  <td className="break-all font-medium">{inv.email}</td>
                  <td>
                    <span
                      className={`status-chip status-chip--${inv.status === "accepted" ? "accepted" : "pending"}`}
                    >
                      {inv.status === "accepted" ? "Joined" : "Invited"}
                    </span>
                  </td>
                  <td className="hidden text-ink-muted sm:table-cell">
                    {new Date(inv.sentAt ?? inv.createdAt).toLocaleDateString()}
                  </td>
                  <td className="text-right">
                    {inv.status !== "accepted" && inv.token ? (
                      <button
                        type="button"
                        onClick={() => void copyLink(inv)}
                        className="whitespace-nowrap text-sm font-semibold text-forest-800 hover:underline"
                      >
                        {copiedId === inv.id ? "Copied" : "Copy setup link"}
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
