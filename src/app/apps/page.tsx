import Link from "next/link";
import {
  APP_CATALOG,
  APP_UNAVAILABLE_LABEL,
  appOpenHref,
  isAppAvailable,
  sortAppsAvailableFirst,
} from "@/lib/apps";

export const runtime = "edge";

export const metadata = {
  alternates: { canonical: "/apps" },
  title: "App library",
  description:
    "Browse the learning apps on Guide. Teachers add apps to a class, and students open them from My apps.",
};

export default function AppsLibraryPage() {
  return (
    <div className="portal-page">
      <div className="content-band portal-page__inner">
        <header className="portal-hero">
          <p className="portal-eyebrow">Apps on Guide</p>
          <h1 className="display-feature mt-1">App library</h1>
          <p className="mt-1.5 max-w-xl text-[0.95rem] leading-relaxed text-ink-muted">
            Learning apps available on Guide. Teachers add apps to a class,
            and students open them from My apps with their Guide login.
          </p>
        </header>

        <ul className="grid gap-4 sm:grid-cols-2">
          {sortAppsAvailableFirst(APP_CATALOG).map((app) => {
            const available = isAppAvailable(app);
            const href = appOpenHref(app);
            const body = (
              <>
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <p className="text-2xl font-semibold tracking-tight text-forest-950">
                    {app.name}
                  </p>
                  {!available ? (
                    <span className="rounded-full border border-line bg-forest-100 px-2.5 py-1 text-xs font-semibold text-forest-800">
                      {APP_UNAVAILABLE_LABEL}
                    </span>
                  ) : null}
                </div>
                <p className="mt-1 text-sm font-medium text-forest-800">
                  {app.tagline}
                </p>
                <p className="mt-3 text-[0.95rem] leading-relaxed text-ink-muted">
                  {app.description}
                </p>
                {available ? (
                  <p className="mt-5 text-sm font-semibold text-forest-800">
                    Open {app.name} <span aria-hidden>→</span>
                  </p>
                ) : null}
              </>
            );

            return (
              <li key={app.slug}>
                {href ? (
                  <Link href={href} className="portal-tile">
                    {body}
                  </Link>
                ) : (
                  <div className="portal-tile portal-tile--soon" aria-disabled="true">
                    {body}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
        <p className="mt-8 text-sm text-ink-muted">
          Teachers can add apps from the{" "}
          <Link href="/teacher" className="font-semibold text-forest-800">
            teacher portal
          </Link>
          . Developers can{" "}
          <Link
            href="/developers/apply"
            className="font-semibold text-forest-800"
          >
            apply to publish an app
          </Link>
          .
        </p>
      </div>
    </div>
  );
}
