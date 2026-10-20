import { AmudFooter } from "@/components/amud-footer";
import { AmudHeader } from "@/components/amud-header";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { isAmudSite } from "@/lib/site";

/** Picks Guide school chrome vs public Amud chrome. */
export function SiteChrome({ children }: { children: React.ReactNode }) {
  if (isAmudSite()) {
    return (
      <>
        <AmudHeader />
        <main className="flex-1">{children}</main>
        <AmudFooter />
      </>
    );
  }

  return (
    <>
      <SiteHeader />
      <main className="flex-1">{children}</main>
      <SiteFooter />
    </>
  );
}
