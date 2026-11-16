import Link from "next/link";
import {
  APP_UNAVAILABLE_LABEL,
  appOpenHref,
  isAppAvailable,
  type GuideApp,
} from "@/lib/apps";

type Props = {
  apps: GuideApp[];
  emptyHint?: string;
};

/** Student / developer app launcher — square tiles in the portal only. */
export function MyAppsGrid({
  apps,
  emptyHint = "Ask your teacher to add an app to your class — it will show up here.",
}: Props) {
  if (apps.length === 0) {
    return (
      <section id="apps">
        <h2 className="portal-section-title">My apps</h2>
        <p className="-mt-2 mb-4 text-sm text-ink-muted">
          Apps your teacher adds for class open here.
        </p>
        <div className="portal-empty">
          <p className="portal-empty__title">Ready when your class is</p>
          <p className="portal-empty__body">{emptyHint}</p>
        </div>
      </section>
    );
  }

  return (
    <section id="apps">
      <h2 className="portal-section-title">My apps</h2>
      <p className="-mt-2 mb-4 text-sm text-ink-muted">
        Tap an app to open it for class.
      </p>
      <ul className="portal-apps-grid">
        {apps.map((app) => {
          const href = appOpenHref(app);
          const available = isAppAvailable(app);
          const external = Boolean(app.launchUrl);
          const inner = (
            <>
              <span className="portal-app-tile__mark" aria-hidden>
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
                  className="portal-app-tile opacity-75"
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
