import Link from "next/link";

export function SiteHeader() {
  return (
    <header className="relative z-20 border-b border-forest-800/10 bg-white/35 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4 sm:px-8">
        <Link href="/" className="group flex items-baseline gap-2 no-underline">
          <span className="display text-2xl font-semibold tracking-tight text-forest-900 transition group-hover:text-forest-700">
            Guide
          </span>
          <span className="hebrew hidden text-sm text-forest-600 sm:inline">
            בבא מציעא
          </span>
        </Link>
        <nav className="flex items-center gap-2 sm:gap-3">
          <Link
            href="/study"
            className="rounded-full px-3 py-1.5 text-sm font-semibold text-forest-800 no-underline transition hover:bg-white/60"
          >
            Study
          </Link>
          <Link href="/study/21a" className="btn-primary !px-4 !py-2 text-sm">
            אלו מציאות
          </Link>
        </nav>
      </div>
    </header>
  );
}
