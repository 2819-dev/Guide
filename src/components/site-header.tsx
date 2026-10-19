"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { SignOutButton } from "@/components/sign-out-button";
import { roleLabel, type Role } from "@/lib/roles";

type Me = {
  profile: { id: string; role: Role; displayName: string } | null;
};

export function SiteHeader() {
  const [me, setMe] = useState<Me | null>(null);

  useEffect(() => {
    void fetch("/api/me")
      .then((r) => r.json())
      .then((data) => setMe(data))
      .catch(() => setMe({ profile: null }));
  }, []);

  const role = me?.profile?.role;

  return (
    <header className="border-b border-line bg-paper/90">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-4 sm:px-8">
        <Link href="/" className="group flex items-baseline gap-2 no-underline">
          <span className="display text-2xl font-semibold text-forest-900">
            Guide
          </span>
          <span className="hebrew hidden text-sm text-forest-600 sm:inline">
            בבא מציעא
          </span>
        </Link>
        <nav className="flex flex-wrap items-center justify-end gap-2 sm:gap-3">
          <Link
            href="/study"
            className="rounded-md px-2.5 py-1.5 text-sm font-semibold text-forest-800 no-underline hover:bg-forest-100"
          >
            Study
          </Link>
          {role === "rebbe" && (
            <Link
              href="/education"
              className="rounded-md px-2.5 py-1.5 text-sm font-semibold text-forest-800 no-underline hover:bg-forest-100"
            >
              Education
            </Link>
          )}
          {role === "admin" && (
            <Link
              href="/admin"
              className="rounded-md px-2.5 py-1.5 text-sm font-semibold text-forest-800 no-underline hover:bg-forest-100"
            >
              Support
            </Link>
          )}
          {role === "moderator" && (
            <Link
              href="/account"
              className="rounded-md px-2.5 py-1.5 text-sm text-ink-muted no-underline"
              title={roleLabel("moderator")}
            >
              Moderator
            </Link>
          )}
          {me?.profile ? (
            <>
              <Link
                href="/account"
                className="hidden rounded-md px-2.5 py-1.5 text-sm font-semibold text-forest-800 no-underline hover:bg-forest-100 sm:inline"
              >
                {me.profile.displayName}
              </Link>
              <SignOutButton />
            </>
          ) : (
            <>
              <Link
                href="/auth/sign-in"
                className="rounded-md px-2.5 py-1.5 text-sm font-semibold text-forest-800 no-underline hover:bg-forest-100"
              >
                Sign in
              </Link>
              <Link href="/auth/sign-up" className="btn-primary !px-3 !py-1.5 text-sm">
                Join
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
