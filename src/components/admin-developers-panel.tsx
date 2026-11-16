"use client";

import { useEffect, useState } from "react";

type Application = {
  id: string;
  contactName: string;
  contactEmail: string;
  organization: string;
  websiteUrl: string;
  appName: string;
  appAbout: string;
  status: string;
  createdAt: string;
};

export function AdminDevelopersPanel() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  async function load() {
    const res = await fetch("/api/developers/applications");
    if (!res.ok) {
      setError("Could not load developer applications");
      return;
    }
    const data = await res.json();
    setApplications(data.applications ?? []);
  }

  useEffect(() => {
    void load();
  }, []);

  async function review(applicationId: string, status: "approved" | "rejected") {
    setBusyId(applicationId);
    setError(null);
    try {
      const res = await fetch("/api/developers/applications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ applicationId, status }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Review failed");
      }
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Review failed");
    } finally {
      setBusyId(null);
    }
  }

  if (applications.length === 0) {
    return (
      <div className="portal-empty">
        <p className="portal-empty__title">No developer applications</p>
        <p className="portal-empty__body">
          Verified partner applications from For developers appear here for
          Official review.
        </p>
      </div>
    );
  }

  const pending = applications.filter((a) => a.status === "pending").length;

  return (
    <div className="space-y-4">
      <div className="official-stat-row" aria-label="Developer queue summary">
        <div className="official-stat">
          <p className="official-stat__value">{applications.length}</p>
          <p className="official-stat__label">Total</p>
        </div>
        <div className="official-stat">
          <p className="official-stat__value">{pending}</p>
          <p className="official-stat__label">Pending</p>
        </div>
        <div className="official-stat">
          <p className="official-stat__value">
            {applications.filter((a) => a.status === "approved").length}
          </p>
          <p className="official-stat__label">Approved</p>
        </div>
      </div>
      {error ? (
        <p className="rounded-[10px] border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
          {error}
        </p>
      ) : null}
      {applications.map((a) => (
        <article key={a.id} className="portal-panel space-y-3">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <h3 className="text-base font-semibold tracking-tight text-forest-950">
                {a.appName}
              </h3>
              <p className="mt-0.5 text-sm text-ink-muted">
                {a.organization} · {a.contactName} · {a.contactEmail}
              </p>
              <p className="mt-1 text-sm">
                <a
                  href={a.websiteUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="font-semibold text-forest-800"
                >
                  {a.websiteUrl}
                </a>
              </p>
            </div>
            <span className={`status-chip status-chip--${a.status}`}>
              {a.status}
            </span>
          </div>
          <p className="text-sm leading-relaxed text-forest-950">{a.appAbout}</p>
          {a.status === "pending" ? (
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                disabled={busyId === a.id}
                onClick={() => void review(a.id, "approved")}
                className="btn-primary !min-h-12 !px-3.5 !text-sm"
              >
                Approve
              </button>
              <button
                type="button"
                disabled={busyId === a.id}
                onClick={() => void review(a.id, "rejected")}
                className="btn-secondary !min-h-12 !px-3.5 !text-sm"
              >
                Decline
              </button>
            </div>
          ) : null}
        </article>
      ))}
    </div>
  );
}
