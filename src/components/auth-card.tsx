import type { ReactNode } from "react";
import { LoginMenu } from "@/components/login-menu";

/** Shared auth panel chrome — role switcher only (site header already has wordmark). */
export function AuthCard({
  eyebrow = "Log in as a",
  title,
  subtitle,
  children,
  footer,
}: {
  eyebrow?: string | null;
  title: string;
  subtitle?: string | null;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <div className="w-full max-w-md">
      <div className="mb-5 flex justify-end">
        <LoginMenu variant="nav" />
      </div>
      <div className="rounded-2xl border border-line bg-surface px-6 py-8 sm:px-8 sm:py-9">
        {eyebrow ? (
          <p className="text-sm font-semibold text-forest-700">{eyebrow}</p>
        ) : null}
        <h1
          className={`display text-[1.75rem] text-forest-950 sm:text-[2rem] ${eyebrow ? "mt-1.5" : ""}`}
        >
          {title}
        </h1>
        {subtitle ? (
          <p className="mt-3 text-[0.95rem] leading-relaxed text-ink-muted">
            {subtitle}
          </p>
        ) : null}
        <div className="mt-8">{children}</div>
        {footer ? (
          <div className="mt-6 text-center text-sm text-ink-muted">{footer}</div>
        ) : null}
      </div>
    </div>
  );
}
