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
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-5 py-3 sm:px-8">
          <div className="flex items-center gap-3">
            <AppWordmark
              name={TESTQUIZ_APP_NAME}
              href={appHomePath(TESTQUIZ_APP_SLUG)}
              size="md"
              className="!text-[var(--tq-ink)]"
            />
            <span className="hidden text-sm text-[var(--tq-muted)] sm:inline">
              Live classroom quizzes
            </span>
          </div>
          <nav className="flex flex-wrap items-center gap-3 text-sm">
            <Link
              href="/apps/testquiz/join"
              className="font-medium text-[var(--tq-ink)] no-underline hover:underline"
            >
              Join
            </Link>
            <Link
              href="/apps/testquiz/library"
              className="font-medium text-[var(--tq-ink)] no-underline hover:underline"
            >
              Library
            </Link>
            <Link
              href="/apps"
              className="font-medium text-[var(--tq-muted)] no-underline hover:underline"
            >
              ← Guide apps
            </Link>
          </nav>
        </div>
      </div>
      {children}
    </div>
  );
}
