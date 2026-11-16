"use client";

import { useEffect, useState } from "react";

type School = { id: string; name: string; slug: string };
type BadgeRow = {
  id: string;
  displayName: string;
  badgeCode: string | null;
  schoolId: string | null;
  loginEmail: string | null;
};

export function AdminBadgesPanel() {
  const [schools, setSchools] = useState<School[]>([]);
  const [badges, setBadges] = useState<BadgeRow[]>([]);
  const [displayName, setDisplayName] = useState("");
  const [schoolId, setSchoolId] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [createdCode, setCreatedCode] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function load() {
    const res = await fetch("/api/admin/badges");
    if (!res.ok) {
      setError("Could not load badge tools");
      return;
    }
    const data = await res.json();
    setSchools(data.schools ?? []);
    setBadges(data.badges ?? []);
    if (!schoolId && data.schools?.[0]) setSchoolId(data.schools[0].id);
  }

  useEffect(() => {
    void load();
  }, []);

  async function create() {
    setBusy(true);
    setError(null);
    setCreatedCode(null);
    try {
      const res = await fetch("/api/admin/badges", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          displayName,
          schoolId,
          email: email.trim() || undefined,
          password: password || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed");
      setCreatedCode(data.badge?.badgeCode ?? null);
      setDisplayName("");
      setEmail("");
      setPassword("");
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      {schools.length === 0 ? (
        <div className="portal-empty">
          <p className="portal-empty__title">Approve a school first</p>
          <p className="portal-empty__body">
            Then issue student badge codes for scan or typed login. Keep these
            separate from community Roles above.
          </p>
        </div>
      ) : (
        <div className="portal-panel space-y-3">
          <h3 className="text-sm font-semibold text-forest-800">
            Issue a badge login
          </h3>
          <label className="block text-sm font-semibold text-forest-900">
            Student name
            <input
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="field mt-1.5"
              placeholder="Student name"
            />
          </label>
          <label className="block text-sm font-semibold text-forest-900">
            School
            <select
              value={schoolId}
              onChange={(e) => setSchoolId(e.target.value)}
              className="field mt-1.5"
            >
              {schools.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-sm font-semibold text-forest-900">
            Login email (new student)
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
              className="field mt-1.5"
              placeholder="student@school.org"
            />
          </label>
          <label className="block text-sm font-semibold text-forest-900">
            Temporary password
            <input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type="password"
              minLength={8}
              className="field mt-1.5"
              placeholder="At least 8 characters"
            />
          </label>
          <button
            type="button"
            disabled={
              busy ||
              displayName.trim().length < 2 ||
              !schoolId ||
              !email.trim() ||
              password.length < 8
            }
            onClick={() => void create()}
            className="btn-primary"
          >
            {busy ? "Creating…" : "Create badge login"}
          </button>
          {createdCode ? (
            <p className="rounded-[10px] border border-forest-200 bg-forest-100 px-3 py-2 text-sm text-forest-900">
              Badge code ready:{" "}
              <span className="font-mono text-lg font-semibold tracking-wider">
                {createdCode}
              </span>
            </p>
          ) : null}
          {error ? (
            <p className="rounded-[10px] border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
              {error}
            </p>
          ) : null}
        </div>
      )}

      {badges.length > 0 ? (
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-forest-800">
            Recent badge logins
          </h3>
          <ul className="divide-y divide-line overflow-hidden rounded-[10px] border border-line bg-surface">
            {badges.slice(0, 12).map((b) => (
              <li
                key={b.id}
                className="flex min-h-12 flex-wrap items-center justify-between gap-2 px-4 py-3 text-sm"
              >
                <span className="font-semibold text-forest-950">
                  {b.displayName}
                </span>
                <span className="font-mono tracking-wider text-forest-800">
                  {b.badgeCode}
                </span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
