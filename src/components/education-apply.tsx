"use client";

import { SchoolApplicationForm } from "@/components/school-application-form";

type Props = {
  defaultName?: string;
  defaultEmail?: string;
  hasAccount?: boolean;
  alreadyApplied?: boolean;
  alreadyAppliedMessage?: string;
};

/**
 * School / district apply only.
 * Teachers are invited by email — no teacher-only signup/apply.
 * Submit creates the school-admin account immediately (when not signed in).
 */
export function EducationApply({
  defaultName = "",
  defaultEmail = "",
  hasAccount = false,
  alreadyApplied = false,
  alreadyAppliedMessage,
}: Props) {
  return (
    <div className="space-y-4">
      <SchoolApplicationForm
        defaultName={defaultName}
        defaultEmail={defaultEmail}
        hasAccount={hasAccount}
        alreadyApplied={alreadyApplied}
        alreadyAppliedMessage={alreadyAppliedMessage}
      />
    </div>
  );
}
