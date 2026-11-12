"use client";

import Link from "next/link";
import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type MouseEventHandler,
  type ReactNode,
} from "react";
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
  /** Section tabs in the top bar (desktop) + mobile drawer */
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
  onNavigate,
}: {
  item: PortalChip;
  variant: "tab" | "link" | "drawer";
  onNavigate?: () => void;
}) {
  const base =
    variant === "tab"
      ? "portal-topbar__tab"
      : variant === "link"
        ? "portal-topbar__link"
        : "portal-drawer__link";
  const className = item.active ? `${base} ${base}--active` : base;

  if (item.onClick) {
    return (
      <button
        type="button"
        className={className}
        onClick={(e) => {
          item.onClick?.(e);
          onNavigate?.();
        }}
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
      onClick={() => onNavigate?.()}
    >
      {item.label}
    </a>
  );
}

function navLabelKey(label: string): string {
  return label.toLowerCase().replace(/messaging/, "messages").trim();
}

function dedupeNav(items: PortalChip[]): PortalChip[] {
  const seen = new Set<string>();
  const out: PortalChip[] = [];
  for (const item of items) {
    const key = navLabelKey(item.label);
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(item);
  }
  return out;
}

/**
 * Clever-like school portal shell — shared by Student, Teacher,
 * School administrator, and (when used) Official / Developer.
 * Desktop: top-bar nav. Mobile: collapsible hamburger drawer.
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
  const drawerItems = dedupeNav([...tabs, ...utils]);
  const hasDrawerNav =
    drawerItems.length > 0 ||
    Boolean(accountName) ||
    (!embed && showSignOut) ||
    Boolean(embedActions);

  const [menuOpen, setMenuOpen] = useState(false);
  const menuId = useId();
  const titleId = `${menuId}-title`;
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const drawerRef = useRef<HTMLElement>(null);
  const previouslyFocused = useRef<HTMLElement | null>(null);

  const closeMenu = useCallback(() => setMenuOpen(false), []);
  const openMenu = useCallback(() => setMenuOpen(true), []);

  useEffect(() => {
    if (!menuOpen) return;

    previouslyFocused.current =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const drawer = drawerRef.current;
    const focusables = () =>
      drawer
        ? Array.from(
            drawer.querySelectorAll<HTMLElement>(
              'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])',
            ),
          ).filter((el) => !el.hasAttribute("disabled") && el.tabIndex !== -1)
        : [];

    const nodes = focusables();
    (nodes[0] ?? drawer)?.focus();

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        closeMenu();
        return;
      }
      if (e.key !== "Tab" || !drawer) return;
      const list = focusables();
      if (list.length === 0) {
        e.preventDefault();
        return;
      }
      const first = list[0];
      const last = list[list.length - 1];
      const active = document.activeElement;
      if (e.shiftKey && active === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && active === last) {
        e.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKeyDown);
      const restore = previouslyFocused.current ?? menuButtonRef.current;
      restore?.focus();
    };
  }, [menuOpen, closeMenu]);

  // Close drawer when viewport grows into desktop top-bar mode.
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 900px)");
    const onChange = () => {
      if (mq.matches) closeMenu();
    };
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, [closeMenu]);

  return (
    <div
      className={
        embed
          ? "portal-shell portal-shell--embed"
          : "portal-shell"
      }
    >
      <header className="portal-topbar">
        <div className="portal-topbar__inner">
          <div className="portal-topbar__brand">
            <GuideWordmark href={embed ? null : "/"} size="lg" />
            <span className="portal-topbar__role">{roleLabel}</span>
          </div>

          {tabs.length > 0 ? (
            <nav
              className="portal-topbar__tabs portal-topbar__desktop-nav"
              aria-label="Portal sections"
            >
              {tabs.map((tab) => (
                <PortalNavItem
                  key={tab.href + tab.label}
                  item={tab}
                  variant="tab"
                />
              ))}
            </nav>
          ) : (
            <div
              className="portal-topbar__tabs portal-topbar__desktop-nav"
              aria-hidden
            />
          )}

          <div className="portal-topbar__actions portal-topbar__desktop-nav">
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

          {hasDrawerNav ? (
            <button
              ref={menuButtonRef}
              type="button"
              className="portal-topbar__menu-btn"
              aria-label={menuOpen ? "Close menu" : "Open menu"}
              aria-expanded={menuOpen}
              aria-controls={menuId}
              onClick={() => (menuOpen ? closeMenu() : openMenu())}
            >
              <span className="portal-topbar__menu-icon" aria-hidden>
                {menuOpen ? (
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                    <path
                      d="M5 5l10 10M15 5L5 15"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                  </svg>
                ) : (
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                    <path
                      d="M3.5 5.5h13M3.5 10h13M3.5 14.5h13"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                  </svg>
                )}
              </span>
            </button>
          ) : null}
        </div>
      </header>

      {menuOpen ? (
        <div className="portal-drawer-root">
          <button
            type="button"
            className="portal-drawer__backdrop"
            aria-label="Close menu"
            onClick={closeMenu}
          />
          <aside
            ref={drawerRef}
            id={menuId}
            className="portal-drawer"
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            tabIndex={-1}
          >
            <div className="portal-drawer__head">
              <div className="portal-drawer__brand">
                <GuideWordmark href={embed ? null : "/"} size="md" />
                <p id={titleId} className="portal-drawer__role">
                  {roleLabel}
                </p>
              </div>
              <button
                type="button"
                className="portal-drawer__close"
                aria-label="Close menu"
                onClick={closeMenu}
              >
                <svg width="18" height="18" viewBox="0 0 20 20" fill="none" aria-hidden>
                  <path
                    d="M5 5l10 10M15 5L5 15"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
              </button>
            </div>

            {drawerItems.length > 0 ? (
              <nav className="portal-drawer__nav" aria-label="Portal sections">
                {drawerItems.map((item) => (
                  <PortalNavItem
                    key={`drawer-${item.href}-${item.label}`}
                    item={item}
                    variant="drawer"
                    onNavigate={closeMenu}
                  />
                ))}
              </nav>
            ) : null}

            <div className="portal-drawer__footer">
              {accountName ? (
                embed || !accountHref ? (
                  <span className="portal-drawer__account">{accountName}</span>
                ) : (
                  <Link
                    href={accountHref}
                    className="portal-drawer__link"
                    onClick={closeMenu}
                  >
                    Account · {accountName}
                  </Link>
                )
              ) : null}
              {embedBadge ? (
                <span className="portal-topbar__badge">{embedBadge}</span>
              ) : null}
              {embedActions ? (
                <div className="portal-drawer__embed-actions">{embedActions}</div>
              ) : null}
              {!embed && showSignOut ? (
                <div className="portal-drawer__signout">
                  <SignOutButton />
                </div>
              ) : null}
            </div>
          </aside>
        </div>
      ) : null}

      <div className="portal-dash">
        <div className="portal-dash__inner">
          <header className="portal-dash__hero">
            <p className="portal-dash__eyebrow">{roleLabel}</p>
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
