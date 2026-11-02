"use client";

import { useEffect, useState } from "react";

type Meeting = {
  id: string;
  contactName: string;
  contactEmail: string;
  organization: string;
  contactRole: string;
  message: string;
  preferredTime: string | null;
  status: string;
  reviewNote: string | null;
  createdAt: string;
};

export function AdminMeetingsPanel() {
  const [requests, setRequests] = useState<Meeting[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  async function load() {
    const res = await fetch("/api/meetings");
    if (!res.ok) {
      setError("Could not load meeting requests");
      return;
    }
    const data = await res.json();
    setRequests(data.requests ?? []);
  }

  useEffect(() => {
    void load();
  }, []);

  async function setStatus(
    requestId: string,
    status: "pending" | "contacted" | "scheduled" | "closed",
  ) {
    setBusyId(requestId);
    setError(null);
    try {
      const res = await fetch("/api/meetings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requestId, status }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Update failed");
      }
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Update failed");
    } finally {
      setBusyId(null);
    }
  }

  if (error && requests.length === 0) {
    return (
      <div className="portal-empty">
        <p className="portal-empty__title">Could not load</p>
        <p className="portal-empty__body">{error}</p>
      </div>
    );
  }

  if (requests.length === 0) {
    return (
      <div className="portal-empty">
        <p className="portal-empty__title">No meeting requests yet</p>
        <p className="portal-empty__body">
          Requests from Book a meeting appear here for follow-up.
        </p>
      </div>
    );
  }

  const pendingCount = requests.filter((r) => r.status === "pending").length;

  return (
    <div className="space-y-4">
      <div className="official-stat-row" aria-label="Meeting queue summary">
        <div className="official-stat">
          <p className="official-stat__value">{requests.length}</p>
          <p className="official-stat__label">Total</p>
        </div>
        <div className="official-stat">
          <p className="official-stat__value">{pendingCount}</p>
          <p className="official-stat__label">Pending</p>
        </div>
        <div className="official-stat">
          <p className="official-stat__value">
            {requests.filter((r) => r.status === "scheduled").length}
          </p>
          <p className="official-stat__label">Scheduled</p>
        </div>
      </div>
      {error ? (
        <p className="rounded-[10px] border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
          {error}
        </p>
      ) : null}
      {requests.map((r) => (
        <article key={r.id} className="portal-panel space-y-3">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <h3 className="text-base font-semibold tracking-tight text-forest-950">
                {r.organization}
              </h3>
              <p className="mt-0.5 text-sm text-ink-muted">
                {r.contactName} · {r.contactEmail} · {r.contactRole}
              </p>
            </div>
            <span className={`status-chip status-chip--${r.status}`}>
              {r.status}
            </span>
          </div>
          {r.preferredTime ? (
            <p className="text-sm text-ink-muted">
              Preferred: {r.preferredTime}
            </p>
          ) : null}
          <p className="text-sm leading-relaxed text-forest-950">{r.message}</p>
          <div className="flex flex-wrap gap-2">
            {(
              [
                ["contacted", "Mark contacted"],
                ["scheduled", "Scheduled"],
                ["closed", "Close"],
                ["pending", "Back to pending"],
              ] as const
            ).map(([status, label]) => (
              <button
                key={status}
                type="button"
                disabled={busyId === r.id || r.status === status}
                onClick={() => void setStatus(r.id, status)}
                className="btn-secondary !min-h-12 !px-3.5 !text-sm"
              >
                {label}
              </button>
            ))}
            <a
              href={`mailto:${r.contactEmail}?subject=${encodeURIComponent(`Guide meeting · ${r.organization}`)}`}
              className="btn-primary !min-h-12 !px-3.5 !text-sm"
            >
              Email
            </a>
          </div>
        </article>
      ))}
    </div>
  );
}
