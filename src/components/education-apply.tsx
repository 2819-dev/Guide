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
    <SchoolApplicationForm
      defaultName={defaultName}
      defaultEmail={defaultEmail}
    />
  );
}
