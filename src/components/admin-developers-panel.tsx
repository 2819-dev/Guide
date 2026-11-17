"use client";

import { AdminDeleteButton } from "@/components/admin-delete-button";
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

const STATUS_LABELS: Record<string, string> = {
  pending: "Pending",
  approved: "Approved",
  rejected: "Declined",
};

export function AdminDevelopersPanel() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  async function load() {
    const res = await fetch("/api/developers/applications");
    if (!res.ok) {
      setError(
        "Developer applications couldn’t be loaded. Refresh the page to try again.",
      );
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
        throw new Error(data.error ?? "The decision wasn’t saved. Try again.");
      }
      await load();
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "The decision wasn’t saved. Try again.",
      );
    } finally {
      setBusyId(null);
    }
  }

  if (applications.length === 0) {
    return (
      <div className="portal-empty">
        <p className="portal-empty__title">No developer applications yet</p>
        <p className="portal-empty__body">
          Applications from the For developers page appear here for review.
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
        <p className="form-alert form-alert--error" role="alert">
          {error}
        </p>
      ) : null}
      {applications.map((a) => (
        <article key={a.id} className="portal-panel space-y-3">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div className="min-w-0">
              <h3 className="text-base font-semibold tracking-tight text-forest-950">
                {a.appName}
              </h3>
              <p className="official-row-meta mt-0.5">
                {a.organization} · {a.contactName} · {a.contactEmail}
              </p>
              <p className="mt-1 text-sm [overflow-wrap:anywhere]">
                <a
                  href={a.websiteUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="font-semibold text-forest-800 hover:underline"
                >
                  {a.websiteUrl}
                </a>
              </p>
            </div>
            <span className={`status-chip status-chip--${a.status}`}>
              {STATUS_LABELS[a.status] ?? "Reviewed"}
            </span>
          </div>
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-ink">
            {a.appAbout}
          </p>
          <div className="flex flex-wrap items-center gap-2">
            {a.status === "pending" ? (
              <>
                <button
                  type="button"
                  disabled={busyId === a.id}
                  onClick={() => void review(a.id, "approved")}
                  className="btn-primary !min-h-10 !px-4 !py-2 !text-sm"
                >
                  Approve
                </button>
                <button
                  type="button"
                  disabled={busyId === a.id}
                  onClick={() => void review(a.id, "rejected")}
                  className="btn-secondary !min-h-10 !px-4 !py-2 !text-sm"
                >
                  Decline
                </button>
              </>
            ) : null}
            <AdminDeleteButton
              url={`/api/developers/applications?id=${a.id}`}
              what="this developer application"
              onDeleted={() => void load()}
            />
          </div>
        </article>
      ))}
    </div>
  );
}
