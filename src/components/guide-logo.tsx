import Link from "next/link";

type WordmarkProps = {
  href?: string | null;
  className?: string;
  tone?: "default" | "onDark";
  size?: "sm" | "md" | "lg";
};

const sizeMap = {
  sm: "text-[1.0625rem]",
  md: "text-[1.25rem]",
  lg: "text-[1.625rem]",
} as const;

/**
 * Locked brand lockup: typographic “Guide” only.
 * No icon mark — weight, tracking, and forest color do the work.
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
      className={`inline-block font-medium leading-none tracking-[-0.035em] ${sizeMap[size]} ${textColor} ${className}`}
      style={{
        fontFamily: "var(--font-manrope), var(--font-body), system-ui, sans-serif",
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
