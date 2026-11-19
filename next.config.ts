import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      // TestQuiz was renamed Blitz.
      { source: "/apps/testquiz", destination: "/apps/blitz", permanent: true },
      {
        source: "/apps/testquiz/:path*",
        destination: "/apps/blitz/:path*",
        permanent: true,
      },
      { source: "/developers", destination: "/developers/apply", permanent: true },
      // The family portal was removed.
      { source: "/family", destination: "/", permanent: true },
      { source: "/family/:path*", destination: "/", permanent: true },
      // Amud was removed from Guide; its old links go to the app library.
      ...[
        "/study",
        "/study/:path*",
        "/apps/chazarah",
        "/apps/chazarah/:path*",
        "/apps/amud",
        "/apps/amud/:path*",
        "/amudsite",
        "/amudsite/:path*",
        "/learn",
        "/learn/:path*",
        "/invite/ohr-reuven",
      ].map((source) => ({ source, destination: "/apps", permanent: true })),
    ];
  },
};

export default nextConfig;
