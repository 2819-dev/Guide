import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  /**
   * Legacy /study and old Chazarah slug → Amud.
   * FIRST_APP_SLUG is `amud` — update destinations if renamed.
   */
  async redirects() {
    return [
      {
        source: "/study",
        destination: "/apps/amud",
        permanent: false,
      },
      {
        source: "/study/:daf(\\d{1,3}[abAB])",
        destination: "/apps/amud/bava-metzia/:daf",
        permanent: false,
      },
      {
        source: "/study/:tractate",
        destination: "/apps/amud/:tractate",
        permanent: false,
      },
      {
        source: "/study/:tractate/:daf",
        destination: "/apps/amud/:tractate/:daf",
        permanent: false,
      },
      {
        source: "/apps/chazarah",
        destination: "/apps/amud",
        permanent: false,
      },
      {
        source: "/apps/chazarah/:path*",
        destination: "/apps/amud/:path*",
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
