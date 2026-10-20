import Link from "next/link";
import type { ReactNode } from "react";

export type PortalChip = {
  href: string;
  label: string;
};

type Props = {
  eyebrow: string;
  title: string;
  subtitle?: string | null;
  chips?: PortalChip[];
  backHref?: string;
  backLabel?: string;
  children: ReactNode;
};

/**
 * Clever Instant Login–style portal chrome: soft page band, greeting header,
 * optional section chips. Apps stay in-page — never the top bar.
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

        <header className="portal-hero">
          <p className="text-sm font-semibold text-forest-700">{eyebrow}</p>
          <h1 className="display-feature mt-1.5">{title}</h1>
          {subtitle ? (
            <p className="mt-2 max-w-2xl text-base leading-relaxed text-ink-muted">
              {subtitle}
            </p>
          ) : null}
          {chips && chips.length > 0 ? (
            <nav
              className="portal-chips"
              aria-label="Portal sections"
            >
              {chips.map((chip) => (
                <a key={chip.href} href={chip.href} className="portal-chip">
                  {chip.label}
                </a>
              ))}
            </nav>
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
