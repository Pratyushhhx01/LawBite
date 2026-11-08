# LawBite — Project Brief + Professor Q&A Pack

Everything below is grounded in the actual source code, the live deployment, and the
database — not in the README. Where the docs overstate something, that is called out
explicitly in **§13 Doc/code drift** so you are never caught out.

Live: https://law-bite.vercel.app/ &nbsp;|&nbsp; Repo: https://github.com/Pratyushhhx01/LawBite

---

## 1. The 30-second pitch

> LawBite is a citation-grounded legal research assistant for Indian law. You ask a
> question in plain English and it answers using retrieved text from the actual bare
> acts — BNS, IPC, BNSS, BSA and the Contract Act — then shows you the section it came
> from, maps old IPC/CrPC sections to their BNS/BNSS equivalents, and flags any citation
> it could not confirm against the corpus. It is a research aid, not a lawyer.

If asked "why does this matter": Indian legal research is split between expensive
databases (SCC, Manupatra) and generic chatbots that invent section numbers. The gap is
a cheap, verifiable, India-specific tool that *shows its work*.

---

## 2. The problem, stated precisely

Three concrete failures the project targets:

1. **Generic LLMs fabricate citations.** They produce confident "Section 302 IPC" answers
   that are wrong, and a non-lawyer cannot tell.
2. **The 2023 criminal-law overhaul broke muscle memory.** IPC → BNS, CrPC → BNSS,
   Evidence Act → BSA. Practitioners, students and the public still think in old section
   numbers, and most tools do not translate.
3. **Legal databases are priced for institutions.** A student or a small practice has no
   affordable option that is both grounded and auditable.

---

## 3. What actually works today (honest feature matrix)

| Feature | Status | Notes |
| --- | --- | --- |
| 5 chat modes (Talk to AI, Deep Analysis, AI Lawyer/grill, Document Drafter, Document Reviewer) | Shipped | Each has its own system prompt, length contract and test suite |
| Grounded answers from bare acts | Shipped (partial corpus) | Postgres full-text + exact section lookup |
| Citation verification with per-citation status | Shipped | `verified` / `section_not_found` / `act_not_resolved` / … |
| IPC ⇄ BNS / CrPC ⇄ BNSS / Evidence ⇄ BSA mapping | Shipped | 34-entry mapping table, bidirectional |
| Web search augmentation (Tavily) | Shipped | Only when the query is classified as time-sensitive |
| Share links (immutable snapshot, `noindex`) | Shipped | `/shared/<uuid>` |
| PDF / DOCX export | Shipped | Client-side generation |
| Case folders + document upload (S3) | Shipped | 10 MB cap |
| Hearing reminders + iCal export | Shipped | |
| Document review of an uploaded PDF/DOCX | Shipped | 10 MB server cap, 8k chars extracted |
| Admin dashboard | Shipped | Gated by `ADMIN_EMAILS` |
| Billing / "Plus plan" | **Not built** | See §13 |
| Voice, mobile app, regional languages | Not built | Legitimate "next" items |

---

## 4. Architecture at a glance

```
Browser (Next.js App Router / React 19)
   │  POST /api/chat  (SSE)
   ▼
app/api/chat/route.ts  ── the orchestrator (~2.8k lines)
   ├─ Better Auth session check (cached 60 s)
   ├─ per-user rate limit (30 req/min)
   ├─ input validation (≤100 messages, ≤10k chars)
   ├─ lib/chat-filters.ts      → scope / refusal / drafting classification
   ├─ lib/legal-kb-db.ts       → exact section lookup + Postgres FTS
   ├─ lib/s3.ts               → bare-act text (DB-first, local fallback, LRU cache)
   ├─ Tavily                  → only for time-sensitive queries
   ├─ lib/chat-prompts.ts     → mode-specific system prompt + retrieved context
   ├─ lib/ai-providers.ts     → model candidate chain + failover
   │      Mercure 2.5 → NVIDIA nemotron-super → nemotron-lightning → muse-glimmer
   ├─ SSE stream (+ 5 s keepalive frames)
   └─ lib/citation-verifier.ts → verify each citation, emit a `citations` frame
```

Storage: **Neon Postgres** via Kysely (13 tables) — auth, conversations, messages,
shares, cases, documents, reminders, legal chunks. AWS S3 is used only for uploaded case
documents and profile images.

---

## 5. Request lifecycle (the answer to "walk me through a request")

1. **Session + rate limit.** Better Auth session validated server-side (60 s cache);
   per-user counter allows 30 messages/minute.
