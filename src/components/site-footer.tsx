import Link from "next/link";
import { GuideWordmark } from "@/components/guide-logo";
import { FIRST_APP_NAME, appHomePath } from "@/lib/apps";
import { amudPublicUrl } from "@/lib/site";

const link =
  "text-sm font-medium text-ink-muted no-underline hover:text-forest-900";

export function SiteFooter() {
  const amudHref = amudPublicUrl() || appHomePath();

  return (
    <footer className="border-t border-line bg-sky-soft">
      <div className="mx-auto grid max-w-6xl gap-10 px-5 py-12 sm:grid-cols-2 sm:px-8 lg:grid-cols-4 lg:py-14">
        <div className="sm:col-span-2 lg:col-span-1">
          <GuideWordmark href="/" size="md" />
          <p className="mt-3 max-w-xs text-sm leading-relaxed text-ink-muted">
            School platform for learning apps — portals, login, and classroom
            tools for students, teachers, and Guide Official.
          </p>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.08em] text-forest-700">
            Schools
          </p>
          <ul className="mt-3 space-y-2">
            <li>
              <Link href="/apps" className={link}>
                App library
              </Link>
            </li>
            <li>
              <Link href="/education" className={link}>
                Guide for Education
              </Link>
            </li>
            <li>
              <a href={amudHref} className={link}>
                {FIRST_APP_NAME} (learning app)
              </a>
            </li>
          </ul>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.08em] text-forest-700">
            Log in
          </p>
          <ul className="mt-3 space-y-2">
            <li>
              <Link href="/auth/sign-in?as=student" className={link}>
                Student
              </Link>
            </li>
            <li>
              <Link href="/auth/sign-in?as=educator" className={link}>
                Teacher
              </Link>
            </li>
            <li>
              <Link href="/auth/sign-in?as=official" className={link}>
                Guide Official
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.08em] text-forest-700">
            Account
          </p>
          <ul className="mt-3 space-y-2">
            <li>
              <Link href="/account" className={link}>
                Account
              </Link>
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t border-line">
        <p className="mx-auto max-w-6xl px-5 py-4 text-xs text-ink-muted sm:px-8">
          © 2026 Guide
        </p>
      </div>
    </footer>
  );
}
