# LawBite Testing & Quality Assurance Methodology

This document details the automated test architecture, coverage enforcement, continuous integration pipelines, and reproduction commands for the LawBite platform.

---

## 1. Test Architecture Overview

LawBite employs **Vitest 4** configured in a Node.js runtime environment (`environment: "node"` in `vitest.config.ts`), paired with V8 coverage analysis.

- **Total Test Suites:** 38 test files
- **Total Executed Tests:** 712 passed unit, integration, and E2E tests
- **CI Status:** GitHub Actions workflow running on every commit to `main` and all pull requests.

```
tests/
  ├── auth/                        # Better Auth authentication and API tests
  │   ├── api.test.ts
  │   ├── client.test.ts
  │   ├── config.test.ts
  │   ├── db.test.ts
  │   └── e2e.test.ts
  ├── conversations/               # Chat persistence and title generation
  │   ├── db.test.ts
  │   ├── delete-route.test.ts
  │   └── title-route.test.ts
  ├── deployed/                    # Live production smoke verification
  │   └── api-smoke.test.ts
  ├── s3/                          # Bare acts and S3 corpus assertions
  │   └── acts.test.ts
  ├── admin-auth.test.ts           # Admin RBAC and authorization guards
  ├── advanced-features.test.ts    # Matters, contract risk, diffing, courtroom prep
  ├── ai-providers.test.ts         # Multi-provider payload builder and failover
  ├── case-law.test.ts             # Landmark judgments and good-law precedent status
  ├── cases-tracker-nav.test.ts    # Case tracker UI and breadcrumbs
  ├── chat-modes.test.ts           # Mode-specific prompts and formatting
  ├── chat-stream.test.ts          # SSE streaming transport validation
  ├── citation-verifier.test.ts    # Statutory parsing and verification engine
  ├── draft-document.test.ts       # Legal document generation and notice drafting
  ├── e2e-audit.test.ts            # Complete 11-step end-to-end user workflow audit
  ├── inception-live.test.ts       # Live integration tests with Inception Mercury 2.5
  ├── legal-benchmark.test.ts      # Schema and sanity check for 50-question QA benchmark
  ├── legal-tools.test.ts          # Legal search and IPC-BNS transition tools
  ├── response-citations.test.ts   # Citation extraction from assistant replies
  └── security-headers.test.ts     # HTTP security headers verification
```

---

## 2. Running Automated Tests

### 2.1 Complete Local Test Run
Runs all unit and integration tests against local knowledge bases and configured database:
```bash
npm run test
```

### 2.2 Watch Mode (Active Development)
```bash
npm run test:watch
```

### 2.3 CI Mode (Hermetic Offline Run)
In CI runners where no local PostgreSQL daemon is running, `CI_SKIP_DB_TESTS=1` automatically skips database-dependent test blocks while executing all pure logic, AST, parsing, and algorithmic tests:
```bash
$env:CI_SKIP_DB_TESTS="1"; npm run test
```

### 2.4 Live AI Provider Integration Test
Tests live token streaming, reasoning effort tiers, and error handling against Inception Labs Mercury 2.5:
```bash
$env:LIVE_AI_TESTS="1"; npx vitest run tests/inception-live.test.ts
```

### 2.5 Live Production Deployment Smoke Test
Runs end-to-end user creation, session authentication, and streaming SSE chat against the deployed production website (`https://law-bite.vercel.app`):
```bash
$env:DEPLOYED_BASE_URL="https://law-bite.vercel.app"; npx vitest run tests/deployed/api-smoke.test.ts
```

---

## 3. Coverage & Quality Gates

The GitHub Actions CI pipeline enforces strict quality gates on every push to `main`:
1. **Typecheck:** `npx tsc --noEmit` must pass with 0 errors.
2. **Lint:** `npm run lint` must pass with 0 warnings and 0 errors.
3. **Automated Tests:** All hermetic suites must execute with 0 failures.
4. **Build Check:** `npm run build` must compile all 56 static and dynamic routes.
