"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";
import { LOGIN_AS_OPTIONS } from "@/lib/login-roles";

type Props = {
  variant?: "primary" | "nav";
  className?: string;
};

/** Clever-style header Log In control (~50px tall, 10px radius). */
export function LoginMenu({ variant = "primary", className = "" }: Props) {
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
      ? "inline-flex h-[50px] items-center gap-2 rounded-[10px] bg-forest-800 px-7 text-base font-semibold text-white transition hover:bg-forest-700"
      : "inline-flex items-center gap-1.5 rounded-[10px] border border-line bg-surface px-3 py-2 text-sm font-semibold text-forest-900 hover:bg-forest-100";

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
        {variant === "primary" ? (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
            <circle cx="12" cy="8" r="3.5" stroke="currentColor" strokeWidth="1.7" />
            <path
              d="M5 19.5c1.5-3.2 4-4.8 7-4.8s5.5 1.6 7 4.8"
              stroke="currentColor"
              strokeWidth="1.7"
              strokeLinecap="round"
            />
          </svg>
        ) : null}
        Log In
        <svg
          width="12"
          height="12"
          viewBox="0 0 12 12"
          aria-hidden
          className={`opacity-90 transition ${open ? "rotate-180" : ""}`}
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
          aria-label="Log in as a"
          className="absolute right-0 z-50 mt-2.5 w-[min(100vw-2rem,22rem)] overflow-hidden rounded-[10px] border border-line bg-surface"
          style={{ boxShadow: "var(--shadow-menu)" }}
        >
          <p className="border-b border-line bg-sky-soft px-4 py-3 text-sm font-semibold text-forest-900">
            Log in as a
          </p>
          <ul className="py-1">
            {LOGIN_AS_OPTIONS.map((opt) => (
              <li key={opt.id} role="none">
                <Link
                  role="menuitem"
                  href={opt.href}
                  onClick={() => setOpen(false)}
                  className="block min-h-[52px] px-4 py-3 no-underline transition hover:bg-forest-100"
                >
                  <span className="block text-[0.9375rem] font-semibold text-forest-950">
                    {opt.label}
                  </span>
                  <span className="mt-0.5 block text-[0.8125rem] leading-snug text-ink-muted">
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
