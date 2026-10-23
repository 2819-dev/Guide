"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Props = {
  defaultName?: string;
  defaultEmail?: string;
  /** Already signed in — password optional (account exists). */
  hasAccount?: boolean;
  alreadyApplied?: boolean;
  alreadyAppliedMessage?: string;
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
  hasAccount = false,
  alreadyApplied = false,
  alreadyAppliedMessage,
}: Props) {
  const router = useRouter();
  const [schoolName, setSchoolName] = useState("");
  const [contactName, setContactName] = useState(defaultName);
  const [contactEmail, setContactEmail] = useState(defaultEmail);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [contactRole, setContactRole] = useState("");
  const [studentCountEstimate, setStudentCountEstimate] = useState("");
  const [intendedUse, setIntendedUse] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (alreadyApplied) {
    return (
      <div className="portal-panel">
        <p className="portal-eyebrow">School application</p>
        <h2 className="display-feature mt-1">Application received</h2>
        <p className="mt-2 text-[0.95rem] leading-relaxed text-ink-muted">
          {alreadyAppliedMessage ??
            "Your school application is already submitted. Open your School Administrator Portal anytime to check status."}
        </p>
        <a href="/education/panel" className="btn-primary mt-5 inline-flex">
          School Administrator Portal
        </a>
      </div>
    );
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      if (!hasAccount) {
        if (password.length < 8) {
          throw new Error("Use a password of at least 8 characters.");
        }
        if (password !== confirmPassword) {
          throw new Error("Passwords do not match.");
        }
      }
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
          ...(hasAccount ? {} : { password }),
        }),
      });
      const data = (await res.json()) as {
        error?: string;
        redirectTo?: string;
      };
      if (!res.ok) throw new Error(data.error ?? "Could not submit");
      router.push(data.redirectTo ?? "/education/panel");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not submit");
      setBusy(false);
    }
  }

  return (
    <form onSubmit={(e) => void submit(e)} className="portal-panel space-y-5">
      <div>
        <p className="portal-eyebrow">School application</p>
        <h2 className="display-feature mt-1">Apply for your school</h2>
        <p className="mt-2 max-w-xl text-[0.95rem] leading-relaxed text-ink-muted">
          {hasAccount
            ? "Share a few details about your school or district. After you submit, open your School Administrator Portal — classroom tools open when your school is approved."
            : "Create your Guide account when you apply. You will land in your School Administrator Portal right away; classroom tools open when your school is approved."}
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
            disabled={hasAccount && Boolean(defaultEmail)}
          />
        </label>
      </div>

      {!hasAccount ? (
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block text-sm font-semibold text-forest-900">
            Password
            <input
              required
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="field mt-1.5"
              placeholder="At least 8 characters"
              autoComplete="new-password"
              minLength={8}
            />
          </label>
          <label className="block text-sm font-semibold text-forest-900">
            Confirm password
            <input
              required
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="field mt-1.5"
              placeholder="Re-enter password"
              autoComplete="new-password"
              minLength={8}
            />
          </label>
        </div>
      ) : null}

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
          placeholder="Keep students engaged in class, add learning apps, manage homework…"
        />
      </label>

      {error && (
        <p className="rounded-[10px] border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
          {error}
        </p>
      )}

      <button type="submit" disabled={busy} className="btn-primary w-full sm:w-auto">
        {busy
          ? hasAccount
            ? "Submitting…"
            : "Creating your account…"
          : hasAccount
            ? "Submit application"
            : "Create account & apply"}
      </button>
    </form>
  );
}