2. **Validation.** Message count and character caps reject abusive payloads before any
   model spend.
3. **Classification** (`lib/chat-filters.ts`, pure and unit-tested). Detects
   model-identity probes, prompt-injection attempts and off-topic asks, and refuses them
   *before* the provider call. Also decides: is this time-sensitive (→ Tavily), is this a
   document-drafting request, is this out of legal scope?
4. **Retrieval.** Exact section lookup first (fast, deterministic), then Postgres
   full-text search over `legal_chunks` for supporting passages. Only a small, ranked
   slice enters the prompt.
5. **Prompt assembly.** Mode-specific system prompt + scope rules + retrieved text +
   the *latest* user message only (prevents instruction bleed across turns).
6. **Generation with failover.** The provider registry walks an ordered candidate list;
   connect timeouts, first-content timeouts and mid-stream failures each trigger the next
   candidate. `maxDuration = 300 s`. Reasoning effort is pinned per mode
   (`instant` for short answers, `low` for analysis, `medium` for drafting) because
   Mercury's server default costs seconds of hidden reasoning.
7. **Streaming.** SSE with 5 s keepalive frames so proxies do not kill idle connections.
8. **Verification.** After the stream completes, every citation in the answer is parsed
   and checked against the corpus (4 s budget). A `citations` frame carries a status per
   citation.
9. **Repair pass.** For analysis, table and drafting modes, a response that fails its
   structural contract (too short, missing citations, broken table) is retried once.

---

## 6. Key design decisions and why

| Decision | Alternative rejected | Why | Cost |
| --- | --- | --- | --- |
| Ground every answer in retrieved statute text | Pure prompt-engineered chatbot | Fabricated citations are the #1 failure mode in legal AI | Retrieval + prompt budget, and answers are only as good as the corpus |
| Verify citations *after* generation | Trust the model | Turns "trust me" into a measurable status per citation | Adds latency; only proves existence, not correctness (§11) |
| Postgres full-text + exact lookup | Dense vector search | Deterministic section lookups are what lawyers actually ask for; no embedding pipeline to maintain | Misses paraphrased/ conceptual queries — the real gap |
| Multi-provider failover | Single vendor | A legal answer that dies mid-stream is worse than a slower one | More config surface, harder to reason about output consistency |
| SSE streaming | Request/response JSON | Perceived latency; users see the answer being built | More complex error handling mid-stream |
| Immutable share snapshots | Share a live conversation | A shared citation must not silently change later | Storage duplication |
| In-memory rate limiting | Redis/Upstash | Zero infra for a single-region deploy | Not shared across instances (§13) |
| Server-side session check in the page | Client-only guard | Prevents flashing protected UI before redirect | Slightly slower navigation |

---

## 7. Retrieval and grounding — say this precisely

- Chat uses **exact section lookup** (`getSectionByActAndNumber`) plus **Postgres
  full-text search** (`searchLegalChunksText`) with a local-file fallback.
- A dense-vector function (`searchLegalChunksVector`) **exists in the codebase but is not
  wired into the chat path.** Do not claim vector RAG in the demo.
- The corpus is small and uneven: **1,069 chunks** across **6 act groups** —
  IPC 563, BNS 460, Contract Act 18, Supreme Court judgments 16, BNSS 7, BSA 5.
- **145 unique acts are mapped** (441 alias entries, 72 act definitions) so the system can
  *resolve* a citation for many more statutes than it can *quote*.

**The honest one-liner:** "Citation resolution covers 145 acts; full-text grounding is
deep for BNS, IPC and the Contract Act, and thin for BNSS/BSA plus 16 Supreme Court
judgments. Closing that coverage gap is the next milestone."

---

## 8. Citation verification — the strongest technical story

`lib/citation-verifier.ts` parses every `Section X of Act Y` pattern, resolves the act
name through an alias map, looks the section up in the corpus, and assigns one of:

`verified`, `section_not_found`, `act_not_resolved`, `section_not_parsed`,
`reference_not_section`, `web_source`, `untrusted_web_source`, `lookup_error`.

Two details that show engineering maturity, and are worth saying out loud:

- **`lookup_error` is excluded from precision and hallucination metrics.** If the lookup
  itself failed, the tool reports "verification unavailable" instead of scoring the model
  as a hallucinator. Most naive benchmarks get this wrong.
- **Metrics are only reported when something is verifiable** — otherwise `n/a`, never 0%.

The verifier is injected with its lookup function, so 100% of its tests run without a
database or S3.

