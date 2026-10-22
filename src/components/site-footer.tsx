import Link from "next/link";
import { GuideWordmark } from "@/components/guide-logo";
import { FIRST_APP_NAME } from "@/lib/apps";
import { amudPublicUrl } from "@/lib/site";

/**
 * Clever footer density — follow strip + 5 columns + forest legal bar.
 * Guide school language only (no Clever trademarks).
 */
export function SiteFooter() {
  const amudHref = amudPublicUrl();

  return (
    <footer className="border-t border-line bg-paper">
      <div className="content-band site-footer-upper">
        <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
          <GuideWordmark href="/" size="md" />
          <p className="text-sm text-ink-muted">
            Apps and classrooms for schools
          </p>
        </div>

        <p className="site-footer-follow">
          Contact ·{" "}
          <a href="mailto:hello@guidelearning.org">hello@guidelearning.org</a>
        </p>

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
              <li>
                <Link
                  href="/auth/sign-in?as=educator"
                  className="site-footer-link"
                >
                  School administrator log in
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
              <li>
                <Link href="/apps" className="site-footer-link">
                  My apps
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
                <Link href="/education" className="site-footer-link">
                  School portals
                </Link>
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
              <li>
                <Link href="/developer" className="site-footer-link">
                  Developer portal
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
                  Contact
                </a>
              </li>
              <li>
                <Link href="/invite/ohr-reuven" className="site-footer-link">
                  School invites
                </Link>
              </li>
            </ul>
          </div>
        </div>
      </div>

      <div className="site-footer-legal">
        <div className="content-band site-footer-legal__inner">
          <p>Copyright © 2026 Guide</p>
          <p className="flex flex-wrap gap-x-4 gap-y-1">
            <a href="mailto:hello@guidelearning.org">Terms</a>
            <a href="mailto:hello@guidelearning.org">Privacy</a>
            <a href="mailto:hello@guidelearning.org">Accessibility</a>
          </p>
        </div>
      </div>
    </footer>
  );
}
