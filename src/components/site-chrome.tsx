"use client";

import { usePathname } from "next/navigation";
import { AmudFooter } from "@/components/amud-footer";
import { AmudHeader } from "@/components/amud-header";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { isAmudPublicPath, isAmudSite } from "@/lib/site";

/** Portal routes own Clever top-bar chrome — skip marketing header/footer. */
function isSchoolPortalPath(pathname: string): boolean {
  return (
    pathname === "/student" ||
    pathname.startsWith("/student/") ||
    pathname === "/teacher" ||
    pathname === "/education/panel" ||
    pathname.startsWith("/education/panel/") ||
    pathname === "/admin" ||
    pathname.startsWith("/admin/") ||
    pathname === "/official" ||
    pathname === "/developer" ||
    pathname.startsWith("/developer/") ||
    pathname === "/account"
  );
}

/** Picks Guide school chrome vs public Amud chrome. Auth / portals are full-bleed. */
export function SiteChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() ?? "";
  const authBare =
    pathname.startsWith("/auth/") || pathname.startsWith("/invite/");
  const portalBare = isSchoolPortalPath(pathname);
  const bare = authBare || portalBare;

  const amudChrome = isAmudSite() || isAmudPublicPath(pathname);

  if (amudChrome) {
    if (authBare) {
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
