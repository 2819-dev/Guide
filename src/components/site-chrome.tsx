"use client";

import { usePathname } from "next/navigation";
import { AmudFooter } from "@/components/amud-footer";
import { AmudHeader } from "@/components/amud-header";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { isAmudSite } from "@/lib/site";

/** Picks Guide school chrome vs public Amud chrome. Auth is full-bleed (Clever login). */
export function SiteChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() ?? "";
  const bareAuth = pathname.startsWith("/auth/");

  if (isAmudSite()) {
    if (bareAuth) {
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

  if (bareAuth) {
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
