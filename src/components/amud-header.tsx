"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AppWordmark } from "@/components/app-wordmark";
import { SignOutButton } from "@/components/sign-out-button";
import { FIRST_APP_NAME } from "@/lib/apps";
import { publicAmudHomePath, publicAmudLearnBase } from "@/lib/site";

type Me = {
  profile: { displayName: string } | null;
};

const navLink =
  "px-2.5 py-2 text-[0.9375rem] font-medium text-forest-950 no-underline hover:text-forest-700";

/**
 * Public Amud chrome — Amud wordmark · Learn · Log In.
 * Not Guide school nav (no Education / portals / apps).
 */
export function AmudHeader() {
  const [me, setMe] = useState<Me | null>(null);

  useEffect(() => {
    void fetch("/api/me")
      .then((r) => r.json())
      .then((data) => setMe(data))
      .catch(() => setMe({ profile: null }));
  }, []);

  const loggedIn = Boolean(me?.profile);
  const home = publicAmudHomePath();
  const learn = publicAmudLearnBase();

  return (
    <header className="site-header sticky top-0 z-40">
      <div className="site-header__inner">
        <AppWordmark name={FIRST_APP_NAME} href={home} size="lg" />
        <nav
          className="flex flex-wrap items-center justify-end gap-1 sm:gap-5"
          aria-label="Amud"
        >
          <Link href={learn} className={navLink}>
            Learn
          </Link>
          {loggedIn ? (
            <>
              <Link href="/account" className={`hidden sm:inline ${navLink}`}>
                {me!.profile!.displayName}
              </Link>
              <SignOutButton />
            </>
          ) : (
            <Link
              href="/auth/sign-in?as=learner"
              className={`${navLink} font-semibold`}
            >
              Log In
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
