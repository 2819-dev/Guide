import Link from "next/link";
import { appHomePath, type GuideApp } from "@/lib/apps";

type Props = {
  apps: GuideApp[];
  emptyHint?: string;
};

/** Clever-style portal app launcher — tiles only; not in the top bar. */
export function MyAppsGrid({
  apps,
  emptyHint = "No apps yet. When your teacher adds an app to your class, it shows up here.",
}: Props) {
  if (apps.length === 0) {
    return (
      <div
        id="apps"
        className="rounded-2xl border border-dashed border-line bg-sky-soft/40 px-5 py-8 sm:px-6"
      >
        <p className="text-lg font-semibold text-forest-950">My apps</p>
        <p className="mt-2 text-[0.95rem] leading-relaxed text-ink-muted">
          {emptyHint}
        </p>
      </div>
    );
  }

  return (
    <div id="apps">
      <h2 className="mb-4 text-lg font-semibold text-forest-950">My apps</h2>
      <ul className="grid gap-3 sm:grid-cols-2">
        {apps.map((app) => (
          <li key={app.slug}>
            <Link
              href={appHomePath(app.slug)}
              className="block rounded-2xl border border-line bg-surface px-5 py-5 no-underline transition hover:border-forest-400 hover:bg-forest-100 sm:px-6"
            >
              <p className="text-xl font-semibold tracking-tight text-forest-950">
                {app.name}
              </p>
              <p className="mt-1 text-sm text-forest-700">{app.tagline}</p>
              <p className="mt-2 text-sm leading-relaxed text-ink-muted">
                {app.description}
              </p>
              <p className="mt-4 text-sm font-semibold text-forest-800">
                Open {app.name} →
              </p>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
