"use client";

import { useEffect, useState } from "react";
import { TeacherAppsPanel } from "@/components/teacher-apps-panel";
import { TeacherMessages } from "@/components/teacher-messages";
import { TeacherSuggestionsAccess } from "@/components/teacher-suggestions-access";

type Student = {
  id: string;
  displayName: string;
  dapimStudied: number;
  quizAttempts: number;
  bestScore: number | null;
  averageQuizScore: number | null;
  notesSubmitted: number;
  recentDafim: string[];
};

type Classroom = {
  id: string;
  name: string;
  inviteCode: string;
  students: Student[];
};

export function EducationPanel() {
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function load() {
    const res = await fetch("/api/education/classrooms");
    if (!res.ok) {
      setError("Could not load classes");
      return;
    }
    const data = await res.json();
    setClassrooms(data.classrooms);
  }

  useEffect(() => {
    void load();
  }, []);

  async function createClass() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/education/classrooms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed");
      setName("");
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <TeacherAppsPanel />

      <section id="classes" className="space-y-4">
        <h2 className="portal-section-title">Classes</h2>
        <div className="portal-panel space-y-3">
          <p className="text-sm font-semibold text-forest-950">New class</p>
          <div className="flex flex-wrap gap-3">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Evening Gemara · בבא מציעא"
              className="field max-w-md"
            />
            <button
              type="button"
              disabled={busy || name.trim().length < 2}
              onClick={() => void createClass()}
              className="btn-primary"
            >
              Create
            </button>
          </div>
          {error && <p className="text-sm text-red-700">{error}</p>}
        </div>

        {classrooms.length === 0 ? (
          <div className="portal-empty">
            <p className="portal-empty__title">No classes yet</p>
            <p className="portal-empty__body">
              Create one above — student progress appears after they join with
              the invite code.
            </p>
          </div>
        ) : (
          classrooms.map((room) => (
            <div key={room.id} className="portal-panel space-y-4">
              <div>
                <h3 className="text-xl font-semibold tracking-tight text-forest-950">
                  {room.name}
                </h3>
                <p className="mt-1 text-sm text-ink-muted">
                  Invite code:{" "}
                  <span className="font-mono font-semibold text-forest-800">
                    {room.inviteCode}
                  </span>{" "}
                  — students enter this after signing in.
                </p>
              </div>

              {room.students.length === 0 ? (
                <p className="text-sm text-ink-muted">No students yet.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[640px] border-collapse text-left text-sm">
                    <thead>
                      <tr className="border-b border-line text-forest-700">
                        <th className="py-2 pr-3 font-semibold">Student</th>
                        <th className="py-2 pr-3 font-semibold">Dapim</th>
                        <th className="py-2 pr-3 font-semibold">Quizzes</th>
                        <th className="py-2 pr-3 font-semibold">Best</th>
                        <th className="py-2 pr-3 font-semibold">Avg</th>
                        <th className="py-2 pr-3 font-semibold">Notes</th>
                        <th className="py-2 font-semibold">Recent</th>
                      </tr>
                    </thead>
                    <tbody>
                      {room.students.map((s) => (
                        <tr key={s.id} className="border-b border-line/70">
                          <td className="py-3 pr-3 font-medium text-forest-950">
                            {s.displayName}
                          </td>
                          <td className="py-3 pr-3">{s.dapimStudied}</td>
                          <td className="py-3 pr-3">{s.quizAttempts}</td>
                          <td className="py-3 pr-3">
                            {s.bestScore == null ? "—" : `${s.bestScore}%`}
                          </td>
                          <td className="py-3 pr-3">
                            {s.averageQuizScore == null
                              ? "—"
                              : `${s.averageQuizScore}%`}
                          </td>
                          <td className="py-3 pr-3">{s.notesSubmitted}</td>
                          <td className="py-3 text-ink-muted">
                            {s.recentDafim.join(", ") || "—"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ))
        )}
      </section>

      <div id="suggestions-access">
        <TeacherSuggestionsAccess />
      </div>
      <div id="messages">
        <TeacherMessages />
      </div>
    </>
  );
}
