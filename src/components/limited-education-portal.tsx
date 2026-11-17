import Link from "next/link";
import { PortalShell } from "@/components/portal-shell";
import type { SchoolApplicationStatus } from "@/lib/education-access";

type Props = {
  displayName: string;
  status: Extract<SchoolApplicationStatus, "pending" | "rejected" | "none">;
  schoolName?: string;
  /** School applicants vs invited teachers */
  portalLabel: "School Administrator Portal" | "Teacher Portal";
  kind?: "teacher" | "school";
};

/** Calm limited portal while a school application is pending or declined. */
export function LimitedEducationPortal({
  displayName,
  status,
  schoolName,
  portalLabel,
  kind = "school",
}: Props) {
  const isRejected = status === "rejected";
  const schoolLabel = schoolName?.trim() || "Your school";
  const shortRole =
    portalLabel === "Teacher Portal" ? "Teacher" : "School administrator";

  const title = isRejected
    ? "Application not approved"
    : status === "pending"
      ? "Application under review"
      : "Apply for your school";

  const body = isRejected
    ? `The application for ${schoolLabel} was not approved. You can update your details and apply again. Classroom tools become available after approval.`
    : status === "pending"
      ? `The application for ${schoolLabel} is under review. Once it is approved, you can create classes, add apps, and invite teachers here.`
      : "Submit an application for your school to get started. Classroom tools become available after approval.";

  return (
    <PortalShell
      eyebrow={shortRole}
      title={`Welcome, ${displayName}`}
      subtitle={
        isRejected
          ? "You can update your application and apply again at any time."
          : "Classroom tools become available when your school is approved."
      }
      accountName={displayName}
    >
      <div className="portal-panel portal-limited">
        <div className="portal-limited__visual" aria-hidden>
          <LimitedPortalIllustration />
        </div>
        <p className="portal-eyebrow mt-6">Application status</p>
        <h2 className="display-feature mt-1 text-[1.35rem] sm:text-[1.5rem]">
          {title}
        </h2>
        <p className="mt-3 max-w-lg text-[0.95rem] leading-relaxed text-ink-muted">
          {body}
        </p>
        <div className="portal-empty__action !justify-start">
          {isRejected || status === "none" ? (
            <Link href="/education#apply" className="btn-primary">
              {isRejected ? "Update and apply again" : "Apply for your school"}
            </Link>
          ) : null}
          {kind === "school" && status === "pending" ? (
            <p className="text-sm text-ink-muted">
              No action is needed. We will email you when a decision is made.
            </p>
          ) : null}
        </div>
      </div>
    </PortalShell>
  );
}

function LimitedPortalIllustration() {
  return (
    <svg
      className="portal-limited__svg"
      viewBox="0 0 320 160"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
    >
      <rect className="portal-limited__bg" width="320" height="160" rx="12" />
      <path
        d="M0 118c28-18 56-18 84 0s56 18 84 0 56-18 84 0 56 18 84 0v42H0v-42Z"
        fill="rgba(74,143,108,0.1)"
      />
      <circle cx="248" cy="42" r="18" fill="rgba(74,143,108,0.14)" />
      <path
        d="M72 118V62h48v56"
        stroke="rgba(74,143,108,0.4)"
        strokeWidth="2.5"
        strokeLinejoin="round"
      />
      <path
        d="M64 62h64l-32-28-32 28Z"
        fill="rgba(74,143,108,0.22)"
        stroke="rgba(74,143,108,0.45)"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <rect
        x="88"
        y="78"
        width="16"
        height="16"
        rx="2"
        fill="rgba(74,143,108,0.12)"
        stroke="rgba(74,143,108,0.3)"
        strokeWidth="1.5"
      />
      <path
        d="M168 118c0-22 14-36 32-36s32 14 32 36"
        stroke="rgba(74,143,108,0.32)"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <circle cx="200" cy="68" r="10" fill="rgba(74,143,108,0.2)" />
      <path
        d="M186 118h28"
        stroke="rgba(74,143,108,0.32)"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
    </svg>
  );
}
