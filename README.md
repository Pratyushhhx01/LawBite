# LawBite

An AI legal assistant for Indian law. Ask questions in plain language and get
answers grounded in 157+ Indian bare acts (BNS/IPC, BNSS/CrPC, the Constitution
and more), with optional real-time web search and document drafting/review.

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
npm run dev          # Start dev server (localhost:3000)
npm run build        # Production build
npm run lint         # ESLint (flat config, eslint-config-next)
npm run test         # Vitest single run
npm run test:watch   # Vitest in watch mode
```

## AI providers and models

LawBite is provider-agnostic. Every provider is an OpenAI-compatible
`/v1/chat/completions` endpoint, and `lib/ai-providers.ts` is the single source
of truth for the provider list, the model catalogue, request shaping, and the
failover order. The UI reads that same module, so the picker can never drift
from what the server actually supports.

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

Inception exposes two more models, `mercury-2` and `mercury-decide`. Mercury 2
is selectable in the UI; Mercury Decide is a typed-decision preview that uses a
different endpoint and is intentionally not listed.

### Fallback provider: NVIDIA

NVIDIA NIM is the automatic fallback. If Inception is unavailable — missing key,
HTTP error, rate limit, connection timeout, a stalled stream, or an SSE error
frame — the request is transparently retried against the NVIDIA chain, so a
single-provider outage never takes the assistant down.

| Model id                                | Role                             |
| --------------------------------------- | -------------------------------- |
| `meta/muse-glimmer-30b`                 | Primary NVIDIA fallback          |
| `nvidia/nemotron-3.5-lightning-30b-a3b` | Second-line fallback             |
| `nvidia/nemotron-3-super-120b-a12b`     | High-quality fallback            |
| `meta/llama-3.2-11b-vision-instruct`    | Vision model for document review |

### Behaviour

- **Default:** Inception Mercury 2.5.
- **Failover chain:** selected model → its provider's other models → the other
  provider's models. Providers without a configured API key are skipped, so a
  local checkout with only one key still works.
- **Vision:** document review (`review` mode) and any message carrying an image
  are pinned to the NVIDIA vision model regardless of the picker. The header chip
  shows an **Auto** badge when this happens.
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

Two further knobs exist but are not on by default:

- `CHAT_REALTIME=1` sends Inception's `realtime` flag. Measured against
  `instant` effort it made no meaningful difference, so it is opt-in.
- `CHAT_RATE_LIMIT_RETRIES` / `CHAT_RATE_LIMIT_BACKOFF_MS` tune the HTTP 429
  retry policy (default 3 retries at 300/800/1600 ms).

**Why retries matter:** the Inception free tier is capacity-limited and returned
`429 free tier is at capacity` on roughly half of requests during testing.
Because 429 is recoverable, the route retries the _fast_ model briefly before
walking the failover chain — otherwise every capacity blip silently produced a
slow NVIDIA answer.

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
| `firstTokenMs`       | ~0.7-1.6s                           | The model. This is what `reasoning_effort` controls.                                                                                               |
| `first client frame` | ≈ `firstTokenMs`                    | Proof the server is not buffering — the reply leaves as soon as the model produces it.                                                             |

For reference, the same question measured **~8-11s** end to end before the
`reasoning_effort` fix and **~0.8-1.5s** after, for a plain chat reply.

### Known upstream variance

Two things are outside the app's control and show up as occasional slowness:

- **Inception free-tier capacity.** The tier is rate-limited per minute on
  _output_ tokens (100K/min) and returned `429 free tier is at capacity` on
  roughly half of rapid sequential test requests. Requests can also just take
  5s+ to first token when the tier is busy. Lowering `reasoning_effort` reduces
  output tokens, which directly reduces how often this happens.
- **NVIDIA fallback is markedly slower.** When Inception fails after its retries,
  the reply is served by NVIDIA and takes much longer. The per-message model chip
  shows `fallback · <model>` in amber when this happens, so it is visible rather
  than simply feeling slow.

Buffered modes (`analysis`, and table-shaped `talk-to-ai` replies) deliberately
hold the whole answer before sending it, because the reply is repaired
afterwards (blank table cells, missing section references). They therefore feel
slower than their actual `firstTokenMs`: the user sees one frame at the end.
Switching those to stream-then-replace would improve perceived speed at the cost
of a possible visible rewrite, so it is left as a deliberate tradeoff.

### Switching models

Open any conversation and click the model chip in the top-right header. The chip
is visible in every mode — Talk to AI, Deep Analysis, AI Lawyer, Document Drafter
and Document Reviewer (the PDF/document reader) — and the selection is persisted
to `localStorage` under `lawbite-model`. Each request then carries that model id
in its `POST /api/chat` body; the server resolves and validates it, falling back
to the default if it is unknown.

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
