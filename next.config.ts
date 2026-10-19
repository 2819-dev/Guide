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
  /** Legacy BM-only URLs → nested tractate routes */
  async redirects() {
    return [
      {
        source: "/study/:daf(\\d{1,3}[abAB])",
        destination: "/study/bava-metzia/:daf",
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
