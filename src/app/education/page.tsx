import Link from "next/link";
import { SchoolApplicationForm } from "@/components/school-application-form";
import {
  getApplicantEducationStatus,
  hasEducationAccess,
} from "@/lib/education-access";
import { ensureProfile } from "@/lib/profile";

export const instant = false;

export const metadata = {
  title: "Guide for Education",
  description:
    "Guide for Education helps schools and Rebbeim invite students, add apps like Chazarah, and see progress from home or Chromebook.",
};

export default async function EducationLandingPage() {
  const session = await ensureProfile().catch(() => null);
  const canOpenPanel = session
    ? await hasEducationAccess(session.profile)
    : false;
  const appStatus = session
    ? await getApplicantEducationStatus(session.profile.id)
    : { status: "none" as const };

  const formLocked =
    appStatus.status === "pending" || appStatus.status === "approved";
  const lockedMessage =
    appStatus.status === "approved"
      ? `${appStatus.schoolName ?? "Your school"} is approved. Open the Rebbe panel to invite students.`
      : appStatus.status === "pending"
        ? `${appStatus.schoolName ?? "Your application"} is pending review. We will unlock Education access after approval.`
        : undefined;

  return (
    <div>
      <section className="hero-band">
        <div className="mx-auto max-w-3xl px-5 py-16 text-center sm:px-8 sm:py-20">
          <p className="eyebrow">Guide for Education</p>
          <h1 className="display mt-3 text-[2.25rem] text-forest-950 sm:text-5xl">
            Classes, apps, and home learning in one place
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-base text-ink-muted sm:text-lg">
            Apply once. After approval, Rebbeim invite a class, add apps from
            the Guide library, and follow progress from home or Chromebook.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            {canOpenPanel ? (
              <Link href="/education/panel" className="btn-primary">
                Open teacher portal
              </Link>
            ) : (
              <a href="#apply" className="btn-primary">
                Apply for your school
              </a>
            )}
            <Link href="/apps" className="btn-secondary">
              App library
            </Link>
          </div>
        </div>
      </section>

      <section className="section-pad mx-auto max-w-6xl">
        <h2 className="display max-w-2xl text-2xl text-forest-950 sm:text-3xl">
          For schools who want home learning to stay visible
        </h2>
        <p className="mt-3 max-w-2xl text-base text-ink-muted">
          Students open apps on Guide. After your school is approved, Rebbeim
          add apps to classes and see progress without a noisy dashboard.
        </p>
        <ol className="mt-8 grid gap-0 border border-line bg-surface lg:grid-cols-3">
          <li className="border-b border-line p-5 lg:border-b-0 lg:border-r">
            <p className="text-xs font-semibold text-forest-600">01</p>
            <h3 className="mt-2 text-base font-semibold text-forest-950">
              Apply
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-ink-muted">
              Send a short school application. We review and approve before
              Education tools open.
            </p>
          </li>
          <li className="border-b border-line p-5 lg:border-b-0 lg:border-r">
            <p className="text-xs font-semibold text-forest-600">02</p>
            <h3 className="mt-2 text-base font-semibold text-forest-950">
              Invite a class
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-ink-muted">
              Create a class and share a short invite code. Students join after
              they sign up.
            </p>
          </li>
          <li className="p-5">
            <p className="text-xs font-semibold text-forest-600">03</p>
            <h3 className="mt-2 text-base font-semibold text-forest-950">
              Track home study
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-ink-muted">
              See dapim visited, quizzes taken, and notes from home or
              Chromebook.
            </p>
          </li>
        </ol>
      </section>

      <section id="apply" className="section-pad mx-auto max-w-3xl !pt-0">
        <SchoolApplicationForm
          defaultName={session?.profile.displayName ?? ""}
          defaultEmail={session?.user.email ?? ""}
          locked={formLocked}
          lockedMessage={lockedMessage}
        />
        {appStatus.status === "rejected" && (
          <p className="mt-4 text-sm text-ink-muted">
            A previous application was not approved. You may submit again with
            updated details.
          </p>
        )}
        {!session && (
          <p className="mt-4 text-sm text-ink-muted">
            Tip:{" "}
            <Link
              href="/auth/sign-in?as=educator"
              className="font-semibold text-forest-700"
            >
              Log in as Teacher or School Administrator
            </Link>{" "}
            before applying so approval can unlock Education automatically.
          </p>
        )}
      </section>
    </div>
  );
}
