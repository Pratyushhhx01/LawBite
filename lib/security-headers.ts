/**
 * Single source of truth for browser hardening headers.
 *
 * `proxy.ts` applies these to page requests and `next.config.ts` applies them
 * to every route (including API routes and the auth callback that the proxy
 * matcher skips). Keeping one list prevents the two layers from drifting —
 * previously the proxy set a CSP while the config layer set COOP, so neither
 * layer was complete on its own.
 */

export const SECURITY_HEADERS = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=()",
  },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
] as const;

export const CONTENT_SECURITY_POLICY = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "img-src 'self' data: blob: https: http:",
  "font-src 'self' data: https://fonts.gstatic.com",
  "connect-src 'self' https://integrate.api.nvidia.com https://api.tavily.com https://*.amazonaws.com https://accounts.google.com https://github.com",
  "frame-ancestors 'none'",
].join("; ");
