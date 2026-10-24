# Architecture

LawBite is a single Next.js app. The chat path is deliberately split into a
small orchestration layer and focused modules, so prompt, retrieval, provider,
and verification changes can be reviewed and tested independently.

## Request flow

```
Browser
  -> POST /api/chat
     -> auth + rate limit
     -> classifyQuery()                 lib/chat-filters.ts
     -> S3 legal context                lib/s3.ts
     -> optional Tavily web context     app/api/chat/route.ts
     -> getSystemPrompt()               lib/chat-prompts.ts
     -> provider fallback chain         lib/ai-providers.ts
     -> SSE stream back to the browser
```

Citations can be checked separately through the authenticated
`POST /api/citations/verify` endpoint, which uses `lib/citation-verifier.ts`.

## Module boundaries

| Module | Responsibility |
| --- | --- |
| `app/api/chat/route.ts` | HTTP validation, retrieval orchestration, provider failover, SSE transport, and response post-processing. |
| `lib/chat-prompts.ts` | System prompts, source-quality rules, draft disclaimer, and `getSystemPrompt()`. Data-only; no transport code. |
| `lib/act-map.ts` | Maps user-facing act names and abbreviations to S3 bare-act keys. |
| `lib/chat-filters.ts` | Pure query classification: legal/non-legal, Indian context, foreign jurisdiction, acronym context. |
| `lib/ai-providers.ts` | Provider registry, model catalogue, request shaping, reasoning effort, and fallback order. |
| `lib/s3.ts` | Read-only access to the S3 bare-acts knowledge base. |
| `lib/citation-verifier.ts` | Citation parsing, act resolution, S3 verification, and precision/hallucination metrics. |
| `lib/legal-sources.ts` | Trusted-source and excluded-domain rules for web results. |
| `scripts/legal-eval.mjs` | Seeded legal QA benchmark runner and report generator. |

Keeping prompts and act mappings out of the route means a prompt or coverage
change produces a small, reviewable diff instead of touching the streaming
transport. The route still owns request-specific policy, such as which context
blocks are included and how the response is framed.

## Invariants

- The browser never chooses a model or provider. Selection stays server-side.
- Unit tests do not need real S3, a database, or an AI provider. Lookup and
  provider boundaries are injectable or mocked.
- `lookup_error` is not treated as a hallucination. It is reported separately so
  an unavailable knowledge base cannot silently improve or worsen accuracy.
- Benchmark rows stay `draft` until a qualified reviewer signs them off.

## Current hotspot

`app/chat/_components/ChatApp.tsx` is still the largest client module. The next
safe split is by UI concern: message list, composer, attachment picker, citation
badge, and share/export controls. Each extraction should keep the existing
desktop popover and mobile bottom-sheet behavior covered by tests.

## Guardrails

- `npm run typecheck`
- `npm run lint`
- `npm run test`
- `npm run test:coverage` (thresholds in `vitest.config.ts`)
- `npm run build`
- Manual deployed smoke: `tests/deployed` against a live URL
- Manual legal benchmark: `npm run eval:legal`

Typecheck, lint, coverage, and build run on every push and pull request through
`.github/workflows/ci.yml`.
