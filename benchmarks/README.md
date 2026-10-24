# Legal QA benchmark data

`legal-qa.jsonl` is a **50-question seed set** for measuring legal citation
accuracy. Every row is currently `review_status: "draft"`. It has not been
reviewed by an advocate.

Run it with:

```bash
npm run eval:legal
```

Read [`docs/benchmark.md`](../docs/benchmark.md) for the schema, metrics,
citation verifier behaviour, and the review process.

## Ground rules

- Do not mark a question `reviewed` without a qualified Indian advocate checking
  the expected act, section, proposition, and trap terms.
- Add `reviewed_by` when you do.
- Keep IDs stable. Add a new ID instead of repurposing an existing one.
- Every non-refusal question must have at least one expected citation.
- Every refusal question must have `must_refuse: true` and no expected citation.
- Act keys must match the S3 bare-act folder names listed in
  `ACT_DEFINITIONS` in `lib/citation-verifier.ts`.
- Do not add a question just to make the score look better. Add questions that
  represent real user questions and real failure modes.

## Quick validation

The dataset is validated by `tests/legal-benchmark.test.ts`, which runs with the
normal test suite:

```bash
npm run test
```
