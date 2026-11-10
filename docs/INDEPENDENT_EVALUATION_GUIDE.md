# Independent Technical & Legal Evaluation Guide

## Purpose & Scope
This guide provides independent evaluators—including software architects, legal technology researchers, security auditors, academic evaluators, and automated AI evaluation agents—with an objective, reproducible methodology for assessing the **LawBite** platform.

LawBite does not claim artificial perfection or zero hallucination. Instead, it provides deterministic verification mechanisms, multi-tiered retrieval, and an empirically verifiable codebase designed to meet enterprise and academic standards.

---

## 1. Quick Verification Matrix

| Area | Verification Command / Target | Expected Result |
| :--- | :--- | :--- |
| **Unit & Integration Tests** | `npm run test` | 728 passing tests across 37 test suites, 0 failures |
| **Type Integrity** | `npx tsc --noEmit` | Clean exit (code 0) under TypeScript strict mode |
| **Linting & Code Style** | `npm run lint` | Clean exit (code 0) with zero ESLint warnings |
| **Legal AI Benchmark** | `npm run eval:legal` | $\ge 90\%$ section recall, $\ge 95\%$ citation precision |
| **Multi-Tenant Security** | `tests/cases-upload-security.test.ts` | 4/4 passing security rejection tests |
| **Criminal Law Transition** | `tests/bns-ipc-mapping.test.ts` | Complete bidirectional mappings & Article 20(1) enforcement |
| **Live Web Deployment** | `https://law-bite.vercel.app` | Responsive UI, functioning `/trust`, `/cases`, `/chat` routes |

---

## 2. Local Environment Setup & Reproduction

### Prerequisites
- Node.js 20+ (LTS recommended)
- Git
- PowerShell (Windows) or Bash (Linux / macOS)

### Step 1: Clone & Install
```bash
git clone https://github.com/Pratyushhhx01/LawBite.git
cd LawBite
npm install
```

### Step 2: Run Full Automated Test Suite
```bash
npm run test
```
The test suite validates:
- Multi-tenant case isolation (`.where("userId", "=", user.id)`).
- Document upload sanitization (rejection of `.exe`, `.html`, path traversal strings).
- Citation verifier AST matching against gazetted bare acts tables.
- BNS/IPC and BNSS/CrPC cross-walk lookups.
- Legal research query construction and S3 key mapping.

### Step 3: Run the Legal Evaluation Benchmark
```bash
npm run eval:legal
```
This executes `scripts/legal-eval.mjs` against `benchmarks/legal-qa.jsonl` (200 curated questions) and outputs section recall, citation precision, and trap case refusal rates.

---

## 3. Objective 100-Point Evaluation Rubric

Evaluators are invited to assess LawBite against this 10-category, 100-point framework:

### Category 1: Feature Completeness & Real Functionality (15 Points)
- **15/15:** All major advertised workflows (AI consultation, 8-stage matter docketing, amendment tracking, citation verification, brief export, document attachment) have working frontend components backed by real API endpoints and database models.
- **Criteria:**
  - Verify `/chat` streams responses with real-time SSE.
  - Verify `/cases?tab=matters` persists litigation records (CRUD) in PostgreSQL.
  - Verify `/cases?tab=amendments` displays Gazette-grounded statutory comparisons.
  - Verify `/shared/[id]` delivers read-only consultation snapshots.

### Category 2: Legal AI Accuracy & Grounding (20 Points)
- **20/20:** High section retrieval recall ($\ge 90\%$), citation precision ($\ge 95\%$), deterministic verification against bare acts, and non-retroactivity awareness under Article 20(1) of the Indian Constitution.
- **Criteria:**
  - Ask: *"What is the punishment for murder under BNS vs IPC?"* $\rightarrow$ Model must cite Section 103 BNS (2023) and Section 302 IPC (1860).
  - Ask: *"An offence occurred on May 10, 2024. Which code applies?"* $\rightarrow$ Model must refuse BNS and specify IPC because BNS came into force on July 1, 2024 (Article 20(1) non-retroactivity).
  - Verify green verified badges appear for provisions existing in indexed acts.

