# Security and dependency policy

## Dependency advisories

`npm run audit` fails on high or critical advisories, and the same command runs
in CI before typecheck, lint, and tests. The current lockfile resolves with
**zero known vulnerabilities**.

When an advisory requires a breaking framework or auth upgrade, the upgrade is
treated as a migration rather than a drive-by version bump. In particular:

- **Better Auth is pinned to `1.6.33`.** Better Auth 1.7 adds a required
  `account.issuer` column and a compound identity index. Deploying 1.7 without
  the schema change and a reviewed issuer backfill can lock existing users out.
  The 1.6.33 patch contains the account-takeover fix without that schema change.
  A 1.7 upgrade must land with a Neon migration, a backfill plan, and an auth
  regression run.
- **Next.js is on 16.4.3 or newer within 16.x.** The 16.4.3 release fixes the
  critical advisories that affect 16.2.7.
- **Vitest and the V8 coverage provider stay on the same version.** Mismatched
  peer versions caused coverage resolution failures during upgrades.

## Browser hardening headers

Every route is served with:

- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy: camera=(), microphone=(), geolocation=()`
- `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload`
- `Cross-Origin-Opener-Policy: same-origin`
- `Content-Security-Policy` with `frame-ancestors 'none'`

The header list lives in `lib/security-headers.ts` and is applied by both
`proxy.ts` (page requests) and `next.config.ts` (every route, including the
auth callback the proxy matcher skips). Keeping one list prevents the two
layers from drifting. `tests/security-headers.test.ts` asserts the baseline on
the Next.js config layer.

The CSP still allows `'unsafe-inline'` / `'unsafe-eval'` because the app relies
on inline Next.js bootstrap scripts and third-party document tooling. A nonce
rollout with a report-only phase is the next hardening step.

## Health probe

`GET /api/health` returns `200` when the database, auth config, and at least one
AI provider are usable, and `503` otherwise. Optional integrations (S3, Tavily)
are reported but do not fail the probe because the app degrades gracefully
without them. The response never includes secret values, only presence booleans
and database latency. Point the uptime monitor at this endpoint.

## Authentication

- Auth is handled by Better Auth with Google and GitHub OAuth plus email/password.
- Sessions are validated server-side. Protected pages call
  `auth.api.getSession()` and redirect unauthenticated users.
- The browser never receives provider API keys or the S3 secret.
- Sign-out clears the local disclaimer acceptance and uses the Next.js router to
  leave the authenticated page.

## Request limits

- `/api/chat` requires a session, caps the request body at 100 messages and
  10,000 characters per message, and applies a per-user rate limit of 30
  requests per minute.
- `/api/citations/verify` requires a session, caps input at 20,000 characters
  and 50 citations, and applies a per-user limit of 60 requests per minute.
- Rate limiting is in-memory and per server instance. It is a best-effort abuse
  control, not a distributed quota. A multi-instance deployment should move the
  counter to a shared store before relying on it for billing or hard quotas.

## Data and secrets

- `.env.local` is git-ignored and must never be committed.
- AWS access is read-only from the app's perspective: the S3 module only reads
  bare-act objects.
- S3 failures are logged without printing credentials or signed URLs.
- Uploaded documents are processed in request scope; they are not written to the
  S3 knowledge-base bucket.

## Reporting a problem

Do not open a public issue containing a secret, session cookie, or personal data.
Rotate the exposed credential first, then report the affected route and the
minimum reproduction steps.
