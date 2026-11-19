import type { MetadataRoute } from "next";
import { guidePublicUrl } from "@/lib/site";

/** Public pages are indexable; signed-in portals, admin, and APIs are not. */
export default function robots(): MetadataRoute.Robots {
  const base = guidePublicUrl();
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/api/",
          "/admin",
          "/official",
          "/account",
          "/student",
          "/teacher",
          "/education/panel",
          "/developer$",
          "/developer/",
          "/invite/",
          "/apps/blitz/",
          "/auth/change-password",
          "/auth/reset-password",
          "/auth/forgot-password",
        ],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
    host: base,
  };
}
