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
      setError("Could not load support queue");
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

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-forest-300 bg-forest-100 px-4 py-3 text-sm text-forest-900">
        {note ??
          "Admin support shows operational ticket data only. Personal information is never shown here."}
      </div>
      {error && <p className="text-sm text-red-700">{error}</p>}

      {tickets.length === 0 ? (
        <p className="panel text-ink-muted">No support tickets yet.</p>
      ) : (
        <ul className="space-y-4">
          {tickets.map((t) => (
            <li key={t.id} className="panel space-y-3">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-mono text-sm font-semibold text-forest-700">
                    {t.ticketNumber}
                  </p>
                  <h3 className="display text-xl font-semibold text-forest-950">
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
                  className="field !w-auto"
                >
                  <option value="open">open</option>
                  <option value="in_progress">in_progress</option>
                  <option value="resolved">resolved</option>
                  <option value="closed">closed</option>
                </select>
              </div>
              <p className="text-ink-muted">{t.body}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
