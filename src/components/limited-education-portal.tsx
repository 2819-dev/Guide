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

  const title = isRejected
    ? "Application not approved"
    : status === "pending"
      ? "Under review"
      : "Welcome";

  const body = isRejected
    ? `${schoolLabel} was not approved this time. You can update your details and re-apply — full classroom tools open after approval.`
    : status === "pending"
      ? `${schoolLabel} is being reviewed. You can sign in anytime. Invite teachers, classes, and apps will be ready here once your school is approved.`
      : "Finish applying for your school to open classroom tools after approval.";

  return (
    <PortalShell
      eyebrow={portalLabel}
      title={`Hi, ${displayName}`}
      subtitle={
        isRejected
          ? "Your portal is ready with a limited view while you re-apply."
          : "Your portal is ready. Full tools open when your school is approved."
      }
    >
      <div className="portal-panel portal-limited">
        <div className="portal-limited__visual" aria-hidden>
          <LimitedPortalIllustration />
        </div>
        <p className="portal-eyebrow mt-6">{isRejected ? "Status" : "Application status"}</p>
        <h2 className="display-feature mt-1 text-[1.35rem] sm:text-[1.5rem]">
          {title}
        </h2>
        <p className="mt-3 max-w-lg text-[0.95rem] leading-relaxed text-ink-muted">
          {body}
        </p>
        <div className="mt-6 flex flex-wrap items-center gap-3">
          {isRejected || status === "none" ? (
            <Link href="/education#apply" className="btn-primary">
              {isRejected ? "Re-apply for your school" : "Apply for your school"}
            </Link>
          ) : null}
          {kind === "school" && status === "pending" ? (
            <p className="text-sm text-ink-muted">
              No further action needed while we review.
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
      <rect width="320" height="160" rx="12" fill="rgba(240,245,242,0.95)" />
      <path
        d="M0 118c28-18 56-18 84 0s56 18 84 0 56-18 84 0 56 18 84 0v42H0v-42Z"
        fill="rgba(28,61,46,0.08)"
      />
      <circle cx="248" cy="42" r="18" fill="rgba(28,61,46,0.12)" />
      <path
        d="M72 118V62h48v56"
        stroke="rgba(28,61,46,0.35)"
        strokeWidth="2.5"
        strokeLinejoin="round"
      />
      <path
        d="M64 62h64l-32-28-32 28Z"
        fill="rgba(28,61,46,0.22)"
        stroke="rgba(28,61,46,0.4)"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <rect
        x="88"
        y="78"
        width="16"
        height="16"
        rx="2"
        fill="rgba(28,61,46,0.12)"
        stroke="rgba(28,61,46,0.28)"
        strokeWidth="1.5"
      />
      <path
        d="M168 118c0-22 14-36 32-36s32 14 32 36"
        stroke="rgba(28,61,46,0.28)"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <circle cx="200" cy="68" r="10" fill="rgba(28,61,46,0.18)" />
      <path
        d="M186 118h28"
        stroke="rgba(28,61,46,0.28)"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
    </svg>
  );
}
