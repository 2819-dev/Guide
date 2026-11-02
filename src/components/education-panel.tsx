"use client";

import { useEffect, useState } from "react";
import { TeacherAppsPanel } from "@/components/teacher-apps-panel";
import { TeacherInvitesPanel } from "@/components/teacher-invites-panel";
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
      <TeacherInvitesPanel />

      <section id="classes" className="space-y-4">
        <div>
          <h2 className="portal-section-title">Classes</h2>
          <p className="-mt-2 text-sm text-ink-muted">
            Create a class, share the invite code, then follow student progress.
          </p>
        </div>
        <div className="portal-panel space-y-3">
          <label className="block text-sm font-semibold text-forest-900">
            Class name
            <div className="mt-1.5 flex flex-wrap gap-3">
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Period 3 Algebra · Grade 9"
                className="field min-w-[14rem] flex-1"
              />
              <button
                type="button"
                disabled={busy || name.trim().length < 2}
                onClick={() => void createClass()}
                className="btn-primary"
              >
                {busy ? "Creating…" : "Create class"}
              </button>
            </div>
          </label>
          {error && (
            <p className="rounded-[10px] border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
              {error}
            </p>
          )}
        </div>

        {classrooms.length === 0 ? (
          <div className="portal-empty">
            <p className="portal-empty__title">Create your first class</p>
            <p className="portal-empty__body">
              Use the form above. Students join with the invite code from
              Account, then progress shows here.
            </p>
          </div>
        ) : (
          classrooms.map((room) => (
            <div key={room.id} className="portal-panel space-y-4">
              <div>
                <h3 className="text-lg font-semibold tracking-tight text-forest-950">
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
                <div className="portal-empty !py-6">
                  <p className="portal-empty__title">Waiting for students</p>
                  <p className="portal-empty__body">
                    Share the invite code so students can join from Account.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[640px] border-collapse text-left text-sm">
                    <thead>
                      <tr className="border-b border-line text-forest-700">
                        <th className="py-2 pr-3 font-semibold">Student</th>
                        <th className="py-2 pr-3 font-semibold">Visited</th>
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
