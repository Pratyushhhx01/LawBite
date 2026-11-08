# LawBite Security Architecture & Policies

This document details the authentication models, multi-tenant authorization controls, database protections, input validation rules, security headers, and secret management enforced across LawBite.

---

## 1. Authentication & Session Management

- **Framework:** [Better Auth](https://www.better-auth.com/) backed by the PostgreSQL Kysely adapter.
- **Session Mechanism:** HttpOnly, Secure session cookies signed with `BETTER_AUTH_SECRET`.
- **OAuth Providers:** Google OAuth 2.0 and GitHub OAuth 2.0.
- **Server-Side Validation:** All authenticated routes (`/chat`, `/matters`, `/api/matters/*`, `/api/cases/*`, `/api/conversations/*`) resolve sessions server-side using `auth.api.getSession({ headers: request.headers })`. Unauthenticated requests immediately receive HTTP 401 Unauthorized.
- **Admin Endpoints:** Protected by both session authentication and an explicit email whitelist check against `ADMIN_EMAILS` in [`app/api/admin/route.ts`](file:///c:/Users/medev/Desktop/LawBite/app/api/admin/route.ts). Non-whitelisted accounts receive HTTP 403 Forbidden.

---

## 2. Multi-Tenant Authorization & Data Privacy

Because legal workspaces contain sensitive client confidences, attorney-client privileged notes, and proprietary contracts, LawBite implements multi-layer tenant isolation:

1. **Row-Level User Binding:** Queries against `case_folder`, `case_document`, `conversation`, `matter_activity`, and `matter_report` include `.where("userId", "=", user.id)`.
2. **Document Access Shielding:** Document streaming endpoint [`app/api/cases/documents/[docId]/route.ts`](file:///c:/Users/medev/Desktop/LawBite/app/api/cases/documents/[docId]/route.ts) validates document ownership against `user.id`. An attacker cannot view another tenant's documents by guessing or iterating document UUIDs.
3. **Report & Attachment Guardrails:** Inserting documents or AI reports into a legal matter requires prior ownership verification of the parent `case_folder`. Cross-tenant injection is rejected with HTTP 404.

---

## 3. SQL Injection Prevention

- **Parameterized Queries:** 100% of application queries are executed via Kysely's compiled query builder (`db.selectFrom`, `db.insertInto`, etc.).
- **Raw SQL Sanitization:** Where raw SQL fragments are required (e.g. JSONB casting), parameters are bound exclusively using Kysely's tagged template literal `sql`...``, which compiles to PostgreSQL parameterized variables (`$1`, `$2`). Raw string concatenation in SQL statements is strictly prohibited across the codebase.

---

## 4. File Upload Security & Document Parsing

File upload endpoints ([`app/api/upload/route.ts`](file:///c:/Users/medev/Desktop/LawBite/app/api/upload/route.ts) and [`app/api/cases/documents/upload/route.ts`](file:///c:/Users/medev/Desktop/LawBite/app/api/cases/documents/upload/route.ts)) enforce defensive constraints:

- **10MB Hard Size Ceiling:** Requests exceeding 10MB (`10 * 1024 * 1024` bytes) are immediately terminated with HTTP 400.
- **MIME & Extension Whitelisting:** Accepted files are restricted to PDF (`application/pdf`, `.pdf`) and Word documents (`application/vnd.openxmlformats-officedocument.wordprocessingml.document`, `.docx`, `.doc`). Executable files (`.exe`, `.sh`, `.bat`, `.js`) and archive files (`.zip`, `.tar`) are rejected.
- **Path Traversal Shield:** Uploaded file names are sanitized using regex sanitization (`file.name.replace(/[^a-zA-Z0-9._-]/g, "_")`) before being incorporated into S3 object keys.
- **Buffer Parsing Sandboxing:** Text extraction via `pdf-parse` and `mammoth` occurs entirely in-memory with character caps (15,000 characters per single-turn prompt) to prevent memory exhaustion attacks.

---

## 5. Security Headers & Browser Hardening

Configured globally in [`next.config.ts`](file:///c:/Users/medev/Desktop/LawBite/next.config.ts) across all routes (`/:path*`):

```typescript
{
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
  "Strict-Transport-Security": "max-age=63072000; includeSubDomains; preload",
  "Cross-Origin-Opener-Policy": "same-origin"
}
```

- **Clickjacking Prevention:** `X-Frame-Options: DENY` stops the application from being embedded in malicious iframes.
- **MIME Sniffing Prevention:** `X-Content-Type-Options: nosniff` forces browsers to adhere strictly to declared MIME types.
- **HSTS Enforcement:** `Strict-Transport-Security` enforces HTTPS with a 2-year duration and preloading.

---

## 6. Secret Management & Production Hygiene

- **`.env.local` Segregation:** Sensitive credentials (`DATABASE_URL`, `BETTER_AUTH_SECRET`, `INCEPTION_API_KEY`, `NVIDIA_API_KEY`, `TAVILY_API_KEY`, `AWS_SECRET_ACCESS_KEY`) are kept strictly in `.env.local` and ignored by `.gitignore`.
- **Public Environment Shielding:** Client-accessible variables are restricted to the `NEXT_PUBLIC_` prefix (e.g. `NEXT_PUBLIC_APP_URL`). API keys and database URLs are never prefixed with `NEXT_PUBLIC_`.
- **Git Commit Scanning:** Automated CI audit checks (`npm run audit`) scan packages and prevent secret leaks.