---

## 9. AI reliability

- Primary: **Inception Mercury 2.5** (diffusion-based, very fast). Fallbacks: NVIDIA NIM
  `nemotron-3-super-120b`, `nemotron-3.5-lightning-30b`, `meta/muse-glimmer-30b`.
  Vision: `llama-3.2-90b-vision` → `nemotron-3.5-super-vl`.
- Failover triggers on: connect timeout (20 s, 8 s in short modes), first-token timeout
  (20 s / 7 s), non-2xx, and stream break.
- Short-mode total budget: 25 s.
- `mercury-2` is only used if explicitly requested — a deliberate rollback path.
- The model is told never to reveal its identity or provider; that refusal is also caught
  upstream in the classifier so it cannot be prompt-injected.

---

## 10. Security and privacy

- **Auth:** Better Auth 1.7.14, Google + GitHub OAuth. Sessions server-validated.
- **Headers:** HSTS (2 y, preload), `X-Frame-Options: DENY`, `nosniff`, referrer policy,
  Permissions-Policy, COOP same-origin, CSP with `frame-ancestors 'none'`.
  *Known gap:* CSP still allows `unsafe-inline` / `unsafe-eval` (Next.js constraint).
- **Rate limits:** chat 30/min, verify 60/min, review 10/min — in-memory per instance.
- **Uploads:** 10 MB server cap; extracted text truncated to 8k chars before it reaches a
  model (cost and prompt-injection control).
- **Secrets:** server-only env vars, never exposed to the client bundle.
- **Share links:** immutable snapshots, `noindex`, UUID (unguessable) not sequential IDs.
- **Prompt injection:** instructions inside retrieved text or uploaded documents are
  treated as data, and the scope rules tell the model to ignore embedded commands.

---

## 11. Testing and CI

- **676 tests across 33 files: 627 passing, 49 skipped.** The skips are live-database and
  live-deployment suites, skipped deliberately in CI (`CI_SKIP_DB_TESTS=1`) rather than
  faked.
- Coverage floors enforced in CI: **46% statements / 40% branches / 55% functions /
  47% lines** (local run is above all four).
- CI pipeline: dependency audit (fails on high/critical) → typecheck → lint → coverage →
  production build. Node 24.
- Separate opt-in `deployed-smoke.yml` signs up a throwaway user and drives the real SSE
  endpoint.
- A **50-question legal benchmark harness** (`npm run eval:legal`) measures section
  recall, citation precision, hallucination rate, refusal accuracy and p95 latency.
  Its rows are marked `review_status: draft` — it is a harness, not a validated exam.

*Note:* the current full run has one failing file, `tests/shares.test.ts`, purely because
the live Neon host did not resolve from this machine (DNS `ENOTFOUND`). Worth saying if
it comes up: "the only red test is a network-dependent DB suite, not a logic failure."

---

## 12. Numbers to have memorised

| Metric | Value |
| --- | --- |
| Legal chunks indexed | 1,069 |
| Act groups with full text | 6 (IPC 563, BNS 460, Contract 18, SC 16, BNSS 7, BSA 5) |
| Acts resolvable by name/alias | 145 (441 alias entries, 72 definitions) |
| Old→new section mappings | 34 |
| Database tables | 13 |
| Users / conversations / sessions | 107 / 70 / 131 |
| Tests | 676 (627 pass, 49 skipped) |
| Chat modes | 5 |
| Chat route size | ~2,846 lines |
| Max request duration | 300 s |
| Rate limit | 30 msg/min/user |

---

## 13. Doc/code drift — know this before he finds it

Be the first to say these. It reads as rigour, not as a confession.

1. **"157+ bare acts" is a mapping claim, not a content claim.** The code holds 145 unique
   act keys; the indexed corpus is 1,069 chunks over 6 act groups. Say "mapped", not
   "indexed".
2. **Docs describe S3 as the bare-act store; the code does not use it.** `lib/s3.ts` has
   `s3Client = null`; bare-act text comes from Postgres with a local-file fallback. The
   S3 path broke on `InvalidAccessKeyId` and retrieval was migrated. Docs lag the code.
3. **The health endpoint's `knowledgeBase` check only confirms env vars exist**, not that
   the bucket is readable. Do not present it as a corpus check.
4. **FAQ mentions a "Plus plan" that does not exist.** No billing code, no pricing table.
5. **`lib/auth.ts` enables email/password but the sign-in UI is OAuth-only.** Dead
   configuration, harmless but untidy.
