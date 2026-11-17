"use client";

import { useEffect, useState } from "react";
import {
  APP_UNAVAILABLE_LABEL,
  appOpenHref,
  isAppAvailable,
  type GuideApp,
} from "@/lib/apps";

type Classroom = { id: string; name: string };

/** `refreshKey` changes when classes are created so this panel reloads. */
export function TeacherAppsPanel({ refreshKey = 0 }: { refreshKey?: number }) {
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
      setError("Apps couldn’t be loaded. Refresh the page to try again.");
      return;
    }
    const data = await res.json();
    setCatalog(data.catalog ?? []);
    setClassrooms(data.classrooms ?? []);
    setInstallsByClassroom(data.installsByClassroom ?? {});
  }

  useEffect(() => {
    void load();
  }, [refreshKey]);  

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
      if (!res.ok) {
        throw new Error(data.error ?? "Your change wasn’t saved. Try again.");
      }
      await load();
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Your change wasn’t saved. Try again.",
      );
    } finally {
      setBusy(null);
    }
  }

  return (
    <section id="apps" className="space-y-4">
      <div>
        <h2 className="portal-section-title">Apps</h2>
        <p className="portal-section-lede">
          Add apps from the Guide library to your classes. Students open them
          from My apps.
        </p>
      </div>

      {classrooms.length === 0 ? (
        <div className="portal-empty">
          <p className="portal-empty__title">No classes yet</p>
          <p className="portal-empty__body">
            Create a class first. Then you can add apps to it here.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {[...catalog]
            .sort(
              (a, b) => Number(isAppAvailable(b)) - Number(isAppAvailable(a)),
            )
            .map((app) => (
            <div
              key={app.slug}
              className={`portal-panel space-y-4${isAppAvailable(app) ? "" : " portal-tile--soon"}`}
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex min-w-0 items-start gap-3">
                  <span
                    className="portal-app-tile__mark !h-12 !w-12 !text-lg"
                    aria-hidden
                  >
                    {app.name.slice(0, 1)}
                  </span>
                  <div className="min-w-0">
                    <p className="text-lg font-semibold text-forest-950">
                      {app.name}
                    </p>
                    <p className="mt-0.5 text-sm text-ink-muted">
                      {app.tagline}
                    </p>
                  </div>
                </div>
                {isAppAvailable(app) ? (
                  <a
                    href={appOpenHref(app) ?? "#"}
                    className="btn-secondary !min-h-10 !px-4 !py-2 !text-sm"
                    {...(app.launchUrl
                      ? { rel: "noopener noreferrer" }
                      : {})}
                  >
                    Open app
                  </a>
                ) : (
                  <span className="portal-pill">{APP_UNAVAILABLE_LABEL}</span>
                )}
              </div>
              {!isAppAvailable(app) ? (
                <p className="text-sm text-ink-muted">{app.description}</p>
              ) : (
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
                      <span className="min-w-0 font-medium text-forest-950">
                        {room.name}
                      </span>
                      <button
                        type="button"
                        disabled={busy === key}
                        onClick={() =>
                          void toggle(room.id, app.slug, !installed)
                        }
                        className={`${installed ? "btn-secondary" : "btn-primary"} !min-h-10 !px-4 !py-2 !text-sm`}
                      >
                        {busy === key
                          ? "Saving…"
                          : installed
                            ? "Remove from class"
                            : "Add to class"}
                      </button>
                    </li>
                  );
                })}
              </ul>
              )}
            </div>
          ))}
        </div>
      )}

      {error && (
        <p className="form-alert form-alert--error" role="alert">
          {error}
        </p>
      )}
    </section>
  );
}
