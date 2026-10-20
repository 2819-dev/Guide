"use client";

import { useEffect, useState } from "react";

type StudentRow = {
  id: string;
  displayName: string;
  blocked: boolean;
  individuallyBlocked: boolean;
};

type ClassRow = {
  classroomId: string;
  classroomName: string;
  classBlocked: boolean;
  students: StudentRow[];
};

export function TeacherSuggestionsAccess() {
  const [classrooms, setClassrooms] = useState<ClassRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busyKey, setBusyKey] = useState<string | null>(null);

  async function load() {
    const res = await fetch("/api/education/suggestion-blocks");
    if (!res.ok) {
      setError("Could not load Suggestions access");
      return;
    }
    const data = await res.json();
    setClassrooms(data.classrooms ?? []);
  }

  useEffect(() => {
    void load();
  }, []);

  async function setBlock(opts: {
    classroomId: string;
    studentId: string | null;
    blocked: boolean;
  }) {
    const key = `${opts.classroomId}:${opts.studentId ?? "class"}`;
    setBusyKey(key);
    setError(null);
    try {
      const res = await fetch("/api/education/suggestion-blocks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(opts),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Update failed");
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Update failed");
    } finally {
      setBusyKey(null);
    }
  }

  if (classrooms.length === 0) {
    return (
      <p className="panel text-ink-muted">
        Create a class and invite students to manage Suggestions access.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="portal-section-title">Suggestions pause</h2>
        <p className="-mt-2 text-sm text-ink-muted">
          Pause Suggestions for a whole class or for individual students.
        </p>
      </div>
      {error && <p className="text-sm text-red-700">{error}</p>}

      {classrooms.map((room) => (
        <section key={room.classroomId} className="portal-panel space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h3 className="text-lg font-semibold text-forest-950">
              {room.classroomName}
            </h3>
            <label className="inline-flex items-center gap-2 text-sm font-semibold text-forest-900">
              <input
                type="checkbox"
                checked={room.classBlocked}
                disabled={busyKey === `${room.classroomId}:class`}
                onChange={(e) =>
                  void setBlock({
                    classroomId: room.classroomId,
                    studentId: null,
                    blocked: e.target.checked,
                  })
                }
              />
              Pause for whole class
            </label>
          </div>

          {room.students.length === 0 ? (
            <p className="text-sm text-ink-muted">No students in this class.</p>
          ) : (
            <ul className="divide-y divide-line rounded-xl border border-line">
              {room.students.map((s) => (
                <li
                  key={s.id}
                  className="flex flex-wrap items-center justify-between gap-3 px-4 py-3"
                >
                  <div>
                    <p className="font-semibold text-forest-950">
                      {s.displayName}
                    </p>
                    {room.classBlocked && (
                      <p className="text-xs text-ink-muted">
                        Covered by class pause
                      </p>
                    )}
                  </div>
                  <label className="inline-flex items-center gap-2 text-sm text-forest-900">
                    <input
                      type="checkbox"
                      checked={s.individuallyBlocked || room.classBlocked}
                      disabled={
                        room.classBlocked ||
                        busyKey === `${room.classroomId}:${s.id}`
                      }
                      onChange={(e) =>
                        void setBlock({
                          classroomId: room.classroomId,
                          studentId: s.id,
                          blocked: e.target.checked,
                        })
                      }
                    />
                    Pause Suggestions
                  </label>
                </li>
              ))}
            </ul>
          )}
        </section>
      ))}
    </div>
  );
}
