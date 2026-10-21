import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { amudPublicUrl, guidePublicUrl } from "@/lib/site";

export const runtime = "edge";

export const metadata: Metadata = {
  title: "Invitation to try Guide for your class · Guide",
  description:
    "Private invitation for a teacher to try Guide with their class.",
  robots: { index: false, follow: false },
};

const GUIDE_URL = guidePublicUrl();
const GUIDE_HOST = GUIDE_URL.replace(/^https?:\/\//, "");
const TEACHER_APPLY_URL = `${GUIDE_URL}/education?as=teacher#apply`;
const AMUD_URL = amudPublicUrl();
const AMUD_HOST_PATH = AMUD_URL.replace(/^https?:\/\//, "");

/**
 * Safari-friendly invite letter — professional teacher/class invitation.
 * Source copy: /cursor/stores/self/docs/ohr-reuven-invite-email.md
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
            An invitation to try Guide with your class
          </span>
        </p>
      </div>

      <div className="px-2.5 py-7 sm:px-4 sm:py-9">
        <article
          id="invite-letter"
          className="mx-auto max-w-[640px] overflow-hidden rounded border border-[#d5e0d9] bg-white font-[Georgia,'Times_New_Roman',Times,serif] text-[#152A20] shadow-[0_1px_0_rgba(21,42,32,0.04)]"
        >
          <div className="bg-white px-7 pb-[18px] pt-8 text-center sm:px-8">
            <Image
              src="/invite/ohr-reuven/wordmark.png"
              alt="Guide"
              width={148}
              height={40}
              className="mx-auto h-auto w-[148px]"
              priority
            />
          </div>

          <div className="leading-[0]">
            <Image
              src="/invite/ohr-reuven/banner.jpg"
              alt="Guide"
              width={640}
              height={200}
              className="h-auto w-full"
              priority
            />
          </div>

          <div className="px-6 pb-2 pt-10 text-[17px] leading-[1.7] text-[#2a3f34] sm:px-11">
            <p className="mb-2.5 font-[system-ui,-apple-system,'Segoe_UI',sans-serif] text-[12px] uppercase tracking-[0.12em] text-[#3d6b52]">
              Private invitation
            </p>
            <h1 className="mb-[22px] text-[28px] font-normal leading-[1.3] text-[#152A20] sm:text-[30px]">
              An invitation to try Guide with your class
            </h1>
            <p className="mb-[18px]">Dear Teacher,</p>
            <p className="mb-[18px]">I hope this message finds you well.</p>
            <p className="mb-[18px]">
              I am writing to introduce{" "}
              <strong className="font-semibold text-[#152A20]">Guide</strong>, a
              school platform that gives teachers and students one place to sign
              in and open learning apps for class. I would like to invite you to
              try it{" "}
              <strong className="font-semibold text-[#152A20]">
                with your class
              </strong>
              , at no cost. This is an invitation for your classroom use—not a
              requirement that your entire school adopt the platform.
            </p>
          </div>

          <div className="px-6 py-3 sm:px-11">
            <div className="border border-[#d5e0d9] bg-[#f3f8f5] px-6 py-[26px] sm:px-7">
              <p className="mb-2 font-[system-ui,-apple-system,'Segoe_UI',sans-serif] text-[11px] uppercase tracking-[0.14em] text-[#3d6b52]">
                Our first learning app
              </p>
              <p className="mb-3 text-[24px] leading-[1.3] text-[#152A20]">
                Amud
              </p>
              <p className="mb-3.5 text-[16px] leading-[1.65] text-[#2a3f34]">
                Amud is the first app available on Guide. It supports structured
                study and practice for Mishnayos and Gemara, including a{" "}
                <em>Test Yourself</em> experience with varied questions
                (including translation). Students can review after class; you can
                follow their progress as they work.
              </p>
              <p className="font-[system-ui,-apple-system,'Segoe_UI',sans-serif] text-[15px] leading-[1.6] text-[#3d6b52]">
                Additional apps will be added over time. Teachers choose which
                apps to make available for each class.
              </p>
            </div>
          </div>

          <div className="px-6 pb-2 pt-7 text-[17px] leading-[1.7] text-[#2a3f34] sm:px-11">
            <p className="mb-[18px]">
              If you are interested, you can join Guide{" "}
              <strong className="font-semibold text-[#152A20]">
                as a teacher for your class
              </strong>{" "}
              and we will help you get started. You may open the teacher apply
              page below, or simply reply to this email—I would be glad to
              schedule a brief walkthrough at a convenient time.
            </p>
            <p className="mb-3.5 text-[#152A20]">
              <strong className="font-semibold">How to get started</strong>
            </p>
            <ul className="mb-[18px] list-disc space-y-2.5 pl-[22px]">
              <li>
                Create a Guide account as Teacher or School Administrator
              </li>
              <li>
                Choose{" "}
                <strong className="font-semibold text-[#152A20]">
                  I’m a teacher — add my class
                </strong>{" "}
                (short form)
              </li>
              <li>After approval, create your class and share the invite code</li>
              <li>Add Amud (or other apps) for your students</li>
            </ul>
          </div>

          <div className="px-6 pb-7 pt-5 text-center sm:px-11">
            <Link
              href={TEACHER_APPLY_URL}
              className="inline-block bg-[#1b4332] px-[34px] py-[15px] font-[system-ui,-apple-system,'Segoe_UI',sans-serif] text-base font-semibold text-white no-underline"
            >
              Apply as a teacher
            </Link>
            <p className="mt-[18px] font-[system-ui,-apple-system,'Segoe_UI',sans-serif] text-sm leading-[1.55] text-[#5a7264]">
              Teacher apply: {GUIDE_HOST}/education?as=teacher
              <br />
              Guide: {GUIDE_HOST}
              <br />
              Amud: {AMUD_HOST_PATH}
            </p>
          </div>

          <div className="px-6 pb-10 pt-2 text-[17px] leading-[1.7] text-[#2a3f34] sm:px-11">
            <p className="mb-2">With appreciation,</p>
            <p className="mb-1 text-[#152A20]">
              <strong className="font-semibold">The Guide team</strong>
            </p>
            <p className="font-[system-ui,-apple-system,'Segoe_UI',sans-serif] text-sm text-[#5a7264]">
              Big Happy Smiley
            </p>
          </div>

          <div className="bg-[#152A20] px-6 py-[22px] text-center sm:px-11">
            <p className="font-[system-ui,-apple-system,'Segoe_UI',sans-serif] text-xs leading-[1.5] text-[#9bb0a3]">
              Guide — a school platform for learning apps
              <br />
              This message is a private invitation for a teacher to try Guide
              with their class.
            </p>
          </div>
        </article>

        <p className="mx-auto mt-5 max-w-[640px] select-none text-center font-[system-ui,-apple-system,'Segoe_UI',sans-serif] text-xs text-[#5a7264]">
          <a href={TEACHER_APPLY_URL} className="font-semibold text-[#1b4332]">
            Teacher apply
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
