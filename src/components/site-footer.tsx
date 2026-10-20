import Link from "next/link";
import { GuideWordmark } from "@/components/guide-logo";

export function SiteFooter() {
  return (
    <footer className="border-t border-line bg-forest-900 text-forest-100">
      <div className="mx-auto flex max-w-6xl flex-col gap-8 px-5 py-10 sm:flex-row sm:items-start sm:justify-between sm:px-8">
        <div>
          <GuideWordmark tone="onDark" href="/" />
          <p className="mt-3 max-w-sm text-sm leading-relaxed text-forest-300">
            Study Mishnayos and Gemara with clarity. Guide for Education is
            available separately for Rebbeim.
          </p>
        </div>
        <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm font-medium">
          <Link
            href="/study"
            className="text-forest-100 no-underline hover:text-white"
          >
            Study
          </Link>
          <Link
            href="/education"
            className="text-forest-100 no-underline hover:text-white"
          >
            Education
          </Link>
          <Link
            href="/auth/sign-up?as=student"
            className="text-forest-100 no-underline hover:text-white"
          >
            Join
          </Link>
          <Link
            href="/auth/sign-in?as=student"
            className="text-forest-100 no-underline hover:text-white"
          >
            Log in
          </Link>
          <Link
            href="/account"
            className="text-forest-100 no-underline hover:text-white"
          >
            Account
          </Link>
        </div>
      </div>
    </footer>
  );
}
