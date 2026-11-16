/* Blitz brand primitives: wordmark, tile symbols, critter avatars, confetti. */

import type { CSSProperties } from "react";
import { avatarFor, type BlitzAvatar as AvatarSpec } from "@/lib/blitz/avatars";

/* ---------------------------------------------------------------- wordmark */

export function BlitzBolt({
  size = 28,
  className,
  color = "var(--bz-lime)",
}: {
  size?: number;
  className?: string;
  color?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      className={className}
      aria-hidden
    >
      <path
        d="M19.6 2.5 6.4 18.1c-.5.6-.1 1.5.7 1.5h6.6l-2.4 9.6c-.2.9.9 1.4 1.5.7L26 14.1c.5-.6.1-1.5-.7-1.5h-6.7l2.6-9.4c.2-.9-.9-1.4-1.6-.7Z"
        fill={color}
        stroke="var(--bz-ink)"
        strokeWidth="2.2"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** Heavy italic wordmark with the bolt replacing the dot of the i. */
export function BlitzWordmark({
  size = "md",
  className = "",
}: {
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}) {
  return (
    <span
      className={`bz-wordmark bz-wordmark--${size} ${className}`}
      aria-label="Blitz"
      role="img"
    >
      <span className="bz-wordmark-text" aria-hidden>
        Bl
        <span className="bz-wordmark-i">
          ı
          <BlitzBolt className="bz-wordmark-bolt" />
        </span>
        tz
      </span>
    </span>
  );
}

/* ---------------------------------------------------------------- symbols */

export const TILE_SYMBOLS = ["bolt", "star", "hex", "moon", "flower", "drop"] as const;
export type TileSymbolName = (typeof TILE_SYMBOLS)[number];

export const TILE_NAMES = ["Bolt", "Star", "Hex", "Moon", "Flower", "Drop"];

export function TileSymbol({
  index,
  size = 34,
  className = "",
}: {
  index: number;
  size?: number;
  className?: string;
}) {
  const name = TILE_SYMBOLS[index % TILE_SYMBOLS.length]!;
  const common = {
    fill: "currentColor",
    stroke: "currentColor",
    strokeWidth: 1.5,
    strokeLinejoin: "round" as const,
  };
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      className={`bz-symbol ${className}`}
      aria-hidden
    >
      {name === "bolt" ? (
        <path d="M18.8 3.2 7.6 17.4c-.4.5 0 1.2.6 1.2h6l-2 9.6c-.2.8.8 1.2 1.3.6l11-14.4c.4-.5 0-1.2-.6-1.2h-6l2.2-9.3c.2-.8-.8-1.2-1.3-.7Z" {...common} />
      ) : name === "star" ? (
        <path d="M16 3.5c.5 0 .9.3 1.1.7l3.1 6.6 7.1 1c1 .1 1.3 1.3.6 2l-5.2 5 1.3 7.1c.2 1-.8 1.7-1.7 1.2L16 23.7l-6.3 3.4c-.9.5-1.9-.3-1.7-1.2l1.3-7.1-5.2-5c-.7-.7-.3-1.9.6-2l7.1-1 3.1-6.6c.2-.4.6-.7 1.1-.7Z" {...common} />
      ) : name === "hex" ? (
        <path d="M14.6 3.4a2.8 2.8 0 0 1 2.8 0l9.2 5.3c.9.5 1.4 1.4 1.4 2.4v10.6c0 1-.5 1.9-1.4 2.4l-9.2 5.3a2.8 2.8 0 0 1-2.8 0l-9.2-5.3A2.8 2.8 0 0 1 4 21.7V11.1c0-1 .5-1.9 1.4-2.4l9.2-5.3Z" {...common} />
      ) : name === "moon" ? (
        <path d="M21.5 4.2c.6-.2 1 .5.7 1a10.5 10.5 0 0 0 7.4 15.7c.6.1.8.9.2 1.2A12.8 12.8 0 1 1 21.5 4.2Z" {...common} transform="translate(-3 1)" />
      ) : name === "flower" ? (
        <path d="M16 4.5a5 5 0 0 1 4.9 6 5 5 0 1 1 0 11 5 5 0 1 1-9.8 0 5 5 0 1 1 0-11 5 5 0 0 1 4.9-6Z" {...common} />
      ) : (
        <path d="M16 3.6c.4 0 .8.2 1 .5 2.4 3.3 8.5 10.2 8.5 15a9.5 9.5 0 0 1-19 0c0-4.8 6.1-11.7 8.5-15 .2-.3.6-.5 1-.5Z" {...common} />
      )}
    </svg>
  );
}

/* ---------------------------------------------------------------- avatars */

function bodyPath(body: AvatarSpec["body"]): string {
  switch (body) {
    case "squircle":
      return "M14 10h36c6 0 10 4 10 10v30c0 6-4 10-10 10H14C8 60 4 56 4 50V20c0-6 4-10 10-10Z";
    case "ghost":
      return "M32 6c14 0 24 10 24 24v28c0 2-2 3-4 2l-5-4-5 4c-1 1-3 1-4 0l-6-4-6 4c-1 1-3 1-4 0l-5-4-5 4c-2 1-4 0-4-2V30C8 16 18 6 32 6Z";
    case "drop":
      return "M32 4c2 0 3 1 4 2 6 8 22 24 22 36a26 26 0 0 1-52 0c0-12 16-28 22-36 1-1 2-2 4-2Z";
    case "ears":
      return "M10 8c2-2 5-1 7 1l7 9c2.6-.7 5.2-1 8-1s5.4.3 8 1l7-9c2-2 5-3 7-1 1 1 1 3 1 4v16c2 4 3 8 3 12 0 13-11 21-26 21S6 53 6 40c0-4 1-8 3-12V12c0-1 0-3 1-4Z";
    case "star":
      return "M32 3c1.5 0 2.6.8 3.2 2l6.1 11.4 12.9 2.4c2.6.5 3.6 3.6 1.8 5.5l-9 9.4 1.7 12.9c.4 2.6-2.4 4.6-4.8 3.4L32 44.4 20.1 50c-2.4 1.2-5.2-.8-4.8-3.4L17 33.7l-9-9.4c-1.8-1.9-.8-5 1.8-5.5l12.9-2.4L28.8 5c.6-1.2 1.7-2 3.2-2Z";
    default:
      return "M32 6c15 0 27 11 27 27S47 60 32 60 5 49 5 33 17 6 32 6Z";
  }
}

function Eyes({ kind, y }: { kind: AvatarSpec["eyes"]; y: number }) {
  const ink = "#15123b";
  if (kind === "sleepy") {
    return (
      <g stroke={ink} strokeWidth="3.2" strokeLinecap="round" fill="none">
        <path d={`M20 ${y} q4 3 8 0`} />
        <path d={`M36 ${y} q4 3 8 0`} />
      </g>
    );
  }
  if (kind === "wink") {
    return (
      <g>
        <circle cx="24" cy={y} r="3.6" fill={ink} />
        <path d={`M36 ${y} h8`} stroke={ink} strokeWidth="3.2" strokeLinecap="round" />
      </g>
    );
  }
  if (kind === "wide") {
    return (
      <g>
        <circle cx="24" cy={y} r="6" fill="#fff" stroke={ink} strokeWidth="2.4" />
        <circle cx="40" cy={y} r="6" fill="#fff" stroke={ink} strokeWidth="2.4" />
        <circle cx="25.5" cy={y + 1} r="2.8" fill={ink} />
        <circle cx="41.5" cy={y + 1} r="2.8" fill={ink} />
      </g>
    );
  }
  return (
    <g fill={ink}>
      <circle cx="24" cy={y} r="3.6" />
      <circle cx="40" cy={y} r="3.6" />
      <circle cx="25.2" cy={y - 1.2} r="1.1" fill="#fff" />
      <circle cx="41.2" cy={y - 1.2} r="1.1" fill="#fff" />
    </g>
  );
}

function Mouth({ kind, y }: { kind: AvatarSpec["mouth"]; y: number }) {
  const ink = "#15123b";
  switch (kind) {
    case "o":
      return <ellipse cx="32" cy={y + 2} rx="3.4" ry="4" fill={ink} />;
    case "grin":
      return (
        <path
          d={`M23 ${y} q9 10 18 0 z`}
          fill={ink}
          stroke={ink}
          strokeWidth="2"
          strokeLinejoin="round"
        />
      );
    case "tongue":
      return (
        <g>
          <path d={`M24 ${y} q8 7 16 0`} stroke={ink} strokeWidth="3" fill="none" strokeLinecap="round" />
          <path d={`M30 ${y + 3} q2 5 5 0`} fill="#ff5a8a" stroke={ink} strokeWidth="1.6" />
        </g>
      );
    default:
      return (
        <path d={`M25 ${y} q7 6 14 0`} stroke={ink} strokeWidth="3" fill="none" strokeLinecap="round" />
      );
  }
}

export function BlitzAvatar({
  id,
  seed = "",
  size = 48,
  className = "",
  style,
}: {
  id: string | null | undefined;
  seed?: string;
  size?: number;
  className?: string;
  style?: CSSProperties;
}) {
  const a = avatarFor(id, seed || id || "x");
  const eyeY = a.body === "ears" ? 36 : a.body === "drop" ? 38 : 30;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      className={`bz-avatar ${className}`}
      style={style}
      role="img"
      aria-label={a.label}
    >
      <path
        d={bodyPath(a.body)}
        fill={a.color}
        stroke="#15123b"
        strokeWidth="3"
        strokeLinejoin="round"
      />
      <path
        d={bodyPath(a.body)}
        fill="none"
        stroke="rgba(255,255,255,.55)"
        strokeWidth="2.5"
        strokeDasharray="10 200"
        strokeDashoffset="-32"
        strokeLinecap="round"
        transform="translate(32 32) scale(.82) translate(-32 -32)"
      />
      <Eyes kind={a.eyes} y={eyeY} />
      <circle cx="17" cy={eyeY + 8} r="3.2" fill="#ff7aa8" opacity=".45" />
      <circle cx="47" cy={eyeY + 8} r="3.2" fill="#ff7aa8" opacity=".45" />
      <Mouth kind={a.mouth} y={eyeY + 10} />
    </svg>
  );
}

