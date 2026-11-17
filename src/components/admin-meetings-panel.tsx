"use client";

import { AdminDeleteButton } from "@/components/admin-delete-button";
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

const STATUS_LABELS: Record<string, string> = {
  pending: "New",
  contacted: "Contacted",
  scheduled: "Scheduled",
  closed: "Closed",
};

export function AdminMeetingsPanel() {
  const [requests, setRequests] = useState<Meeting[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  async function load() {
    const res = await fetch("/api/meetings");
    if (!res.ok) {
      setError(
        "Meeting requests couldn’t be loaded. Refresh the page to try again.",
      );
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
        throw new Error(data.error ?? "The status wasn’t updated. Try again.");
      }
      await load();
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "The status wasn’t updated. Try again.",
      );
    } finally {
      setBusyId(null);
    }
  }

  if (error && requests.length === 0) {
    return (
      <div className="portal-empty">
        <p className="portal-empty__title">Meeting requests unavailable</p>
        <p className="portal-empty__body">{error}</p>
      </div>
    );
  }

  if (requests.length === 0) {
    return (
      <div className="portal-empty">
        <p className="portal-empty__title">No meeting requests yet</p>
        <p className="portal-empty__body">
          Requests from the Book a meeting form appear here for follow-up.
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
          <p className="official-stat__label">New</p>
        </div>
        <div className="official-stat">
          <p className="official-stat__value">
            {requests.filter((r) => r.status === "scheduled").length}
          </p>
          <p className="official-stat__label">Scheduled</p>
        </div>
      </div>
      {error ? (
        <p className="form-alert form-alert--error" role="alert">
          {error}
        </p>
      ) : null}
      {requests.map((r) => (
        <article key={r.id} className="portal-panel space-y-3">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div className="min-w-0">
              <h3 className="text-base font-semibold tracking-tight text-forest-950">
                {r.organization}
              </h3>
              <p className="official-row-meta mt-0.5">
                {r.contactName} · {r.contactEmail} · {r.contactRole}
              </p>
            </div>
            <span className={`status-chip status-chip--${r.status}`}>
              {STATUS_LABELS[r.status] ?? "Open"}
            </span>
          </div>
          {r.preferredTime ? (
            <p className="text-sm text-ink-muted">
              Preferred time: {r.preferredTime}
            </p>
          ) : null}
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-ink">
            {r.message}
          </p>
          <div className="flex flex-wrap items-center gap-2">
            {(
              [
                ["contacted", "Mark contacted"],
                ["scheduled", "Mark scheduled"],
                ["closed", "Close request"],
                ["pending", "Reopen"],
              ] as const
            ).map(([status, label]) => (
              <button
                key={status}
                type="button"
                disabled={busyId === r.id || r.status === status}
                onClick={() => void setStatus(r.id, status)}
                className="btn-secondary !min-h-10 !px-4 !py-2 !text-sm"
              >
                {label}
              </button>
            ))}
            <a
              href={`mailto:${r.contactEmail}?subject=${encodeURIComponent(`Guide meeting · ${r.organization}`)}`}
              className="btn-primary !min-h-10 !px-4 !py-2 !text-sm"
            >
              Send email
            </a>
            <AdminDeleteButton
              url={`/api/meetings?id=${r.id}`}
              what={`the meeting request from ${r.organization}`}
              onDeleted={() => void load()}
            />
          </div>
        </article>
      ))}
    </div>
  );
}
