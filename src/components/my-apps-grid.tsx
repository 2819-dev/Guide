import Link from "next/link";
import {
  APP_UNAVAILABLE_LABEL,
  appOpenHref,
  isAppAvailable,
  sortAppsAvailableFirst,
  type GuideApp,
} from "@/lib/apps";

type Props = {
  apps: GuideApp[];
  emptyHint?: string;
};

/** Student / developer app launcher — square tiles in the portal only. */
export function MyAppsGrid({
  apps,
  emptyHint = "When your teacher adds an app to your class, it will appear here.",
}: Props) {
  if (apps.length === 0) {
    return (
      <section id="apps">
        <h2 className="portal-section-title">My apps</h2>
        <p className="-mt-2 mb-4 text-sm text-ink-muted">
          Apps your teachers add to your classes appear here.
        </p>
        <div className="portal-empty">
          <p className="portal-empty__title">No apps yet</p>
          <p className="portal-empty__body">{emptyHint}</p>
        </div>
      </section>
    );
  }

  return (
    <section id="apps">
      <h2 className="portal-section-title">My apps</h2>
      <p className="-mt-2 mb-4 text-sm text-ink-muted">
        Select an app to open it.
      </p>
      <ul className="portal-apps-grid">
        {sortAppsAvailableFirst(apps).map((app) => {
          const href = appOpenHref(app);
          const available = isAppAvailable(app);
          const external = Boolean(app.launchUrl);
          const inner = (
            <>
              <span
                className={`portal-app-tile__mark portal-app-tile__mark--${app.slug}`}
                aria-hidden
              >
                {app.name.slice(0, 1)}
              </span>
              <span className="portal-app-tile__name">{app.name}</span>
              <span className="portal-app-tile__tag">
                {available ? app.tagline : APP_UNAVAILABLE_LABEL}
              </span>
            </>
          );

          return (
            <li key={app.slug}>
              {href ? (
                <Link
                  href={href}
                  className="portal-app-tile"
                  aria-label={`Open ${app.name}`}
                  {...(external ? { rel: "noopener noreferrer" } : {})}
                >
                  {inner}
                </Link>
              ) : (
                <div
                  className="portal-app-tile portal-tile--soon"
                  aria-disabled="true"
                  aria-label={`${app.name} — ${APP_UNAVAILABLE_LABEL}`}
                >
                  {inner}
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
