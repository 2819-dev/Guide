import Link from "next/link";

type MarkProps = {
  className?: string;
  title?: string;
};

/** Forest mark — open page + guiding path */
export function GuideMark({ className = "h-9 w-9", title }: MarkProps) {
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
      <rect width="40" height="40" rx="11" fill="#276348" />
      <path
        d="M11 12.5c0-.8.65-1.45 1.45-1.45H19.2c.35 0 .68.12.95.35l1.35 1.15c.27.23.6.35.95.35h4.1c.8 0 1.45.65 1.45 1.45v15.05c0 .8-.65 1.45-1.45 1.45H12.45c-.8 0-1.45-.65-1.45-1.45V12.5Z"
        fill="#eaf5ef"
      />
      <path
        d="M20 12.2v16.6"
        stroke="#276348"
        strokeWidth="1.6"
        strokeLinecap="round"
        opacity="0.35"
      />
      <path
        d="M14.2 18.2c2.2 1.6 4.2 2.4 5.8 2.4 1.6 0 3.6-.8 5.8-2.4"
        stroke="#7cb05f"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
      <path
        d="M14.2 23.1c2.2 1.5 4.2 2.25 5.8 2.25 1.6 0 3.6-.75 5.8-2.25"
        stroke="#f0c96a"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
    </svg>
  );
}

type WordmarkProps = {
  href?: string | null;
  className?: string;
  /** Light wordmark for dark footers */
  tone?: "default" | "onDark";
  size?: "sm" | "md" | "lg";
};

const sizeMap = {
  sm: { mark: "h-7 w-7", text: "text-xl" },
  md: { mark: "h-9 w-9", text: "text-[1.65rem]" },
  lg: { mark: "h-11 w-11", text: "text-3xl" },
} as const;

/** Brand lockup: mark + “Guide” only — never category text */
export function GuideWordmark({
  href = "/",
  className = "",
  tone = "default",
  size = "md",
}: WordmarkProps) {
  const s = sizeMap[size];
  const textColor =
    tone === "onDark" ? "text-white" : "text-forest-900";

  const inner = (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <GuideMark className={s.mark} title="Guide" />
      <span className={`display leading-none ${s.text} ${textColor}`}>
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
