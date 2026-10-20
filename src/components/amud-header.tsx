"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AppWordmark } from "@/components/app-wordmark";
import { SignOutButton } from "@/components/sign-out-button";
import { FIRST_APP_NAME } from "@/lib/apps";
import { guidePublicUrl } from "@/lib/site";

type Me = {
  profile: { displayName: string } | null;
};

const navLink =
  "rounded-full px-3 py-2 text-[0.9375rem] font-medium text-ink no-underline hover:bg-forest-100";

/** Public Amud site chrome — not Guide school chrome. */
export function AmudHeader() {
  const [me, setMe] = useState<Me | null>(null);

  useEffect(() => {
    void fetch("/api/me")
      .then((r) => r.json())
      .then((data) => setMe(data))
      .catch(() => setMe({ profile: null }));
  }, []);

  const loggedIn = Boolean(me?.profile);

  return (
    <header className="site-header sticky top-0 z-40">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-3.5 sm:px-8">
        <AppWordmark name={FIRST_APP_NAME} href="/" size="lg" />
        <nav className="flex flex-wrap items-center justify-end gap-0.5 sm:gap-1">
          <Link href="/learn" className={navLink}>
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
            <>
              <Link href="/auth/sign-in?as=learner" className={navLink}>
                Log In
              </Link>
              <Link
                href="/auth/sign-up?as=learner"
                className="btn-primary !px-4 !py-2 text-sm"
              >
                Create account
              </Link>
            </>
          )}
        </nav>
      </div>
      <p className="border-t border-line bg-sky-soft/50 px-5 py-1.5 text-center text-xs text-ink-muted sm:px-8">
        Schools use{" "}
        <a
          href={guidePublicUrl()}
          className="font-semibold text-forest-800 no-underline hover:underline"
        >
          Guide
        </a>{" "}
        to add {FIRST_APP_NAME} for classes.
      </p>
    </header>
  );
}
