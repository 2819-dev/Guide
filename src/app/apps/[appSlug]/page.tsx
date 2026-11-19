import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import {
  APP_UNAVAILABLE_DETAIL,
  APP_UNAVAILABLE_LABEL,
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

  notFound();
}
