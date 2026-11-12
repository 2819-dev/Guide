"use client";

import { useEffect, useState } from "react";
import { HOME_HERO_RELEASE_DATE } from "@/lib/brand";

const SESSION_KEY = "guide.releaseNotice.dismissed";

function formatReleaseDate(raw: string): string {
  // HOME_HERO_RELEASE_DATE is MM.DD.YYYY → "November 17, 2026"
  const m = /^(\d{1,2})\.(\d{1,2})\.(\d{4})$/.exec(raw.trim());
  if (!m) return raw;
  const month = Number(m[1]);
  const day = Number(m[2]);
  const year = Number(m[3]);
  const d = new Date(Date.UTC(year, month - 1, day));
  return d.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
}

/**
 * Soft sitewide notice: Official Release date + under-development reminder.
 * Dismissed once per browser session (sessionStorage).
 */
export function ReleaseNotice() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    try {
      if (sessionStorage.getItem(SESSION_KEY) === "1") return;
    } catch {
      /* private mode — still show */
    }
    setOpen(true);
  }, []);

  function dismiss() {
    try {
      sessionStorage.setItem(SESSION_KEY, "1");
    } catch {
      /* ignore */
    }
    setOpen(false);
  }

  if (!open) return null;

  const releaseLabel = formatReleaseDate(HOME_HERO_RELEASE_DATE);

  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center bg-[rgba(15,31,24,0.28)] p-4 backdrop-blur-[2px]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="guide-release-notice-title"
    >
      <div className="w-full max-w-md rounded-[14px] border border-line bg-surface px-6 py-7 shadow-[var(--shadow-card)] sm:px-8 sm:py-8">
        <p className="portal-eyebrow">Official Release</p>
        <h2
          id="guide-release-notice-title"
          className="mt-1.5 text-[1.375rem] font-semibold tracking-tight text-forest-950 sm:text-[1.5rem]"
        >
          Guide is releasing {releaseLabel}
        </h2>
        <p className="mt-3 text-[0.95rem] leading-relaxed text-ink-muted">
          This website is still under development and may not work correctly
          until the final release. Thank you for your patience while we finish
          preparing Guide for schools.
        </p>
        <div className="mt-7 flex justify-end">
          <button type="button" className="btn-primary min-w-[7.5rem]" onClick={dismiss}>
            Continue
          </button>
        </div>
      </div>
    </div>
  );
}
