import Link from "next/link";
import { notFound } from "next/navigation";
import { AppWordmark } from "@/components/app-wordmark";
import { getApp } from "@/lib/apps";

export const instant = false;

type Props = {
  children: React.ReactNode;
  params: Promise<{ appSlug: string }>;
};

export default async function AppShellLayout({ children, params }: Props) {
  const { appSlug } = await params;
  const app = getApp(appSlug);
  if (!app) notFound();

  return (
    <div>
      <div className="border-b border-line bg-sky-soft/60">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-5 py-3 sm:px-8">
          <div className="flex items-center gap-3">
            <AppWordmark name={app.name} size="md" />
            <span className="hidden text-sm text-ink-muted sm:inline">
              {app.tagline}
            </span>
          </div>
          <Link
            href="/apps"
            className="text-sm font-medium text-forest-700 no-underline hover:underline"
          >
            ← Guide apps
          </Link>
        </div>
      </div>
      {children}
    </div>
  );
}
