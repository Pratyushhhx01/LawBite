# Changelog

All notable changes to the **LawBite** platform are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [2.1.0] - 2026-11-08

### Added
- **Complete Technical Documentation Suite:** Published 10 comprehensive architectural specifications in `/docs`:
  - `ARCHITECTURE.md`: High-level system architecture, diagrams, component flows, and tech justifications.
  - `AI_SYSTEM.md`: Mercury 2.5 diffusion model token generation, reasoning tiers, and NVIDIA failover.
  - `LEGAL_RESEARCH.md`: 157+ Bare Acts, citation verifier grammar, case law database, and IPC-to-BNS diffs.
  - `DATABASE.md`: Neon PostgreSQL schema, 15 tables, ER diagrams, Kysely queries, and indexing.
  - `SECURITY.md`: Better Auth sessions, tenant isolation, CSRF/XSS mitigations, and security headers.
  - `TESTING.md`: Vitest test framework, 712 automated tests, coverage suites, and deployed smoke tests.
  - `DEPLOYMENT.md`: Production setup on Vercel and Neon, database migrations, and environment runbooks.
  - `PRIVACY.md`: Zero third-party model training, transient file handling, and legal disclaimer terms.
  - `BENCHMARK_REPORT.md`: Empirical evaluation on 50 legal QA questions, accuracy metrics, and reproduction guide.
  - `COMPETITIVE_ANALYSIS.md`: Rigorous comparative analysis against 6 existing Indian legal tech platforms.
- **Repository Professionalization:**
  - Standardized `README.md` with live badges, Mermaid diagrams, and feature directory.
  - Added `CONTRIBUTING.md`, `CODE_OF_CONDUCT.md`, `CITATION.cff`, and `LICENSE` (MIT).
  - Added GitHub issue templates for bug reports and feature requests, and a pull request template.
- **SEO & Discoverability Infrastructure:**
  - Upgraded `app/layout.tsx` with canonical URL, Schema.org JSON-LD structured data (`SoftwareApplication`, `Organization`, `WebSite`).
  - Updated `app/sitemap.ts` and `app/robots.ts` with all public routes and production base URLs.
  - Added `public/llms.txt` and `public/llms-full.txt` for AI agent and crawler discoverability.
  - Upgraded `app/(info)/tools/page.tsx` and `app/components/Footer.tsx` with direct discovery links to Legal Matter Management and Statutory Amendments.

---

## [2.0.0] - 2026-11-08

### Added
- **Legal Matter Management (`/matters`):**
  - Dedicated multi-tenant workspaces for litigation and advisory matters.
  - Full lifecycle tracking: stages (Pre-litigation, Pleadings, Evidence, Arguments, Judgment/Decree, Appeal, Closed), key dates, filing deadlines, opposing counsel, and judicial officers.
  - Client dossiers, notes, documents, and cross-feature reports storage with strict tenant isolation.
- **Contract Risk Analyzer (`/api/contract-risk`):**
  - Clause-by-clause automated risk audit checking Indian Contract Act §§23/27/28, unilateral indemnities, termination covenants, and state stamp duty schedules.
- **Document Comparison Engine (`/api/document-compare`):**
  - Side-by-side contract revision redlining with risk escalation metrics and statutory exposure analysis.
- **Courtroom Preparation Mode (`/api/courtroom-prep`):**
  - Examination-in-chief planning, witness cross-examination outlines, impeachment traps with contradictory exhibits, and judicial tendency summaries.
- **Indian Statutory Amendment Tracker (`/amendments`):**
  - Central statute enforcement timelines, gazette notifications, and historical legislative amendments.
- **Connected Legal Workflows:**
  - Ability to attach Contract Risk audits, Document Comparison redlines, and Courtroom Prep strategies directly to matter dossiers with a single click.

### Security
- Hardened multi-tenant isolation across all matter service queries (`lib/matter-service.ts`) ensuring cross-tenant unauthorized reads return HTTP 404/403.
- Enforced 10MB file size limits on document parsers.

---

## [1.5.0] - 2026-11-08

### Added
- **Indian Case-Law Research Engine:**
  - Supreme Court and High Court judgment search with preserved canonical citations, court benches, dates, and verbatim paragraph numbers.
- **Good-Law Precedent Checker:**
  - Deterministic subsequent treatment verification (*Followed*, *Distinguished*, *Overruled*, *Reversed*, *Affirmed*, *Referred to*).
  - Explicit prohibition of LLM guessing; unverified citations report as `Unknown / Unverified`.
- **IPC to BNS Transition Mapping:**
  - Granular bidirectional cross-referencing between IPC 1860 and BNS 2023 with exact textual diffs, newly criminalized acts (e.g. organized crime, snatching), and transitional scope guidance.

---

## [1.0.0] - 2026-11-07

### Added
- **Initial Production Release of LawBite:**
  - 157+ Indian Bare Acts indexed in structured JSON and PostgreSQL vector chunks.
  - Deterministic Citation Verification Engine validating section existence in real time.
  - Inception Labs Mercury 2.5 dLLM primary inference with automatic failover to NVIDIA NIM.
  - Better Auth authentication with Google and GitHub OAuth providers.
  - SSE streaming legal chat with Default, Deep Analysis, Talk to AI, and AI Lawyer modes.
  - Document Drafter and clause review engine for legal notices, complaints, and contracts.
