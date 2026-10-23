import Link from "next/link";
import type { MouseEventHandler, ReactNode } from "react";
import { GuideWordmark } from "@/components/guide-logo";
import { SignOutButton } from "@/components/sign-out-button";

export type PortalChip = {
  href: string;
  label: string;
  active?: boolean;
  /** Demo / in-page tabs — render as button instead of link */
  onClick?: MouseEventHandler<HTMLButtonElement>;
};

type Props = {
  /** Role label (Student / Teacher / School Administrator / …) */
  eyebrow?: string;
  title: string;
  subtitle?: string | null;
  /** Section tabs in the top bar */
  chips?: PortalChip[];
  /** Utility links in the top bar (Messaging, Suggestions, …) */
  utilities?: PortalChip[];
  accountName?: string;
  /** Omit or null to show name without link (embeds) */
  accountHref?: string | null;
  showSignOut?: boolean;
  /** Embedded preview (school demo) — no site sign-out */
  embed?: boolean;
  embedBadge?: string;
  embedActions?: ReactNode;
  children: ReactNode;
};

function PortalNavItem({
  item,
  variant,
}: {
  item: PortalChip;
  variant: "tab" | "link";
}) {
  const base =
    variant === "tab" ? "portal-topbar__tab" : "portal-topbar__link";
  const className = item.active ? `${base} ${base}--active` : base;

  if (item.onClick) {
    return (
      <button
        type="button"
        className={className}
        onClick={item.onClick}
        aria-current={item.active ? "page" : undefined}
      >
        {item.label}
      </button>
    );
  }

  return (
    <a
      href={item.href}
      className={className}
      aria-current={item.active ? "page" : undefined}
    >
      {item.label}
    </a>
  );
}

/**
 * Clever-like school portal shell — shared by Student, Teacher,
 * School administrator, and (when used) Official / Developer.
 * Top bar = navigation; dash fills the viewport below.
 */
export function PortalShell({
  eyebrow,
  title,
  subtitle,
  chips,
  utilities,
  accountName,
  accountHref = "/account",
  showSignOut = true,
  embed = false,
  embedBadge,
  embedActions,
  children,
}: Props) {
  const roleLabel = eyebrow ?? "Portal";
  const tabs = chips ?? [];
  const utils = utilities ?? [];

  return (
    <div
      className={
        embed ? "portal-shell portal-shell--embed" : "portal-shell"
      }
    >
      <header className="portal-topbar">
        <div className="portal-topbar__inner">
          <div className="portal-topbar__brand">
            <GuideWordmark href={embed ? null : "/"} size="md" />
            <span className="portal-topbar__role">{roleLabel}</span>
          </div>

          {tabs.length > 0 ? (
            <nav className="portal-topbar__tabs" aria-label="Portal sections">
              {tabs.map((tab) => (
                <PortalNavItem
                  key={tab.href + tab.label}
                  item={tab}
                  variant="tab"
                />
              ))}
            </nav>
          ) : (
            <div className="portal-topbar__tabs" aria-hidden />
          )}

          <div className="portal-topbar__actions">
            {utils.map((u) => (
              <PortalNavItem
                key={u.href + u.label}
                item={u}
                variant="link"
              />
            ))}
            {accountName ? (
              embed || !accountHref ? (
                <span className="portal-topbar__link">{accountName}</span>
              ) : (
                <Link href={accountHref} className="portal-topbar__link">
                  {accountName}
                </Link>
              )
            ) : null}
            {embedBadge ? (
              <span className="portal-topbar__badge">{embedBadge}</span>
            ) : null}
            {embedActions}
            {!embed && showSignOut ? <SignOutButton /> : null}
          </div>
        </div>
      </header>

      <div className="portal-dash">
        <div className="portal-dash__inner">
          <header className="portal-dash__hero">
            <h1 className="portal-dash__title">{title}</h1>
            {subtitle ? (
              <p className="portal-dash__subtitle">{subtitle}</p>
            ) : null}
          </header>
          <div className="portal-dash__body">{children}</div>
        </div>
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

/** Compact portal tool shortcut (messages, suggestions, etc.). */
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
