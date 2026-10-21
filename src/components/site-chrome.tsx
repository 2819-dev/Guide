"use client";

import { usePathname } from "next/navigation";
import { AmudFooter } from "@/components/amud-footer";
import { AmudHeader } from "@/components/amud-header";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { isAmudPublicPath, isAmudSite } from "@/lib/site";

/** Picks Guide school chrome vs public Amud chrome. Auth is full-bleed (Clever login). */
export function SiteChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() ?? "";
  const bare =
    pathname.startsWith("/auth/") || pathname.startsWith("/invite/");

  const amudChrome = isAmudSite() || isAmudPublicPath(pathname);

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
    return <main className="flex-1">{children}</main>;
  }

  return (
    <>
      <SiteHeader />
      <main className="flex-1">{children}</main>
      <SiteFooter />
    </>
  );
}
