import Image from "next/image";
import {
  GUIDE_BANNER_HEIGHT,
  GUIDE_BANNER_SRC,
  GUIDE_BANNER_WIDTH,
  INVITE_BANNER_SRC,
} from "@/lib/brand";

type Variant = "strip" | "panel" | "full" | "login";

type Props = {
  variant?: Variant;
  /** Use invite-local path (same bytes) when the surface is the Ohr Reuven letter. */
  src?: typeof GUIDE_BANNER_SRC | typeof INVITE_BANNER_SRC;
  priority?: boolean;
  className?: string;
  alt?: string;
};

/**
 * Shared Guide banner — one asset across homepage, portals, Amud, auth, invite.
 */
export function GuideBrandBanner({
  variant = "strip",
  src = GUIDE_BANNER_SRC,
  priority = false,
  className = "",
  alt = "Guide",
}: Props) {
  if (variant === "login") {
    return (
      <div className={`guide-banner-login ${className}`.trim()} aria-hidden>
        <Image
          src={src}
          alt=""
          fill
          className="guide-banner-login__img"
          priority={priority}
          sizes="41vw"
        />
      </div>
    );
  }

  if (variant === "panel") {
    return (
      <div className={`guide-banner-panel ${className}`.trim()}>
        <Image
          src={src}
          alt={alt}
          fill
          className="guide-banner__img"
          priority={priority}
          sizes="(max-width: 1024px) 100vw, 42vw"
        />
      </div>
    );
  }

  const wrap = variant === "strip" ? "guide-banner-strip" : "guide-banner-full";

  return (
    <div className={`${wrap} ${className}`.trim()}>
      <Image
        src={src}
        alt={alt}
        width={GUIDE_BANNER_WIDTH}
        height={GUIDE_BANNER_HEIGHT}
        className="guide-banner__img"
        priority={priority}
        sizes="100vw"
      />
    </div>
  );
}
