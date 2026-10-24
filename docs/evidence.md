# Engineering evidence pack

This page collects the checks a reviewer can run, the claims they support, and
the limitations that are still open. It is intentionally factual: no score is
claimed for legal accuracy while the benchmark is draft and S3 verification is
unavailable.

## What is verified

| Area | Evidence | How to reproduce |
| --- | --- | --- |
| Type safety | TypeScript strict mode passes | `npm run typecheck` |
| Lint | ESLint flat config passes with no warnings | `npm run lint` |
| Unit and integration tests | 515 passed, 44 skipped across 26 files | `npm run test` |
| Coverage | Local run: 50.8% statements, 46.5% branches, 60.7% functions, 51.4% lines. CI enforces floors of 46/40/55/47. | `npm run test:coverage` |
| Production build | Next.js 16.4.3 build succeeds | `npm run build` |
| Dependency audit | 0 known vulnerabilities; CI fails on high or critical advisories | `npm run audit` |
| Browser hardening | HSTS, `nosniff`, frame denial, referrer policy, permissions policy, and COOP on every route | `tests/security-headers.test.ts` |
| CI | Audit, typecheck, lint, coverage, and build on pushes and PRs | `.github/workflows/ci.yml` |
| Deployed smoke | Manual workflow signs up a throwaway user and drives the live SSE chat path | `.github/workflows/deployed-smoke.yml` |
| Legal benchmark harness | 50 seeded questions, citation verifier, recall/precision/refusal/latency report | `npm run eval:legal` |
| S3 diagnosis | Credential, bucket, region, and read-access check with actionable errors | `npm run check:s3` |

The 44 skipped tests are live-database and live-deployment suites. CI sets
`CI_SKIP_DB_TESTS=1` so it never pretends to have a database it does not have.
The deployed smoke workflow is the separate opt-in path for a real environment.

## Architecture evidence

- `app/api/chat/route.ts` is the orchestration layer. Prompts and act mappings
  were extracted to `lib/chat-prompts.ts` and `lib/act-map.ts`.
- Pure query classification lives in `lib/chat-filters.ts` and has its own tests.
- Provider selection and failover live in `lib/ai-providers.ts`.
- Citation parsing and S3 verification live in `lib/citation-verifier.ts` and are
  tested with an injected lookup, so unit tests never need real S3.
- See [`architecture.md`](architecture.md) for the request flow and module
  boundaries.

## Legal accuracy evidence

- The benchmark is a **50-question draft seed set**, not an advocate-reviewed
  exam. Every row is `review_status: "draft"`.
- The runner checks section recall, citation precision, hallucination rate,
  refusal accuracy, content terms, and p95 latency.
- A `lookup_error` is reported as verification unavailable, not as a
  hallucination. When nothing is verifiable, precision and hallucination are
  `n/a`, not 0%.
- Production currently returns `InvalidAccessKeyId (HTTP 403)` for the BNS full
  text. Until AWS credentials are rotated, the app answers from model knowledge
  and the benchmark cannot produce a meaningful citation-precision score.
- See [`benchmark.md`](benchmark.md) and [`runbook-s3.md`](runbook-s3.md).

## Security evidence

- Better Auth is pinned to `1.6.33`, which contains the account-takeover fix
  without the 1.7 `account.issuer` schema change.
- `/api/chat` requires a session, caps messages and message length, and applies a
  per-user rate limit.
- `/api/citations/verify` requires a session, caps input, and rate-limits
  verification.
- S3 logging records the error class and HTTP status, not credentials or signed
  URLs.
- See [`security.md`](security.md) for the dependency policy and known
  in-memory rate-limit limitation.

## Known limitations

1. **S3 is unavailable in production.** This is a credential/IAM problem, not a
   code path that can be fixed by the test suite. The diagnostic and runbook
   above make the fix repeatable.
2. **The benchmark is not advocate-reviewed.** Do not publish its score as a
   legal-accuracy claim yet.
3. **`app/chat/_components/ChatApp.tsx` is still the largest client module.**
   The next refactor should split message list, composer, attachment picker,
   citation badge, and share/export controls without changing desktop or mobile
   attachment behavior.
4. **Rate limiting is per instance.** It is best-effort abuse control, not a
   distributed quota.
5. **No distributed tracing or metrics backend.** Logs are structured enough for
   request diagnosis, but there is no trace ID propagated from the browser
   through the provider call.

## What would count as a stronger claim

- Rotate S3 credentials and run the full benchmark with verification available.
- Get the 50 questions reviewed by a qualified Indian-law reviewer and update
  `review_status` and reviewer metadata.
- Add a client-side split of `ChatApp.tsx` with tests for the attachment sheet
  and citation badge.
- Add a shared rate-limit store and a request trace ID if the app is deployed at
  more than one instance.

Until then, the honest claim is: the engineering controls and benchmark harness
are in place; the legal-accuracy claim is blocked on credentials and human
review.
