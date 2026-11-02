import Link from "next/link";

type WordmarkProps = {
  href?: string | null;
  className?: string;
  tone?: "default" | "onDark";
  size?: "sm" | "md" | "lg";
};

const sizeMap = {
  sm: "text-[1.125rem] lg:text-[1.25rem]",
  md: "text-[1.35rem] lg:text-[1.6rem]",
  lg: "text-[1.75rem] lg:text-[2.05rem]",
} as const;

/**
 * Guide wordmark — licensed Gulfs Display (wordmark only).
 * Amud keeps AppWordmark.
 */
export function GuideWordmark({
  href = "/",
  className = "",
  tone = "default",
  size = "md",
}: WordmarkProps) {
  const textColor = tone === "onDark" ? "text-white" : "text-ink";

  const inner = (
    <span
      className={`guide-wordmark inline-block font-normal leading-none tracking-[-0.02em] ${sizeMap[size]} ${textColor} ${className}`}
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
