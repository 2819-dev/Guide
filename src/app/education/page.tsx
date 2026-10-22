import Link from "next/link";
import { EducationApply } from "@/components/education-apply";
import {
  getApplicantEducationStatus,
  hasEducationAccess,
} from "@/lib/education-access";
import { ensureProfile } from "@/lib/profile";

export const runtime = "edge";

export const metadata = {
  title: "Apply for Guide",
  description:
    "School and district administrators apply for Guide. Teachers are invited by email.",
};

/** School/district apply + lock states. Teachers = login / invite only. */
export default async function EducationLandingPage() {
  const session = await ensureProfile().catch(() => null);
  const canOpenPanel = session
    ? await hasEducationAccess(session.profile)
    : false;
  const appStatus = session
    ? await getApplicantEducationStatus(session.profile.id)
    : { status: "none" as const };

  const isPending = appStatus.status === "pending";
  const isRejected = appStatus.status === "rejected";
  const isApproved = appStatus.status === "approved";
  const showPortalCta =
    isApproved || (canOpenPanel && !isPending && !isRejected);

  if (isPending || isApproved) {
    const pendingLabel = appStatus.schoolName
      ? `${appStatus.schoolName} is under review.`
      : "Your school application is under review.";
    const approvedLabel = appStatus.schoolName
      ? `${appStatus.schoolName} is approved.`
      : "Your school is approved.";

    return (
      <div className="portal-page">
        <div className="content-band portal-page__inner max-w-2xl">
          <header className="portal-hero !border-0 !pb-0">
            <p className="portal-eyebrow">School administrator</p>
            <h1 className="display-feature mt-1">
              {isPending ? "Application pending" : "Approved"}
            </h1>
            <p className="mt-2 max-w-xl text-[0.95rem] leading-relaxed text-ink-muted">
              {isPending
                ? `${pendingLabel} The portal stays locked until Guide Official accepts or declines.`
                : `${approvedLabel} Open your portal to invite teachers, create classes, and add apps.`}
            </p>
          </header>

          <div className="portal-panel mt-6">
            {isPending ? (
              <div className="portal-empty !border-0 !bg-transparent !p-0 !shadow-none">
                <p className="portal-empty__title">Waiting for review</p>
                <p className="portal-empty__body">
                  You will use this same Guide account after approval. No
                  further action is needed while pending.
                </p>
              </div>
            ) : (
              <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-[0.95rem] leading-relaxed text-ink-muted">
                  Your school portal is unlocked.
                </p>
                <Link href="/education/panel" className="btn-primary shrink-0">
                  Open portal
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="portal-page">
      <section className="bg-paper">
        <div className="content-band py-12 text-center sm:py-14">
          <p className="eyebrow">For schools</p>
          <h1 className="display-feature mx-auto mt-3 max-w-[20ch]">
            Classes, apps, and home learning in one place
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-base font-medium leading-[1.65] text-ink-muted">
            School and district administrators apply here. After approval,
            invite teachers by email, add apps, and follow progress. Teachers
            log in with their invite — no separate teacher signup.
          </p>
          <div className="mt-7 flex flex-col items-center gap-2">
            {showPortalCta ? (
              <Link href="/education/panel" className="btn-primary">
                Open portal
              </Link>
            ) : (
              <a href="#apply" className="btn-primary">
                {isRejected ? "Re-apply" : "Apply for your school"}
              </a>
            )}
            <p className="hero-secondary-links !mt-2">
              <Link href="/auth/sign-in?as=educator">Teacher log in</Link>
              <span aria-hidden className="hero-secondary-links__dot">
                ·
              </span>
              <Link href="/schools/demo">Demo</Link>
              <span aria-hidden className="hero-secondary-links__dot">
                ·
              </span>
              <Link href="/schools/meeting">Book a meeting</Link>
            </p>
          </div>
        </div>
      </section>

      <section className="content-band py-10 sm:py-12">
        <ol className="grid gap-0 overflow-hidden rounded-[10px] border border-line bg-surface shadow-[var(--shadow-soft)] lg:grid-cols-3">
          <li className="border-b border-line p-6 lg:border-b-0 lg:border-r">
            <p className="text-xs font-semibold text-forest-600">01</p>
            <h2 className="mt-2 text-lg font-semibold text-forest-950">
              Apply
            </h2>
            <p className="mt-2 text-[0.95rem] leading-relaxed text-ink-muted">
              School or district application. Tools stay locked until accepted.
            </p>
          </li>
          <li className="border-b border-line p-6 lg:border-b-0 lg:border-r">
            <p className="text-xs font-semibold text-forest-600">02</p>
            <h2 className="mt-2 text-lg font-semibold text-forest-950">
              Invite teachers
            </h2>
            <p className="mt-2 text-[0.95rem] leading-relaxed text-ink-muted">
              Type teacher emails in your portal. Guide sends setup links.
            </p>
          </li>
          <li className="p-6">
            <p className="text-xs font-semibold text-forest-600">03</p>
            <h2 className="mt-2 text-lg font-semibold text-forest-950">
              Follow progress
            </h2>
            <p className="mt-2 text-[0.95rem] leading-relaxed text-ink-muted">
              Teachers create classes and add apps. Students open them from My
              apps.
            </p>
          </li>
        </ol>
      </section>

      <section id="apply" className="content-band max-w-3xl pb-14">
        {isRejected ? (
          <div className="portal-empty mb-5 !border-solid">
            <p className="portal-empty__title">Application declined</p>
            <p className="portal-empty__body">
              {appStatus.schoolName
                ? `${appStatus.schoolName} was not approved.`
                : "Your previous application was not approved."}{" "}
              Update the details and re-apply below. The portal stays locked
              until an application is accepted.
            </p>
          </div>
        ) : null}
        <EducationApply
          defaultName={session?.profile.displayName ?? ""}
          defaultEmail={session?.user.email ?? ""}
        />
        {!session && (
          <p className="mt-4 text-center text-sm text-ink-muted sm:text-left">
            Already have an account?{" "}
            <Link
              href="/auth/sign-in?as=educator"
              className="font-semibold text-forest-800"
            >
              Log in
            </Link>{" "}
            before applying so approval unlocks your portal automatically.
          </p>
        )}
      </section>
    </div>
  );
}
