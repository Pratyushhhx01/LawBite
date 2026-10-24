# Legal accuracy benchmark

LawBite has a readability evaluation (`npm run eval`), but readability is not
legal correctness. This benchmark measures whether answers cite the right
provision and whether the cited provision actually exists in the bare-act
knowledge base.

## Current status

- **Production blocker (2026-10-24):** a smoke run returned
  `InvalidAccessKeyId (HTTP 403)` from S3 for
  `bare-acts/bharatiya-nyaya-sanhita/full.txt`. The AWS credentials configured
  in Vercel are invalid, so the app is currently answering from model knowledge
  rather than the bare-act knowledge base. Until the credentials are rotated,
  citation verification correctly reports `lookup_error` and the benchmark
  reports precision/hallucination as `n/a`, not 0%.
- **Seed set:** 50 questions in [`benchmarks/legal-qa.jsonl`](../benchmarks/legal-qa.jsonl).
- **Review status:** all questions are marked `draft`. They have **not** been
  reviewed by an advocate yet.
- **Purpose:** engineering regression testing and a transparent starting point
  for advocate review.
- **Do not** publish the score as a legal-accuracy claim until the dataset has
  been reviewed and the review status is updated.

The seed set covers criminal law, criminal procedure, evidence, constitutional
law, family law, property and contract, cyber/data law, corporate/labour/tax
law, environmental law, and refusal boundaries. It includes deliberate traps:

- BNS 302 is **not** the murder provision; IPC 302 is.
- Article 302 of the Constitution is about restrictions on trade and commerce.
- A cross-act question that requires both BNS 103 and IPC 302.

## How to run

Start the app, then run:

```bash
npm run eval:legal
```

Useful variants:

```bash
npm run eval:legal -- --limit 10
npm run eval:legal -- --id bns-103-murder,trap-const-302
npm run eval:legal -- --reviewed-only
npm run eval:legal -- --base https://law-bite.vercel.app
npm run eval:legal -- --fail-under 80
```

The script:

1. Creates a disposable Better Auth test session.
2. Sends each question to the real `/api/chat` endpoint.
3. Collects the streamed answer and structured citations.
4. Calls `/api/citations/verify` to check every section citation against S3.
5. Writes `test-results/legal-eval-report.md` and
   `test-results/legal-eval-report.json`.

`test-results/` is git-ignored. Copy a run into `docs/` only when you want to
publish a specific, dated result.

## Metrics

| Metric                       | Meaning                                                                                                                                                                 |
| ---------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Section recall**           | Of the expected provisions, how many appeared in the answer's citations.                                                                                                |
| **Citation precision**       | Of all _verifiable_ section citations, how many exist in the bare act.                                                                                                  |
| **Hallucination rate**       | `1 - citation precision`.                                                                                                                                               |
| **Verification unavailable** | Questions where S3 could not be reached, so precision and hallucination are `n/a` instead of a false 0%.                                                                |
| **Content accuracy**         | Required terms are present and forbidden trap phrases are absent.                                                                                                       |
| **Refusal accuracy**         | Non-Indian-law and non-legal questions are refused; in-scope questions are not.                                                                                         |
| **Pass**                     | For legal questions: score ≥ 80, all expected sections found, verification available, and zero unverified section citations. For refusal questions: the answer refused. |
| **p95 latency**              | 95th percentile end-to-end chat latency.                                                                                                                                |

The overall score is a weighted engineering signal:

- 40% section recall
- 25% citation precision
- 20% content checks
- 15% refusal correctness

It is not a substitute for a lawyer's judgment. A verified section can still be
misapplied, and a correct answer can use different wording than the expected
terms.

## Dataset schema

Each line is one JSON object:

```json
{
  "id": "bns-103-murder",
  "category": "criminal",
  "mode": "analysis",
  "question": "What is the punishment for murder under the Bharatiya Nyaya Sanhita?",
  "expected_act_key": "bharatiya-nyaya-sanhita",
  "expected_sections": ["103"],
  "must_include": ["murder"],
  "must_not_include": [],
  "must_refuse": false,
  "difficulty": "easy",
  "review_status": "draft",
  "reviewed_by": null,
  "notes": "Core BNS mapping from IPC 302."
}
```

For a question that needs multiple acts, use `expected_citations`:

