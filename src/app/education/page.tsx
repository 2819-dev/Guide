import Link from "next/link";
import { redirect } from "next/navigation";
import { EducationApply } from "@/components/education-apply";
import {
  getApplicantEducationStatus,
  hasEducationAccess,
} from "@/lib/education-access";
import { educatorPortalLabel } from "@/lib/educator-portal-label";
import { ensureProfile } from "@/lib/profile";

export const runtime = "edge";

export const metadata = {
  title: "For schools · Guide",
  description:
    "Keep students engaged and classrooms well managed. School administrators apply; teachers log in with a school invite.",
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
  const portalLabel = educatorPortalLabel({
    kind: "kind" in appStatus ? appStatus.kind : "school",
  });

  // Signed-in applicants with a pending/approved application go straight to portal.
  if (session && (isPending || isApproved || canOpenPanel)) {
    redirect("/education/panel");
  }

  return (
    <div className="portal-page">
      <section className="bg-paper">
        <div className="content-band py-12 sm:py-16">
          <div className="mx-auto max-w-2xl text-center">
            <p className="eyebrow">For schools</p>
            <h1 className="display-feature mx-auto mt-3 max-w-[18ch]">
              Keep students engaged and classrooms well managed
            </h1>
            <p className="mx-auto mt-4 max-w-xl text-base font-medium leading-[1.65] text-ink-muted">
              Guide gives schools a calm place for classes, apps, and invites —
              so learning feels inviting and teachers stay organized.
              Administrators apply here; teachers log in with a school invite
              only.
            </p>
            <div className="mt-8 flex flex-col items-center gap-2">
              <a href="#apply" className="btn-primary">
                {isRejected ? "Re-apply for your school" : "Apply for your school"}
              </a>
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
                <span aria-hidden className="hero-secondary-links__dot">
                  ·
                </span>
                <Link href="/apps">App library</Link>
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
              Create classes, share invite codes, and follow progress without
              juggling five different tools.
            </p>
          </article>
          <article className="schools-feature">
            <h2 className="schools-feature__title">Apps students actually open</h2>
            <p className="schools-feature__body">
              Teachers add apps to a class. Students see them under My apps —
              Amud, Arcade Education, and more your school chooses.
            </p>
          </article>
          <article className="schools-feature">
            <h2 className="schools-feature__title">Invite teachers by email</h2>
            <p className="schools-feature__body">
              Type work emails from the portal. Guide sends setup links —
              teachers log in only; there is no public teacher signup.
            </p>
          </article>
        </div>
      </section>

      <section className="content-band py-2 sm:py-4">
        <ol className="grid gap-0 overflow-hidden rounded-[10px] border border-line bg-surface shadow-[var(--shadow-soft)] lg:grid-cols-3">
          <li className="border-b border-line p-6 lg:border-b-0 lg:border-r">
            <p className="text-xs font-semibold text-forest-600">01</p>
            <h2 className="mt-2 text-lg font-semibold text-forest-950">
              Apply & create your account
            </h2>
            <p className="mt-2 text-[0.95rem] leading-relaxed text-ink-muted">
              School or district application creates your Guide account right
              away. Open your {portalLabel} while we review.
            </p>
          </li>
          <li className="border-b border-line p-6 lg:border-b-0 lg:border-r">
            <p className="text-xs font-semibold text-forest-600">02</p>
            <h2 className="mt-2 text-lg font-semibold text-forest-950">
              Invite teachers
            </h2>
            <p className="mt-2 text-[0.95rem] leading-relaxed text-ink-muted">
              After approval, paste work emails. Guide sends professional setup
              links.
            </p>
          </li>
          <li className="p-6">
            <p className="text-xs font-semibold text-forest-600">03</p>
            <h2 className="mt-2 text-lg font-semibold text-forest-950">
              Engage students
            </h2>
            <p className="mt-2 text-[0.95rem] leading-relaxed text-ink-muted">
              Teachers create classes and add apps. Students open them from My
              apps.
            </p>
          </li>
        </ol>
      </section>

      <section id="apply" className="content-band max-w-3xl py-12 sm:py-14">
        {isRejected ? (
          <div className="portal-empty mb-5 !border-solid">
            <p className="portal-empty__title">Application not approved</p>
            <p className="portal-empty__body">
              {appStatus.schoolName
                ? `${appStatus.schoolName} was not approved.`
                : "Your previous application was not approved."}{" "}
              Update the details and re-apply below. Your {portalLabel} stays
              available with a limited view until an application is accepted.
            </p>
            <Link href="/education/panel" className="btn-primary mt-5 inline-flex">
              {portalLabel}
            </Link>
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
            then apply — or create your account as you submit below.
          </p>
        )}
      </section>
    </div>
  );
}
