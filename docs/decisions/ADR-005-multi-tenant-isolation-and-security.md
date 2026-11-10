# ADR-005: Multi-Tenant Data Isolation and Defense-in-Depth Security Architecture

## Status
Accepted

## Context
Legal technology platforms store highly sensitive client data, litigation strategy notes, commercial contracts under redline negotiation, and draft pleadings. Unintended data leakage between users (Broken Object Level Authorization / IDOR) or cross-tenant contamination would violate legal confidentiality duties.

Additionally, user file uploads (PDF, DOCX) present potential attack vectors (stored XSS, path traversal, malicious binary execution, resource exhaustion).

## Decision
We enforce layered defense-in-depth security principles across all tiers:

1. **Strict Query-Level Tenant Isolation:**
   - Every read, update, and delete query in Kysely explicitly chains `.where("userId", "=", user.id)`.
   - Foreign key traversals (e.g. querying a `case_document` or `matter_report`) verify that both the parent folder and child document belong to the authenticated session's `userId`.
2. **Strict File Upload Validation & Sandboxing:**
   - Whitelist of allowed MIME types: `application/pdf`, `application/vnd.openxmlformats-officedocument.wordprocessingml.document`, `application/msword`, `text/plain`.
   - File extensions validated strictly (`.pdf`, `.docx`, `.doc`, `.txt`).
   - Maximum upload ceiling enforced at 10MB.
   - S3 object keys are isolated by user and case: `cases/${user.id}/${caseId}/${timestamp}-${sanitizedFilename}`.
   - User-supplied filenames are regex-sanitized (`[^a-zA-Z0-9._-]` $\rightarrow$ `_`) to eliminate path traversal vulnerabilities.
3. **Hardened Browser Security Headers & CSP:**
   - `Content-Security-Policy`: Blocks insecure HTTP images, restricts script execution, restricts frame ancestors (`frame-ancestors 'none'`), and limits connection origins.
   - `X-Frame-Options: DENY`: Protects against clickjacking.
   - `X-Content-Type-Options: nosniff`: Prevents MIME-type sniffing.
   - `Strict-Transport-Security`: Enforces HTTPS for 2 years with preloading.
   - `Cross-Origin-Opener-Policy: same-origin`: Protects against cross-origin window leaks.
4. **Decoupled Server-Side Secrets:**
   - All AI provider tokens (`INCEPTION_API_KEY`, `NVIDIA_API_KEY`), database credentials (`DATABASE_URL`), and search keys (`TAVILY_API_KEY`) reside exclusively in backend environment variables and are never bundled in frontend artifacts.

## Consequences
- IDOR vulnerabilities are structurally prevented at the database query level.
- Uploaded malicious scripts cannot be executed or served directly from the application domain.
- Public consultation shares (`/shared/<id>`) are cryptographically isolated snapshots that do not expose private conversation IDs or user profile records.
