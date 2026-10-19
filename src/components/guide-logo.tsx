import Link from "next/link";

type MarkProps = {
  className?: string;
  title?: string;
};

/**
 * Guide mark (v3) — solid forest rounded square + two white strokes.
 * Flat, geometric, quiet space. No illustration.
 */
export function GuideMark({ className = "h-8 w-8", title }: MarkProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role={title ? "img" : "presentation"}
      aria-hidden={title ? undefined : true}
      aria-label={title}
    >
      {title ? <title>{title}</title> : null}
      <rect width="40" height="40" rx="10" fill="#1C3D2E" />
      {/* Two horizontal strokes — abstract open page / guide lines */}
      <rect x="10" y="15.25" width="20" height="3.5" rx="1.75" fill="#FFFFFF" />
      <rect x="13" y="21.25" width="14" height="3.5" rx="1.75" fill="#FFFFFF" />
    </svg>
  );
}

type WordmarkProps = {
  href?: string | null;
  className?: string;
  tone?: "default" | "onDark";
  size?: "sm" | "md" | "lg";
};

const sizeMap = {
  sm: { mark: "h-7 w-7", text: "text-[1.05rem]", gap: "gap-2" },
  md: { mark: "h-8 w-8", text: "text-[1.2rem]", gap: "gap-2" },
  lg: { mark: "h-10 w-10", text: "text-xl", gap: "gap-2.5" },
} as const;

/** Brand lockup: mark + “Guide” only — modern sans pairing */
export function GuideWordmark({
  href = "/",
  className = "",
  tone = "default",
  size = "md",
}: WordmarkProps) {
  const s = sizeMap[size];
  const textColor = tone === "onDark" ? "text-white" : "text-forest-900";

  const inner = (
    <span className={`inline-flex items-center ${s.gap} ${className}`}>
      <GuideMark className={s.mark} title="Guide" />
      <span
        className={`font-semibold leading-none tracking-tight ${s.text} ${textColor}`}
        style={{ fontFamily: "var(--font-manrope), var(--font-body), sans-serif" }}
      >
        Guide
      </span>
    </span>
  );

  if (href == null) return inner;

  return (
    <Link href={href} className="no-underline" aria-label="Guide home">
      {inner}
    </Link>
  );
}
