import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { TractatePicker } from "@/components/tractate-picker";
import {
  APP_UNAVAILABLE_DETAIL,
  APP_UNAVAILABLE_LABEL,
  FIRST_APP_SLUG,
  BLITZ_APP_SLUG,
  getApp,
  isAppAvailable,
  isExternalLaunchApp,
} from "@/lib/apps";

export const runtime = "edge";

type Props = {
  params: Promise<{ appSlug: string }>;
};

export async function generateMetadata({ params }: Props) {
  const { appSlug } = await params;
  const app = getApp(appSlug);
  if (!app) return { title: "App" };
  return { title: app.name };
}

export default async function AppHomePage({ params }: Props) {
  const { appSlug } = await params;
  const app = getApp(appSlug);
  if (!app) notFound();

  // Dedicated app trees (e.g. /apps/blitz) win over this dynamic route.
  if (appSlug === BLITZ_APP_SLUG) {
    redirect("/apps/blitz");
  }

  if (!isAppAvailable(app)) {
    return (
      <div className="portal-page">
        <div className="content-band portal-page__inner">
          <header className="portal-hero">
            <p className="portal-eyebrow">{APP_UNAVAILABLE_LABEL}</p>
            <h1 className="display-feature mt-1">{app.name}</h1>
            <p className="mt-1.5 text-base font-medium text-forest-800">
              {app.tagline}
            </p>
            <p className="mt-3 max-w-2xl text-[0.95rem] leading-relaxed text-ink-muted">
              {APP_UNAVAILABLE_DETAIL}
            </p>
            <p className="mt-6">
              <Link href="/apps" className="btn-secondary">
                Back to the app library
              </Link>
            </p>
          </header>
        </div>
      </div>
    );
  }

  // External apps (Arcade): shim → launch bridge → subdomain product home.
  if (isExternalLaunchApp(app)) {
    redirect(`/api/apps/launch?slug=${encodeURIComponent(app.slug)}`);
  }

  // First app = Mishnayos/Gemara learning surface
  if (appSlug !== FIRST_APP_SLUG) notFound();

  return (
    <div>
      <section className="hero-band">
        <div className="mx-auto max-w-6xl px-5 py-10 sm:px-8 sm:py-12">
          <h1 className="display text-3xl text-forest-950 sm:text-4xl">
            Choose what to learn
          </h1>
          <p className="mt-3 max-w-2xl text-base text-ink-muted">
            Pick a Gemara or Mishnah that is open today, or see what is coming
            next. Bava Metzia is available now.
          </p>
        </div>
      </section>
      <div className="mx-auto max-w-6xl px-5 py-8 sm:px-8 sm:py-10">
        <TractatePicker />
      </div>
    </div>
  );
}
