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
    ? "Not approved this time"
    : status === "pending"
      ? "Application under review"
      : "Welcome";

  const body = isRejected
    ? `${schoolLabel} was not approved. Update a few details and re-apply when you are ready — classroom tools open after approval.`
    : status === "pending"
      ? `${schoolLabel} is under review. You can sign in anytime. When approved, invite teachers, create classes, and add apps right here.`
      : "Apply for your school to open this portal. Classroom tools arrive after approval.";

  return (
    <PortalShell
      eyebrow={shortRole}
      title={`Hi, ${displayName}`}
      subtitle={
        isRejected
          ? "Your portal stays open while you update and re-apply."
          : "You are in. Full classroom tools arrive when your school is approved."
      }
      accountName={displayName}
    >
      <div className="portal-panel portal-limited">
        <div className="portal-limited__visual" aria-hidden>
          <LimitedPortalIllustration />
        </div>
        <p className="portal-eyebrow mt-6">
          {isRejected ? "Status" : "Application status"}
        </p>
        <h2 className="display-feature mt-1 text-[1.35rem] sm:text-[1.5rem]">
          {title}
        </h2>
        <p className="mt-3 max-w-lg text-[0.95rem] leading-relaxed text-ink-muted">
          {body}
        </p>
        <div className="portal-empty__action !justify-start">
          {isRejected || status === "none" ? (
            <Link href="/education#apply" className="btn-primary">
              {isRejected ? "Update & re-apply" : "Apply for your school"}
            </Link>
          ) : null}
          {kind === "school" && status === "pending" ? (
            <p className="text-sm text-ink-muted">
              Nothing to do while we review — we will email you.
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
      <rect width="320" height="160" rx="12" fill="rgba(246,251,248,0.98)" />
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