/* ---------------------------------------------------------------- deco */

export function Squiggle({
  className = "",
  color = "var(--bz-lime)",
}: {
  className?: string;
  color?: string;
}) {
  return (
    <svg viewBox="0 0 200 16" preserveAspectRatio="none" className={`bz-squiggle ${className}`} aria-hidden>
      <path
        d="M2 10c12-8 22-8 32 0s20 8 32 0 22-8 32 0 20 8 32 0 22-8 32 0 20 8 32 0"
        fill="none"
        stroke={color}
        strokeWidth="5"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function Sparkle({
  className = "",
  style,
}: {
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <svg viewBox="0 0 24 24" className={`bz-sparkle ${className}`} style={style} aria-hidden>
      <path
        d="M12 1.5c.4 0 .7.3.8.7l1.4 6.6 6.6 1.4c.8.2.8 1.4 0 1.6l-6.6 1.4-1.4 6.6c-.2.8-1.4.8-1.6 0l-1.4-6.6-6.6-1.4c-.8-.2-.8-1.4 0-1.6l6.6-1.4 1.4-6.6c.1-.4.4-.7.8-.7Z"
        fill="currentColor"
      />
    </svg>
  );
}

export function Flame({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden className="bz-flame">
      <path
        d="M12.6 1.8c.4 3-1.2 4.6-2.7 6.2C8.2 9.8 6.5 11.6 6.5 15a5.5 5.5 0 0 0 11 .3c.1-2.5-1-4.1-2-5.4-.3 1.3-1 2.2-2 2.6.6-3.6.2-7.7-.9-10.7Z"
        fill="#ffc93c"
        stroke="#15123b"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path d="M12 21c-1.8 0-3-1.2-3-2.9 0-1.6 1.2-2.6 2.2-3.7.4 1 1 1.6 1.8 1.9.4-.6.7-1.3.8-2 .8.9 1.2 1.9 1.2 3 0 2.1-1.3 3.7-3 3.7Z" fill="#ff5a5f" />
    </svg>
  );
}

/** CSS-only confetti burst (respects reduced motion via CSS). */
export function Confetti({ pieces = 70 }: { pieces?: number }) {
  const colors = ["#b6f03a", "#ff5a5f", "#22d3ee", "#ffc93c", "#c4a5ff", "#ffffff"];
  return (
    <div className="bz-confetti" aria-hidden>
      {Array.from({ length: pieces }).map((_, i) => {
        // Deterministic pseudo-random so SSR and client agree.
        const r = (n: number) => {
          const x = Math.sin(i * 12.9898 + n * 78.233) * 43758.5453;
          return x - Math.floor(x);
        };
        return (
          <i
            key={i}
            style={
              {
                left: `${r(1) * 100}%`,
                background: colors[i % colors.length],
                animationDelay: `${r(2) * 2.4}s`,
                animationDuration: `${3.2 + r(3) * 2.6}s`,
                "--bz-drift": `${(r(4) - 0.5) * 220}px`,
                "--bz-spin": `${(r(5) - 0.5) * 1440}deg`,
                width: `${6 + r(6) * 8}px`,
                height: `${10 + r(7) * 10}px`,
                borderRadius: i % 3 === 0 ? "50%" : "3px",
              } as CSSProperties
            }
          />
        );
      })}
    </div>
  );
}

export function SpeakerIcon({ off }: { off: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden>
      <path d="M4 9h4l5-4v14l-5-4H4z" fill="currentColor" />
      {off ? (
        <path d="m16 9 5 6m0-6-5 6" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
      ) : (
        <path d="M16 8.5c1.4 1 2 2.2 2 3.5s-.6 2.5-2 3.5M18.5 6c2 1.6 3 3.6 3 6s-1 4.4-3 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" fill="none" />
      )}
    </svg>
  );
}
