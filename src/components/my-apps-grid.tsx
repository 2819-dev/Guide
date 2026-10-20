import Link from "next/link";
import { appHomePath, type GuideApp } from "@/lib/apps";

type Props = {
  apps: GuideApp[];
  emptyHint?: string;
};

/** Clever Instant Login app launcher — square tiles in the portal only. */
export function MyAppsGrid({
  apps,
  emptyHint = "No apps yet. When your teacher adds an app to your class, it shows up here.",
}: Props) {
  if (apps.length === 0) {
    return (
      <section id="apps">
        <h2 className="portal-section-title">My apps</h2>
        <div className="portal-panel border-dashed bg-sky-soft/40">
          <p className="text-base font-semibold text-forest-950">No apps yet</p>
          <p className="mt-2 text-sm leading-relaxed text-ink-muted">
            {emptyHint}
          </p>
        </div>
      </section>
    );
  }

  return (
    <section id="apps">
      <h2 className="portal-section-title">My apps</h2>
      <ul className="portal-apps-grid">
        {apps.map((app) => (
          <li key={app.slug}>
            <Link
              href={appHomePath(app.slug)}
              className="portal-app-tile"
              aria-label={`Open ${app.name}`}
            >
              <span className="portal-app-tile__mark" aria-hidden>
                {app.name.slice(0, 1)}
              </span>
              <span className="portal-app-tile__name">{app.name}</span>
              <span className="portal-app-tile__tag">{app.tagline}</span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
