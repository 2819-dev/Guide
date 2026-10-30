"use client";

import { useEffect, useState } from "react";

type Invite = {
  id: string;
  email: string;
  schoolName: string;
  status: string;
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

  async function load() {
    const res = await fetch("/api/education/teacher-invites");
    if (!res.ok) return;
    const data = await res.json();
    setInvites(data.invites ?? []);
    setEmailConfigured(Boolean(data.emailConfigured));
  }

  useEffect(() => {
    void load();
  }, []);

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
          Enter work emails (one per line or comma-separated). Each teacher
          gets a setup link — teachers log in with that invite only.
        </p>
      </div>

      <div className="portal-panel space-y-3">
        {!emailConfigured ? (
          <p className="auth-soft-note !mb-0">
            Invites are saved here. Email delivery reconnects shortly — teachers
            can still use a setup link once mail is sending.
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
          {busy ? "Sending…" : "Send invites"}
        </button>
      </div>

      {invites.length === 0 ? (
        <div className="portal-empty">
          <p className="portal-empty__title">Ready to invite your team</p>
          <p className="portal-empty__body">
            Paste work emails above. Teachers create a password from the setup
            link, then open their Teacher Portal.
          </p>
        </div>
      ) : (
        <div className="portal-panel overflow-x-auto">
          <table className="w-full min-w-[420px] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-line text-forest-700">
                <th className="py-2 pr-3 font-semibold">Email</th>
                <th className="py-2 pr-3 font-semibold">Status</th>
                <th className="py-2 font-semibold">Sent</th>
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
                          : inv.status === "queued"
                            ? "Queued"
                            : inv.status}
                    </span>
                  </td>
                  <td className="py-2.5 text-ink-muted">
                    {inv.sentAt
                      ? new Date(inv.sentAt).toLocaleDateString()
                      : "—"}
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
