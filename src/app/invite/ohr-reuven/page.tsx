import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Invitation for Yeshivas Ohr Reuven · Guide",
  description:
    "Private invitation for Yeshivas Ohr Reuven to be the first school on Guide.",
  robots: { index: false, follow: false },
};

const GUIDE_URL = "https://guide-big-happy-smiley.vercel.app";
const AMUD_URL = "https://amud-big-happy-smiley.vercel.app";

/**
 * Public Safari-friendly invite letter (matches Zoho HTML email).
 * Select All → Copy works cleanly — no Guide marketing chrome.
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
            An invitation for Yeshivas Ohr Reuven to be the first school on Guide
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
              An invitation for Yeshivas Ohr Reuven
            </h1>
            <p className="mb-[18px]">
              Dear Members of the Hanhalah and Rebbeim of{" "}
              <strong className="font-semibold text-[#152A20]">
                Yeshivas Ohr Reuven
              </strong>
              ,
            </p>
            <p className="mb-[18px]">
              I am writing to share something we have been building with care,
              and to ask whether Ohr Reuven would consider being the very first
              school to use it.
            </p>
            <p className="mb-[18px]">
              <strong className="font-semibold text-[#152A20]">Guide</strong> is
              a school platform for students and teachers: one calm place to
              sign in, open learning apps, message, and stay organized. The idea
              is simple—less friction getting into the tools that matter for
              learning, and a clearer picture for the people guiding that
              learning.
            </p>
            <p className="mb-[18px]">
              We would be honored if{" "}
              <strong className="font-semibold text-[#152A20]">
                Yeshivas Ohr Reuven
              </strong>{" "}
              were our founding school. As the first school on Guide, your
              access would be{" "}
              <strong className="font-semibold text-[#152A20]">
                entirely free
              </strong>
              . There is no pilot fee and no commitment beyond trying it
              honestly with us and telling us what works for a real yeshiva
              classroom and after-school routine.
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
                Amud is built for Mishnayos and Gemara. Talmidim can open a daf,
                review, and <em>Test Yourself</em> with real
                questions—including translation—so chazarah after school is
                structured, not vague. Rebbeim can see progress as students
                work.
              </p>
              <p className="font-[system-ui,-apple-system,'Segoe_UI',sans-serif] text-[15px] leading-[1.6] text-[#3d6b52]">
                Amud is available today. Additional apps will follow; teachers
                choose what to add for each class from the Guide portal.
              </p>
            </div>
          </div>

          <div className="px-6 pb-2 pt-7 text-[17px] leading-[1.7] text-[#2a3f34] sm:px-11">
            <p className="mb-3.5 text-[#152A20]">
              <strong className="font-semibold">
                What we are offering Ohr Reuven
              </strong>
            </p>
            <p className="mb-3.5">
              As the first school on Guide, you would receive:
            </p>
            <ul className="mb-[18px] list-disc space-y-2.5 pl-[22px]">
              <li>Full use of Guide for your students and Rebbeim at no cost</li>
              <li>
                Immediate access to Amud for Mishnayos and Gemara practice
              </li>
              <li>
                A direct line to our team so your feedback shapes what we build
                next
              </li>
              <li>
                Straightforward school onboarding, with student login by
                password or badge
              </li>
              <li>Room to grow as we add more apps to the library</li>
            </ul>
            <p className="mb-[18px]">
              We are not asking for a press announcement or a public
              endorsement. We are asking for a thoughtful trial with people who
              take limud seriously—and who can tell us, plainly, where Guide
              helps and where it still falls short.
            </p>
            <p className="mb-[18px]">
              If this is of interest, the easiest next step is simply to open
              Guide, or to reply to this email. We would gladly schedule a short
              walkthrough at a time that works for the Hanhalah—on Zoom or in
              person if that is preferred.
            </p>
          </div>

          <div className="px-6 pb-7 pt-5 text-center sm:px-11">
            <Link
              href={GUIDE_URL}
              className="inline-block bg-[#1b4332] px-[34px] py-[15px] font-[system-ui,-apple-system,'Segoe_UI',sans-serif] text-base font-semibold text-white no-underline"
            >
              Visit Guide
            </Link>
            <p className="mt-[18px] font-[system-ui,-apple-system,'Segoe_UI',sans-serif] text-sm leading-[1.55] text-[#5a7264]">
              Guide: guide-big-happy-smiley.vercel.app
              <br />
              Amud: amud-big-happy-smiley.vercel.app
            </p>
          </div>

          <div className="px-6 pb-10 pt-2 text-[17px] leading-[1.7] text-[#2a3f34] sm:px-11">
            <p className="mb-2">With sincere respect and appreciation,</p>
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
              This message is a private invitation to Yeshivas Ohr Reuven.
            </p>
          </div>
        </article>

        <p className="mx-auto mt-5 max-w-[640px] select-none text-center font-[system-ui,-apple-system,'Segoe_UI',sans-serif] text-xs text-[#5a7264]">
          <a href={GUIDE_URL} className="font-semibold text-[#1b4332]">
            {GUIDE_URL}
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
