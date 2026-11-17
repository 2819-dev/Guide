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
      setError("Classes couldn’t be loaded. Refresh the page to try again.");
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
      if (!res.ok) {
        throw new Error(data.error ?? "The class wasn’t created. Try again.");
      }
      setName("");
      await load();
      setClassesVersion((v) => v + 1);
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "The class wasn’t created. Try again.",
      );
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
          <p className="portal-section-lede">
            Create a class, then add each student with a username and password.
          </p>
        </div>
        <form
          className="portal-panel space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            if (!busy && name.trim().length >= 2) void createClass();
          }}
        >
          <label
            htmlFor="new-class-name"
            className="block text-sm font-semibold text-forest-900"
          >
            Class name
          </label>
          <div className="flex flex-col gap-3 sm:flex-row">
            <input
              id="new-class-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Period 3 Algebra · Grade 9"
              className="field min-w-0 flex-1"
            />
            <button
              type="submit"
              disabled={busy || name.trim().length < 2}
              className="btn-primary sm:shrink-0"
            >
              {busy ? "Creating…" : "Create class"}
            </button>
          </div>
          {error && (
            <p className="form-alert form-alert--error" role="alert">
              {error}
            </p>
          )}
        </form>

        {classrooms.length === 0 ? (
          <div className="portal-empty">
            <p className="portal-empty__title">No classes yet</p>
            <p className="portal-empty__body">
              Name your first class above, then add your students to it.
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
                  Class code{" "}
                  <span className="portal-code">{room.inviteCode}</span>
                  <span className="mt-0.5 block">
                    Students who already have an account can join with this
                    code.
                  </span>
                </p>
              </div>

              {room.students.length === 0 ? (
                <p className="text-sm text-ink-muted">
                  No students yet. Add each student below, then share their
                  username and password with them.
                </p>
              ) : (
                <div>
                  <table className="portal-table">
                    <thead>
                      <tr>
                        <th>Student</th>
                        <th className="hidden sm:table-cell">Username</th>
                        <th className="hidden sm:table-cell">Quizzes</th>
                        <th>
                          <span className="sr-only">Password</span>
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {room.students.map((s) => (
                        <tr key={s.id}>
                          <td className="font-medium">
                            {s.displayName}
                            {s.username ? (
                              <span className="block font-mono text-xs font-normal text-ink-muted sm:hidden">
                                {s.username}
                              </span>
                            ) : null}
                          </td>
                          <td className="hidden font-mono sm:table-cell">
                            {s.username ?? <span className="text-ink-muted">—</span>}
                          </td>
                          <td className="hidden sm:table-cell">{s.quizAttempts}</td>
                          <td className="text-right">
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
    { done: false, label: "Add apps to your classes", href: "#apps" },
    ...(canInviteTeachers
      ? [{ done: false, label: "Invite teachers (optional)", href: "#teachers" }]
      : []),
  ];
  return (
    <section className="portal-panel" aria-labelledby="get-started-title">
      <h2 id="get-started-title" className="text-lg font-semibold text-forest-950">
        Get started
      </h2>
      <ol className="portal-steps">
        {steps.map((step, i) => (
          <li
            key={step.label}
            className={`portal-steps__item${step.done ? " portal-steps__item--done" : ""}`}
          >
            <span className="portal-steps__mark" aria-hidden>
              {step.done ? (
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                  <path
                    d="M3.5 8.5 6.5 11.5 12.5 4.5"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              ) : (
                i + 1
              )}
            </span>
            {step.done ? (
              <span className="portal-steps__label">
                {step.label}
                <span className="sr-only"> (done)</span>
              </span>
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