6. **Two tables (`shared_chat`, `user_daily_usage`) are defined but unused** — leftover
   from an earlier design.
7. Tests/coverage numbers in `docs/evidence.md` (523/44) are older than the current run
   (627/49).

---

## 14. Limitations — the honest list

- Retrieval is lexical (FTS), not semantic. Conceptual questions phrased away from statute
  vocabulary retrieve poorly. Vector search is written but not enabled.
- Corpus coverage is uneven: BNSS 7 and BSA 5 chunks is a demo, not a product.
- Verification proves a citation **exists**, not that it is the **right** citation for the
  proposition. This is the single most important limitation to state.
- The benchmark is a 50-question draft set, not advocate-reviewed.
- Rate limiting is per-instance and resets on deploy.
- No distributed tracing or error aggregation; debugging production means reading logs.
- `ChatApp.tsx` is ~9,700 lines — the clearest refactor debt in the repo.
- No billing, no team accounts, no audit log for professional use.
- Single jurisdiction (India), English only.

---

## 15. If I had two more months

1. Enable hybrid retrieval (pgvector + FTS with reciprocal-rank fusion) and measure recall
   against the benchmark.
2. Complete BNS/BNSS/BSA schedules and get the 50-question set advocate-reviewed, then
   publish precision honestly.
3. Extend verification from "exists" to "supports the proposition" — check that the cited
   section's text entails the claim.
4. Redis-backed rate limiting and structured tracing.
5. Break up `ChatApp.tsx` into mode components.
6. Regional-language input.

---

# Q&A BANK

Answers are intentionally 1–4 sentences. Say the answer, then stop — silence invites the
next question and makes you look confident.

## A. Problem and framing

**Q: What problem does this solve?**
Legal information is either expensive (SCC, Manupatra) or unreliable (generic chatbots
that invent sections). LawBite sits in between: cheap, India-specific, and it shows the
statute text it relied on.

**Q: Who is the user?**
Three: law students and aspirants who need fast, correct section references; small
practices and solo advocates doing first-pass research; and citizens trying to understand
their own matter before consulting a lawyer.

**Q: Isn't this just ChatGPT with a prompt?**
No. Retrieval happens before generation, the prompt is assembled from actual statute text,
and every citation is re-checked against the corpus after generation. A prompt alone
cannot tell you that it failed.

**Q: Why India specifically?**
Because the 2023 recodification created a real, underserved problem — everyone still
thinks in IPC numbers while the law now runs on BNS. A general model has no reliable
mapping and no incentive to be careful about it.

## B. Architecture

**Q: Walk me through what happens when I type a question.**
Session check → rate limit → validation → classification (scope, refusal, time-sensitivity)
→ retrieval (exact section + full-text) → prompt assembly → provider call with failover →
SSE stream → citation verification → one repair retry if the answer breaks its format
contract.

**Q: Why Next.js?**
One deployable unit for UI and API, streaming support built in, and server components let
me check the session on the server so protected pages never flash. It also keeps the
project to a single language.

**Q: Why Postgres and Kysely?**
Relational data fits the domain — users, conversations, messages, shares, cases, chunks —
and Postgres gives me full-text search with `tsvector` without adding a search cluster.
Kysely gives typed SQL with no ORM magic.

**Q: Why SSE instead of WebSockets?**
Traffic is unidirectional server→client per request. SSE is simpler, survives proxies
better, and works over plain HTTP/2 without a stateful connection layer.

**Q: What's the hardest part of the codebase?**
The chat route. It is an orchestrator: auth, limits, classification, retrieval, prompt
assembly, provider failover, streaming, post-processing and verification all meet there.
That concentration is also its weakness — it's ~2,846 lines and the first thing I'd split.

**Q: How would this scale to 10,000 users?**
Three changes: move rate limiting to Redis, add a queue or concurrency cap per provider,
and put retrieval behind a cached service. The app tier is already stateless, so horizontal
scaling is mostly config.

## C. Retrieval / RAG

**Q: Is this RAG?**
Yes, but lexical RAG: exact section lookup plus Postgres full-text retrieval. I deliberately
did not ship embeddings yet because lawyers ask in section numbers, and exact lookup is
both faster and deterministic.

**Q: Why not vector search?**
Two reasons. The corpus is too small for embeddings to pay off, and FTS gives explainable
retrieval — I can show you exactly which chunk matched. I have a pgvector path written but
it isn't wired in; enabling it without a way to measure recall would be cargo-culting.

