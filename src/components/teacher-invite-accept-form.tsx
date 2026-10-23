"use client";

import Link from "next/link";
import { useState } from "react";

type Props = {
  token: string;
  email: string;
  schoolName: string;
};

export function TeacherInviteAcceptForm({ token, email, schoolName }: Props) {
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  if (done) {
    return (
      <div className="portal-panel space-y-4">
        <div>
          <p className="portal-eyebrow">Welcome to Guide</p>
          <h2 className="display-feature mt-1">Account ready</h2>
          <p className="mt-3 text-[0.95rem] leading-relaxed text-ink-muted">
            Your teacher account for <strong>{schoolName}</strong> is ready.
            Log in to manage classes, add apps, and keep students engaged.
          </p>
        </div>
        <Link href="/auth/sign-in?as=educator" className="btn-primary inline-flex">
          Teacher log in
        </Link>
      </div>
    );
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/education/teacher-invites/accept", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, name, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not set up account");
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not set up account");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={(e) => void submit(e)} className="portal-panel space-y-5">
      <div>
        <p className="portal-eyebrow">Teacher invite</p>
        <h1 className="display-feature mt-1">Set up your Guide account</h1>
        <p className="mt-2 text-[0.95rem] leading-relaxed text-ink-muted">
          Dear Teacher, <strong>{schoolName}</strong> invited you to Guide.
          Create your password below, then log in to manage classes and apps.
        </p>
      </div>

      <p className="rounded-[10px] border border-line bg-sky-soft px-3.5 py-3 text-sm leading-snug text-forest-900">
        After setup, use this same email to log in. Teachers are invited by
        their school — there is no public teacher signup.
      </p>

      <label className="block text-sm font-semibold text-forest-900">
        Work email
        <input value={email} readOnly className="field mt-1.5 bg-sky-soft" />
      </label>

      <label className="block text-sm font-semibold text-forest-900">
        Your name
        <input
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="field mt-1.5"
          autoComplete="name"
          placeholder="Full name"
        />
      </label>

      <label className="block text-sm font-semibold text-forest-900">
        Password
        <input
          required
          type="password"
          minLength={8}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="field mt-1.5"
          autoComplete="new-password"
          placeholder="At least 8 characters"
        />
      </label>

      {error ? (
        <p className="rounded-[10px] border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
          {error}
        </p>
      ) : null}

      <button type="submit" disabled={busy} className="btn-primary w-full">
        {busy ? "Creating…" : "Create teacher account"}
      </button>

      <p className="text-center text-sm text-ink-muted">
        Already set up?{" "}
        <Link
          href="/auth/sign-in?as=educator"
          className="font-semibold text-forest-800"
        >
          Teacher log in
        </Link>
      </p>
    </form>
  );
}
