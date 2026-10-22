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
      <div className="rounded-[10px] border border-line bg-surface px-6 py-7 shadow-[var(--shadow-card)] sm:px-8 sm:py-8">
        {eyebrow ? (
          <p className="portal-eyebrow">{eyebrow}</p>
        ) : null}
        <h1
          className={`text-[1.625rem] font-semibold tracking-tight text-forest-950 sm:text-[1.875rem] ${eyebrow ? "mt-1.5" : ""}`}
        >
          {title}
        </h1>
        {subtitle ? (
          <p className="mt-2.5 text-[0.9375rem] leading-relaxed text-ink-muted">
            {subtitle}
          </p>
        ) : null}
        <div className="mt-7">{children}</div>
        {footer ? (
          <div className="mt-5 text-center text-sm text-ink-muted">{footer}</div>
        ) : null}
      </div>
    </div>
  );
}
