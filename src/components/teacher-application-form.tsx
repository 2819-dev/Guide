"use client";

import { useState } from "react";

type Props = {
  defaultName?: string;
  defaultEmail?: string;
};

/** Legacy teacher / class apply — prefer school invite for teachers. */
export function TeacherApplicationForm({
  defaultName = "",
  defaultEmail = "",
}: Props) {
  const [contactName, setContactName] = useState(defaultName);
  const [contactEmail, setContactEmail] = useState(defaultEmail);
  const [schoolName, setSchoolName] = useState("");
  const [className, setClassName] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  if (done) {
    return (
      <div className="portal-panel">
        <p className="portal-eyebrow">Teacher application</p>
        <h2 className="display-feature mt-1">Application received</h2>
        <p className="mt-3 max-w-lg text-[0.95rem] leading-relaxed text-ink-muted">
          Thanks — your class request is pending review. Open your Teacher
          Portal anytime; full classroom tools open when your school is
          approved.
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
          kind: "teacher",
          contactName,
          contactEmail,
          className,
          schoolName,
          note,
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
        <p className="portal-eyebrow">Teacher application</p>
        <h2 className="display-feature mt-1">Add my class</h2>
        <p className="mt-2 max-w-xl text-[0.95rem] leading-relaxed text-ink-muted">
          Apply as a teacher for your class. After approval, you can invite
          students, add apps, and message from your portal.
        </p>
      </div>

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

      <label className="block text-sm font-semibold text-forest-900">
        Class name
        <input
          required
          value={className}
          onChange={(e) => setClassName(e.target.value)}
          className="field mt-1.5"
          placeholder="e.g. Period 3 · Grade 9"
        />
      </label>

      <label className="block text-sm font-semibold text-forest-900">
        School name{" "}
        <span className="font-medium text-ink-muted">(optional)</span>
        <input
          value={schoolName}
          onChange={(e) => setSchoolName(e.target.value)}
          className="field mt-1.5"
          placeholder="e.g. Lincoln High School"
          autoComplete="organization"
        />
      </label>

      <label className="block text-sm font-semibold text-forest-900">
        Anything we should know?{" "}
        <span className="font-medium text-ink-muted">(optional)</span>
        <textarea
          rows={3}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          className="field mt-1.5"
          placeholder="Apps you want, class size, schedule…"
        />
      </label>

      {error && (
        <p className="rounded-[10px] border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={busy}
        className="btn-primary w-full sm:w-auto"
      >
        {busy ? "Submitting…" : "Submit teacher application"}
      </button>
    </form>
  );
}
