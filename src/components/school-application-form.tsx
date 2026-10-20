"use client";

import { useState } from "react";

type Props = {
  defaultName?: string;
  defaultEmail?: string;
  locked?: boolean;
  lockedMessage?: string;
};

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
        <h2 className="text-2xl font-semibold tracking-tight text-forest-900">
          School application
        </h2>
        <p className="mt-2 text-ink-muted">
          {lockedMessage ??
            "Your school application is already on file. We will be in touch when it is reviewed."}
        </p>
      </div>
    );
  }

  if (done) {
    return (
      <div className="portal-panel">
        <h2 className="text-2xl font-semibold tracking-tight text-forest-900">
          Application received
        </h2>
        <p className="mt-2 text-ink-muted">
          Thanks — your school request is pending review. Once approved, you can
          open the teacher portal and invite students.
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
    <form onSubmit={(e) => void submit(e)} className="portal-panel space-y-4">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight text-forest-900">
          Apply for your school
        </h2>
        <p className="mt-2 text-sm text-ink-muted">
          Tell us a little about your school. After approval, teachers can
          create classes and follow home Mishnayos and Gemara study.
        </p>
      </div>

      <label className="block text-sm font-semibold text-forest-800">
        School name
        <input
          required
          value={schoolName}
          onChange={(e) => setSchoolName(e.target.value)}
          className="field mt-1.5"
          placeholder="e.g. Yeshiva High School"
        />
      </label>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block text-sm font-semibold text-forest-800">
          Your name
          <input
            required
            value={contactName}
            onChange={(e) => setContactName(e.target.value)}
            className="field mt-1.5"
            placeholder="Contact name"
          />
        </label>
        <label className="block text-sm font-semibold text-forest-800">
          Email
          <input
            required
            type="email"
            value={contactEmail}
            onChange={(e) => setContactEmail(e.target.value)}
            className="field mt-1.5"
            placeholder="you@school.org"
          />
        </label>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block text-sm font-semibold text-forest-800">
          Your role
          <input
            required
            value={contactRole}
            onChange={(e) => setContactRole(e.target.value)}
            className="field mt-1.5"
            placeholder="e.g. Rebbe, Menahel, Admin"
          />
        </label>
        <label className="block text-sm font-semibold text-forest-800">
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

      <label className="block text-sm font-semibold text-forest-800">
        How will your school use Guide?
        <textarea
          required
          rows={4}
          value={intendedUse}
          onChange={(e) => setIntendedUse(e.target.value)}
          className="field mt-1.5"
          placeholder="Classes, after-school review, Chromebook study…"
        />
      </label>

      {error && (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
          {error}
        </p>
      )}

      <button type="submit" disabled={busy} className="btn-primary">
        {busy ? "Submitting…" : "Submit school application"}
      </button>
    </form>
  );
}
