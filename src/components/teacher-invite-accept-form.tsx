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
            Log in to create classes, add students, and add apps.
          </p>
        </div>
        <Link href="/auth/sign-in?as=educator" className="btn-primary w-full">
          Log in
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
      if (!res.ok) {
        throw new Error(
          data.error ?? "Your account wasn’t created. Try again in a moment.",
        );
      }
      setDone(true);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Your account wasn’t created. Try again in a moment.",
      );
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
          <strong>{schoolName}</strong> invited you to join Guide as a teacher.
          Enter your name and choose a password. You’ll log in with this email
          from now on.
        </p>
      </div>

      <label className="block text-sm font-semibold text-forest-900">
        Work email
        <input
          value={email}
          readOnly
          aria-readonly
          className="field mt-1.5 !bg-sky-soft text-ink-muted"
        />
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
        <p className="form-alert form-alert--error" role="alert">
          {error}
        </p>
      ) : null}

      <button type="submit" disabled={busy} className="btn-primary w-full">
        {busy ? "Creating account…" : "Create teacher account"}
      </button>

      <p className="text-center text-sm text-ink-muted">
        Already set up your account?{" "}
        <Link
          href="/auth/sign-in?as=educator"
          className="font-semibold text-forest-800 hover:underline"
        >
          Log in
        </Link>
      </p>
    </form>
  );
}
