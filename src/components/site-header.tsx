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
  "px-2 py-2 text-base font-normal text-forest-950 no-underline hover:text-forest-700";

/**
 * Clever 1:1 header structure — Guide wordmark + forest CTAs.
 * Apps never appear in the top bar.
 */
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

  let portalId: PortalId | null = null;
  let portalHref = "/student";
  if (profile) {
    const portal = portalFor({
      role: profile.role,
      schoolId: profile.schoolId,
      badgeCode: profile.badgeCode,
      educationOk: me?.educationOk,
    });
    if (portal) {
      portalId = portal.id;
      portalHref = portal.href;
    } else if (profile.role === "rebbe") {
      portalHref = "/education#apply";
    } else if (profile.role === "admin" || profile.role === "moderator") {
      portalHref = "/official";
      portalId = "official";
    }
  }

  return (
    <header className="site-header sticky top-0 z-40">
      <div className="site-header__inner">
        <GuideWordmark size="lg" />
        <nav className="flex flex-wrap items-center justify-end gap-1 sm:gap-5">
          {loggedIn ? (
            <>
              <Link href={portalHref} className={`${navLink} font-semibold`}>
                My portal
              </Link>
              {portalId ? (
                <>
                  <Link href={messagesHrefFor(portalId)} className={navLink}>
                    Messaging
                  </Link>
                  <Link
                    href={suggestionsHrefFor(portalId)}
                    className={navLink}
                  >
                    Suggestions
                  </Link>
                </>
              ) : null}
              <Link href="/account" className={`hidden sm:inline ${navLink}`}>
                {profile!.displayName}
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
