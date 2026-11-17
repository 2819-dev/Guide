import Link from "next/link";
import { redirect } from "next/navigation";
import { EducationApply } from "@/components/education-apply";
import {
  getApplicantEducationStatus,
  hasEducationAccess,
} from "@/lib/education-access";
import { ensureProfile } from "@/lib/profile";

export const runtime = "edge";

export const metadata = {
  title: "For schools · Guide",
  description:
    "One login for every app your school uses. School administrators apply for their school; teachers join by invitation.",
};

/** School/district apply + status. Teachers = login / invite only. */
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

  // Signed-in applicants with a pending/approved application go straight to portal.
  if (session && (isPending || isApproved || canOpenPanel)) {
    redirect("/education/panel");
  }

  return (
    <div className="portal-page">
      <section className="schools-hero-band">
        <div className="content-band py-12 sm:py-16 lg:py-20">
          <div className="mx-auto max-w-3xl text-center">
            <p className="eyebrow">For schools</p>
            <h1 className="display-feature mx-auto mt-3 max-w-[18ch] lg:max-w-[14em]">
              One platform for your classes, rosters, and learning apps
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-base font-medium leading-[1.65] text-ink-muted lg:text-lg">
              Guide gives your school a single sign-in for its learning apps.
              School administrators apply here, and teachers join by
              invitation.
            </p>
            <div className="mt-8 flex flex-col items-center gap-2">
              <a href="#apply" className="btn-primary">
                {isRejected ? "Update and reapply" : "Apply for your school"}
              </a>
              <p className="hero-secondary-links !mt-2">
                <Link href="/schools/demo">See a demo</Link>
                <span aria-hidden className="hero-secondary-links__dot">
                  ·
                </span>
                <Link href="/schools/meeting">Book a meeting</Link>
                <span aria-hidden className="hero-secondary-links__dot">
                  ·
                </span>
                <Link href="/auth/sign-in?as=educator">Teacher log in</Link>
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="content-band py-10 sm:py-14">
        <div className="schools-feature-grid">
          <article className="schools-feature">
            <h2 className="schools-feature__title">Classroom management</h2>
            <p className="schools-feature__body">
              Create classes, give each student a username and password, and
              reset passwords when needed.
            </p>
          </article>
          <article className="schools-feature">
            <h2 className="schools-feature__title">Learning apps in every class</h2>
            <p className="schools-feature__body">
              Teachers add apps, such as Blitz, to a class. Students open them
              from My apps without another password.
            </p>
          </article>
          <article className="schools-feature">
            <h2 className="schools-feature__title">Invite teachers by email</h2>
            <p className="schools-feature__body">
              Enter work email addresses in your portal. Guide sends each
              teacher a link to set up their account.
            </p>
          </article>
        </div>
      </section>

      <section className="content-band py-2 sm:py-4">
        <ol className="grid gap-0 overflow-hidden rounded-[10px] border border-line bg-surface shadow-[var(--shadow-soft)] lg:grid-cols-3">
          <li className="border-b border-line p-6 lg:border-b-0 lg:border-r">
            <p className="text-xs font-semibold text-forest-600">01</p>
            <h2 className="mt-2 text-lg font-semibold text-forest-950">
              Apply for your school
            </h2>
            <p className="mt-2 text-[0.95rem] leading-relaxed text-ink-muted">
              The application takes about five minutes and creates your
              administrator account. The Guide team reviews it and emails you.
            </p>
          </li>
          <li className="border-b border-line p-6 lg:border-b-0 lg:border-r">
            <p className="text-xs font-semibold text-forest-600">02</p>
            <h2 className="mt-2 text-lg font-semibold text-forest-950">
              Invite your teachers
            </h2>
            <p className="mt-2 text-[0.95rem] leading-relaxed text-ink-muted">
              After approval, add teacher email addresses in your portal. Each
              teacher receives a setup link.
            </p>
          </li>
          <li className="p-6">
            <p className="text-xs font-semibold text-forest-600">03</p>
            <h2 className="mt-2 text-lg font-semibold text-forest-950">
              Add classes and students
            </h2>
            <p className="mt-2 text-[0.95rem] leading-relaxed text-ink-muted">
              Teachers create classes, add students, and choose apps. Students
              log in with their school, username, and password.
            </p>
          </li>
        </ol>
      </section>

      <section id="apply" className="content-band max-w-3xl py-12 sm:py-14">
        {isRejected ? (
          <div className="portal-empty mb-5">
            <p className="portal-empty__title">Not approved this time</p>
            <p className="portal-empty__body">
              {appStatus.schoolName
                ? `${appStatus.schoolName} was not approved.`
                : "Your previous application was not approved."}{" "}
              Update the details and reapply below. All tools become available
              after approval.
            </p>
            <div className="portal-empty__action">
              <Link href="/education/panel" className="btn-primary">
                Open your portal
              </Link>
            </div>
          </div>
        ) : null}
        <EducationApply
          defaultName={session?.profile.displayName ?? ""}
          defaultEmail={session?.user.email ?? ""}
          hasAccount={Boolean(session)}
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
            before you apply so your portal opens automatically after approval.
          </p>
        )}
      </section>
    </div>
  );
}
