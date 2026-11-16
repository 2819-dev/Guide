import Link from "next/link";

/** Small key glyph for educator Admin entry — not emoji. */
export function AdminKeyIcon({
  className = "h-[1.05em] w-[1.05em]",
}: {
  className?: string;
}) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
    >
      <circle
        cx="8.5"
        cy="8.5"
        r="3.75"
        stroke="currentColor"
        strokeWidth="1.7"
      />
      <path
        d="M11.5 11.5 20 20"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
      <path
        d="M16.25 16.25h2.5M18.5 18.5v-2.25"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </svg>
  );
}

const buttonClass =
  "inline-flex h-[50px] items-center gap-2 rounded-[10px] bg-forest-700 px-6 text-base font-semibold text-white no-underline transition hover:bg-forest-600";

/** Corner / primary Admin control → teacher + school-admin login. */
export function AdminEntryButton({
  className = "",
}: {
  className?: string;
}) {
  return (
    <Link
      href="/auth/sign-in?as=educator"
      className={`${buttonClass} ${className}`.trim()}
    >
      <AdminKeyIcon />
      Admin
    </Link>
  );
}
