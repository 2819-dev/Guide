"use client";

import { SchoolApplicationForm } from "@/components/school-application-form";

type Props = {
  defaultName?: string;
  defaultEmail?: string;
};

/**
 * School / district apply only.
 * Teachers are invited by email — no teacher-only signup/apply.
 */
export function EducationApply({
  defaultName = "",
  defaultEmail = "",
}: Props) {
  return (
    <div className="space-y-4">
      <div>
        <p className="portal-eyebrow">For schools</p>
        <h2 className="display-feature mt-1">Apply for your school</h2>
        <p className="mt-2 max-w-xl text-[0.95rem] leading-relaxed text-ink-muted">
          School and district administrators apply here. After approval, invite
          teachers by email, add classroom apps, and keep students engaged.
          Teachers log in only — there is no separate teacher signup.
        </p>
      </div>
      <SchoolApplicationForm
        defaultName={defaultName}
        defaultEmail={defaultEmail}
      />
    </div>
  );
}
