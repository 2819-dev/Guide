import type { MetadataRoute } from "next";
import { guidePublicUrl } from "@/lib/site";

/** Public pages for search engines. Portals and admin are excluded. */
export default function sitemap(): MetadataRoute.Sitemap {
  const base = guidePublicUrl();
  const pages: { path: string; priority: number; changeFrequency: "weekly" | "monthly" | "yearly" }[] = [
    { path: "/", priority: 1, changeFrequency: "weekly" },
    { path: "/education", priority: 0.9, changeFrequency: "monthly" },
    { path: "/apps", priority: 0.8, changeFrequency: "weekly" },
    { path: "/developers/apply", priority: 0.7, changeFrequency: "monthly" },
    { path: "/schools/demo", priority: 0.6, changeFrequency: "monthly" },
    { path: "/schools/meeting", priority: 0.6, changeFrequency: "monthly" },
    { path: "/auth/sign-in", priority: 0.5, changeFrequency: "yearly" },
    { path: "/privacy", priority: 0.3, changeFrequency: "yearly" },
    { path: "/terms", priority: 0.3, changeFrequency: "yearly" },
    { path: "/accessibility", priority: 0.3, changeFrequency: "yearly" },
  ];
  return pages.map((p) => ({
    url: `${base}${p.path === "/" ? "" : p.path}`,
    changeFrequency: p.changeFrequency,
    priority: p.priority,
  }));
}
