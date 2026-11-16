"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BlitzWordmark } from "@/components/blitz/brand";

const TEACHER_LINKS = [
  { href: "/apps/blitz/library", label: "Library" },
  { href: "/apps/blitz/discover", label: "Discover" },
  { href: "/apps/blitz/reports", label: "Reports" },
];

/** Blitz band: wordmark + section nav (teacher links only for teachers). */
export function BlitzAppNav({ teacher, planLabel }: { teacher: boolean; planLabel?: string | null }) {
  const pathname = usePathname() ?? "";
  return (
    <div className="bz-band">
      <div className="bz-band-inner">
        <Link
          href={teacher ? "/apps/blitz/library" : "/apps/blitz/join"}
          className="no-underline"
          aria-label="Blitz home"
        >
          <BlitzWordmark size="md" />
        </Link>
        <nav className="bz-nav" aria-label="Blitz">
          {teacher
            ? TEACHER_LINKS.map((l) => (
                <Link
                  key={l.href}
                  href={l.href}
                  className={`bz-nav-link ${pathname.startsWith(l.href) || (l.href.endsWith("library") && pathname.startsWith("/apps/blitz/edit")) ? "is-active" : ""}`}
                >
                  {l.label}
                </Link>
              ))
            : null}
          {teacher ? (
            <Link
              href="/apps/blitz/upgrade"
              className={`bz-nav-link bz-nav-plan ${pathname.startsWith("/apps/blitz/upgrade") ? "is-active" : ""}`}
              title="Your Blitz plan"
            >
              {planLabel ?? "Plan"}
              {planLabel === "Free" ? <span className="bz-lock">Upgrade</span> : null}
            </Link>
          ) : null}
          <Link href="/apps" className="bz-nav-link">
            Apps
          </Link>
          <Link href="/apps/blitz/join" className="bz-nav-link bz-nav-link--join">
            Join
          </Link>
        </nav>
      </div>
    </div>
  );
}
