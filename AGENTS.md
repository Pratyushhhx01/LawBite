# AGENTS.md

## Commands

```bash
npm run dev          # Start dev server (localhost:3000)
npm run build        # Production build
npm run lint         # ESLint (flat config, eslint-config-next)
npm run test         # Vitest single run
npm run test:watch   # Vitest in watch mode
```

No separate typecheck script exists. TypeScript strict mode is on via `tsconfig.json` (`noEmit: true`). The `next build` step will catch type errors.

## Stack

- Next.js 16 (App Router), React 19, TypeScript 5, Tailwind CSS 4
- Auth: Better Auth (`lib/auth.ts` server, `lib/auth-client.ts` client)
- DB: PostgreSQL on Neon (Kysely ORM in app code; Neon tools for schema changes)
- AI: Inception Labs (Mercury 2.5 diffusion model) by default, with NVIDIA NIM as the automatic fallback. Provider/model registry lives in `lib/ai-providers.ts`. Mercury's `reasoning_effort` defaults to `medium` server-side, which costs seconds of hidden reasoning — the route always sends an explicit level (`instant` for short modes, `low` for analysis, `medium` for drafting; override with `CHAT_REASONING_EFFORT`).
- Search: Tavily for real-time web search augmentation
- Storage: AWS S3 for Indian legal bare acts knowledge base

## GitHub Identity (authoritative — do not use other IDs)

This PC has multiple GitHub identities. For this repo, use ONLY:

- **GitHub account:** `Pratyushhhx01` — repo `Pratyushhhx01/LawBite` (branch `main`).
  Verify: `gh auth status` must show `Pratyushhhx01` as Active.
  Switch: `gh auth switch --user Pratyushhhx01`.
  Never use `dev-me-ayush` for push / PR / `gh secret` / `gh run` on this repo.

## Project Structure

Single-package Next.js app. No monorepo, no workspaces.

```
app/
  api/auth/[...all]/  → Better Auth catch-all route
  api/chat/route.ts   → Main AI chat endpoint (streaming SSE)
  chat/                → Chat page (session-protected)
  legal/               → Static legal pages (terms, privacy, etc.)
  components/          → Landing page components (16 components)
  signin/              → OAuth sign-in page
lib/
  auth.ts              → Better Auth server config (Kysely adapter, Google/GitHub providers)
  auth-client.ts       → Better Auth React client (signIn, signOut, useSession)
  db.ts                → Kysely + pg Pool connection
  s3.ts                → S3 knowledge base (bare acts, sections, references)
tests/
  auth/                → Auth-related tests
  setup.ts             → Loads .env.local via dotenv
```

## Key Gotchas

- **`serverExternalPackages: ["kysely", "pg", "better-auth"]`** — these are externalized from the Next.js bundler. They must be in `node_modules` at runtime.
- **Path alias `@/*`** maps to project root (e.g., `@/lib/auth` = `lib/auth.ts`).
- **Tests use `vitest` with `environment: "node"`**, not jsdom. The `@better-auth` package is inlined in vitest deps. Test timeout is 30s.
- **Auth session check** is done server-side in `app/chat/page.tsx` using `auth.api.getSession()` with `headers()`. If no session, redirects to `/signin`.
- **Chat API (`app/api/chat/route.ts`)** is the core business logic. It classifies queries for web search, fetches legal context from S3, and streams responses via SSE. Four conversation modes: default (2-line), analysis (10-12 lines), talk-to-ai (2-line), grill (structured interrogation).
- **S3 knowledge base** stores Indian bare acts as structured JSON and full text files under `bare-acts/` prefix. The `actMap` in `app/api/chat/route.ts` maps ~157+ Indian acts to their S3 keys.
- **`.env.local` contains secrets** — never commit it. Required env vars: `DATABASE_URL`, `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`, `NEXT_PUBLIC_APP_URL`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`, `TAVILY_API_KEY`. For AI, at least one of `INCEPTION_API_KEY` (default provider) or `NVIDIA_API_KEY` (fallback) is required; set both for full failover. AWS env vars (`AWS_REGION`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `S3_BUCKET_NAME`) are also needed for S3 access.
- **`BETTER_AUTH_URL` and `NEXT_PUBLIC_APP_URL`** are set to `http://localhost:3000` locally. `TRUSTED_ORIGINS` (comma-separated) may be set to allow extra origins.

## Database Workflow

- **Schema changes (CREATE TABLE, ALTER TABLE, etc.)** — use the Neon tools (`neon_prepare_database_migration`, `neon_run_sql`, etc.) directly. Do not write raw migration files or run SQL through the app's Kysely connection.
- **Destructive operations (DROP TABLE, DROP COLUMN, TRUNCATE, etc.)** — always confirm with the user before executing. State what will be deleted and ask for explicit approval.
- **App code uses Kysely** (`lib/db.ts`) for queries at runtime. Schema management is separate from app code.
