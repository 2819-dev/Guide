type Props = {
  name: string;
  color: string;
  iconUrl?: string | null;
  size?: "sm" | "md";
};

/** Discord-style role chip: icon + colored name. */
export function RoleBadgeChip({
  name,
  color,
  iconUrl,
  size = "md",
}: Props) {
  const iconSize = size === "sm" ? "h-4 w-4" : "h-5 w-5";
  const textSize = size === "sm" ? "text-xs" : "text-sm";

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 font-semibold ${textSize}`}
      style={{
        borderColor: `${color}55`,
        backgroundColor: `${color}18`,
        color,
      }}
      title={name}
    >
      {iconUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={iconUrl}
          alt=""
          className={`${iconSize} rounded-full object-cover`}
        />
      ) : (
        <span
          className={`${iconSize} rounded-full`}
          style={{ backgroundColor: color }}
          aria-hidden
        />
      )}
      <span>{name}</span>
    </span>
  );
}
