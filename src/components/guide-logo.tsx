import Link from "next/link";

type WordmarkProps = {
  href?: string | null;
  className?: string;
  tone?: "default" | "onDark";
  size?: "sm" | "md" | "lg";
};

const sizeMap = {
  sm: "text-lg",
  md: "text-[1.35rem]",
  lg: "text-2xl",
} as const;

/**
 * Soft fallback lockup: “Guide” wordmark only.
 * No decorative mark until a direction is picked (guide-alt-* pending).
 */
export function GuideWordmark({
  href = "/",
  className = "",
  tone = "default",
  size = "md",
}: WordmarkProps) {
  const textColor = tone === "onDark" ? "text-white" : "text-forest-900";

  const inner = (
    <span
      className={`font-semibold leading-none tracking-tight ${sizeMap[size]} ${textColor} ${className}`}
      style={{
        fontFamily: "var(--font-manrope), var(--font-body), sans-serif",
      }}
    >
      Guide
    </span>
  );

  if (href == null) return inner;

  return (
    <Link href={href} className="no-underline" aria-label="Guide home">
      {inner}
    </Link>
  );
}

/** @deprecated Mark deferred — wordmark-only until user picks guide-alt-* */
export function GuideMark({
  className = "hidden",
  title,
}: {
  className?: string;
  title?: string;
}) {
  return (
    <span className={className} aria-hidden title={title}>
      Guide
    </span>
  );
}
