import type { MetadataRoute } from "next";

const BASE_URL =
  process.env.NEXT_PUBLIC_APP_URL ||
  process.env.BETTER_AUTH_URL ||
  "https://law-bite.vercel.app";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  const publicRoutes = [
    { path: "", changeFrequency: "weekly" as const, priority: 1.0 },
    { path: "/cases", changeFrequency: "weekly" as const, priority: 0.95 },
    { path: "/chat", changeFrequency: "weekly" as const, priority: 0.95 },
    { path: "/matters", changeFrequency: "weekly" as const, priority: 0.9 },
    { path: "/amendments", changeFrequency: "weekly" as const, priority: 0.9 },
    { path: "/trust", changeFrequency: "weekly" as const, priority: 0.9 },
    { path: "/tools", changeFrequency: "monthly" as const, priority: 0.85 },
    { path: "/about", changeFrequency: "monthly" as const, priority: 0.8 },
    { path: "/calculators", changeFrequency: "monthly" as const, priority: 0.75 },
    { path: "/calculators/interest", changeFrequency: "monthly" as const, priority: 0.7 },
    { path: "/calculators/limitations", changeFrequency: "monthly" as const, priority: 0.7 },
    { path: "/guides", changeFrequency: "monthly" as const, priority: 0.7 },
    { path: "/documents", changeFrequency: "monthly" as const, priority: 0.7 },
    { path: "/templates", changeFrequency: "monthly" as const, priority: 0.65 },
    { path: "/news", changeFrequency: "weekly" as const, priority: 0.65 },
    { path: "/contact", changeFrequency: "yearly" as const, priority: 0.4 },
    { path: "/signin", changeFrequency: "yearly" as const, priority: 0.3 },
    { path: "/legal/terms", changeFrequency: "yearly" as const, priority: 0.2 },
    { path: "/legal/privacy", changeFrequency: "yearly" as const, priority: 0.2 },
    { path: "/legal/disclaimer", changeFrequency: "yearly" as const, priority: 0.2 },
    { path: "/legal/cookies", changeFrequency: "yearly" as const, priority: 0.2 },
    { path: "/legal/refund", changeFrequency: "yearly" as const, priority: 0.2 },
    { path: "/legal/risk-closure", changeFrequency: "yearly" as const, priority: 0.2 },
  ];

  return publicRoutes.map((route) => ({
    url: `${BASE_URL}${route.path}`,
    lastModified: now,
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }));
}
