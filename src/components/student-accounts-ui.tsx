"use client";

import { useEffect, useState } from "react";

const PW_ALPHABET = "abcdefghjkmnpqrstuvwxyz23456789";

/** Easy-to-read starter password, e.g. "maple-7k3p-river". */
export function generatePassword(): string {
  const words = ["maple", "river", "cloud", "tiger", "piano", "comet", "lemon", "ocean", "panda", "rocket"];
  const bytes = crypto.getRandomValues(new Uint8Array(6));
  const mid = Array.from(bytes.slice(0, 4), (b) => PW_ALPHABET[b % PW_ALPHABET.length]).join("");
  return `${words[bytes[4]! % words.length]}-${mid}-${words[bytes[5]! % words.length]}`;
}

async function post(body: unknown) {
  const res = await fetch("/api/education/students", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error ?? "Something went wrong. Try again.");
  return data;
}

/** Shows a new password once so the teacher can hand it to the student. */
function NewPasswordNote({ name, username, password }: { name: string; username: string; password: string }) {
  return (
    <div className="rounded-[10px] border border-forest-200 bg-forest-100 px-3 py-2.5 text-sm text-forest-950">
      Give these to <strong>{name}</strong>: username <strong className="font-mono">{username}</strong>,
      password <strong className="font-mono">{password}</strong>
    </div>
  );
}

/** Add a student account to a class. */
export function AddStudentForm({
  classroomId,
  onAdded,
}: {
  classroomId: string;
  onAdded: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [created, setCreated] = useState<{ name: string; username: string; password: string } | null>(null);

  function start() {
    setOpen(true);
    setError(null);
    setPassword(generatePassword());
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await post({ action: "create", classroomId, displayName: name, username, password });
      setCreated({ name, username: username.trim().toLowerCase(), password });
      setName("");
      setUsername("");
      setPassword(generatePassword());
      onAdded();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn’t add the student.");
    } finally {
      setBusy(false);
    }
  }

  if (!open) {
    return (
      <div className="space-y-2">
        {created ? <NewPasswordNote {...created} /> : null}
        <button type="button" onClick={start} className="btn-secondary !py-2 text-sm">
          + Add a student
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-3 rounded-[10px] border border-line p-4">
      {created ? <NewPasswordNote {...created} /> : null}
      <div className="grid gap-3 sm:grid-cols-3">
        <label className="block text-sm font-semibold text-forest-900">
          Student name
          <input value={name} onChange={(e) => setName(e.target.value)} className="field mt-1.5" required placeholder="Maya Rivera" />
        </label>
        <label className="block text-sm font-semibold text-forest-900">
          Username
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value.replace(/\s/g, ""))}
            className="field mt-1.5 font-mono"
            required
            placeholder="maya.r"
            autoCapitalize="none"
            spellCheck={false}
          />
        </label>
        <label className="block text-sm font-semibold text-forest-900">
          Password
          <input value={password} onChange={(e) => setPassword(e.target.value)} className="field mt-1.5 font-mono" required minLength={8} />
        </label>
      </div>
      {error ? <p className="text-sm text-red-700">{error}</p> : null}
      <div className="flex flex-wrap gap-2">
        <button type="submit" disabled={busy} className="btn-primary !py-2 text-sm">
          {busy ? "Adding…" : "Add student"}
        </button>
        <button type="button" onClick={() => setOpen(false)} className="btn-secondary !py-2 text-sm">
          Done
        </button>
      </div>
    </form>
  );
}

/** Inline "Reset password" for one student. */
export function ResetPasswordButton({
  studentId,
  name,
  username,
  onDone,
}: {
  studentId: string;
  name: string;
  username: string;
  onDone?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);

  async function save() {
    setBusy(true);
    setError(null);
    try {
      await post({ action: "reset", studentId, password });
      setDone(password);
      setOpen(false);
      onDone?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn’t reset the password.");
    } finally {
      setBusy(false);
    }
  }

  if (done) return <NewPasswordNote name={name} username={username} password={done} />;

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => {
          setOpen(true);
          setPassword(generatePassword());
        }}
        className="text-sm font-semibold text-forest-800 hover:underline"
      >
        Reset password
      </button>
    );
  }

  return (
    <span className="flex flex-wrap items-center gap-2">
      <input
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        className="field !min-h-0 !w-48 !py-1.5 font-mono text-sm"
        aria-label={`New password for ${name}`}
        minLength={8}
      />
      <button type="button" onClick={() => void save()} disabled={busy || password.length < 8} className="btn-primary !min-h-0 !px-3 !py-1.5 text-sm">
        {busy ? "Saving…" : "Save"}
      </button>
      <button type="button" onClick={() => setOpen(false)} className="text-sm text-ink-muted">
        Cancel
      </button>
      {error ? <span className="w-full text-sm text-red-700">{error}</span> : null}
    </span>
  );
}

type HelpRequest = {
  id: string;
  studentId: string;
  displayName: string;
  username: string | null;
  createdAt: string;
};

/** Students who tapped "Forgot password?" — shown at the top of the portal. */
export function PasswordHelpPanel({ refreshKey = 0 }: { refreshKey?: number }) {
  const [requests, setRequests] = useState<HelpRequest[]>([]);

  async function load() {
    const res = await fetch("/api/education/students");
    if (!res.ok) return;
    const data = await res.json();
    setRequests(data.requests ?? []);
  }

  useEffect(() => {
    void load();
  }, [refreshKey]);  

  if (requests.length === 0) return null;

  return (
    <section id="password-help" className="space-y-3">
      <div>
        <h2 className="portal-section-title">Password help</h2>
        <p className="-mt-2 text-sm text-ink-muted">
          These students forgot their password. Set a new one and give it to them.
        </p>
      </div>
      <ul className="portal-panel divide-y divide-line !p-0">
        {requests.map((r) => (
          <li key={r.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
            <div>
              <p className="font-semibold text-forest-950">{r.displayName}</p>
              <p className="text-sm text-ink-muted">
                <span className="font-mono">{r.username}</span> · asked{" "}
                {new Date(r.createdAt).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })}
              </p>
            </div>
            <ResetPasswordButton studentId={r.studentId} name={r.displayName} username={r.username ?? ""} />
          </li>
        ))}
      </ul>
    </section>
  );
}
