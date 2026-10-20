import Link from "next/link";
import { GuideWordmark } from "@/components/guide-logo";

const link =
  "text-sm font-medium text-ink-muted no-underline hover:text-forest-900";

export function SiteFooter() {
  return (
    <footer className="border-t border-line bg-sky-soft">
      <div className="mx-auto grid max-w-6xl gap-10 px-5 py-12 sm:grid-cols-2 sm:px-8 lg:grid-cols-4 lg:py-14">
        <div className="sm:col-span-2 lg:col-span-1">
          <GuideWordmark href="/" size="md" />
          <p className="mt-3 max-w-xs text-sm leading-relaxed text-ink-muted">
            The calm place for Mishnayos and Gemara. Guide for Education is
            separate for schools and Rebbeim.
          </p>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.08em] text-forest-700">
            Study
          </p>
          <ul className="mt-3 space-y-2">
            <li>
              <Link href="/study" className={link}>
                Choose what to learn
              </Link>
            </li>
            <li>
              <Link href="/study/bava-metzia" className={link}>
                Bava Metzia
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.08em] text-forest-700">
            Education
          </p>
          <ul className="mt-3 space-y-2">
            <li>
              <Link href="/education" className={link}>
                Guide for Education
              </Link>
            </li>
            <li>
              <Link href="/education#apply" className={link}>
                For schools
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
              <Link href="/auth/sign-in?as=family" className={link}>
                Log In
              </Link>
            </li>
            <li>
              <Link href="/auth/sign-up?as=family" className={link}>
                Create account
              </Link>
            </li>
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
