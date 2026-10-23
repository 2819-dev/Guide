import type { ReactNode } from "react";

/** Shared auth panel chrome — full-bleed pages own the wordmark above. */
export function AuthCard({
  eyebrow,
  title,
  subtitle,
  children,
  footer,
}: {
  eyebrow?: string | null;
  title: ReactNode;
  subtitle?: string | null;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <div className="w-full max-w-lg lg:max-w-xl">
      <div className="auth-card">
        {eyebrow ? <p className="portal-eyebrow">{eyebrow}</p> : null}
        <h1
          className={`text-[1.625rem] font-semibold tracking-tight text-forest-950 sm:text-[1.875rem] lg:text-[2.1rem] ${eyebrow ? "mt-1.5" : ""}`}
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
