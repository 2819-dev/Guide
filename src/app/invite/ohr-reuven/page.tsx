import type { Metadata } from "next";
import Link from "next/link";
import { GuideBrandBanner } from "@/components/guide-brand-banner";
import { INVITE_BANNER_SRC } from "@/lib/brand";
import { amudPublicUrl, guidePublicUrl } from "@/lib/site";

export const runtime = "edge";

export const metadata: Metadata = {
  title: "Invitation to try Guide · Guide",
  description:
    "Invitation for Yeshivas Ohr Reuven to try Guide with your school.",
  robots: { index: false, follow: false },
};

const GUIDE_URL = guidePublicUrl();
const GUIDE_HOST = GUIDE_URL.replace(/^https?:\/\//, "");
const SCHOOL_APPLY_URL = `${GUIDE_URL}/education#apply`;
const TEACHER_LOGIN_URL = `${GUIDE_URL}/auth/sign-in?as=educator`;
const MEETING_URL = `${GUIDE_URL}/schools/meeting`;
const DEMO_URL = `${GUIDE_URL}/schools/demo`;
const AMUD_URL = amudPublicUrl();
const AMUD_HOST_PATH = AMUD_URL.replace(/^https?:\/\//, "");

/**
 * Safari invite letter for Yeshivas Ohr Reuven.
 * Aligned with teacher-login-only + school/district apply + meeting.
 */
export default function OhrReuvenInvitePage() {
  return (
    <div className="min-h-screen bg-[#eef3f0]">
      <div
        className="sticky top-0 z-10 border-b border-[#d5e0d9] bg-[#f7faf8]/80 px-4 py-3 backdrop-blur-md select-none"
        aria-label="How to copy this invitation"
      >
        <p className="mx-auto max-w-[640px] text-center text-[13px] leading-snug text-[#3d6b52]">
          <strong className="font-semibold text-[#152A20]">iPad / Safari:</strong>{" "}
          tap the letter below → <strong>Select All</strong> →{" "}
          <strong>Copy</strong> → paste into Zoho Mail. Subject:{" "}
          <span className="font-medium text-[#152A20]">
            An invitation to try Guide with your school
          </span>
        </p>
      </div>

      <div className="px-2.5 py-7 sm:px-4 sm:py-9">
        <article
          id="invite-letter"
          className="mx-auto max-w-[640px] overflow-hidden rounded border border-[#d5e0d9] bg-white font-[Georgia,'Times_New_Roman',Times,serif] text-[#152A20] shadow-[0_1px_0_rgba(21,42,32,0.04)]"
        >
          <GuideBrandBanner
            variant="full"
            src={INVITE_BANNER_SRC}
            priority
          />

          <div className="px-6 pb-2 pt-10 text-[17px] leading-[1.7] text-[#2a3f34] sm:px-11">
            <p className="mb-[18px] font-semibold text-[#152A20]">Dear Teacher,</p>
            <p className="mb-[18px]">
              Guide is a school platform that gives teachers and students one
              place to sign in and open the learning apps they use for class.
              Built with Jewish schools in mind, it is designed to support the
              way Torah subjects are taught and learned. We would be honored to
              welcome Yeshivas Ohr Reuven as the first school to use Guide, and
              we would like to invite you to try it at no cost.
            </p>
            <p className="mb-[18px]">
              Schools and districts apply on Guide. After approval, administrators
              invite teachers by email. Teachers log in with that account — there
              is no separate teacher-only signup.
            </p>
            <p className="mb-[18px]">
              <a
                href={AMUD_URL}
                className="font-semibold text-[#1b4332] underline underline-offset-2"
              >
                Amud
              </a>
              , the first app available on Guide, supports structured study and
              practice for Mishnayos and Gemara. It includes a Test Yourself
              experience with varied question types, including translation.
              Students can review after class, and teachers can follow their
              progress as they work.
            </p>
            <p className="mb-[18px]">
              You can{" "}
              <a
                href={DEMO_URL}
                className="font-semibold text-[#1b4332] underline underline-offset-2"
              >
                view the school demo
              </a>{" "}
              on desktop or iPad,{" "}
              <a
                href={MEETING_URL}
                className="font-semibold text-[#1b4332] underline underline-offset-2"
              >
                book a meeting
              </a>
              , or{" "}
              <a
                href={SCHOOL_APPLY_URL}
                className="font-semibold text-[#1b4332] underline underline-offset-2"
              >
                apply for your school
              </a>
              . Teachers who already have an invite can{" "}
              <a
                href={TEACHER_LOGIN_URL}
                className="font-semibold text-[#1b4332] underline underline-offset-2"
              >
                log in here
              </a>
              .
            </p>
            <p className="mb-[18px]">
              Guide is available for free at{" "}
              <a
                href={GUIDE_URL}
                className="font-semibold text-[#1b4332] underline underline-offset-2"
              >
                {GUIDE_HOST}
              </a>
              .
            </p>
            <p className="mb-[18px]">
              Thank you for your time and consideration. We would be grateful for
              the opportunity to work with you.
            </p>
          </div>

          <div className="px-6 pb-7 pt-2 text-center sm:px-11">
            <Link
              href={SCHOOL_APPLY_URL}
              className="inline-block bg-[#1b4332] px-[34px] py-[15px] font-[system-ui,-apple-system,'Segoe_UI',sans-serif] text-base font-semibold text-white no-underline"
            >
              Apply for your school
            </Link>
            <p className="mt-[18px] font-[system-ui,-apple-system,'Segoe_UI',sans-serif] text-sm leading-[1.55] text-[#5a7264]">
              Apply: {GUIDE_HOST}/education
              <br />
              Teacher log in: {GUIDE_HOST}/auth/sign-in?as=educator
              <br />
              Demo: {GUIDE_HOST}/schools/demo
              <br />
              Meeting: {GUIDE_HOST}/schools/meeting
              <br />
              Amud: {AMUD_HOST_PATH}
            </p>
          </div>

          <div className="px-6 pb-10 pt-2 text-[17px] leading-[1.7] text-[#2a3f34] sm:px-11">
            <p className="mb-1 text-[#152A20]">
              <strong className="font-semibold">Hillel Frankel</strong>
            </p>
            <p className="mb-0 font-[system-ui,-apple-system,'Segoe_UI',sans-serif] text-[15px] leading-[1.55] text-[#5a7264]">
              Founder &amp; CEO
              <br />
              Guide Learning
            </p>
          </div>

          <div className="bg-[#152A20] px-6 py-[22px] sm:px-11">
            <div className="flex flex-col gap-3 font-[system-ui,-apple-system,'Segoe_UI',sans-serif] sm:flex-row sm:items-start sm:justify-between sm:gap-6">
              <p className="text-[18px] font-semibold tracking-tight text-white sm:text-[20px]">
                Guide Learning
              </p>
              <p className="text-[13px] leading-[1.6] text-[#c5d4cb] sm:text-right">
                <a
                  href="mailto:hello@guidelearning.org"
                  className="text-[#c5d4cb] underline underline-offset-2"
                >
                  hello@guidelearning.org
                </a>
                <br />
                <a
                  href={GUIDE_URL}
                  className="text-[#c5d4cb] underline underline-offset-2"
                >
                  www.guidelearning.org
                </a>
              </p>
            </div>
          </div>
        </article>

        <p className="mx-auto mt-5 max-w-[640px] select-none text-center font-[system-ui,-apple-system,'Segoe_UI',sans-serif] text-xs text-[#5a7264]">
          <a href={SCHOOL_APPLY_URL} className="font-semibold text-[#1b4332]">
            School apply
          </a>
          {" · "}
          <a href={TEACHER_LOGIN_URL} className="font-semibold text-[#1b4332]">
            Teacher log in
          </a>
          {" · "}
          <a href={GUIDE_URL} className="font-semibold text-[#1b4332]">
            Guide
          </a>
          {" · "}
          <a href={AMUD_URL} className="font-semibold text-[#1b4332]">
            Amud
          </a>
        </p>
      </div>
    </div>
  );
}
