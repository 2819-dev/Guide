"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { GuideWordmark } from "@/components/guide-logo";
import { SignOutButton } from "@/components/sign-out-button";
import type { Role } from "@/lib/roles";

type Me = {
  profile: { id: string; role: Role; displayName: string } | null;
};

const navLink =
  "rounded-md px-2.5 py-1.5 text-sm font-medium text-ink no-underline hover:bg-forest-100";

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
    <header className="sticky top-0 z-40 border-b border-line bg-paper">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-3 sm:px-8">
        <GuideWordmark />
        <nav className="flex flex-wrap items-center justify-end gap-0.5 sm:gap-1">
          <Link href="/study" className={navLink}>
            Study
          </Link>
          <Link href={educationHref} className={navLink}>
            Education
          </Link>
          {(role === "admin" || role === "moderator") && (
            <Link href="/admin" className={navLink}>
              {role === "admin" ? "Ops" : "Schools"}
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
            <>
              <Link href="/auth/sign-in" className={navLink}>
                Log in
              </Link>
              <Link
                href="/auth/sign-up"
                className="btn-primary !px-3 !py-1.5 text-sm"
              >
                Get started
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
