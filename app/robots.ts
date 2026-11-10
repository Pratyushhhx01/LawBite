import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const BASE_URL =
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.BETTER_AUTH_URL ||
    "https://law-bite.vercel.app";

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/auth/", "/admin"],
      },
      {
        userAgent: [
          "GPTBot",
          "ClaudeBot",
          "Google-Extended",
          "PerplexityBot",
          "Applebot-Extended",
          "CCBot",
          "anthropic-ai",
          "OAI-SearchBot",
        ],
        allow: [
          "/",
          "/chat",
          "/cases",
          "/matters",
          "/amendments",
          "/trust",
          "/tools",
          "/about",
          "/calculators",
          "/documents",
          "/guides",
          "/templates",
          "/news",
          "/legal/",
          "/llms.txt",
          "/llms-full.txt",
          "/sitemap.xml",
        ],
        disallow: ["/api/auth/", "/admin"],
      },
    ],
    sitemap: `${BASE_URL}/sitemap.xml`,
  };
}