**Q: What happens if retrieval returns nothing?**
The model answers from its own knowledge, and the verifier marks the citations it cannot
confirm. The answer degrades to "unverified" rather than silently pretending to be grounded.

**Q: How much context do you put in the prompt?**
A ranked slice, not everything. Unbounded context both costs money and dilutes attention —
and it makes prompt injection easier.

**Q: How do you handle the old/new section confusion?**
A 34-entry mapping table (IPC→BNS, CrPC→BNSS, Evidence→BSA) resolves both directions, so
"Section 302 IPC" surfaces BNS 103 and the user sees both.

## D. Hallucination and correctness

**Q: How do you stop it hallucinating?**
Three layers: retrieval constrains what it can cite, the prompt forbids citing outside the
supplied text, and post-generation verification marks anything that doesn't resolve. It
reduces fabrication; it does not eliminate it.

**Q: But your verification only checks that a section exists.**
Correct, and that's the key limitation. Existence is cheap and deterministic; entailment —
"does this section actually support this claim" — needs a second model or a human. That's
the next milestone, not a solved problem.

**Q: What's your measured accuracy?**
I don't claim one. The benchmark is a 50-question draft set without advocate review, and
until it's reviewed any precision number would be misleading. I have the harness and the
metrics defined; I'm missing the ground truth.

**Q: Give me a case where it fails.**
Ask it a conceptual question with no statutory vocabulary — "can my landlord keep my
deposit" — and lexical retrieval may miss the Transfer of Property Act entirely. It will
still answer, but unverified. That's the honest failure mode.

**Q: What about section renumbering mid-conversation?**
The mapping is applied at retrieval and surfaced in the answer, so a follow-up phrased in
old numbers still resolves.

## E. Data and corpus

**Q: Where does the statute text come from?**
Public bare-act text, parsed into section-level chunks and loaded into Postgres as
`legal_chunks`. Roughly 1,069 rows today.

**Q: Why is the coverage uneven?**
Because I prioritised the criminal-law transition — BNS and IPC are deep (460 and 563
chunks) — and the Contract Act for civil questions. BNSS and BSA are seeded but thin.

**Q: Is the data current?**
The BNS/IPC/BNSS/BSA text is the post-2023 recodification. Amendments after ingestion are
a maintenance problem I have not automated — that's a real gap for production use.

**Q: How do you keep the corpus updated?**
Today, manually. The right design is a versioned ingestion job with an effective-date
column per section, so an answer can cite the law as it stood on a given date. Not built.

## F. Security, privacy, ethics

**Q: Isn't this unauthorised practice of law?**
It's framed as legal information and research assistance, not legal advice, and the UI says
so. The line is real though: the more the tool looks like it's advising on *your* matter,
the closer it gets to UPL. That's why document drafting is templated rather than
bespoke advice.

**Q: What's your liability if it's wrong?**
Legally, disclaimers and terms shift some risk but don't eliminate it; professionally, the
real mitigation is verification status shown per citation plus an explicit "consult an
advocate" path. I'd want insurance and a reviewed disclaimer before any commercial launch.

**Q: How do you handle user data — case documents are sensitive.**
Uploads are capped, extracted text is truncated before it reaches a model, and documents
sit in a private bucket. Under India's DPDP Act 2023 I'd need explicit consent, retention
limits and deletion-on-request — partially implemented, not audited.

**Q: Do you send user queries to third-party model providers?**
Yes — that's inherent to using hosted inference. The honest position is that the privacy
policy must disclose it, and a professional-tier deployment should offer a self-hosted
model. Not currently offered.

**Q: How do you prevent prompt injection via uploaded documents?**
Uploaded text is treated as data, the system prompt states that instructions inside
documents are not to be followed, and the scope classifier blocks obvious meta-probes
before the model is called.

**Q: Can someone extract your system prompt?**
I refuse model-identity and prompt-disclosure questions in the classifier, before the
provider call, and the shared scope rules tell the model to decline. It raises the cost of
extraction; it doesn't make it impossible.

## G. Engineering quality

**Q: How do you know it works?**
676 tests, 627 passing, with CI enforcing typecheck, lint, coverage floors and a production
build on every push. The 49 skips are live-DB and live-deployment suites, skipped
explicitly rather than mocked into passing.

**Q: What's your coverage?**
Above the enforced floors of 46% statements / 40% branches / 55% functions / 47% lines.
Not high enough — the chat orchestrator is the weak spot because it's integration-heavy.

