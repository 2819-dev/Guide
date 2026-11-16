"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

const TABS = [
  {
    href: "/student",
    label: "Apps",
    match: (p: string, h: string) => p === "/student" && h !== "#classes",
    icon: (
      <path d="M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h6v6h-6z" strokeLinejoin="round" />
    ),
  },
  {
    href: "/student#classes",
    label: "Classes",
    match: (p: string, h: string) => p === "/student" && h === "#classes",
    icon: (
      <>
        <circle cx="9" cy="8" r="3" />
        <path d="M3.5 19c.8-3 3-4.5 5.5-4.5s4.7 1.5 5.5 4.5M16 6.5a2.5 2.5 0 0 1 0 5M17.5 14.5c1.6.5 2.6 1.9 3 4.5" strokeLinecap="round" />
      </>
    ),
  },
  {
    href: "/student/messages",
    label: "Messages",
    match: (p: string) => p.startsWith("/student/messages"),
    icon: <path d="M4 5h16v11H9l-5 4z" strokeLinejoin="round" />,
  },
  {
    href: "/student/suggestions",
    label: "Ideas",
    match: (p: string) => p.startsWith("/student/suggestions"),
    icon: (
      <path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.2 1 2.1h5c0-.9.4-1.6 1-2.1A6 6 0 0 0 12 3z" strokeLinejoin="round" />
    ),
  },
  {
    href: "/account",
    label: "Account",
    match: (p: string) => p.startsWith("/account"),
    icon: (
      <>
        <circle cx="12" cy="8" r="3.5" />
        <path d="M5 20c1.4-3.4 4-5 7-5s5.6 1.6 7 5" strokeLinecap="round" />
      </>
    ),
  },
];

/** App-style bottom navigation for students on phones. */
export function StudentTabBar() {
  const pathname = usePathname() ?? "";
  const [hash, setHash] = useState("");

  useEffect(() => {
    const sync = () => setHash(window.location.hash);
    sync();
    window.addEventListener("hashchange", sync);
    return () => window.removeEventListener("hashchange", sync);
  }, [pathname]);

  return (
    <nav className="student-tabbar" aria-label="Student">
      {TABS.map((t) => {
        const active = t.match(pathname, hash);
        return (
          <Link
            key={t.href}
            href={t.href}
            className={`student-tabbar__tab${active ? " is-active" : ""}`}
            aria-current={active ? "page" : undefined}
            onClick={() => setHash(t.href.includes("#") ? "#" + t.href.split("#")[1] : "")}
          >
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              aria-hidden
            >
              {t.icon}
            </svg>
            <span>{t.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
