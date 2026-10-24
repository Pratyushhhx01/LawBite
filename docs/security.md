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
