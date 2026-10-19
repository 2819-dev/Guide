import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="border-t border-line bg-forest-900 text-forest-100">
      <div className="mx-auto flex max-w-6xl flex-col gap-8 px-5 py-12 sm:flex-row sm:items-start sm:justify-between sm:px-8">
        <div>
          <p className="display text-2xl text-white">Guide</p>
          <p className="hebrew mt-1 text-forest-300">בבא מציעא · אלו מציאות</p>
          <p className="mt-3 max-w-sm text-sm text-forest-300">
            A calm place to study Gemara — for students at home and Rebbeim who
            want learning to stay visible.
          </p>
        </div>
        <div className="flex flex-wrap gap-x-8 gap-y-3 text-sm font-semibold">
          <Link href="/study" className="text-white no-underline hover:text-forest-200">
            Study
          </Link>
          <Link href="/auth/sign-up" className="text-white no-underline hover:text-forest-200">
            Join
          </Link>
          <Link
            href="/auth/sign-up?role=rebbe"
            className="text-white no-underline hover:text-forest-200"
          >
            For Rebbeim
          </Link>
          <Link href="/account" className="text-white no-underline hover:text-forest-200">
            Account
          </Link>
        </div>
      </div>
    </footer>
  );
}
