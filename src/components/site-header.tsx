"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { GuideWordmark } from "@/components/guide-logo";
import { LoginMenu } from "@/components/login-menu";
import { SignOutButton } from "@/components/sign-out-button";
import {
  messagesHrefFor,
  portalFor,
  suggestionsHrefFor,
  type PortalId,
} from "@/lib/portals";
import type { Role } from "@/lib/roles";

type Me = {
  profile: {
    id: string;
    role: Role;
    displayName: string;
    schoolId?: string | null;
    badgeCode?: string | null;
  } | null;
  educationOk?: boolean;
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

  const profile = me?.profile;
  const loggedIn = Boolean(profile);

  let portalId: PortalId = "family";
  let portalHref = "/family";
  if (profile) {
    const portal = portalFor({
      role: profile.role,
      schoolId: profile.schoolId,
      badgeCode: profile.badgeCode,
      educationOk: me?.educationOk,
    });
    portalId = portal.id;
    portalHref = portal.href;
  }

  return (
    <header className="site-header sticky top-0 z-40">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-3.5 sm:px-8">
        <GuideWordmark size="lg" />
        <nav className="flex flex-wrap items-center justify-end gap-0.5 sm:gap-1">
          {loggedIn ? (
            <>
              <Link href={portalHref} className={`${navLink} font-semibold`}>
                My portal
              </Link>
              <Link
                href={messagesHrefFor(portalId)}
                className={navLink}
              >
                Messaging
              </Link>
              <Link
                href={suggestionsHrefFor(portalId)}
                className={navLink}
              >
                Suggestions
              </Link>
              {portalId === "teacher" || portalId === "official" ? (
                <Link href="/study" className={`hidden sm:inline ${navLink}`}>
                  Study
                </Link>
              ) : (
                <Link href="/study" className={`hidden sm:inline ${navLink}`}>
                  Learning
                </Link>
              )}
              <Link
                href="/account"
                className={`hidden sm:inline ${navLink}`}
              >
                {profile!.displayName}
              </Link>
              <SignOutButton />
            </>
          ) : (
            <>
              <Link href="/study" className={navLink}>
                Study
              </Link>
              <Link href="/education" className={navLink}>
                Education
              </Link>
              <LoginMenu variant="primary" />
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
