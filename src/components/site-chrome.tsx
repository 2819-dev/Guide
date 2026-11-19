"use client";

import { usePathname } from "next/navigation";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { SupportChatWidget } from "@/components/support-chat-widget";

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

/** Guide header and footer; auth and portal pages are full-bleed. */
export function SiteChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() ?? "";
  const authBare =
    pathname.startsWith("/auth/") || pathname.startsWith("/invite/");
  const portalBare = isSchoolPortalPath(pathname);
  const bare = authBare || portalBare;

  if (bare) {
    return (
      <>
        <main className="flex-1">{children}</main>
        <SupportChatWidget />
      </>
    );
  }

  return (
    <>
      <SiteHeader />
      <main className="flex-1">{children}</main>
      <SiteFooter />
      <SupportChatWidget />
    </>
  );
}
