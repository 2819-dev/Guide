"use client";

import { useEffect, useState } from "react";
import { appHomePath, type GuideApp } from "@/lib/apps";

type Classroom = { id: string; name: string };

export function TeacherAppsPanel() {
  const [catalog, setCatalog] = useState<GuideApp[]>([]);
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [installsByClassroom, setInstallsByClassroom] = useState<
    Record<string, string[]>
  >({});
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  async function load() {
    const res = await fetch("/api/education/apps");
    if (!res.ok) {
      setError("Could not load apps");
      return;
    }
    const data = await res.json();
    setCatalog(data.catalog ?? []);
    setClassrooms(data.classrooms ?? []);
    setInstallsByClassroom(data.installsByClassroom ?? {});
  }

  useEffect(() => {
    void load();
  }, []);

  async function toggle(classroomId: string, appSlug: string, install: boolean) {
    const key = `${classroomId}:${appSlug}`;
    setBusy(key);
    setError(null);
    try {
      const res = await fetch("/api/education/apps", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ classroomId, appSlug, install }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed");
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed");
    } finally {
      setBusy(null);
    }
  }

  return (
    <section id="apps" className="space-y-4">
      <div>
        <h2 className="portal-section-title">Apps</h2>
        <p className="-mt-2 text-sm text-ink-muted">
          Add apps from the Guide library to a class. Students see them under
          My apps on their portal — not in the top bar.
        </p>
      </div>

      {classrooms.length === 0 ? (
        <p className="portal-panel text-sm text-ink-muted">
          Create a class first, then add apps here.
        </p>
      ) : (
        <div className="space-y-4">
          {catalog.map((app) => (
            <div key={app.slug} className="portal-panel space-y-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <span
                    className="portal-app-tile__mark !h-12 !w-12 !text-lg"
                    aria-hidden
                  >
                    {app.name.slice(0, 1)}
                  </span>
                  <div>
                    <p className="text-lg font-semibold text-forest-950">
                      {app.name}
                    </p>
                    <p className="mt-0.5 text-sm text-forest-700">
                      {app.tagline}
                    </p>
                  </div>
                </div>
                <a
                  href={appHomePath(app.slug)}
                  className="btn-secondary !py-2 text-sm"
                >
                  Open app
                </a>
              </div>
              <ul className="divide-y divide-line rounded-[10px] border border-line">
                {classrooms.map((room) => {
                  const installed =
                    installsByClassroom[room.id]?.includes(app.slug) ?? false;
                  const key = `${room.id}:${app.slug}`;
                  return (
                    <li
                      key={room.id}
                      className="flex flex-wrap items-center justify-between gap-3 px-4 py-3"
                    >
                      <span className="font-medium text-forest-950">
                        {room.name}
                      </span>
                      <button
                        type="button"
                        disabled={busy === key}
                        onClick={() =>
                          void toggle(room.id, app.slug, !installed)
                        }
                        className={installed ? "btn-secondary !py-2 text-sm" : "btn-primary !py-2 text-sm"}
                      >
                        {busy === key
                          ? "Saving…"
                          : installed
                            ? "Remove from class"
                            : `Add ${app.name}`}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>
      )}

      {error && <p className="text-sm text-red-700">{error}</p>}
    </section>
  );
}
