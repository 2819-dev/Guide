/**
 * Photo in a shaped frame with a soft accent shape behind it — the
 * homepage's people photography. Shapes vary per section on purpose.
 */
export type FrameShape = "arch" | "leaf" | "blob" | "pill" | "petal";
export type FrameAccent = "sun" | "mint" | "forest";

export function PhotoFrame({
  src,
  alt,
  shape,
  accent = "mint",
  position = "50% 50%",
  priority = false,
  className = "",
}: {
  src: string;
  alt: string;
  shape: FrameShape;
  accent?: FrameAccent;
  /** CSS object-position, to keep faces in frame. */
  position?: string;
  priority?: boolean;
  className?: string;
}) {
  return (
    <figure className={`photo-frame photo-frame--${shape} ${className}`}>
      <span className={`photo-frame__accent photo-frame__accent--${accent}`} aria-hidden />
      {/* Static pre-optimized WebP; next/image optimization isn't available on Pages. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={alt}
        width={1200}
        height={800}
        loading={priority ? "eager" : "lazy"}
        decoding="async"
        {...(priority ? { fetchPriority: "high" as const } : {})}
        className="photo-frame__img"
        style={{ objectPosition: position }}
      />
    </figure>
  );
}
