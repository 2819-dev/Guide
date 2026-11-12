import Link from "next/link";
import {
  APP_CATALOG,
  APP_UNAVAILABLE_DETAIL,
  APP_UNAVAILABLE_LABEL,
  appOpenHref,
  isAppAvailable,
} from "@/lib/apps";

export const runtime = "edge";

export const metadata = {
  title: "Apps",
  description: "Guide app library — add apps to your class for students.",
};

export default function AppsLibraryPage() {
  return (
    <div className="portal-page">
      <div className="content-band portal-page__inner">
        <header className="portal-hero">
          <p className="portal-eyebrow">For schools</p>
          <h1 className="display-feature mt-1">App library</h1>
          <p className="mt-1.5 max-w-xl text-[0.95rem] leading-relaxed text-ink-muted">
            Teachers add an app to a class. Students open it from My apps on
            their portal.
          </p>
        </header>

        <ul className="grid gap-4 sm:grid-cols-2">
          {APP_CATALOG.map((app) => {
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
                  {available ? app.description : APP_UNAVAILABLE_DETAIL}
                </p>
                <p className="mt-5 text-sm font-semibold text-forest-800">
                  {available ? `Open ${app.name} →` : APP_UNAVAILABLE_LABEL}
                </p>
              </>
            );

            return (
              <li key={app.slug}>
                {href ? (
                  <Link href={href} className="portal-tile">
                    {body}
                  </Link>
                ) : (
                  <div className="portal-tile opacity-90" aria-disabled="true">
                    {body}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
        <p className="mt-8 text-sm text-ink-muted">
          Teachers: add apps from your{" "}
          <Link href="/teacher" className="font-semibold text-forest-800">
            teacher portal
          </Link>
          .
        </p>
      </div>
    </div>
  );
}
