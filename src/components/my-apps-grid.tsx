import Link from "next/link";
import { appOpenHref, type GuideApp } from "@/lib/apps";

type Props = {
  apps: GuideApp[];
  emptyHint?: string;
};

/** Student / developer app launcher — square tiles in the portal only. */
export function MyAppsGrid({
  apps,
  emptyHint = "When your teacher adds an app to your class, it shows up here.",
}: Props) {
  if (apps.length === 0) {
    return (
      <section id="apps">
        <h2 className="portal-section-title">My apps</h2>
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
      <ul className="portal-apps-grid">
        {apps.map((app) => {
          const href = appOpenHref(app);
          const external = Boolean(app.launchUrl);
          return (
            <li key={app.slug}>
              <Link
                href={href}
                className="portal-app-tile"
                aria-label={`Open ${app.name}`}
                {...(external
                  ? { rel: "noopener noreferrer" }
                  : {})}
              >
                <span className="portal-app-tile__mark" aria-hidden>
                  {app.name.slice(0, 1)}
                </span>
                <span className="portal-app-tile__name">{app.name}</span>
                <span className="portal-app-tile__tag">{app.tagline}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
