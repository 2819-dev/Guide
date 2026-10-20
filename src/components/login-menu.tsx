"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";
import { LOGIN_AS_OPTIONS } from "@/lib/login-roles";

type Props = {
  /** Primary filled style (Clever-like) vs quiet text */
  variant?: "primary" | "nav";
  className?: string;
};

export function LoginMenu({ variant = "nav", className = "" }: Props) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const menuId = useId();

  useEffect(() => {
    if (!open) return;
    function onPointer(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const triggerClass =
    variant === "primary"
      ? "btn-primary inline-flex items-center gap-1.5 !px-3.5 !py-2 text-sm"
      : "inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-sm font-medium text-ink hover:bg-forest-100";

  return (
    <div ref={rootRef} className={`relative ${className}`}>
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={menuId}
        onClick={() => setOpen((v) => !v)}
        className={triggerClass}
      >
        Log in
        <svg
          width="12"
          height="12"
          viewBox="0 0 12 12"
          aria-hidden
          className={`opacity-70 transition ${open ? "rotate-180" : ""}`}
        >
          <path
            d="M2.5 4.5 6 8l3.5-3.5"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      {open && (
        <div
          id={menuId}
          role="menu"
          aria-label="Log in as"
          className="absolute right-0 z-50 mt-2 w-[min(100vw-2rem,20rem)] overflow-hidden rounded-lg border border-line bg-surface shadow-[0_8px_24px_rgba(15,31,24,0.08)]"
        >
          <p className="border-b border-line bg-paper px-3.5 py-2.5 text-xs font-semibold uppercase tracking-[0.12em] text-forest-700">
            Log in as
          </p>
          <ul className="py-1">
            {LOGIN_AS_OPTIONS.map((opt) => (
              <li key={opt.id} role="none">
                <Link
                  role="menuitem"
                  href={opt.href}
                  onClick={() => setOpen(false)}
                  className="block px-3.5 py-2.5 no-underline transition hover:bg-forest-100"
                >
                  <span className="block text-sm font-semibold text-forest-950">
                    {opt.label}
                  </span>
                  <span className="mt-0.5 block text-xs leading-snug text-ink-muted">
                    {opt.description}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
