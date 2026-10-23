"use client";

import { useState } from "react";
import Link from "next/link";

export function MeetingRequestForm() {
  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [organization, setOrganization] = useState("");
  const [contactRole, setContactRole] = useState("");
  const [preferredTime, setPreferredTime] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  if (done) {
    return (
      <div className="portal-panel">
        <div className="portal-empty !border-0 !bg-transparent !p-0 !shadow-none">
          <p className="portal-empty__title">Request received</p>
          <p className="portal-empty__body">
            Guide Official will review your request and follow up by email.
            Meanwhile, try the interactive demo or apply for your school.
          </p>
        </div>
        <p className="mt-5 flex flex-wrap gap-3 text-sm font-semibold text-forest-800">
          <Link href="/schools/demo">View demo →</Link>
          <Link href="/education#apply">Apply for your school →</Link>
        </p>
      </div>
    );
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/meetings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contactName,
          contactEmail,
          organization,
          contactRole,
          preferredTime,
          message,
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
        <p className="portal-eyebrow">Meeting request</p>
        <h2 className="display-feature mt-1">Tell us about your school</h2>
        <p className="mt-2 max-w-xl text-[0.95rem] leading-relaxed text-ink-muted">
          Guide Official reviews every request and follows up to schedule a
          walkthrough. Prefer to explore first? Open the demo anytime.
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
            autoComplete="email"
            placeholder="you@school.org"
          />
        </label>
        <label className="block text-sm font-semibold text-forest-900">
          School or district
          <input
            required
            value={organization}
            onChange={(e) => setOrganization(e.target.value)}
            className="field mt-1.5"
          />
        </label>
        <label className="block text-sm font-semibold text-forest-900">
          Your role
          <input
            required
            value={contactRole}
            onChange={(e) => setContactRole(e.target.value)}
            className="field mt-1.5"
            placeholder="e.g. Principal, Tech director"
          />
        </label>
      </div>

      <label className="block text-sm font-semibold text-forest-900">
        Preferred times{" "}
        <span className="font-medium text-ink-muted">(optional)</span>
        <input
          value={preferredTime}
          onChange={(e) => setPreferredTime(e.target.value)}
          className="field mt-1.5"
          placeholder="e.g. Weekday mornings ET"
        />
      </label>

      <label className="block text-sm font-semibold text-forest-900">
        What would you like to cover?
        <textarea
          required
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          className="field mt-1.5 min-h-[120px]"
          minLength={10}
        />
      </label>

      {error ? (
        <p className="rounded-[10px] border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
          {error}
        </p>
      ) : null}

      <button type="submit" disabled={busy} className="btn-primary">
        {busy ? "Sending…" : "Submit meeting request"}
      </button>
    </form>
  );
}
