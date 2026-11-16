import type { ReactNode } from "react";

/**
 * Blitz "night stage" backdrop for billing + admin pages. Tailwind-only so it
 * doesn't depend on blitz.css class names.
 */
export function BlitzStage({
  children,
  wide = false,
}: {
  children: ReactNode;
  wide?: boolean;
}) {
  return (
    <div className="bzb-stage relative isolate min-h-[calc(100dvh-3.5rem)] overflow-hidden bg-gradient-to-b from-[#15123b] via-[#1b1650] to-[#241a5e] text-white">
      {/*
        The Blitz shell ships unlayered resets (e.g. `:where(.bz) :where(button)
        { font: inherit; color: inherit }`) that outrank Tailwind's layered
        utilities. Hand these properties back to the utilities in this subtree.
      */}
      <style>{`.bzb-stage button,.bzb-stage input,.bzb-stage select,.bzb-stage a{font:revert-layer;color:revert-layer;}`}</style>
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 opacity-60"
        style={{
          backgroundImage:
            "radial-gradient(40rem 22rem at 12% -6%, rgba(34,211,238,0.18), transparent 60%), radial-gradient(36rem 20rem at 92% 4%, rgba(255,90,95,0.16), transparent 60%), radial-gradient(30rem 18rem at 50% 110%, rgba(182,240,58,0.10), transparent 60%)",
        }}
      />
      <div
        className={`mx-auto w-full ${wide ? "max-w-6xl" : "max-w-5xl"} px-4 pb-16 pt-6 sm:px-8 sm:pt-10`}
      >
        {children}
      </div>
    </div>
  );
}

export function StageEyebrow({ children }: { children: ReactNode }) {
  return (
    <p className="m-0 text-xs font-bold uppercase tracking-[0.18em] text-[#22d3ee]">
      {children}
    </p>
  );
}

export function PlanBadge({ planId, label }: { planId: string; label: string }) {
  const tone =
    planId === "ultra"
      ? "bg-[#ffc93c] text-[#15123b]"
      : planId === "plus"
        ? "bg-[#b6f03a] text-[#15123b]"
        : "bg-white/15 text-white";
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-extrabold uppercase tracking-wider ${tone}`}
    >
      {label}
    </span>
  );
}