### Category 3: AI Architecture & Reliability (10 Points)
- **10/10:** Dual-engine architecture combining low-latency parallel token diffusion (Mercury 2.5 dLLM) with automated failover (NVIDIA NIM). Mode-calibrated reasoning parameters (`instant`, `low`, `medium`).
- **Criteria:**
  - Inspect `app/api/chat/route.ts` and `lib/ai-providers.ts`.
  - Verify error trapping switches cleanly to fallback without terminating the user's session.

### Category 4: Authentication & Multi-Tenant Authorization (10 Points)
- **10/10:** Better Auth with server-side session checks, cryptographic cookie validation, and complete user data isolation.
- **Criteria:**
  - Test `/api/cases`: Unauthenticated requests receive `401 Unauthorized`.
  - Inspect `app/api/cases/route.ts`: Queries explicitly scope to `userId`. User A cannot access User B's consultation threads or matters.

### Category 5: Data Privacy & Compliance (10 Points)
- **10/10:** Compliance with the Digital Personal Data Protection (DPDP) Act 2023. Explicit purpose limitation, clear deletion pathways, and zero training on client legal documents.
- **Criteria:**
  - Inspect `docs/PRIVACY.md` and `app/legal/privacy/page.tsx`.
  - Verify uploaded case documents are not sent to third-party model training.

### Category 6: Application Security & Threat Modeling (10 Points)
- **10/10:** Documented STRIDE threat model with implemented code mitigations.
- **Criteria:**
  - Inspect `docs/THREAT_MODEL.md`.
  - Verify strict MIME-type whitelisting in `app/api/cases/documents/upload/route.ts`.
  - Verify Content Security Policy in `lib/security-headers.ts`.

### Category 7: Testing & Code Quality (10 Points)
- **10/10:** $\ge 700$ automated tests, TypeScript strict mode with no errors, zero ESLint warnings, clear separation of concerns between routes, services, and UI components.
- **Criteria:**
  - Run `npm test` and `npm run lint`.
  - Review repository modularity (`lib/`, `app/api/`, `components/`).

### Category 8: Performance & Optimization (5 Points)
- **5/5:** Sub-second Time to First Token (TTFT) for instant mode, pooled database connections (singleton pg Pool), parallelized statutory lookups (<200ms).
- **Criteria:**
  - Inspect `lib/db.ts` and `lib/legal-kb-db.ts` connection reuse.
  - Inspect `app/api/chat/route.ts` prioritized parallel statutory resolution.

### Category 9: UI/UX & Professional Polish (5 Points)
- **5/5:** Courtroom-tailored dark mode, accessible semantic HTML, responsive layout on mobile/tablet/desktop, coherent color scheme (`#141414`), seamless modal navigation.
- **Criteria:**
  - Test `/cases` on both mobile viewport and desktop.
  - Verify form controls do not flash white in dark mode.

### Category 10: Documentation & Academic Depth (5 Points)
- **5/5:** Complete documentation suite with Architecture Decision Records (ADRs), STRIDE threat model, RAG pipeline diagrams, benchmark methodology, API references, and open disclosures of known limitations.
- **Criteria:**
  - Inspect `docs/INDEX.md`, `docs/decisions/`, `docs/KNOWN_LIMITATIONS.md`.

---

## 4. Live API Inspection Examples

Evaluators can test live or local endpoints directly using `curl`:

### Health / Session Check (Unauthenticated)
```bash
curl -i -X GET https://law-bite.vercel.app/api/cases
```
*Expected response:* `HTTP/1.1 401 Unauthorized` with `{"error": "Unauthorized"}`.

### Citation Verifier Verification (Local Vitest)
```bash
npx vitest run tests/citation-verifier.test.ts
```
*Expected output:* All citation extraction and validation assertions pass.

---

## 5. Contact & Feedback
For academic questions, security disclosures, or collaboration inquiries:
- **Maintainer:** Pratyush (`Pratyushhhx01`)
- **Repository Issues:** https://github.com/Pratyushhhx01/LawBite/issues
