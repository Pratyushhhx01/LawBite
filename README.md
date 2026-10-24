# LawBite

[![CI](https://github.com/Pratyushhhx01/LawBite/actions/workflows/ci.yml/badge.svg)](https://github.com/Pratyushhhx01/LawBite/actions/workflows/ci.yml)

An AI legal assistant for Indian law. Ask questions in plain language and get
answers grounded in 157+ Indian bare acts (BNS/IPC, BNSS/CrPC, the Constitution
and more), with optional real-time web search and document drafting/review.

For a reviewer-facing summary of what is tested, what is still blocked, and how
to reproduce each claim, see [`docs/evidence.md`](docs/evidence.md).

## Requirements

- Node.js 20 or newer
- A PostgreSQL database (Neon) plus the environment variables listed in `AGENTS.md`
- At least one AI provider API key: **Inception Labs** (default) and/or **NVIDIA** (fallback)

## Getting Started

First, run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

## Scripts

```bash
npm run dev            # Start dev server (localhost:3000)
npm run build          # Production build
npm run typecheck      # tsc --noEmit
npm run lint           # ESLint (flat config, eslint-config-next)
npm run audit          # Fail on high/critical dependency advisories
npm run test           # Vitest single run
npm run test:watch     # Vitest in watch mode
npm run test:coverage  # Vitest with V8 coverage + thresholds
npm run check:s3       # Diagnose S3 credentials, bucket, region, and read access
npm run eval:legal     # Legal accuracy benchmark (needs a running app)
```

## CI

GitHub Actions runs a dependency audit, typecheck, lint, tests with coverage, and
a production build on every push to `main` and every pull request. The workflow
uses build-time placeholder environment variables and does not connect to the
database, AI providers, or S3. Coverage thresholds are enforced for `lib/` and
API routes, and the HTML report is uploaded as a workflow artifact. The audit
step fails on high or critical advisories; the lockfile currently resolves with
zero known vulnerabilities.

The legal accuracy benchmark is run manually because it needs a deployed app, a
real database, and working S3 credentials. See [`docs/benchmark.md`](docs/benchmark.md).

A separate **Deployed smoke** workflow runs `tests/deployed` against a live URL
on demand. It signs up a throwaway account and exercises the real streaming
`/api/chat` path, so it catches deployment, auth, and SSE regressions that unit
tests cannot.

## Legal accuracy benchmark

`npm run eval` measures readability. `npm run eval:legal` measures legal
correctness: it sends a seeded set of Indian-law questions to the real chat
endpoint, then checks every cited section against the S3 bare acts through
`/api/citations/verify`.

```bash
npm run eval:legal
npm run eval:legal -- --limit 10
npm run eval:legal -- --reviewed-only
npm run eval:legal -- --base https://law-bite.vercel.app
```

The runner reports section recall, citation precision, hallucination rate,
refusal accuracy, and p95 latency, and writes a markdown + JSON report under
`test-results/`.

The current 50-question seed set is **draft and not advocate-reviewed**. Do not
publish its score as a legal-accuracy claim until the review status is updated.
See [`docs/benchmark.md`](docs/benchmark.md) for the dataset schema, metrics,
and review process.

### S3 knowledge-base check

`npm run check:s3` reads the BNS full text object with the same credentials and
region the app uses. It prints the bucket, key, credential shape (never the
secret), and an actionable hint for `InvalidAccessKeyId`, `SignatureDoesNotMatch`,
`AccessDenied`, wrong region, and timeout failures. Run it locally before a
benchmark and after rotating production credentials. See
[`docs/runbook-s3.md`](docs/runbook-s3.md) for the full rotation and verification
procedure.

## Security

`npm run audit` fails on high or critical dependency advisories and runs in CI.
The lockfile currently resolves with zero known vulnerabilities. Better Auth is
pinned to `1.6.33`; upgrading to 1.7 requires an `account.issuer` schema
migration and a reviewed backfill, so it is treated as a planned migration rather
than a routine bump. See [`docs/security.md`](docs/security.md) for auth
boundaries, request limits, secret handling, and the in-memory rate-limit
limitation.

## Architecture

The chat route is an orchestration layer: classification, S3 retrieval, optional
web search, prompt selection, provider failover, and SSE transport. Prompts,
act-key mappings, pure query filters, the provider registry, and citation
verification live in separate modules with their own tests. See
[`docs/architecture.md`](docs/architecture.md) for the request flow, module
boundaries, and the next client-side refactor target.

## AI providers and models

LawBite is provider-agnostic. Every provider is an OpenAI-compatible
`/v1/chat/completions` endpoint, and `lib/ai-providers.ts` is the single source
of truth for the provider list, the model catalogue, request shaping, and the
failover order. Model choice is entirely server-side: the chat client never
sends a model, so the route always starts at the default and walks the failover
chain on its own.

### Default provider: Inception Labs (Mercury 2.5)

The default model is **Mercury 2.5** from [Inception Labs](https://inceptionlabs.ai).
Mercury is a _diffusion_ large language model (dLLM): instead of emitting one
token at a time, it denoises the whole response in parallel, which makes replies
noticeably faster for the short, high-turnover replies the chat UI produces.

| Property        | Value                                                              |
| --------------- | ------------------------------------------------------------------ |
| API model id    | `mercury-2.5`                                                      |
| Endpoint        | `https://api.inceptionlabs.ai/v1/chat/completions`                 |
| Context window  | 260,000 tokens                                                     |
| Max output      | 65,536 tokens                                                      |
| Env var         | `INCEPTION_API_KEY`                                                |
| Sampling params | `temperature`, `stop`, `reasoning_effort`, `max_completion_tokens` |
| Modalities      | text                                                               |

Inception also offers `mercury-2` and `mercury-decide`. Mercury 2 stays in the
catalogue for explicit legacy selections but is **not** used automatically:
accuracy testing showed it inventing old IPC section numbers and misnaming the
new statutes. Mercury Decide is a typed-decision preview that uses a different
endpoint and is intentionally not listed.

### Fallback provider: NVIDIA

NVIDIA NIM is the automatic fallback. If Inception is unavailable — missing key,
HTTP error, rate limit, connection timeout, a stalled stream, or an SSE error
frame — the request is transparently retried against the NVIDIA chain, so a
single-provider outage never takes the assistant down.

| Model id                                | Role                                       |
| --------------------------------------- | ------------------------------------------ |
| `nvidia/nemotron-3-super-120b-a12b`     | Primary NVIDIA fallback (fastest measured) |
| `nvidia/nemotron-3.5-lightning-30b-a3b` | Second-line fallback                       |
| `meta/muse-glimmer-30b`                 | Last-resort fallback                       |
| `meta/llama-3.2-11b-vision-instruct`    | Vision model for document review           |

The order is deliberate: measured on this deployment, Nemotron Super returned
its first token in roughly 3–5s, while Glimmer and Lightning could stall for
20s+. Putting Super first keeps an Inception outage from turning into a
half-minute wait.

### Behaviour

- **Default:** Inception Mercury 2.5.
- **Failover chain:** default model → its provider's other models → the other
  provider's models. Providers without a configured API key are skipped, so a
  local checkout with only one key still works. For short chat modes, Mercury
  2.5 is retried a few times before NVIDIA: a free-tier 429 returns in a few
  hundred milliseconds, so another attempt is much faster than waiting on the
  slow fallback.
- **Bare legal acronyms:** IPC, CrPC, BNS, BNSS, BSA and CPC are expanded in the
  prompt, so a one-word question like `what is ipc` is answered as an Indian-law
  question instead of being refused as an unknown abbreviation.
- **Vision:** document review (`review` mode) and any message carrying an image
  are pinned to the NVIDIA vision model, whatever the failover chain would have
  picked.
- **Reasoning budget:** Mercury emits hidden reasoning tokens that count against
  the completion budget. The route enforces a floor
  (`MIN_REASONING_MAX_TOKENS = 4096`) so a small budget can never be consumed
  entirely by reasoning and return an empty reply.
- **Request shaping:** each provider gets only the parameters it accepts.
  `top_p` is NVIDIA-only; `max_completion_tokens` is preferred over the
  deprecated `max_tokens` where supported.

### Latency tuning (Mercury is fast only if you ask it to be)

Mercury 2.5 is a diffusion model, so its speed comes from generating tokens in
parallel — but **`reasoning_effort` defaults to `medium` when omitted**, which
costs several seconds of _hidden_ reasoning before the first visible token.
Measured on a representative legal question:

| `reasoning_effort`           | Time to first visible token | Total   |
| ---------------------------- | --------------------------- | ------- |
| omitted → `medium` (default) | ~8.8 s                      | ~11.3 s |
| `instant`                    | ~0.7 s                      | ~3.0 s  |
| `low`                        | ~0.9 s                      | ~3.3 s  |
| `high`                       | ~6.9 s                      | ~10.2 s |

So the route always sends an explicit `reasoning_effort`, chosen per mode:

| Mode                                        | Effort                                                        |
| ------------------------------------------- | ------------------------------------------------------------- |
| Talk to AI, AI Lawyer (grill), default chat | `instant`                                                     |
| Deep Analysis                               | `low`                                                         |
| Document Drafter                            | `medium`                                                      |
| Document Reviewer (vision)                  | omitted — the vision model is not a reasoning model           |
| NVIDIA fallback                             | `instant` is downgraded to `low` (NVIDIA has no instant tier) |

Override every mode with an env var:

```bash
CHAT_REASONING_EFFORT=instant   # instant | low | medium | high
```

Two further knobs:

- `CHAT_REALTIME` sends Inception's latency hint. It is **on by default** for
  Inception requests because measurements showed roughly half the
  time-to-first-token and a better chance of getting through a busy free tier.
  Set `CHAT_REALTIME=0` to disable it.
- `CHAT_RATE_LIMIT_RETRIES` / `CHAT_RATE_LIMIT_BACKOFF_MS` tune the HTTP 429
  retry policy for deep modes (default 3 retries at 300/800/1600 ms). Short
  modes skip the same-model backoff and retry Mercury 2.5 a few times instead.

**Why retries matter:** the Inception free tier is capacity-limited and returned
`429 free tier is at capacity` on a large share of requests during testing.
Because 429 is recoverable, short modes retry the accurate Mercury 2.5 several
times before walking to NVIDIA — so a capacity blip costs a few hundred
milliseconds instead of a slow fallback answer.

The route also logs its own timings so you can see where a request spends time:

```
[ChatAPI] convType=talk-to-ai, model=inception:mercury-2.5, effort=instant,
  sysPromptLen=4863, sessionMs=0, contextMs=210, buffered=false
[ChatAPI] model inception:mercury-2.5 streaming directly to client (firstTokenMs=734)
[ChatAPI] first client frame flushed at +735ms
```

Where the milliseconds actually go on a warm request:

| Phase                | Typical                             | Notes                                                                                                                                              |
| -------------------- | ----------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| `sessionMs`          | ~0 warm, ~500 warm-miss, ~1900 cold | `auth.api.getSession` is a Postgres round trip. Now cached per session cookie for 60s, which took typical chat from ~1.5s to **~0.8s** end to end. |
| `contextMs`          | ~400-600                            | S3 bare-acts lookup + optional Tavily search, run in parallel. `0` when the query needs no lookup.                                                 |
| `firstTokenMs`       | ~0.5-1.8s                           | The model. `reasoning_effort` and the `realtime` flag control this.                                                                                |
| `first client frame` | ≈ `firstTokenMs`                    | Proof the server is not buffering — the reply leaves as soon as the model produces it.                                                             |

For reference, the same question measured **~8-11s** end to end before the
`reasoning_effort` fix and **~0.8-1.5s** after, for a plain chat reply.

### Known upstream variance

Two things are outside the app's control and show up as occasional slowness:

- **Inception free-tier capacity.** The tier is rate-limited per minute and
  returned `429 free tier is at capacity` on a large share of rapid test
  requests. Short modes therefore use `realtime` by default and retry Mercury 2.5
  several times before falling back; a 429 costs only a few hundred
  milliseconds. Set `CHAT_REALTIME=0` to disable the latency hint.
- **NVIDIA fallback is markedly slower.** When Inception fails after its retries,
  the reply is served by NVIDIA. The fallback order now starts with Nemotron
  Super, which measured 3–5s to first token; Glimmer and Lightning are kept only
  as last resorts because they can take 20s or more. The failover is automatic
  and silent in the UI, so a slow reply usually means it fell back rather than
  that the request was lost.

Deep Analysis is the only buffered mode: it holds the whole answer because the
reply is repaired afterwards (blank table cells, missing section references), so
the server sends one frame at the end and the chat UI reveals it word by word.
The reveal runs at ~60 words/s and catches up on a buffered block in about a
second.

Table-shaped `talk-to-ai` replies stream as they are generated. The same checks
run at the end, but the route sends a `replace` frame only when a requested
section was actually omitted or a cell was left blank. The common case has no
extra wait and no visible rewrite; a genuine repair is applied to the already
visible table.

While a reply is pending, the chat shows a short staged status
(thinking → searching legal resources → generating → finalizing), one label at a
time. The card is held back for a moment so fast replies appear directly without
a status flash, and it is removed the instant real content starts arriving.

### Model selection

Model choice is automatic and server-side. The chat client never sends a model,
so every request starts at Mercury 2.5 and the route walks the failover chain on
its own: same-provider siblings first, then the NVIDIA fallback. Document review
and image attachments always use the vision model. Because there is no model
picker in the chat UI, all users get the same default-first behaviour.

### Sharing conversations

Each saved conversation can be shared from its context menu or from the share
button under an assistant reply. The link points at the canonical public origin
(`NEXT_PUBLIC_APP_URL`, falling back to the request origin) and opens
`/shared/<id>`.

A shared page is a read-only public snapshot: it needs no login and shows only
that conversation's messages, the sender's display name, and a **Continue to
chat** action. Continuing sends the visitor through sign-in, then the server
imports the snapshot into their own history exactly once under a deterministic
id. The imported copy is a normal chat they can keep using, and the sender's
original conversation is never modified.

```text
Share button -> POST /api/share -> /shared/<id>
                                    |
                                    +-- Continue to chat -> /chat?shareId=<id>
                                                           (sign-in if needed)
                                                           -> server-side import
                                                           -> /chat?conversation=<id>
```

### Environment variables

```bash
# Inception Labs — default provider
INCEPTION_API_KEY="sk_..."

# NVIDIA — automatic fallback
NVIDIA_API_KEY="nvapi-..."

# Optional latency tuning (see "Latency tuning" above)
# CHAT_REASONING_EFFORT="instant"     # instant | low | medium | high
# CHAT_REALTIME="1"
# CHAT_RATE_LIMIT_RETRIES="3"
# CHAT_RATE_LIMIT_BACKOFF_MS="300,800,1600"
```

At least one is required. Setting both gives you the full failover ladder.
`lib/env.ts` warns at startup when a key is missing rather than silently
degrading.

### Testing the providers

Hermetic unit and route tests run with the normal suite:

```bash
npm run test                       # includes ai-providers + chat-providers tests
```

A live integration test hits the real Inception API. It is opt-in because it
needs network access and a funded key (the free tier is frequently
rate-limited):

```bash
# PowerShell
$env:LIVE_AI_TESTS = "1"; npx vitest run tests/inception-live.test.ts
```

It verifies a plain completion, SSE streaming, BNS-grounded legal answers, and a
401 on an invalid key.

## Learn More

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Inception Labs documentation](https://docs.inceptionlabs.ai) - Mercury API reference.
- [NVIDIA NIM](https://build.nvidia.com) - fallback model catalogue.

See `AGENTS.md` for project structure, stack, and conventions.
