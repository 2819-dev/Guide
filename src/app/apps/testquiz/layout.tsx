import Link from "next/link";
import { AppWordmark } from "@/components/app-wordmark";
import "@/components/testquiz/testquiz.css";
import { TESTQUIZ_APP_NAME, TESTQUIZ_APP_SLUG, appHomePath } from "@/lib/apps";

export const runtime = "edge";

export default function TestQuizLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="tq tq-shell">
      <div className="tq-band">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-5 py-2.5 sm:px-8">
          <div className="flex min-w-0 items-center gap-3">
            <AppWordmark
              name={TESTQUIZ_APP_NAME}
              href={appHomePath(TESTQUIZ_APP_SLUG)}
              size="md"
              className="!text-[var(--tq-ink)]"
            />
            <span className="hidden truncate text-sm text-[var(--tq-muted)] sm:inline">
              Live classroom quizzes
            </span>
          </div>
          <nav className="flex shrink-0 items-center gap-1 text-sm sm:gap-2">
            <Link
              href="/apps/testquiz/join"
              className="rounded-lg px-2.5 py-2 font-semibold text-[var(--tq-ink)] no-underline hover:bg-white/8"
            >
              Join
            </Link>
            <Link
              href="/apps/testquiz/library"
              className="rounded-lg px-2.5 py-2 font-semibold text-[var(--tq-ink)] no-underline hover:bg-white/8"
            >
              Library
            </Link>
            <Link
              href="/apps"
              className="rounded-lg px-2.5 py-2 font-medium text-[var(--tq-muted)] no-underline hover:bg-white/8"
            >
              Apps
            </Link>
          </nav>
        </div>
      </div>
      {children}
    </div>
  );
}
