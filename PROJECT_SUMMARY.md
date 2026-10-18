# Lawbite — Project Summary

> One-page overview of the Lawbite AI legal assistant, built for interviews / project explanations.

## What it is

An AI legal assistant for Indian law. Users ask questions in plain language and get answers grounded in 157+ Indian bare acts (IPC/BNS, CrPC/BNSS, Constitution, etc.), with optional real-time web search and document drafting/review.

## Tech Stack

| Layer          | Technology                                             |
| -------------- | ------------------------------------------------------ |
| Framework      | Next.js 16 (App Router), React 19, TypeScript (strict) |
| Styling        | Tailwind CSS 4                                         |
| Auth           | Better Auth (Google + GitHub OAuth, Kysely adapter)    |
| Database       | PostgreSQL on Neon (Kysely type-safe queries)          |
| Knowledge base | AWS S3 (bare acts as structured JSON + full text)      |
| AI             | NVIDIA API — Llama 3.1 8B Instruct                     |
| Web search     | Tavily (real-time augmentation)                        |
| File upload    | pdf-parse for PDFs, image passthrough for review       |
| Testing        | Vitest                                                 |

## Architecture at a glance

```
UI (landing + chat) ─► /api/chat (SSE streaming)
                         ├─ classify query (S3 KB vs web search)
                         ├─ retrieve context from S3 bare acts
                         ├─ Tavily web search (if needed)
                         └─ NVIDIA Llama 3.1 → streamed tokens
Auth (Better Auth) ─► Postgres on Neon (Kysely)
```

## How it works — 5 steps

1. **Login** — Better Auth, OAuth-only, session checked server-side.
2. **Ask** — user sends a message from the chat UI.
3. **Classify + retrieve** — `/api/chat` decides whether the answer needs act text (S3) or live info (Tavily), then builds the prompt with real section text.
4. **Generate + stream** — Llama 3.1 8B responds; tokens stream to the client over SSE.
5. **Persist** — conversation history in localStorage, grouped by day, with share + saved-cases features.

## Chat modes

- **Talk to AI** — quick 2-line answers
- **Deep Analysis** — 10–12 line structured analysis
- **Case Intake (grill)** — guided Q&A that saves a case summary
- **Document Drafter / Reviewer** — generates legal documents, reviews uploaded PDFs/images clause-by-clause with risk ratings

## Key engineering decisions

- **SSE over WebSockets** — chat is one-way streaming; SSE is simpler over HTTP and auto-reconnects.
- **S3, not a vector DB** — the corpus is ~40 fixed documents; deterministic act/section retrieval is cheaper and exact. No embedding pipeline needed at this scale.
- **Grounding** — answers cite retrieved sections / search results instead of pure model memory (important for a legal tool).
- **Type safety** — Kysely + strict TS catch DB and query errors at compile time.
- **Restrained motion** — GPU-friendly animations + `prefers-reduced-motion` support; a legal product needs credibility, not flash.

## Testing & quality

- 73 Vitest tests (auth flow, chat endpoint, S3 knowledge-base integrity).
- `next build` doubles as type-check (`noEmit`, strict mode).
- `npm run lint` — ESLint with next config.

## Common gotchas solved

- `serverExternalPackages` (kysely, pg, better-auth) externalized from the Next bundler.
- S3 failures degrade silently (KB fetch returns `null`) — AI falls back to model knowledge.

## How it scales

- Stateless streaming route → scales horizontally.
- Immutable S3 act files → cacheable at the CDN/edge.
- Next steps: rate limiting at API layer, act-fetch caching, vector search if the corpus grows.
