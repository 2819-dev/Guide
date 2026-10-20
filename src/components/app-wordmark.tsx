import Link from "next/link";
import { FIRST_APP_NAME, appHomePath } from "@/lib/apps";

type Props = {
  name?: string;
  href?: string | null;
  className?: string;
  size?: "sm" | "md" | "lg";
};

const sizeMap = {
  sm: "text-[1.0625rem]",
  md: "text-[1.25rem]",
  lg: "text-[1.5rem]",
} as const;

/** Wordmark for a Guide app (not the Guide platform mark). */
export function AppWordmark({
  name = FIRST_APP_NAME,
  href = appHomePath(),
  className = "",
  size = "md",
}: Props) {
  const inner = (
    <span
      className={`inline-block font-semibold leading-none tracking-[-0.03em] text-forest-900 ${sizeMap[size]} ${className}`}
      style={{
        fontFamily:
          "var(--font-manrope), var(--font-body), system-ui, sans-serif",
      }}
    >
      {name}
    </span>
  );

  if (href == null) return inner;

  return (
    <Link href={href} className="no-underline" aria-label={`${name} home`}>
      {inner}
    </Link>
  );
}
