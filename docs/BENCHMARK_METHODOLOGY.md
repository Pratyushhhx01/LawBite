# Legal AI Benchmark Methodology

## 1. Overview
The LawBite Legal AI Benchmark is an open, automated evaluation suite engineered to assess statutory recall, citation precision, temporal legal reasoning, and adversarial trap resistance across Indian jurisprudence.

Unlike generic language model benchmarks (e.g., MMLU, GSM8K) which test broad trivia or mathematical computation, this benchmark specifically evaluates Indian legal fidelity under parliamentary statutes, Supreme Court doctrines, and procedural codes.

---

## 2. Benchmark Corpus Taxonomy

The evaluation dataset (`benchmarks/legal-qa.jsonl`) comprises 200 carefully calibrated questions distributed across ten core legal domains:

1. **Substantive Penal Law (BNS & IPC):** 30 questions covering bodily offenses, property offenses, sexual offenses, and state security under both BNS 2023 and IPC 1860.
2. **Criminal Procedure (BNSS & CrPC):** 25 questions covering arrest powers, police custody vs judicial custody limits, anticipatory bail, regular bail, zero FIRs, and inherent powers under Section 482 BNSS / 528 BNSS.
3. **Law of Evidence (BSA & IEA):** 20 questions evaluating digital evidence admissibility (Section 61/63 BSA vs 65B IEA), dying declarations, confessions to police officers, and burden of proof.
4. **Constitutional Law & Fundamental Rights:** 25 questions testing Articles 14, 19, 21, 22, 32, 226, writ jurisdictions, basic structure doctrine, and preventive detention.
5. **Commercial, Contract & Corporate Law:** 25 questions on Indian Contract Act 1872 (§§23, 27, 28, 73, 74), Specific Relief Act 1963, and Companies Act 2013 (§§135, 149, 166).
6. **Insolvency & Bankruptcy (IBC 2016):** 15 questions on Section 7/9 CIRP initiation, moratorium under Section 14, committee of creditors, and waterfall mechanisms under Section 53.
7. **Negotiable Instruments & Cheque Bounce:** 15 questions covering Section 138 NI Act ingredients, statutory 15-day notice requirements, Section 141 vicarious liability, and Sections 143A/148 interim compensation.
8. **Cyber Law & Data Protection (IT Act & DPDP Act 2023):** 15 questions testing data fiduciary obligations, consent managers, penalties under DPDP Section 33, and IT Act Section 66D/67.
9. **Family & Personal Law:** 15 questions covering Hindu Marriage Act 1955, Special Marriage Act 1954, Maintenance under Section 144 BNSS / Section 125 CrPC, and Domestic Violence Act 2005.
10. **Adversarial & Temporal Trap Cases:** 15 questions designed to catch cross-code confusion (e.g. BNS 302 snatching vs IPC 302 murder) and constitutional non-retroactivity boundaries.

---

## 3. Data Format Specification

Each entry in `benchmarks/legal-qa.jsonl` follows a strict JSON Lines schema:

```json
{
  "id": "bns-103-murder",
  "domain": "Penal Law",
  "query": "What is the provision for punishment for murder under the Bharatiya Nyaya Sanhita, 2023?",
  "ground_truth_sections": ["Section 103", "BNS"],
  "historical_counterpart": ["Section 302", "IPC"],
  "is_trap": false,
  "difficulty": "standard",
  "expected_keywords": ["death", "imprisonment for life", "fine"]
}
```

---

## 4. Evaluation Engine Architecture (`scripts/legal-eval.mjs`)

The evaluation script runs in Node.js and processes benchmark questions sequentially or in controlled concurrency batches:

```
┌──────────────────────────────────────┐
│  benchmarks/legal-qa.jsonl           │
└──────────────────┬───────────────────┘
                   │
                   ▼
┌──────────────────────────────────────┐
│  Harness (scripts/legal-eval.mjs)    │
│  - Formats prompt                    │
│  - Calls AI Provider / Mock Engine   │
│  - Measures TTFT & Total Latency     │
└──────────────────┬───────────────────┘
                   │
                   ▼
┌──────────────────────────────────────┐
│  Deterministic Citation Verifier     │
│  - Extracts "Section X Act Y"        │
│  - Verifies presence in Bare Acts    │
└──────────────────┬───────────────────┘
                   │
                   ▼
┌──────────────────────────────────────┐
│  Scoring & Aggregation Engine        │
│  - Section Recall Calculator         │
│  - Citation Precision Evaluator      │
│  - Trap Case Pass/Fail Analyzer      │
└──────────────────┬───────────────────┘
                   │
                   ▼
┌──────────────────────────────────────┐
│  Console Summary & JSON Artifact     │
│  (benchmarks/results/latest.json)    │
└──────────────────────────────────────┘
```

---

## 5. Scoring Metrics & Criteria

### 5.1 Section Recall (Binary Grounding)
A question is scored as a recall hit ($1.0$) if all mandatory `ground_truth_sections` appear in the generated output text. If only a subset appear, partial credit is awarded proportionally:
$$\text{Hit Rate} = \frac{|\text{Retrieved} \cap \text{Ground Truth}|}{|\text{Ground Truth}|}$$

### 5.2 Citation Authenticity & Precision
Extracted citations are validated against the 157+ indexed Acts. Any citation referencing a non-existent section number in an enacted law is logged as an unverified/hallucinated citation.

### 5.3 Adversarial Trap Accuracy
Trap cases are strictly binary:
- **Pass (1.0):** Model explicitly identifies the distinction or refuses the false premise.
- **Fail (0.0):** Model falls into the confusion trap (e.g., claiming Section 302 BNS is murder).

---

## 6. How to Run the Benchmark Locally

```bash
# Run the evaluation suite
npm run eval:legal

# Run with specific sample limit
node scripts/legal-eval.mjs --limit=25
```
