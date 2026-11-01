# Testing & Benchmarking Guide

LawBite maintains a comprehensive automated testing suite covering unit logic, integration pathways, API route boundaries, security policies, and legal domain accuracy.

---

## Test Organization & Directory Layout

The test suite is built on **Vitest 4** in Node environment (`environment: "node"`, `vitest.config.mts`):

```text
tests/
├── auth/                               # Better Auth integration & session tests
│   ├── api.test.ts                     # Auth API routes & session lookup
│   ├── client.test.ts                  # React Better Auth client tests
│   ├── config.test.ts                  # Provider configuration assertions
│   ├── db.test.ts                      # Database table schema validation
│   └── e2e.test.ts                     # Full auth lifecycle (social sign-in, sessions)
├── conversations/                      # Conversation persistence & titles
│   ├── db.test.ts                      # Conversation database operations
│   ├── delete-route.test.ts            # Route handler for deletion
│   └── title-route.test.ts             # Auto-generated title handler
├── deployed/                           # Live deployment smoke tests (skipped in local CI)
│   └── api-smoke.test.ts               # Exercises live streaming chat against deployed URL
├── s3/                                 # Bare acts S3 access tests (opt-in)
│   └── acts.test.ts                    # Statutory corpus read checks
├── ai-providers.test.ts                # Provider registry, model catalogue, failover
├── chat-filters.test.ts                # Query classification, entity extraction, refusals
├── chat-modes.test.ts                  # Mode-specific prompt and reasoning behavior
├── chat-providers.test.ts              # Connect/first-token timeouts, 429 retry logic
├── chat-reasoning.test.ts              # Token budgets and reasoning tiers
├── chat-stream.test.ts                 # SSE formatting and chunking
├── chat-transport.test.ts              # HTTP transport handlers
├── citation-verifier.test.ts           # Citation parsing, section matching, precision math
├── draft-document.test.ts              # Contract & legal notice drafting generator
├── draft-scope.test.ts                 # Scope assertions for drafting
├── inception-live.test.ts              # Opt-in live API integration with Inception Labs
├── legal-benchmark.test.ts             # Legal QA evaluator validation
├── legal-sources.test.ts               # Web domain whitelisting & classification
├── legal-tools.test.ts                 # PostgreSQL legal KB exact lookup and search
├── message-parser.test.ts              # Prompt message shaping & history truncation
├── response-citations.test.ts          # Inline stream citation verification
├── review-route.test.ts                # Document review route & PDF text extraction
├── review-unauth.test.ts               # Unauthorized access rejection
├── security-headers.test.ts            # HTTP hardening & browser security headers
└── shares.test.ts                      # Read-only public snapshot creation & import
```

---

## Running Tests

All standard tests can be executed locally without live API keys or S3 connections:

```bash
# Run the complete test suite once
npm test

# Run tests in watch mode during development
npm run test:watch

# Run with V8 code coverage report
npm run test:coverage

# Run a specific test file
npx vitest run tests/citation-verifier.test.ts
```

### Coverage Configuration & Thresholds
Code coverage is configured in `vitest.config.mts` using the V8 provider. Coverage includes `lib/**/*.ts` and `app/api/**/route.ts`.

The repository enforces the following coverage thresholds in CI:
- **Statements:** $\ge 46\%$
- **Branches:** $\ge 40\%$
- **Functions:** $\ge 55\%$
- **Lines:** $\ge 47\%$

Running `npm run test:coverage` outputs a summary to the console and generates detailed HTML reports under `coverage/index.html`.

---

## Legal Accuracy Benchmark (`npm run eval:legal`)

Standard unit tests verify software functionality (e.g., did an endpoint return 200?), but they cannot verify whether a legal answer correctly cited Section 103 of BNS instead of Section 302 of IPC.

To measure legal correctness, LawBite provides a dedicated benchmark evaluation engine:

```bash
# Run legal accuracy evaluation against local or deployed server
npm run eval:legal

# Limit evaluation to 10 questions
npm run eval:legal -- --limit 10

# Run only advocate-reviewed test rows
npm run eval:legal -- --reviewed-only

# Target a deployed environment
npm run eval:legal -- --base https://law-bite.vercel.app
```

### Benchmark Dataset (`benchmarks/legal-qa.jsonl`)
The benchmark contains 50 curated Indian law queries across criminal law, criminal procedure, evidence, constitutional rights, family law, corporate governance, and refusal scenarios.

Each test case defines:
- `id`: Unique identifier (e.g., `bns-103-murder`, `trap-const-302`).
- `question`: The user query.
- `expectedSections`: Statutory sections that must be cited (e.g., `["BNS 103"]`).
- `forbiddenPhrases`: Trap phrases that indicate hallucinations (e.g., `"Section 302 of the Bharatiya Nyaya Sanhita"` for murder).
- `reviewStatus`: Current legal review status (`draft` vs. `reviewed`).

### Evaluated Benchmark Metrics

| Metric | Definition |
| :--- | :--- |
| **Section Recall** | Ratio of required statutory sections that were successfully cited in the answer. |
| **Citation Precision** | Ratio of verifiable statutory citations that actually exist in the bare-act knowledge base. |
| **Hallucination Rate** | `1 - Citation Precision` (the proportion of cited statutory sections that do not exist). |
| **Verification Unavailable** | Queries where the knowledge base could not be contacted; marked as `n/a` to prevent false hallucination counts. |
| **Content Accuracy** | Whether required legal concepts are explained and forbidden trap phrases are absent. |
| **Refusal Accuracy** | Ensures out-of-scope queries (e.g., foreign law, non-legal advice) are cleanly refused. |
| **p95 Latency** | 95th percentile end-to-end response time. |

> [!IMPORTANT]
> **Dataset Status Notice:**
> The current 50 questions in `benchmarks/legal-qa.jsonl` are marked `draft` and represent an engineering regression benchmark. They have not yet been formally certified by a practicing advocate. Scores should not be published as definitive legal accuracy guarantees until review sign-offs are completed.

---

## Live Integration Tests (Opt-In)

Certain integration tests interact with external live APIs and are skipped by default during hermetic CI runs:

1. **Inception Labs Live Test (`tests/inception-live.test.ts`):**
   - Exercises real completions, SSE token streams, and error codes directly with the Inception Labs API.
   - Run via:
     ```bash
     # PowerShell
     $env:LIVE_AI_TESTS = "1"; npx vitest run tests/inception-live.test.ts
     ```
2. **Deployed Smoke Suite (`tests/deployed/api-smoke.test.ts`):**
   - Automatically registers a throwaway session and exercises the real streaming chat API against a live deployment.
   - Run via:
     ```bash
     $env:DEPLOYED_BASE_URL = "https://law-bite.vercel.app"; npx vitest run tests/deployed/api-smoke.test.ts
     ```
3. **S3 Knowledge Base Diagnostic (`scripts/check-s3.mjs`):**
   - Validates that AWS credentials, IAM policies, and bucket configurations can successfully read statutory texts:
     ```bash
     npm run check:s3
     ```
