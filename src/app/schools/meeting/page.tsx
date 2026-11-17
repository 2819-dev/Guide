import Link from "next/link";
import { MeetingRequestForm } from "@/components/meeting-request-form";

export const runtime = "edge";

export const metadata = {
  title: "Book a meeting · Guide",
  description:
    "Request a walkthrough of Guide with the Guide team.",
};

export default function BookMeetingPage() {
  return (
    <div className="portal-page">
      <section className="schools-hero-band">
        <div className="content-band py-12 sm:py-14 lg:py-20">
          <div className="mx-auto max-w-3xl text-center">
            <p className="eyebrow">For schools</p>
            <h1 className="display-feature mx-auto mt-3 max-w-[18ch] lg:max-w-[13em]">
              Book a meeting
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-base font-medium leading-[1.65] text-ink-muted lg:text-lg">
              Meet with the Guide team for a walkthrough of classes, teacher
              invitations, and the apps students open from My apps.
            </p>
            <p className="hero-secondary-links mt-6 justify-center">
              <Link href="/schools/demo">See a demo</Link>
              <span aria-hidden className="hero-secondary-links__dot">
                ·
              </span>
              <Link href="/education#apply">Apply for your school</Link>
              <span aria-hidden className="hero-secondary-links__dot">
                ·
              </span>
              <Link href="/auth/sign-in?as=educator">Teacher log in</Link>
            </p>
          </div>
        </div>
      </section>

      <div className="content-band portal-page__inner max-w-2xl !pt-6">
        <MeetingRequestForm />
      </div>
    </div>
  );
}
