# LawBite Technical Documentation Ecosystem

Welcome to the LawBite engineering and legal-tech documentation hub. This index categorizes all architectural specifications, AI pipeline designs, security audits, database schemas, and developer runbooks.

---

## 🏛️ Architecture & System Design
- [**System Architecture (`ARCHITECTURE.md`)**](ARCHITECTURE.md) — Comprehensive technical architecture, component diagrams, layer definitions, and data flows.
- [**Database Architecture (`DATABASE.md`)**](DATABASE.md) — Kysely relational schema, multi-tenant entity relationships, and indexes.
- [**Architecture Decision Records (`decisions/`)**](decisions/)
  - [ADR-001: Diffusion LLM as Primary Inference Engine](decisions/ADR-001-diffusion-llm-primary-inference.md)
  - [ADR-002: Deterministic Citation Verification Decoupled from LLM Generation](decisions/ADR-002-deterministic-citation-verification.md)
  - [ADR-003: Serverless Neon PostgreSQL with Kysely Type-Safe Query Builder](decisions/ADR-003-serverless-neon-kysely-database.md)
  - [ADR-004: Statutory Transition Engine for New Indian Criminal Laws](decisions/ADR-004-statutory-transition-ipc-bns-engine.md)
  - [ADR-005: Multi-Tenant Data Isolation and Defense-in-Depth Security](decisions/ADR-005-multi-tenant-isolation-and-security.md)

---

## 🤖 AI & Legal Technology
- [**AI System Architecture (`AI_SYSTEM.md`)**](AI_SYSTEM.md) — Inception Mercury 2.5 dLLM, NVIDIA NIM failover, and reasoning tier specifications.
- [**RAG Pipeline (`RAG_PIPELINE.md`)**](RAG_PIPELINE.md) — Multi-tier retrieval hierarchy, section lookup, and hybrid tsvector search.
- [**Citation Verification Engine (`citation-verification.md`)**](citation-verification.md) — Deterministic section parser, gazette mapping, and verification reasons.
- [**Case Law & Legal Research Engine (`LEGAL_RESEARCH.md`)**](LEGAL_RESEARCH.md) — Paragraph retrieval, bench filtering, and Good-Law precedent status checking.
- [**Knowledge Base Architecture (`knowledge-base.md`)**](knowledge-base.md) — S3 Bare Acts structure, section indexing, and references.
- [**Legal QA Benchmark & Evaluation Report (`BENCHMARK_REPORT.md`)**](BENCHMARK_REPORT.md) — 50-question empirical evaluation, methodology, and reproducibility guide.

---

## 🔒 Security, Privacy & Compliance
- [**Application Security Specification (`SECURITY.md`)**](SECURITY.md) — Authentication, authorization, CSP, and secret management.
- [**Comprehensive Threat Model (`THREAT_MODEL.md`)**](THREAT_MODEL.md) — STRIDE analysis, trust boundaries, asset sensitivity, and attack mitigations.
- [**Data Privacy Policy & Practices (`PRIVACY.md`)**](PRIVACY.md) — Data sovereignty, zero LLM training retention, and user data rights.

---

## 🧪 Testing & Quality Assurance
- [**Testing Strategy & Suite Documentation (`TESTING.md`)**](TESTING.md) — Vitest test suites, test categories, CI integration, and coverage.
- [**Competitive Analysis (`COMPETITIVE_ANALYSIS.md`)**](COMPETITIVE_ANALYSIS.md) — Comparison against general-purpose LLMs and traditional legal databases.
- [**Documentation Audit Report (`DOCUMENTATION_AUDIT.md`)**](DOCUMENTATION_AUDIT.md) — Documentation verification results, link checks, and claim audits.

---

## 🚀 Deployment & Operations
- [**Production Deployment Guide (`DEPLOYMENT.md`)**](DEPLOYMENT.md) — Vercel deployment, serverless external packages, and tracing.
- [**S3 Knowledge Base Runbook (`runbook-s3.md`)**](runbook-s3.md) — Statutory ingestion, synchronization, and integrity checks.
- [**API Reference (`api-reference.md`)**](api-reference.md) — Complete endpoint reference for chat, cases, matters, contracts, and export.
