import Link from "next/link";
import { SchoolApplicationForm } from "@/components/school-application-form";
import {
  getApplicantEducationStatus,
  hasEducationAccess,
} from "@/lib/education-access";
import { ensureProfile } from "@/lib/profile";

export const instant = false;

export const metadata = {
  title: "Apply for your school",
  description:
    "Apply so your school or district can use Guide — invite students, add learning apps, and follow progress from anywhere.",
};

/** School apply + teacher lock states — Guide brand, Clever portal density. */
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

  // Clever Instant Login–style status screens (no marketing chrome).
  if (isPending || isApproved) {
    return (
      <div className="portal-page">
        <div className="content-band portal-page__inner max-w-2xl">
          <header className="portal-hero !border-0 !pb-0">
            <p className="portal-eyebrow">
              Teacher or School Administrator
            </p>
            <h1 className="display-feature mt-1">
              {isPending ? "Application pending" : "School approved"}
            </h1>
            <p className="mt-2 max-w-xl text-[0.95rem] leading-relaxed text-ink-muted">
              {isPending
                ? `${appStatus.schoolName ? `${appStatus.schoolName} is under review.` : "Your school application is under review."} The portal stays locked until Guide Official accepts or declines. Classes, apps, and messaging are not available yet.`
                : `${appStatus.schoolName ? `${appStatus.schoolName} is approved.` : "Your school is approved."} Open your portal to create classes, add apps, and message students.`}
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
                  Your teacher portal is unlocked.
                </p>
                <Link href="/education/panel" className="btn-primary shrink-0">
                  Open teacher portal
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
            Apply once. After approval, teachers and school administrators
            invite a class, add apps, and follow progress from school or home.
          </p>
          <div className="mt-7 flex flex-col items-center gap-2">
            {showPortalCta ? (
              <Link href="/education/panel" className="btn-primary">
                Open teacher portal
              </Link>
            ) : (
              <a href="#apply" className="btn-primary">
                {isRejected ? "Re-apply for your school" : "Apply for your school"}
              </a>
            )}
            <p className="hero-secondary-links !mt-2">
              <Link href="/auth/sign-in?as=educator">Log in</Link>
              <span aria-hidden className="hero-secondary-links__dot">
                ·
              </span>
              <Link href="/apps">App library</Link>
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
              Send a short school application. Tools stay locked until it is
              accepted.
            </p>
          </li>
          <li className="border-b border-line p-6 lg:border-b-0 lg:border-r">
            <p className="text-xs font-semibold text-forest-600">02</p>
            <h2 className="mt-2 text-lg font-semibold text-forest-950">
              Invite a class
            </h2>
            <p className="mt-2 text-[0.95rem] leading-relaxed text-ink-muted">
              Create a class and share an invite code. Students join after they
              sign up.
            </p>
          </li>
          <li className="p-6">
            <p className="text-xs font-semibold text-forest-600">03</p>
            <h2 className="mt-2 text-lg font-semibold text-forest-950">
              Follow progress
            </h2>
            <p className="mt-2 text-[0.95rem] leading-relaxed text-ink-muted">
              See app activity from school or home — without a noisy dashboard.
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
                : "Your previous school application was not approved."}{" "}
              Update the details and re-apply below. The portal stays locked
              until an application is accepted.
            </p>
          </div>
        ) : null}
        <SchoolApplicationForm
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
