"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { GuideWordmark } from "@/components/guide-logo";
import { LoginMenu } from "@/components/login-menu";
import { SignOutButton } from "@/components/sign-out-button";
import type { Role } from "@/lib/roles";

type Me = {
  profile: {
    id: string;
    role: Role;
    displayName: string;
    schoolId?: string | null;
    badgeCode?: string | null;
  } | null;
};

const navLink =
  "rounded-full px-3 py-2 text-[0.9375rem] font-medium text-ink no-underline hover:bg-forest-100";

export function SiteHeader() {
  const [me, setMe] = useState<Me | null>(null);

  useEffect(() => {
    void fetch("/api/me")
      .then((r) => r.json())
      .then((data) => setMe(data))
      .catch(() => setMe({ profile: null }));
  }, []);

  const role = me?.profile?.role;
  const educationHref =
    role === "rebbe" || role === "admin" ? "/education/panel" : "/education";

  return (
    <header className="site-header sticky top-0 z-40">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-3.5 sm:px-8">
        <GuideWordmark size="lg" />
        <nav className="flex flex-wrap items-center justify-end gap-0.5 sm:gap-1">
          {me?.profile?.schoolId || me?.profile?.badgeCode ? (
            <Link href="/student" className={navLink}>
              Student
            </Link>
          ) : null}
          <Link href="/study" className={navLink}>
            Study
          </Link>
          <Link href={educationHref} className={navLink}>
            Education
          </Link>
          {(role === "admin" || role === "moderator") && (
            <Link href="/admin" className={navLink}>
              Guide Official
            </Link>
          )}
          {me?.profile ? (
            <>
              <Link
                href="/account"
                className={`hidden sm:inline ${navLink}`}
              >
                {me.profile.displayName}
              </Link>
              <SignOutButton />
            </>
          ) : (
            <LoginMenu variant="primary" />
          )}
        </nav>
      </div>
    </header>
  );
}
