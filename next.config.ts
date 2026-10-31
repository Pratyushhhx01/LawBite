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
    "pdf-parse",
    "@napi-rs/canvas",
    "better-auth",
  ],
  // The PDF parsers load a worker script and font/CMap assets at runtime, which
  // the bundler's static tracer cannot see. Without these globs the serverless
  // function ships without `pdf.worker.mjs` and every upload fails in
  // production ("Setting up fake worker failed"), even though it works locally.
  outputFileTracingIncludes: {
    "/api/review": ["./node_modules/pdf-parse/**/*"],
  },
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
