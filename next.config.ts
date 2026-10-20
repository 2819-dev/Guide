import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
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
   * Legacy /study URLs → first Guide app (Chazarah).
   * Rename the app via FIRST_APP_SLUG in lib/apps.ts and update these destinations.
   */
  async redirects() {
    return [
      {
        source: "/study",
        destination: "/apps/chazarah",
        permanent: false,
      },
      {
        source: "/study/:daf(\\d{1,3}[abAB])",
        destination: "/apps/chazarah/bava-metzia/:daf",
        permanent: false,
      },
      {
        source: "/study/:tractate",
        destination: "/apps/chazarah/:tractate",
        permanent: false,
      },
      {
        source: "/study/:tractate/:daf",
        destination: "/apps/chazarah/:tractate/:daf",
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
