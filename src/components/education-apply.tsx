"use client";

import { useState } from "react";
import { SchoolApplicationForm } from "@/components/school-application-form";
import { TeacherApplicationForm } from "@/components/teacher-application-form";

type Path = "choose" | "teacher" | "school";

type Props = {
  defaultName?: string;
  defaultEmail?: string;
  initialPath?: Path;
};

/**
 * Clever-style path choice: teacher/class apply vs full school apply.
 */
export function EducationApply({
  defaultName = "",
  defaultEmail = "",
  initialPath = "choose",
}: Props) {
  const [path, setPath] = useState<Path>(initialPath);

  if (path === "teacher") {
    return (
      <div className="space-y-4">
        <button
          type="button"
          onClick={() => setPath("choose")}
          className="text-sm font-semibold text-forest-800"
        >
          ← Choose a different path
        </button>
        <TeacherApplicationForm
          defaultName={defaultName}
          defaultEmail={defaultEmail}
        />
      </div>
    );
  }

  if (path === "school") {
    return (
      <div className="space-y-4">
        <button
          type="button"
          onClick={() => setPath("choose")}
          className="text-sm font-semibold text-forest-800"
        >
          ← Choose a different path
        </button>
        <SchoolApplicationForm
          defaultName={defaultName}
          defaultEmail={defaultEmail}
        />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <p className="portal-eyebrow">Get started</p>
        <h2 className="display-feature mt-1">How are you applying?</h2>
        <p className="mt-2 max-w-xl text-[0.95rem] leading-relaxed text-ink-muted">
          Teachers can add a class. School administrators can apply for the
          whole school or district. Either way, the portal unlocks after
          approval.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <button
          type="button"
          onClick={() => setPath("teacher")}
          className="portal-panel !shadow-soft text-left transition hover:border-forest-300"
        >
          <p className="text-xs font-semibold uppercase tracking-wide text-forest-600">
            Teacher
          </p>
          <p className="mt-2 text-lg font-semibold tracking-tight text-forest-950">
            I’m a teacher — add my class
          </p>
          <p className="mt-2 text-sm leading-relaxed text-ink-muted">
            Short form. Invite your students and add apps after you’re approved.
          </p>
        </button>

        <button
          type="button"
          onClick={() => setPath("school")}
          className="portal-panel !shadow-soft text-left transition hover:border-forest-300"
        >
          <p className="text-xs font-semibold uppercase tracking-wide text-forest-600">
            School
          </p>
          <p className="mt-2 text-lg font-semibold tracking-tight text-forest-950">
            I’m applying for my school
          </p>
          <p className="mt-2 text-sm leading-relaxed text-ink-muted">
            Full school or district application for administrators.
          </p>
        </button>
      </div>
    </div>
  );
}
