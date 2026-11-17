"use client";

import { AdminDeleteButton } from "@/components/admin-delete-button";
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

const STATUS_OPTIONS = [
  { value: "open", label: "Open" },
  { value: "in_progress", label: "In progress" },
  { value: "resolved", label: "Resolved" },
  { value: "closed", label: "Closed" },
];

const CATEGORY_LABELS: Record<string, string> = {
  account: "Account and log in",
  education: "Classes and school",
  study: "Apps and learning",
  billing: "Billing",
  other: "Something else",
};

export function AdminSupportPanel() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [note, setNote] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    const res = await fetch("/api/admin/support");
    if (!res.ok) {
      setError("Help requests couldn’t be loaded. Refresh the page to try again.");
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
    if (res.ok) {
      setError(null);
      await load();
    } else {
      setError("The status wasn’t updated. Try again.");
    }
  }

  const openCount = tickets.filter(
    (t) => t.status === "open" || t.status === "in_progress",
  ).length;

  return (
    <div className="space-y-4">
      <p className="form-alert">
        {note ??
          "Help requests show the request details only. Personal information is not shown here."}
      </p>
      {error ? (
        <p className="form-alert form-alert--error" role="alert">
          {error}
        </p>
      ) : null}

      {tickets.length === 0 ? (
        <div className="portal-empty">
          <p className="portal-empty__title">No help requests yet</p>
          <p className="portal-empty__body">
            Requests sent from Get help appear here for follow-up.
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
                  <div className="min-w-0">
                    <p className="font-mono text-sm font-semibold text-forest-700">
                      {t.ticketNumber}
                    </p>
                    <h3 className="mt-1 text-lg font-semibold tracking-tight text-forest-950">
                      {t.subject}
                    </h3>
                    <p className="official-row-meta mt-1">
                      {CATEGORY_LABELS[t.category] ?? "Other"} · From{" "}
                      {t.reporterCode} · {new Date(t.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <select
                    value={t.status}
                    onChange={(e) => void setStatus(t.id, e.target.value)}
                    className="field !w-auto !min-h-10 !py-2 text-sm"
                    aria-label={`Status for ${t.ticketNumber}`}
                  >
                    {STATUS_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                </div>
                <p className="whitespace-pre-wrap text-sm leading-relaxed text-ink">
                  {t.body}
                </p>
                <AdminDeleteButton
                  url={`/api/admin/support?id=${t.id}`}
                  what={`help request ${t.ticketNumber}`}
                  onDeleted={() => void load()}
                />
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
