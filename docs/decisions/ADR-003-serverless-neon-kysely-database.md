# ADR-003: Serverless Neon PostgreSQL with Kysely Type-Safe Query Builder

## Status
Accepted

## Context
LawBite required a persistent relational datastore capable of handling:
1. Multi-tenant application entities (Users, Sessions, Accounts, Conversations, Case Folders, Case Documents, Matter Activities, Legal Notices).
2. Serverless deployment boundaries (Vercel serverless functions with rapid cold starts and dynamic scaling).
3. Complex relational queries and schema type safety without heavy ORM startup overhead or N+1 query traps.
4. Future-proof hybrid search support for vector embeddings (`pgvector`) alongside relational transactional data.

## Decision
We chose **PostgreSQL hosted on Neon Serverless** paired with the **Kysely** query builder:
1. **Neon Serverless:** Provides on-demand auto-scaling, scale-to-zero compute, instantaneous branching for migrations/testing, and native extension support (`vector`).
2. **Kysely:** Pure TypeScript query builder compiling zero-overhead SQL at runtime with complete compile-time type safety against a statically declared `Database` interface.
3. **Connection Management:** Consolidated a single shared `Pool` with max 10 connections across both application entities and `legal_chunks` vector/text lookup services to prevent connection pool exhaustion in serverless runtimes.

## Options Considered
1. **Prisma ORM:**
   - *Pros:* Widely adopted schema syntax.
   - *Cons:* Heavy binary query engine size; slow serverless cold start overhead (~300ms+); complex multi-tenant query construction; poor compatibility with raw vector similarity operators.
2. **Drizzle ORM:**
   - *Pros:* Lightweight SQL-like syntax.
   - *Cons:* Active ecosystem churn and breaking changes across versions.
3. **Kysely with pg Pool (Selected):**
   - *Pros:* Zero runtime dependencies outside standard `pg`; 100% type safety checked by `tsc --noEmit`; explicit SQL control; seamless integration with `@better-auth/kysely-adapter`.
   - *Cons:* Schema changes must be prepared and executed via Neon SQL management rather than automatic Kysely schema pushes.

## Consequences
- Single source of truth for database schema types in `lib/db.ts`.
- Multi-tenant tenant isolation is explicitly enforced in Kysely queries via `.where("userId", "=", user.id)`.
- Reused singleton pool protects Neon connection quotas under traffic spikes.
