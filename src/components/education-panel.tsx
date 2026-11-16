"use client";

import { useEffect, useState } from "react";
import {
  AddStudentForm,
  PasswordHelpPanel,
  ResetPasswordButton,
} from "@/components/student-accounts-ui";
import { TeacherAppsPanel } from "@/components/teacher-apps-panel";
import { TeacherInvitesPanel } from "@/components/teacher-invites-panel";
import { TeacherMessages } from "@/components/teacher-messages";
import { TeacherSuggestionsAccess } from "@/components/teacher-suggestions-access";

type Student = {
  id: string;
  displayName: string;
  username: string | null;
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

export function EducationPanel({
  canInviteTeachers = true,
}: {
  canInviteTeachers?: boolean;
}) {
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [classesVersion, setClassesVersion] = useState(0);

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
      setClassesVersion((v) => v + 1);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <PasswordHelpPanel refreshKey={classesVersion} />

      <GettingStarted
        hasClass={classrooms.length > 0}
        hasStudents={classrooms.some((c) => c.students.length > 0)}
        canInviteTeachers={canInviteTeachers}
      />

      <section id="classes" className="space-y-4">
        <div>
          <h2 className="portal-section-title">Classes</h2>
          <p className="-mt-2 text-sm text-ink-muted">
            Create a class, then add each student with a username and password.
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
              Name it above — for example “Grade 5 · Room 12”. Then add your
              students to it.
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
                  Class code:{" "}
                  <span className="font-mono font-semibold text-forest-800">
                    {room.inviteCode}
                  </span>{" "}
                  — students with an account can also join this class from
                  their portal.
                </p>
              </div>

              {room.students.length === 0 ? (
                <p className="text-sm text-ink-muted">
                  No students yet. Add each student below — you’ll get a
                  username and password to give them.
                </p>
              ) : (
                <div>
                  <table className="w-full border-collapse text-left text-sm">
                    <thead>
                      <tr className="border-b border-line text-forest-700">
                        <th className="py-2 pr-3 font-semibold">Student</th>
                        <th className="hidden py-2 pr-3 font-semibold sm:table-cell">Username</th>
                        <th className="hidden py-2 pr-3 font-semibold sm:table-cell">Quizzes</th>
                        <th className="py-2 font-semibold">
                          <span className="sr-only">Password</span>
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {room.students.map((s) => (
                        <tr key={s.id} className="border-b border-line/70 align-top">
                          <td className="py-3 pr-3 font-medium text-forest-950">
                            {s.displayName}
                            {s.username ? (
                              <span className="block font-mono text-xs font-normal text-ink-muted sm:hidden">
                                {s.username}
                              </span>
                            ) : null}
                          </td>
                          <td className="hidden py-3 pr-3 font-mono sm:table-cell">
                            {s.username ?? <span className="text-ink-muted">—</span>}
                          </td>
                          <td className="hidden py-3 pr-3 sm:table-cell">{s.quizAttempts}</td>
                          <td className="py-3 text-right">
                            {s.username ? (
                              <ResetPasswordButton
                                studentId={s.id}
                                name={s.displayName}
                                username={s.username}
                                onDone={() => setClassesVersion((v) => v + 1)}
                              />
                            ) : null}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              <AddStudentForm
                classroomId={room.id}
                onAdded={() => void load()}
              />
            </div>
          ))
        )}
      </section>

      <TeacherAppsPanel refreshKey={classesVersion} />
      {canInviteTeachers ? <TeacherInvitesPanel /> : null}

      <div id="suggestions-access">
        <TeacherSuggestionsAccess refreshKey={classesVersion} />
      </div>
      <div id="messages">
        <TeacherMessages />
      </div>
    </>
  );
}

/** First-run checklist; hides once a class has students. */
function GettingStarted({
  hasClass,
  hasStudents,
  canInviteTeachers,
}: {
  hasClass: boolean;
  hasStudents: boolean;
  canInviteTeachers: boolean;
}) {
  if (hasClass && hasStudents) return null;
  const steps = [
    { done: hasClass, label: "Create your first class", href: "#classes" },
    { done: hasStudents, label: "Add students to it", href: "#classes" },
    { done: false, label: "Add an app like Blitz", href: "#apps" },
    ...(canInviteTeachers
      ? [{ done: false, label: "Invite your teachers (optional)", href: "#teachers" }]
      : []),
  ];
  return (
    <section className="portal-panel" aria-labelledby="get-started-title">
      <h2 id="get-started-title" className="text-lg font-semibold text-forest-950">
        Get started
      </h2>
      <ol className="mt-3 space-y-2">
        {steps.map((step, i) => (
          <li key={step.label} className="flex items-center gap-3">
            <span
              className={`grid h-7 w-7 shrink-0 place-items-center rounded-full text-sm font-bold ${
                step.done
                  ? "bg-forest-700 text-white"
                  : "border-2 border-forest-300 text-forest-800"
              }`}
              aria-hidden
            >
              {step.done ? "✓" : i + 1}
            </span>
            {step.done ? (
              <span className="text-ink-muted line-through">{step.label}</span>
            ) : (
              <a href={step.href} className="font-semibold text-forest-800 hover:underline">
                {step.label}
              </a>
            )}
          </li>
        ))}
      </ol>
    </section>
  );
}
