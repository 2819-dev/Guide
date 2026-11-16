import type { ReactNode } from "react";
import type { BlitzThemeId } from "@/lib/blitz/types";

/**
 * Full-screen game stage (covers the site chrome). Theme backgrounds are
 * drawn in CSS from the decor layers below; tiles never change color.
 */
export function BlitzStage({
  theme = "night",
  children,
  className = "",
  tone,
}: {
  theme?: BlitzThemeId;
  children: ReactNode;
  className?: string;
  /** Feedback wash for the player screen. */
  tone?: "correct" | "wrong" | "neutral" | "late" | null;
}) {
  return (
    <div
      className={`bz bz-stage ${tone ? `bz-stage--${tone}` : ""} ${className}`}
      data-bz-theme={theme}
    >
      <div className="bz-stage-bg" aria-hidden>
        <i className="bz-deco bz-deco-a" />
        <i className="bz-deco bz-deco-b" />
        <i className="bz-deco bz-deco-c" />
        <i className="bz-deco bz-deco-d" />
      </div>
      <div className="bz-stage-inner">{children}</div>
    </div>
  );
}
