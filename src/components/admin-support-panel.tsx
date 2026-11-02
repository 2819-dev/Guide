"use client";

import { useEffect, useState } from "react";

type Ticket = {
  id: string;
  ticketNumber: string;
  category: string;
  subject: string;
  body: string;
  status: string;
  reporterCode: string;
  createdAt: string;
  updatedAt: string;
};

export function AdminSupportPanel() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [note, setNote] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    const res = await fetch("/api/admin/support");
    if (!res.ok) {
      setError("Could not load Get help queue");
      return;
    }
    const data = await res.json();
    setTickets(data.tickets);
    setNote(data.note ?? null);
  }

  useEffect(() => {
    void load();
  }, []);

  async function setStatus(ticketId: string, status: string) {
    const res = await fetch("/api/admin/support", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ticketId, status }),
    });
    if (res.ok) await load();
  }

  const openCount = tickets.filter(
    (t) => t.status === "open" || t.status === "in_progress",
  ).length;

  return (
    <div className="space-y-4">
      <p className="rounded-[10px] border border-line bg-sky-soft px-3.5 py-3 text-sm leading-snug text-forest-900">
        {note ??
          "Get help shows operational ticket data only. Personal information is never shown here."}
      </p>
      {error ? (
        <p className="rounded-[10px] border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
          {error}
        </p>
      ) : null}

      {tickets.length === 0 ? (
        <div className="portal-empty">
          <p className="portal-empty__title">No help requests yet</p>
          <p className="portal-empty__body">
            Help requests from school users appear here for follow-up.
          </p>
        </div>
      ) : (
        <>
          <div className="official-stat-row">
            <div className="official-stat">
              <p className="official-stat__value">{tickets.length}</p>
              <p className="official-stat__label">Total</p>
            </div>
            <div className="official-stat">
              <p className="official-stat__value">{openCount}</p>
              <p className="official-stat__label">Open</p>
            </div>
            <div className="official-stat">
              <p className="official-stat__value">
                {tickets.filter((t) => t.status === "resolved").length}
              </p>
              <p className="official-stat__label">Resolved</p>
            </div>
          </div>
          <ul className="space-y-3">
            {tickets.map((t) => (
              <li key={t.id} className="portal-panel space-y-3">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-mono text-sm font-semibold text-forest-700">
                      {t.ticketNumber}
                    </p>
                    <h3 className="mt-1 text-lg font-semibold tracking-tight text-forest-950">
                      {t.subject}
                    </h3>
                    <p className="mt-1 text-xs text-ink-muted">
                      {t.category} · reporter {t.reporterCode} ·{" "}
                      {new Date(t.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <select
                    value={t.status}
                    onChange={(e) => void setStatus(t.id, e.target.value)}
                    className="field !w-auto !min-h-12"
                    aria-label={`Status for ${t.ticketNumber}`}
                  >
                    <option value="open">open</option>
                    <option value="in_progress">in_progress</option>
                    <option value="resolved">resolved</option>
                    <option value="closed">closed</option>
                  </select>
                </div>
                <p className="text-sm leading-relaxed text-ink-muted">{t.body}</p>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
