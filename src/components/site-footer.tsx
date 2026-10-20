import Link from "next/link";
import { GuideWordmark } from "@/components/guide-logo";
import { FIRST_APP_NAME } from "@/lib/apps";
import { amudPublicUrl } from "@/lib/site";

const link =
  "block text-sm leading-[1.55] text-ink-muted no-underline hover:text-forest-900";
const colHead = "mb-3 text-sm font-semibold text-forest-950";

export function SiteFooter() {
  const amudHref =
    amudPublicUrl() || "https://amud-big-happy-smiley.vercel.app";

  return (
    <footer className="border-t border-line bg-paper">
      <div className="content-band py-14 sm:py-16">
        <div className="mb-10">
          <GuideWordmark href="/" size="md" />
        </div>
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-5">
          <div>
            <p className={colHead}>Schools</p>
            <ul className="space-y-2">
              <li>
                <Link href="/education" className={link}>
                  Guide for Education
                </Link>
              </li>
              <li>
                <Link href="/education#apply" className={link}>
                  Apply for your school
                </Link>
              </li>
              <li>
                <Link href="/auth/sign-in?as=educator" className={link}>
                  Teacher log in
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <p className={colHead}>Students</p>
            <ul className="space-y-2">
              <li>
                <Link href="/auth/sign-in?as=student" className={link}>
                  Student log in
                </Link>
              </li>
              <li>
                <Link href="/student" className={link}>
                  Student portal
                </Link>
              </li>
              <li>
                <Link href="/account" className={link}>
                  Account
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <p className={colHead}>Platform</p>
            <ul className="space-y-2">
              <li>
                <Link href="/#what" className={link}>
                  What is Guide?
                </Link>
              </li>
              <li>
                <a href={amudHref} className={link}>
                  {FIRST_APP_NAME} learning app
                </a>
              </li>
              <li>
                <Link href="/auth/sign-in?as=official" className={link}>
                  Guide Official
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <p className={colHead}>Education</p>
            <ul className="space-y-2">
              <li>
                <Link href="/education/panel" className={link}>
                  Teacher portal
                </Link>
              </li>
              <li>
                <Link href="/education" className={link}>
                  Classes &amp; apps
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <p className={colHead}>Help</p>
            <ul className="space-y-2">
              <li>
                <Link href="/account" className={link}>
                  Get help
                </Link>
              </li>
            </ul>
          </div>
        </div>
      </div>
      <div className="border-t border-line bg-forest-100">
        <div className="content-band flex flex-col gap-2 py-3.5 text-xs text-ink-muted sm:flex-row sm:items-center sm:justify-between">
          <p>© 2026 Guide</p>
          <p className="sm:text-right">School identity platform</p>
        </div>
      </div>
    </footer>
  );
}
