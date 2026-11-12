import Link from "next/link";
import { AppWordmark } from "@/components/app-wordmark";
import "@/components/testquiz/testquiz.css";
import { TESTQUIZ_APP_NAME, TESTQUIZ_APP_SLUG, appHomePath } from "@/lib/apps";
import { hasEducationAccess } from "@/lib/education-access";
import { requireProfile } from "@/lib/profile";

export const runtime = "edge";

export default async function TestQuizLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const authz = await requireProfile();
  const showTeacherNav =
    !!authz &&
    (authz.profile.role === "rebbe" || authz.profile.role === "admin") &&
    (await hasEducationAccess(authz.profile));

  return (
    <div className="tq tq-shell" data-tq-theme="light">
      <div className="tq-band">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-5 py-2.5 sm:px-8">
          <div className="flex min-w-0 items-center gap-2.5">
            <AppWordmark
              name={TESTQUIZ_APP_NAME}
              href={appHomePath(TESTQUIZ_APP_SLUG)}
              size="md"
              className="!text-[var(--tq-ink)]"
            />
            <span className="hidden text-[0.8rem] font-medium text-[var(--tq-muted)] sm:inline">
              Live quizzes
            </span>
          </div>
          <nav className="flex shrink-0 items-center gap-0.5 text-sm">
            <Link
              href="/apps/testquiz/join"
              className="rounded-lg px-2.5 py-2 font-semibold text-[var(--tq-ink)] no-underline hover:bg-[var(--tq-accent-wash)]"
            >
              Join
            </Link>
            {showTeacherNav ? (
              <>
                <Link
                  href="/apps/testquiz/library"
                  className="rounded-lg px-2.5 py-2 font-semibold text-[var(--tq-ink)] no-underline hover:bg-[var(--tq-accent-wash)]"
                >
                  Library
                </Link>
                <Link
                  href="/apps/testquiz/discover"
                  className="rounded-lg px-2.5 py-2 font-semibold text-[var(--tq-ink)] no-underline hover:bg-[var(--tq-accent-wash)]"
                >
                  Discover
                </Link>
                <Link
                  href="/apps/testquiz/reports"
                  className="hidden rounded-lg px-2.5 py-2 font-medium text-[var(--tq-muted)] no-underline hover:bg-[var(--tq-accent-wash)] sm:inline"
                >
                  Reports
                </Link>
              </>
            ) : null}
            <Link
              href="/apps"
              className="rounded-lg px-2.5 py-2 font-medium text-[var(--tq-muted)] no-underline hover:bg-[var(--tq-accent-wash)]"
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
