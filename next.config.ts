import type { NextConfig } from "next";
import {
  CONTENT_SECURITY_POLICY,
  SECURITY_HEADERS,
} from "./lib/security-headers";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  reactStrictMode: true,
  serverExternalPackages: [
    "kysely",
    "pg",
    "@neondatabase/serverless",
    "pdfjs-dist",
    "better-auth",
  ],
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          ...SECURITY_HEADERS.map((header) => ({ ...header })),
          {
            key: "Content-Security-Policy",
            value: CONTENT_SECURITY_POLICY,
          },
        ],
      },
    ];
  },
};

export default nextConfig;
