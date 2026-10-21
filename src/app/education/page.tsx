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

/** School apply landing — routes under /education remain; brand is Guide only. */
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
  // Approved applicants (or Official with panel access) may open tools.
  const showPortalCta = isApproved || (canOpenPanel && !isPending && !isRejected);

  return (
    <div className="portal-page">
      <section className="bg-paper">
        <div className="content-band py-14 text-center sm:py-16">
          <p className="eyebrow">For schools</p>
          <h1 className="display-hero mx-auto mt-3 max-w-[18ch]">
            Classes, apps, and home learning in one place
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-lg font-medium leading-[1.65] text-ink">
            Apply once. After approval, teachers and school administrators
            invite a class, add apps from the Guide library, and follow
            progress from school or home.
          </p>
          <div className="mt-8 flex flex-col items-center gap-3">
            {showPortalCta ? (
              <Link href="/education/panel" className="btn-primary">
                Open teacher portal
              </Link>
            ) : isPending ? (
              <a href="#status" className="btn-primary">
                Application pending
              </a>
            ) : isRejected ? (
              <a href="#apply" className="btn-primary">
                Re-apply for your school
              </a>
            ) : (
              <a href="#apply" className="btn-primary">
                Apply for your school
              </a>
            )}
            <p className="hero-secondary-links !mt-1">
              <Link href="/apps">App library</Link>
            </p>
          </div>
        </div>
      </section>

      {isPending ? (
        <section id="status" className="content-band max-w-3xl py-10 sm:py-12">
          <div className="portal-panel text-center">
            <p className="portal-eyebrow">Teacher / School Administrator</p>
            <h2 className="display-feature mt-2">Application pending</h2>
            <p className="mx-auto mt-3 max-w-lg text-[0.95rem] leading-relaxed text-ink-muted">
              {appStatus.schoolName
                ? `${appStatus.schoolName} is under review.`
                : "Your school application is under review."}{" "}
              The teacher portal stays locked until Guide Official accepts or
              declines the application. Classes, apps, and messaging tools are
              not available yet.
            </p>
          </div>
        </section>
      ) : null}

      {isApproved ? (
        <section id="status" className="content-band max-w-3xl py-10 sm:py-12">
          <div className="portal-panel text-center">
            <p className="portal-eyebrow">Teacher / School Administrator</p>
            <h2 className="display-feature mt-2">School approved</h2>
            <p className="mx-auto mt-3 max-w-lg text-[0.95rem] leading-relaxed text-ink-muted">
              {appStatus.schoolName
                ? `${appStatus.schoolName} is approved.`
                : "Your school is approved."}{" "}
              Open the teacher portal to create classes, add apps, and message
              students.
            </p>
            <Link href="/education/panel" className="btn-primary mt-6 inline-flex">
              Open teacher portal
            </Link>
          </div>
        </section>
      ) : null}

      {!isPending && !isApproved ? (
        <>
          <section className="content-band py-12 sm:py-14">
            <h2 className="display-feature max-w-2xl">
              For schools and districts who want learning to stay visible
            </h2>
            <p className="mt-3 max-w-2xl text-base text-ink-muted">
              Students open apps on Guide. After your school is approved,
              teachers add apps to classes and follow progress from one place.
            </p>
            <ol className="mt-10 grid gap-0 overflow-hidden rounded-[10px] border border-line bg-surface shadow-[var(--shadow-soft)] lg:grid-cols-3">
              <li className="border-b border-line p-6 lg:border-b-0 lg:border-r">
                <p className="text-xs font-semibold text-forest-600">01</p>
                <h3 className="mt-2 text-lg font-semibold text-forest-950">
                  Apply
                </h3>
                <p className="mt-2 text-base leading-relaxed text-ink-muted">
                  Send a short school application. We review before school tools
                  open.
                </p>
              </li>
              <li className="border-b border-line p-6 lg:border-b-0 lg:border-r">
                <p className="text-xs font-semibold text-forest-600">02</p>
                <h3 className="mt-2 text-lg font-semibold text-forest-950">
                  Invite a class
                </h3>
                <p className="mt-2 text-base leading-relaxed text-ink-muted">
                  Create a class and share a short invite code. Students join
                  after they sign up.
                </p>
              </li>
              <li className="p-6">
                <p className="text-xs font-semibold text-forest-600">03</p>
                <h3 className="mt-2 text-lg font-semibold text-forest-950">
                  Follow student progress
                </h3>
                <p className="mt-2 text-base leading-relaxed text-ink-muted">
                  See app activity and progress from school or home — without a
                  noisy dashboard.
                </p>
              </li>
            </ol>
          </section>

          <section id="apply" className="content-band max-w-3xl pb-16">
            {isRejected ? (
              <div className="portal-empty mb-6 !border-solid">
                <p className="portal-empty__title">Application declined</p>
                <p className="portal-empty__body">
                  {appStatus.schoolName
                    ? `${appStatus.schoolName} was not approved.`
                    : "Your previous school application was not approved."}{" "}
                  You can update the details and re-apply below. The teacher
                  portal stays locked until an application is accepted.
                </p>
              </div>
            ) : null}
            <SchoolApplicationForm
              defaultName={session?.profile.displayName ?? ""}
              defaultEmail={session?.user.email ?? ""}
            />
            {!session && (
              <p className="mt-4 text-sm text-ink-muted">
                <Link
                  href="/auth/sign-in?as=educator"
                  className="font-semibold text-forest-800"
                >
                  Log in as Teacher or School Administrator
                </Link>{" "}
                before applying so approval unlocks the teacher portal
                automatically.
              </p>
            )}
          </section>
        </>
      ) : null}
    </div>
  );
}
