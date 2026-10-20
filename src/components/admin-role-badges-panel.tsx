"use client";

import { useEffect, useState } from "react";
import { RoleBadgeChip } from "@/components/role-badge-chip";

type Role = {
  id: string;
  name: string;
  slug: string;
  color: string;
  iconUrl: string | null;
};

type Person = {
  id: string;
  displayName: string;
  role: string;
  loginEmail: string | null;
};

type Assignment = {
  id: string;
  roleBadgeId: string;
  profileId: string;
  profileName: string;
  roleName: string;
  roleColor: string;
  roleIconUrl: string | null;
};

export function AdminRoleBadgesPanel() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [people, setPeople] = useState<Person[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [name, setName] = useState("");
  const [color, setColor] = useState("#245239");
  const [iconFile, setIconFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [assignRoleId, setAssignRoleId] = useState("");
  const [assignProfileId, setAssignProfileId] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function load() {
    const res = await fetch("/api/admin/roles");
    if (!res.ok) {
      setError("Could not load roles");
      return;
    }
    const data = await res.json();
    setRoles(data.roles ?? []);
    setPeople(data.people ?? []);
    setAssignments(data.assignments ?? []);
    if (!assignRoleId && data.roles?.[0]) setAssignRoleId(data.roles[0].id);
    if (!assignProfileId && data.people?.[0]) {
      setAssignProfileId(data.people[0].id);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  useEffect(() => {
    if (!iconFile) {
      setPreview(null);
      return;
    }
    const url = URL.createObjectURL(iconFile);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [iconFile]);

  async function createRole() {
    setBusy(true);
    setError(null);
    try {
      const form = new FormData();
      form.set("name", name.trim());
      form.set("color", color);
      if (iconFile) form.set("icon", iconFile);
      const res = await fetch("/api/admin/roles", {
        method: "POST",
        body: form,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed");
      setName("");
      setIconFile(null);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed");
    } finally {
      setBusy(false);
    }
  }

  async function assign(assign: boolean) {
    if (!assignRoleId || !assignProfileId) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/roles/assign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          roleBadgeId: assignRoleId,
          profileId: assignProfileId,
          assign,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed");
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-8">
      <p className="text-sm text-ink-muted">
        Discord-style roles with a name, color, and optional icon. Separate from
        school <span className="font-medium">scan credentials</span> used at
        student Log In.
      </p>

      <div className="portal-panel space-y-4">
        <h3 className="text-sm font-semibold text-forest-800">Create a role</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block text-sm font-semibold text-forest-900">
            Name
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="field mt-1.5"
              placeholder="e.g. Star Student"
            />
          </label>
          <label className="block text-sm font-semibold text-forest-900">
            Color
            <div className="mt-1.5 flex items-center gap-3">
              <input
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="h-11 w-14 cursor-pointer rounded-lg border border-line bg-surface p-1"
              />
              <input
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="field font-mono"
                placeholder="#245239"
              />
            </div>
          </label>
        </div>
        <label className="block text-sm font-semibold text-forest-900">
          Role icon
          <input
            type="file"
            accept="image/png,image/jpeg,image/webp,image/gif,image/svg+xml"
            className="mt-1.5 block w-full text-sm text-ink-muted file:mr-3 file:rounded-full file:border-0 file:bg-forest-100 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-forest-900"
            onChange={(e) => setIconFile(e.target.files?.[0] ?? null)}
          />
        </label>
        {(preview || name) && (
          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold uppercase tracking-wide text-ink-muted">
              Preview
            </span>
            <RoleBadgeChip
              name={name.trim() || "Role"}
              color={color}
              iconUrl={preview}
            />
          </div>
        )}
        <button
          type="button"
          disabled={busy || name.trim().length < 2}
          onClick={() => void createRole()}
          className="btn-primary"
        >
          {busy ? "Saving…" : "Create role"}
        </button>
      </div>

      <div className="portal-panel space-y-4">
        <h3 className="text-sm font-semibold text-forest-800">
          Assign to a person
        </h3>
        {roles.length === 0 || people.length === 0 ? (
          <p className="text-sm text-ink-muted">
            Create a role and wait for people to have accounts, then assign
            here.
          </p>
        ) : (
          <>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block text-sm font-semibold text-forest-900">
                Role
                <select
                  value={assignRoleId}
                  onChange={(e) => setAssignRoleId(e.target.value)}
                  className="field mt-1.5"
                >
                  {roles.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block text-sm font-semibold text-forest-900">
                Person
                <select
                  value={assignProfileId}
                  onChange={(e) => setAssignProfileId(e.target.value)}
                  className="field mt-1.5"
                >
                  {people.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.displayName}
                      {p.loginEmail ? ` · ${p.loginEmail}` : ""}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                disabled={busy}
                onClick={() => void assign(true)}
                className="btn-primary"
              >
                Assign role
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => void assign(false)}
                className="btn-secondary"
              >
                Remove role
              </button>
            </div>
          </>
        )}
      </div>

      {error && <p className="text-sm text-red-700">{error}</p>}

      {roles.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-forest-800">All roles</h3>
          <ul className="flex flex-wrap gap-2">
            {roles.map((r) => (
              <li key={r.id}>
                <RoleBadgeChip
                  name={r.name}
                  color={r.color}
                  iconUrl={r.iconUrl}
                />
              </li>
            ))}
          </ul>
        </div>
      )}

      {assignments.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-forest-800">
            Recent assignments
          </h3>
          <ul className="divide-y divide-line rounded-xl border border-line">
            {assignments.slice(0, 15).map((a) => (
              <li
                key={a.id}
                className="flex flex-wrap items-center justify-between gap-3 px-4 py-3"
              >
                <span className="font-semibold text-forest-950">
                  {a.profileName}
                </span>
                <RoleBadgeChip
                  name={a.roleName}
                  color={a.roleColor}
                  iconUrl={a.roleIconUrl}
                  size="sm"
                />
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
