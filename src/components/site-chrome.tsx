"use client";

import { usePathname } from "next/navigation";
import { AmudFooter } from "@/components/amud-footer";
import { AmudHeader } from "@/components/amud-header";
import { ReleaseNotice } from "@/components/release-notice";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { isAmudPublicPath, isAmudSite } from "@/lib/site";

/** Picks Guide school chrome vs public Amud chrome. Auth is full-bleed (Clever login). */
export function SiteChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() ?? "";
  const bare =
    pathname.startsWith("/auth/") || pathname.startsWith("/invite/");

  const amudChrome = isAmudSite() || isAmudPublicPath(pathname);

  // Guide school surfaces (marketing, portals, auth) — not the public Amud site.
  const showReleaseNotice = !amudChrome;

  if (amudChrome) {
    if (bare) {
      return <main className="flex-1">{children}</main>;
    }
    return (
      <>
        <AmudHeader />
        <main className="flex-1">{children}</main>
        <AmudFooter />
      </>
    );
  }

  if (bare) {
    return (
      <>
        {showReleaseNotice ? <ReleaseNotice /> : null}
        <main className="flex-1">{children}</main>
      </>
    );
  }

  return (
    <>
      {showReleaseNotice ? <ReleaseNotice /> : null}
      <SiteHeader />
      <main className="flex-1">{children}</main>
      <SiteFooter />
    </>
  );
}
