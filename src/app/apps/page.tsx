import Link from "next/link";
import { APP_CATALOG, appOpenHref } from "@/lib/apps";

export const runtime = "edge";

export const metadata = {
  title: "App library · Guide",
  description:
    "Learning apps teachers add to a class — students open them from My apps.",
};

export default function AppsLibraryPage() {
  return (
    <div className="portal-page">
      <div className="content-band portal-page__inner">
        <header className="portal-hero">
          <p className="portal-eyebrow">For schools</p>
          <h1 className="display-feature mt-1">App library</h1>
          <p className="mt-1.5 max-w-xl text-[0.95rem] leading-relaxed text-ink-muted">
            Teachers add an app to a class. Students open it from My apps —
            keeping attention on learning that feels inviting.
          </p>
        </header>

        {APP_CATALOG.length === 0 ? (
          <div className="portal-empty">
            <p className="portal-empty__title">No apps listed yet</p>
            <p className="portal-empty__body">
              Verified partner apps appear here after Guide Official approval.
            </p>
          </div>
        ) : (
          <ul className="grid gap-4 sm:grid-cols-2">
            {APP_CATALOG.map((app) => (
              <li key={app.slug}>
                <Link href={appOpenHref(app)} className="portal-tile">
                  <div className="flex items-start gap-3">
                    <span
                      className="portal-app-tile__mark !h-12 !w-12 !text-lg"
                      aria-hidden
                    >
                      {app.name.slice(0, 1)}
                    </span>
                    <div>
                      <p className="text-xl font-semibold tracking-tight text-forest-950">
                        {app.name}
                      </p>
                      <p className="mt-0.5 text-sm font-medium text-forest-800">
                        {app.tagline}
                      </p>
                    </div>
                  </div>
                  <p className="mt-3 text-[0.95rem] leading-relaxed text-ink-muted">
                    {app.description}
                  </p>
                  <p className="mt-5 text-sm font-semibold text-forest-800">
                    Open {app.name} →
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        )}
        <p className="mt-8 text-sm text-ink-muted">
          Teachers: add apps from your{" "}
          <Link href="/teacher" className="font-semibold text-forest-800">
            teacher portal
          </Link>
          . Partners:{" "}
          <Link
            href="/developers/apply"
            className="font-semibold text-forest-800"
          >
            apply as a developer
          </Link>
          .
        </p>
      </div>
    </div>
  );
}
