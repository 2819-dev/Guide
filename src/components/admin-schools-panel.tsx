"use client";

import { useEffect, useState } from "react";

type Application = {
  id: string;
  schoolName: string;
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

export function AdminSchoolsPanel() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  async function load() {
    const res = await fetch("/api/education/applications");
    if (!res.ok) {
      setError("Could not load school applications");
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
        throw new Error(data.error ?? "Review failed");
      }
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Review failed");
    } finally {
      setBusyId(null);
    }
  }

  const pending = applications.filter((a) => a.status === "pending");
  const others = applications.filter((a) => a.status !== "pending");

  return (
    <div className="space-y-6">
      <p className="text-sm text-ink-muted">
        Approve a school so teachers can use Guide. Contact details are shown
        here for review.
      </p>

      {error && <p className="text-sm text-red-700">{error}</p>}

      {applications.length === 0 ? (
        <p className="portal-panel text-sm text-ink-muted">
          No school applications yet.
        </p>
      ) : (
        <>
          {pending.length > 0 && (
            <ul className="space-y-4">
              {pending.map((a) => (
                <li key={a.id} className="portal-panel space-y-3">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-amber-700">
                        Pending
                      </p>
                      <h3 className="display mt-1 text-xl font-semibold text-forest-950">
                        {a.schoolName}
                      </h3>
                      <p className="mt-1 text-sm text-ink-muted">
                        {a.contactName} · {a.contactEmail} · {a.contactRole} ·{" "}
                        {a.studentCountEstimate} students
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
                        className="btn-primary !py-2 text-sm"
                      >
                        Approve
                      </button>
                      <button
                        type="button"
                        disabled={busyId === a.id}
                        onClick={() => void review(a.id, "rejected")}
                        className="btn-secondary !py-2 text-sm"
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                  <p className="text-sm text-ink">{a.intendedUse}</p>
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
                        {a.schoolName}
                      </p>
                      <p className="text-xs font-semibold uppercase text-forest-700">
                        {a.status}
                      </p>
                    </div>
                    <p className="mt-1 text-sm text-ink-muted">
                      {a.contactName} · {a.contactEmail}
                    </p>
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
