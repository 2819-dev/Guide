/**
 * Artwork in a shaped frame with a soft accent shape behind it — the
 * homepage's illustrations. Shapes vary per section on purpose.
 */
export type FrameShape = "arch" | "leaf" | "blob" | "pill" | "petal";
export type FrameAccent = "sun" | "mint" | "forest";

export function PhotoFrame({
  shape,
  accent = "mint",
  className = "",
  children,
}: {
  shape: FrameShape;
  accent?: FrameAccent;
  className?: string;
  /** The artwork (an SVG scene) that fills the frame. */
  children: React.ReactNode;
}) {
  return (
    <figure className={`photo-frame photo-frame--${shape} ${className}`}>
      <span className={`photo-frame__accent photo-frame__accent--${accent}`} aria-hidden />
      <div className="photo-frame__img">{children}</div>
    </figure>
  );
}