```json
{
  "id": "bns-103-vs-ipc-302",
  "category": "criminal",
  "question": "What is the difference between BNS Section 103 and IPC Section 302?",
  "expected_citations": [
    { "actKey": "bharatiya-nyaya-sanhita", "section": "103" },
    { "actKey": "ipc", "section": "302" }
  ],
  "must_include": ["murder"],
  "review_status": "draft",
  "reviewed_by": null
}
```

Fields:

- `id` — unique, stable identifier.
- `category` — reporting bucket.
- `mode` — one of `talk-to-ai`, `chat`, `analysis`, `grill`, `draft`, `review`.
- `question` — the exact user prompt.
- `expected_act_key` / `expected_sections` — expected S3 act key and section(s).
- `expected_citations` — use instead of the two fields above for multi-act questions.
- `must_include` — terms that must appear in the answer (case/punctuation insensitive).
- `must_not_include` — trap phrases that must not appear.
- `must_refuse` — `true` for out-of-scope questions.
- `difficulty` — `easy`, `medium`, or `hard`.
- `review_status` — `draft` or `reviewed`.
- `reviewed_by` — advocate name or identifier once reviewed.
- `notes` — why the question exists.

Act keys must match the S3 bare-act folder names. The canonical list lives in
`ACT_DEFINITIONS` in [`lib/citation-verifier.ts`](../lib/citation-verifier.ts).

## Citation verifier

[`lib/citation-verifier.ts`](../lib/citation-verifier.ts) normalises citations
from two places:

1. The structured `citations` array emitted by the chat SSE stream.
2. Inline text such as `Section 103 of the BNS`, `BNS s. 103`,
   `Article 21 of the Constitution`, or `s. 138 NI Act`.

It resolves the act name to an S3 key, tries the exact section and its base
section (for example `2(h)` → `2`), and returns one of:

- `verified`
- `section_not_found`
- `act_not_resolved`
- `section_not_parsed`
- `reference_not_section`
- `web_source`
- `untrusted_web_source`
- `lookup_error`

Reference-only citations (for example a limitation-period table) are excluded
from section precision. Web citations are checked against the trusted-source
gate, not against a bare act.

The verifier is exposed at `POST /api/citations/verify` for the benchmark and
for future UI trust badges. It is authenticated and rate-limited.

## Expanding to a publishable benchmark

The seed set is intentionally small enough to review carefully. A publishable
benchmark should reach 150–250 questions with this process:

1. **Draft** — add questions with expected act keys, sections, and trap terms.
2. **Advocate review** — a qualified Indian advocate checks the expected
   provision, the legal proposition, and the trap terms.
3. **Record review** — set `review_status` to `reviewed`, add `reviewed_by`, and
   note the review date.
4. **Run reviewed-only** — `npm run eval:legal -- --reviewed-only`.
5. **Freeze a version** — tag the dataset and keep the dated report.
6. **Re-run on every model, prompt, retrieval, or provider change.**

Useful additions:

- more state-specific and procedural questions;
- questions where the correct answer is “the section does not apply”;
- questions with multiple possible correct sections;
- questions that require distinguishing old IPC/CrPC/Evidence Act law from
  BNS/BNSS/BSA;
- at least two independent reviewers for a subset, so inter-annotator agreement
  can be reported.

## Limitations

- The seed set is not advocate-reviewed.
- A single run is noisy; model providers and prompts change.
- S3 availability affects verification. A `lookup_error` is an infrastructure
  failure, not proof that the model hallucinated.
- The benchmark checks section existence and a small set of content terms. It
  does not yet grade reasoning quality, nuance, or whether the cited section is
  the best fit.
- Refusal questions are a small sample and should be expanded before drawing
  broad safety conclusions.

## Related files

- [`benchmarks/legal-qa.jsonl`](../benchmarks/legal-qa.jsonl) — dataset.
- [`scripts/legal-eval.mjs`](../scripts/legal-eval.mjs) — runner and report.
- [`lib/citation-verifier.ts`](../lib/citation-verifier.ts) — verifier.
- [`app/api/citations/verify/route.ts`](../app/api/citations/verify/route.ts) — API.
- [`tests/citation-verifier.test.ts`](../tests/citation-verifier.test.ts) — verifier tests.
- [`tests/legal-benchmark.test.ts`](../tests/legal-benchmark.test.ts) — dataset integrity tests.
