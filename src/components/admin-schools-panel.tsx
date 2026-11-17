"use client";

import { AdminDeleteButton } from "@/components/admin-delete-button";
import { useEffect, useState } from "react";

type Application = {
  id: string;
  kind?: "teacher" | "school" | string;
  schoolName: string;
  className?: string | null;
  contactName: string;
  contactEmail: string;
  contactRole: string;
  studentCountEstimate: string;
  intendedUse: string;
  status: string;
  reviewNote: string | null;
  createdAt: string;
  reviewedAt: string | null;
};

const STATUS_LABELS: Record<string, string> = {
  pending: "Pending",
  approved: "Approved",
  rejected: "Declined",
};

function statusLabel(status: string) {
  return STATUS_LABELS[status] ?? "Reviewed";
}

function applicationTitle(a: Application) {
  if (a.kind === "teacher") {
    return a.className?.trim()
      ? `Class: ${a.className.trim()}`
      : "Teacher class application";
  }
  return a.schoolName;
}

function applicationMeta(a: Application) {
  if (a.kind === "teacher") {
    const school =
      a.schoolName && a.schoolName !== "Teacher class"
        ? a.schoolName
        : null;
    return [
      a.contactName,
      a.contactEmail,
      school ? `School: ${school}` : null,
    ]
      .filter(Boolean)
      .join(" · ");
  }
  return [
    a.contactName,
    a.contactEmail,
    a.contactRole,
    a.studentCountEstimate ? `${a.studentCountEstimate} students` : null,
  ]
    .filter(Boolean)
    .join(" · ");
}

export function AdminSchoolsPanel() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  async function load() {
    const res = await fetch("/api/education/applications");
    if (!res.ok) {
      setError("Applications couldn’t be loaded. Refresh the page to try again.");
      return;
    }
    const data = await res.json();
    setApplications(data.applications);
  }

  useEffect(() => {
    void load();
  }, []);

  async function review(applicationId: string, status: "approved" | "rejected") {
    setBusyId(applicationId);
    setError(null);
    try {
      const res = await fetch("/api/education/applications", {
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

  const pending = applications.filter((a) => a.status === "pending");
  const others = applications.filter((a) => a.status !== "pending");

  return (
    <div className="space-y-6">
      {error ? (
        <p className="form-alert form-alert--error" role="alert">
          {error}
        </p>
      ) : null}

      {applications.length === 0 ? (
        <div className="portal-empty">
          <p className="portal-empty__title">No applications yet</p>
          <p className="portal-empty__body">
            School and district applications appear here for review.
          </p>
        </div>
      ) : (
        <>
          {pending.length > 0 && (
            <ul className="space-y-4">
              {pending.map((a) => (
                <li key={a.id} className="portal-panel space-y-3">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="status-chip status-chip--pending">
                        {a.kind === "teacher"
                          ? "Pending · Class application"
                          : "Pending · School"}
                      </p>
                      <h3 className="mt-2 text-xl font-semibold tracking-tight text-forest-950">
                        {applicationTitle(a)}
                      </h3>
                      <p className="official-row-meta mt-1">
                        {applicationMeta(a)}
                      </p>
                      <p className="mt-1 text-xs text-ink-muted">
                        Submitted {new Date(a.createdAt).toLocaleString()}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
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
                      <AdminDeleteButton
                        url={`/api/education/applications?id=${a.id}`}
                        what={`the application for “${applicationTitle(a)}”`}
                        onDeleted={() => void load()}
                      />
                    </div>
                  </div>
                  <p className="whitespace-pre-wrap text-sm leading-relaxed text-ink">
                    {a.intendedUse}
                  </p>
                </li>
              ))}
            </ul>
          )}

          {others.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-forest-800">
                Reviewed
              </h3>
              <ul className="space-y-3">
                {others.map((a) => (
                  <li key={a.id} className="portal-panel !py-3">
                    <div className="flex flex-wrap items-baseline justify-between gap-2">
                      <p className="font-semibold text-forest-950">
                        {applicationTitle(a)}
                      </p>
                      <span
                        className={`status-chip status-chip--${a.status === "approved" ? "approved" : "closed"}`}
                      >
                        {statusLabel(a.status)}
                        {" · "}
                        {a.kind === "teacher" ? "Class" : "School"}
                      </span>
                    </div>
                    <div className="mt-1 flex flex-wrap items-center justify-between gap-2">
                      <p className="official-row-meta">
                        {a.contactName} · {a.contactEmail}
                      </p>
                      {a.status !== "approved" ? (
                        <AdminDeleteButton
                          url={`/api/education/applications?id=${a.id}`}
                          what={`the application for “${applicationTitle(a)}”`}
                          onDeleted={() => void load()}
                        />
                      ) : null}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}
    </div>
  );
}
