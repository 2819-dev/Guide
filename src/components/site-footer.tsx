import Link from "next/link";
import { GuideWordmark } from "@/components/guide-logo";
import { FIRST_APP_NAME } from "@/lib/apps";
import { amudPublicUrl } from "@/lib/site";

/**
 * Clever footer density — 5 columns + forest legal bar.
 * Guide school language only (no Clever trademarks).
 */
export function SiteFooter() {
  const amudHref = amudPublicUrl();

  return (
    <footer className="border-t border-line bg-paper">
      <div className="content-band py-14 sm:py-16">
        <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
          <GuideWordmark href="/" size="md" />
          <p className="text-sm text-ink-muted">
            The identity platform for schools
          </p>
        </div>

        <div className="site-footer-cols">
          <div>
            <p className="site-footer-col-head">Schools</p>
            <ul className="space-y-1">
              <li>
                <Link href="/education" className="site-footer-link">
                  For schools
                </Link>
              </li>
              <li>
                <Link href="/education#apply" className="site-footer-link">
                  Apply for your school
                </Link>
              </li>
              <li>
                <Link href="/schools/demo" className="site-footer-link">
                  Demo
                </Link>
              </li>
              <li>
                <Link href="/schools/meeting" className="site-footer-link">
                  Book a meeting
                </Link>
              </li>
              <li>
                <Link
                  href="/auth/sign-in?as=educator"
                  className="site-footer-link"
                >
                  Teacher log in
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <p className="site-footer-col-head">Students</p>
            <ul className="space-y-1">
              <li>
                <Link
                  href="/auth/sign-in?as=student"
                  className="site-footer-link"
                >
                  Student log in
                </Link>
              </li>
              <li>
                <Link href="/student" className="site-footer-link">
                  Student portal
                </Link>
              </li>
              <li>
                <Link href="/account" className="site-footer-link">
                  Account
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <p className="site-footer-col-head">Platform</p>
            <ul className="space-y-1">
              <li>
                <Link href="/#what" className="site-footer-link">
                  What is Guide?
                </Link>
              </li>
              <li>
                <Link href="/apps" className="site-footer-link">
                  App library
                </Link>
              </li>
              <li>
                <a href={amudHref} className="site-footer-link">
                  {FIRST_APP_NAME}
                </a>
              </li>
              <li>
                <Link
                  href="/auth/sign-in?as=official"
                  className="site-footer-link"
                >
                  Guide Official
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <p className="site-footer-col-head">Developers</p>
            <ul className="space-y-1">
              <li>
                <Link href="/developers/apply" className="site-footer-link">
                  Apply as a developer
                </Link>
              </li>
              <li>
                <Link
                  href="/auth/sign-in?as=developer"
                  className="site-footer-link"
                >
                  Partner log in
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <p className="site-footer-col-head">Help</p>
            <ul className="space-y-1">
              <li>
                <Link href="/account" className="site-footer-link">
                  Get help
                </Link>
              </li>
              <li>
                <a
                  href="mailto:hello@guidelearning.org"
                  className="site-footer-link"
                >
                  hello@guidelearning.org
                </a>
              </li>
            </ul>
          </div>
        </div>
      </div>

      <div className="site-footer-legal">
        <div className="content-band site-footer-legal__inner">
          <p>Copyright © 2026 Guide</p>
          <p className="flex flex-wrap gap-x-4 gap-y-1">
            <span>School identity platform</span>
            <a href="mailto:hello@guidelearning.org">Contact</a>
          </p>
        </div>
      </div>
    </footer>
  );
}
