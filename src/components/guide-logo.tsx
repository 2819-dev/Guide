import Link from "next/link";

type MarkProps = {
  className?: string;
  title?: string;
};

/** Quiet mark — open page, single forest accent */
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
      <rect width="40" height="40" rx="8" fill="#1c3d2e" />
      <path
        d="M12 11.5h7.1c.4 0 .75.15 1.02.42l1.2 1.15c.27.26.63.4 1.01.4H28c.83 0 1.5.67 1.5 1.5V28c0 .83-.67 1.5-1.5 1.5H12c-.83 0-1.5-.67-1.5-1.5V13c0-.83.67-1.5 1.5-1.5Z"
        fill="#e8f0eb"
      />
      <path
        d="M20 12v16.5"
        stroke="#1c3d2e"
        strokeWidth="1.4"
        strokeLinecap="round"
        opacity="0.28"
      />
      <path
        d="M14.5 20.5h11"
        stroke="#245239"
        strokeWidth="2"
        strokeLinecap="round"
      />
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
  sm: { mark: "h-7 w-7", text: "text-lg" },
  md: { mark: "h-8 w-8", text: "text-[1.35rem]" },
  lg: { mark: "h-10 w-10", text: "text-2xl" },
} as const;

/** Brand lockup: mark + “Guide” only */
export function GuideWordmark({
  href = "/",
  className = "",
  tone = "default",
  size = "md",
}: WordmarkProps) {
  const s = sizeMap[size];
  const textColor = tone === "onDark" ? "text-white" : "text-forest-900";

  const inner = (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <GuideMark className={s.mark} title="Guide" />
      <span
        className={`display leading-none font-medium ${s.text} ${textColor}`}
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
