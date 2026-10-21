"use client";

import { useState } from "react";

type Props = {
  defaultName?: string;
  defaultEmail?: string;
  locked?: boolean;
  lockedMessage?: string;
};

const ROLE_OPTIONS = [
  "School administrator",
  "Principal",
  "District administrator",
  "Other",
] as const;

export function SchoolApplicationForm({
  defaultName = "",
  defaultEmail = "",
  locked = false,
  lockedMessage,
}: Props) {
  const [schoolName, setSchoolName] = useState("");
  const [contactName, setContactName] = useState(defaultName);
  const [contactEmail, setContactEmail] = useState(defaultEmail);
  const [contactRole, setContactRole] = useState("");
  const [studentCountEstimate, setStudentCountEstimate] = useState("");
  const [intendedUse, setIntendedUse] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  if (locked) {
    return (
      <div className="portal-panel">
        <p className="portal-eyebrow">School application</p>
        <h2 className="display-feature mt-1">Already on file</h2>
        <p className="mt-2 text-[0.95rem] leading-relaxed text-ink-muted">
          {lockedMessage ??
            "Your school application is already on file. We will be in touch when it is reviewed."}
        </p>
      </div>
    );
  }

  if (done) {
    return (
      <div className="portal-panel text-center sm:text-left">
        <p className="portal-eyebrow">Application status</p>
        <h2 className="display-feature mt-1">Application received</h2>
        <p className="mt-3 max-w-lg text-[0.95rem] leading-relaxed text-ink-muted">
          Thanks — your school request is pending review. The portal stays
          locked until Guide Official accepts or declines. After approval you
          can invite teachers by email and manage classes.
        </p>
      </div>
    );
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/education/applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kind: "school",
          schoolName,
          contactName,
          contactEmail,
          contactRole,
          studentCountEstimate,
          intendedUse,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not submit");
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not submit");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={(e) => void submit(e)} className="portal-panel space-y-5">
      <div>
        <p className="portal-eyebrow">School application</p>
        <h2 className="display-feature mt-1">Apply for your school</h2>
        <p className="mt-2 max-w-xl text-[0.95rem] leading-relaxed text-ink-muted">
          Tell us about your school or district. After approval, invite
          teachers by email, create classes, add apps, and follow student
          progress.
        </p>
      </div>

      <label className="block text-sm font-semibold text-forest-900">
        School or district name
        <input
          required
          value={schoolName}
          onChange={(e) => setSchoolName(e.target.value)}
          className="field mt-1.5"
          placeholder="e.g. Lincoln High School"
          autoComplete="organization"
        />
      </label>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block text-sm font-semibold text-forest-900">
          Your name
          <input
            required
            value={contactName}
            onChange={(e) => setContactName(e.target.value)}
            className="field mt-1.5"
            placeholder="Full name"
            autoComplete="name"
          />
        </label>
        <label className="block text-sm font-semibold text-forest-900">
          Work email
          <input
            required
            type="email"
            value={contactEmail}
            onChange={(e) => setContactEmail(e.target.value)}
            className="field mt-1.5"
            placeholder="you@school.org"
            autoComplete="email"
          />
        </label>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block text-sm font-semibold text-forest-900">
          Your role
          <select
            required
            value={contactRole}
            onChange={(e) => setContactRole(e.target.value)}
            className="field mt-1.5"
          >
            <option value="">Select…</option>
            {ROLE_OPTIONS.map((role) => (
              <option key={role} value={role}>
                {role}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-sm font-semibold text-forest-900">
          Students (estimate)
          <select
            required
            value={studentCountEstimate}
            onChange={(e) => setStudentCountEstimate(e.target.value)}
            className="field mt-1.5"
          >
            <option value="">Select…</option>
            <option value="1-25">1–25</option>
            <option value="26-75">26–75</option>
            <option value="76-200">76–200</option>
            <option value="200+">200+</option>
          </select>
        </label>
      </div>

      <label className="block text-sm font-semibold text-forest-900">
        How will your school use Guide?
        <textarea
          required
          rows={3}
          value={intendedUse}
          onChange={(e) => setIntendedUse(e.target.value)}
          className="field mt-1.5"
          placeholder="Classes, homework apps, after-school programs…"
        />
      </label>

      {error && (
        <p className="rounded-[10px] border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
          {error}
        </p>
      )}

      <button type="submit" disabled={busy} className="btn-primary w-full sm:w-auto">
        {busy ? "Submitting…" : "Submit application"}
      </button>
    </form>
  );
}
