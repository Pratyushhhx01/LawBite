# Technical Stack Rationale & Architecture Decision Guide

## 1. Stack Overview

| Layer | Technology | Primary Purpose | Architectural Justification |
| :--- | :--- | :--- | :--- |
| **Frontend Framework** | **Next.js 16 (App Router)** | Full-stack SSR, React Server Components, Streaming | Server components eliminate client bundle weight; route handlers provide streaming SSE without separate server infrastructure. |
| **Client Library** | **React 19** | Concurrent UI rendering, Transitions, Hooks | Native concurrent features and React Server Actions streamline UI state synchronization. |
| **Language** | **TypeScript 5 (Strict Mode)** | End-to-end type safety | Prevents runtime type coercion errors across legal data structures, API payloads, and database records. |
| **Styling & Design** | **Tailwind CSS 4** | Utility-first CSS, Custom Dark Mode | Low runtime overhead, high performance, customizable design tokens (`#141414` palette designed for advocate courtroom low-light use). |
| **Database** | **PostgreSQL on Neon Serverless** | Relational data persistence & full-text search | Serverless autoscaling with fast connection pooling, native `tsvector` full-text search, and branchable dev environments. |
| **Query Builder** | **Kysely** | Type-safe SQL generation | Compile-time query type verification without the runtime memory overhead or opaque abstractions of traditional heavy ORMs. |
| **Authentication** | **Better Auth** | Session-based OAuth & multi-tenant auth | Built-in Kysely adapter, cryptographically signed HTTP-only cookies, automated session refresh, and zero third-party vendor lock-in. |
| **Primary AI Inference** | **Inception Labs Mercury 2.5** | Non-autoregressive diffusion LLM (dLLM) | Ultra-fast token synthesis (~1.2s TTFT), parallel sequence refinement, and explicit reasoning tiers (`instant`, `low`, `medium`). |
| **Fallback AI Inference** | **NVIDIA NIM** | Llama 3.3 70B Instruct / Mistral Large | Enterprise-grade high-throughput fallback ensuring zero downtime if primary API encounters rate limits or maintenance. |
| **Search Engine** | **Tavily API** | Real-time legal search augmentation | Domain-targeted search prioritizing Gazette notifications, High Court orders, and legal news without scraping overhead. |
| **Cloud Storage** | **AWS S3** | Structured Bare Acts JSON & full text | High-durability object storage for 157+ Indian bare acts with sub-50ms parallel access. |
| **Testing Harness** | **Vitest** | Unit, integration & security test runner | Extremely fast in-memory execution with native TypeScript support (728 automated tests running in <10 seconds). |

---

## 2. Deep Dive: Non-Autoregressive Diffusion for Legal AI

### 2.1 The Bottleneck of Autoregressive Generation
Traditional LLMs (GPT-4, Claude, Llama) generate text autoregressively: token $t_{n}$ depends on token $t_{n-1}$. For a 1,000-token legal brief, the model must execute 1,000 sequential forward passes, causing perceptible user latency (often 10–25 seconds) and making conversational back-and-forth sluggish during court preparation.

### 2.2 Why Mercury 2.5 Diffusion Model (dLLM)?
Inception Labs Mercury 2.5 employs a non-autoregressive parallel diffusion architecture. Rather than generating one token after another, it generates and refines all tokens across the sequence simultaneously across discrete diffusion steps.

- **Latency Reduction:** Time to First Token (TTFT) drops to ~1.2 seconds, and complete multi-paragraph legal summaries render in a fraction of autoregressive time.
- **Calibrated Reasoning Tiers:**
  - `instant` (0 reasoning tokens): For standard conversational questions and quick section lookups.
  - `low` (targeted reasoning tokens): For analytical queries, contract clause risk assessments, and bail provisions.
  - `medium` (deep legal synthesis): For structured case intake, petition framing, and appellate strategy.

---

## 3. Database Connection Pooling Architecture

In serverless environments like Vercel, opening individual PostgreSQL connections per request can quickly exhaust database connection pools on Neon.

LawBite resolves this via a consolidated connection architecture:
```
┌───────────────────────────────────────┐
│ Next.js App Router (Serverless Lambdas)│
└───────────────────┬───────────────────┘
                    │
                    ▼
┌───────────────────────────────────────┐
│ lib/db.ts: Singleton pg Pool          │
│   - max: 10 connections               │
│   - idleTimeoutMillis: 30000          │
└─────────┬───────────────────┬─────────┘
          │                   │
          ▼                   ▼
┌───────────────────┐   ┌───────────────────────────┐
│ Kysely DB Client  │   │ lib/legal-kb-db.ts        │
│ (User Cases, Auth)│   │ (Full-Text Legal Search)  │
└───────────────────┘   └───────────────────────────┘
```
By exporting the singleton pool from `lib/db.ts` and consuming it within `lib/legal-kb-db.ts`, LawBite prevents duplicate pool instantiation and connection leaks.
