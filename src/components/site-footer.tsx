import Link from "next/link";
import { GuideWordmark } from "@/components/guide-logo";

export function SiteFooter() {
  return (
    <footer className="border-t border-line bg-forest-900 text-forest-100">
      <div className="mx-auto flex max-w-6xl flex-col gap-8 px-5 py-12 sm:flex-row sm:items-start sm:justify-between sm:px-8">
        <div>
          <GuideWordmark tone="onDark" href="/" />
          <p className="mt-4 max-w-sm text-sm text-forest-300">
            A calm place to study Mishnayos and Gemara — for students at home,
            with Guide for Education when Rebbeim want learning to stay visible.
          </p>
        </div>
        <div className="flex flex-wrap gap-x-8 gap-y-3 text-sm font-semibold">
          <Link
            href="/study"
            className="text-white no-underline hover:text-forest-200"
          >
            Study
          </Link>
          <Link
            href="/education"
            className="text-white no-underline hover:text-forest-200"
          >
            Education
          </Link>
          <Link
            href="/auth/sign-up"
            className="text-white no-underline hover:text-forest-200"
          >
            Join
          </Link>
          <Link
            href="/account"
            className="text-white no-underline hover:text-forest-200"
          >
            Account
          </Link>
        </div>
      </div>
    </footer>
  );
}