**Q: How do you test a streaming LLM endpoint?**
Provider calls are abstracted behind a registry and the verifier takes an injected lookup
function, so the deterministic parts are unit-tested. Live-path behaviour is covered by an
opt-in deployed smoke workflow, not by CI.

**Q: What's the worst code in the repo?**
`ChatApp.tsx`, ~9,700 lines. It accreted five modes and it should be five components. I'd
fix that before adding features.

**Q: What would break first under load?**
The in-memory rate limiter and the provider concurrency — both are per-instance, so two
instances double the real limit.

## H. Product and judgement

**Q: Why five modes instead of one?**
Because the output contract differs: a two-line answer, a structured analysis, an
interrogation, a drafted document and a review of someone else's document are different
products. One prompt doing all five does all five badly.

**Q: What did you cut?**
Billing, teams, and regional languages. All three are real needs, none were on the critical
path to proving the core claim — that grounded, verifiable answers are possible.

**Q: What's the business model?**
Freemium with a paid professional tier for document volume and export. There is no billing
code yet — the FAQ mentions a Plus plan that isn't built, which is a mistake I'd fix by
either building it or removing the claim.

**Q: What would you tell a lawyer considering using this?**
Use it for first-pass orientation and section discovery, then read the section it cites.
Treat unverified citations as leads, not conclusions.

## I. Hostile / trap questions

**Q: "So it's a wrapper around an API?"**
The generation is an API call; the product is everything around it — retrieval, the act
mapping, the citation verifier, the failover chain, and the mode contracts. Remove the
wrapper and you have a chatbot that fabricates sections.

**Q: "Your docs say 157 acts but you have six."**
Correct, and that's the distinction between resolution and coverage: 145 acts are
resolvable by name and alias, 6 have full text loaded. The docs conflate the two and I'd
tighten that wording.

**Q: "If the model is good enough, why bother with retrieval?"**
Because "good enough" is unauditable. Retrieval doesn't make the model smarter, it makes
the output checkable — that's the actual product requirement in law.

**Q: "Has a lawyer validated this?"**
No. The benchmark is draft and unreviewed, and I say so in the evidence doc. That
validation is the gating item before any claim of accuracy.

**Q: "What happens when the model provider goes down?"**
Three fallbacks across two vendors, each triggered by connect, first-token and mid-stream
timeouts, with short modes capped at 25 seconds total. If all fail, the user gets a clean
error, not a half-sentence.

**Q: "Isn't the disclaimer just a legal fig leaf?"**
Partly — disclaimers don't cure a wrong answer. What actually reduces risk is showing
verification status per citation and refusing to answer outside scope, which is why both
are enforced in code and not just in text.

**Q: "Why should I believe your numbers?"**
Don't. Every one is reproducible: `npm run test`, `npm run test:coverage`, `npm run
eval:legal`, and `/api/health` on the live deployment.

---

## 16. Five-minute demo script

1. **Homepage** — one sentence on the problem, then move on. Don't tour the landing page.
2. **Talk to AI** — "What is the punishment for theft under BNS?" → 2-line answer, then
   point at the citation status shown under it. *"That's the verifier, not the model."*
3. **Old→new mapping** — "What is Section 302 IPC now?" → BNS 103, both shown.
4. **Deep Analysis** — a question with two limbs (e.g. cheating vs criminal breach of
   trust) → show the structured, longer contract.
5. **Deliberate failure** — ask something outside the corpus and show the citation marked
   `act_not_resolved`. *"This is the part I'd demo to a sceptic."*
6. **Document Drafter** — generate a legal notice, then export to PDF.
7. **Share link** — share the conversation, show the immutable snapshot.
8. **Close** — "mapped 145 acts, grounded deeply in six, verifies every citation, and says
   so when it can't."

Have a tab open on `/api/health` and on `docs/evidence.md` in case he asks for proof.

---

## 17. Phrases to avoid

| Don't say | Say instead |
| --- | --- |
| "157+ bare acts indexed" | "145 acts mapped, six with full text loaded" |
| "Vector/semantic search" | "Postgres full-text plus exact section lookup" |
| "It's accurate / hallucination-free" | "Every citation gets a verification status; accuracy isn't claimed until the benchmark is reviewed" |
| "It's production-ready" | "It's deployed and hardened, with known gaps in corpus coverage and rate limiting" |
| "It uses S3 for the bare acts" | "Bare acts come from Postgres; S3 is for user documents" |
| "We have 1,000 users" | "107 registered users, 70 conversations — it's a working deployment, not a launched product" |
