import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : "http://localhost:3000");
  return [
    { url: base, changeFrequency: "monthly", priority: 1 },
    { url: `${base}/dashboard`, changeFrequency: "monthly", priority: 0.8 },
  ];
}
