import Link from "next/link";
import { APP_CATALOG, appHomePath } from "@/lib/apps";

export const instant = false;
export const metadata = {
  title: "Apps",
  description: "Guide app library — add apps to your class for students.",
};

export default function AppsLibraryPage() {
  return (
    <div>
      <section className="hero-band">
        <div className="mx-auto max-w-6xl px-5 py-10 sm:px-8 sm:py-12">
          <p className="eyebrow">Guide</p>
          <h1 className="display mt-2 text-3xl text-forest-950 sm:text-4xl">
            Apps
          </h1>
          <p className="mt-3 max-w-2xl text-base text-ink-muted">
            Clever-style library for schools. Teachers add an app to a class;
            students open it from My apps. Amud is also available to everyone on
            its own site.
          </p>
        </div>
      </section>
      <div className="mx-auto max-w-6xl px-5 py-8 sm:px-8 sm:py-10">
        <ul className="grid gap-4 sm:grid-cols-2">
          {APP_CATALOG.map((app) => (
            <li key={app.slug}>
              <Link
                href={appHomePath(app.slug)}
                className="block rounded-2xl border border-line bg-surface px-6 py-7 no-underline transition hover:border-forest-400 hover:bg-forest-100"
              >
                <p className="text-2xl font-semibold tracking-tight text-forest-950">
                  {app.name}
                </p>
                <p className="mt-1 text-sm font-medium text-forest-700">
                  {app.tagline}
                </p>
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
        <p className="mt-10 text-sm text-ink-muted">
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
