import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: [
    "kysely",
    "pg",
    "@neondatabase/serverless",
    "pdfjs-dist",
    "better-auth",
  ],
};

export default nextConfig;
