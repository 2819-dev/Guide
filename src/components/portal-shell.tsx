import Link from "next/link";
import type { ReactNode } from "react";
import { GuideBrandBanner } from "@/components/guide-brand-banner";

export type PortalChip = {
  href: string;
  label: string;
  active?: boolean;
};

type Props = {
  eyebrow: string;
  title: string;
  subtitle?: string | null;
  /** Top tabs shared across all portal roles */
  chips?: PortalChip[];
  backHref?: string;
  backLabel?: string;
  children: ReactNode;
};

/**
 * Shared portal chrome: Guide banner + top tabs for every role.
 * Apps stay in-page — never the site header.
 */
export function PortalShell({
  eyebrow,
  title,
  subtitle,
  chips,
  backHref,
  backLabel = "← Back",
  children,
}: Props) {
  return (
    <div className="portal-page">
      <GuideBrandBanner variant="strip" priority />
      <div className="content-band portal-page__inner">
        {backHref ? (
          <p className="mb-4">
            <Link
              href={backHref}
              className="text-sm font-semibold text-forest-800 no-underline hover:underline"
            >
              {backLabel}
            </Link>
          </p>
        ) : null}

        {chips && chips.length > 0 ? (
          <nav className="portal-tabs" aria-label="Portal sections">
            {chips.map((chip) => (
              <a
                key={chip.href + chip.label}
                href={chip.href}
                className={
                  chip.active ? "portal-tab portal-tab--active" : "portal-tab"
                }
              >
                {chip.label}
              </a>
            ))}
          </nav>
        ) : null}

        <header className="portal-hero">
          <p className="portal-eyebrow">{eyebrow}</p>
          <h1 className="display-feature mt-1">{title}</h1>
          {subtitle ? (
            <p className="mt-1.5 max-w-xl text-[0.95rem] leading-relaxed text-ink-muted">
              {subtitle}
            </p>
          ) : null}
        </header>

        <div className="portal-body">{children}</div>
      </div>
    </div>
  );
}

type ToolTileProps = {
  href: string;
  title: string;
  description: string;
  cta?: string;
  muted?: boolean;
};

/** Compact Clever-style portal tool shortcut (messages, suggestions, etc.). */
export function PortalToolTile({
  href,
  title,
  description,
  cta = "Open →",
  muted = false,
}: ToolTileProps) {
  if (muted) {
    return (
      <div className="portal-tool-tile portal-tool-tile--muted">
        <p className="text-base font-semibold text-forest-950">{title}</p>
        <p className="mt-1 text-sm leading-snug text-ink-muted">{description}</p>
        <p className="mt-3 text-sm font-semibold text-forest-700">Paused</p>
      </div>
    );
  }

  return (
    <Link href={href} className="portal-tool-tile">
      <p className="text-base font-semibold text-forest-950">{title}</p>
      <p className="mt-1 text-sm leading-snug text-ink-muted">{description}</p>
      <p className="mt-3 text-sm font-semibold text-forest-800">{cta}</p>
    </Link>
  );
}
