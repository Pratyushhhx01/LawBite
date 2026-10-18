# S3 Knowledge Base — Gap Analysis & Remediation Plan

## Current State

| Metric                           | Value              |
| -------------------------------- | ------------------ |
| Acts referenced in `actMap`      | 144 unique S3 keys |
| Acts with data in S3             | 60 (42%)           |
| Acts missing from S3 (LLM alone) | 84 (58%)           |
| Acts with parsed sections        | ~55                |
| Acts with placeholder full.txt   | 6                  |
| Reference data files             | 4 — all MISSING    |

## Problem Classification (3 tiers)

### Tier 1 — Critical (placeholder acts that waste S3 calls)

These acts exist in the S3 index but have **0 sections and near-empty `full.txt`**. The code hits S3, finds `index.json`, then returns nothing useful — worse than missing because it wastes an API call and produces empty context.

| Act                                | full.txt size | Sections | What's wrong                |
| ---------------------------------- | ------------- | -------- | --------------------------- |
| `revision-of-courts`               | **6 bytes**   | 0        | Effectively empty           |
| `public-administration`            | 100 bytes     | 0        | Effectively empty           |
| `prisoner-rights`                  | 88 bytes      | 0        | Effectively empty           |
| `fundamental-rules`                | 592 bytes     | 0        | Placeholder stub            |
| `code-of-civil-procedure`          | 530 bytes     | 0        | Placeholder stub            |
| `cyber-law-forensics`              | 480 bytes     | 0        | Placeholder stub            |
| `jurisdiction-structure-of-courts` | 14,496 bytes  | 0        | Has content but no sections |

**Fix:** Replace each `full.txt` with the actual bare act text, generate `_sections.json`, and optionally create `sections/{N}.json` files. Or remove from `_index.json` if the act won't be ingested.

---

### Tier 2 — Quick Win (reference data — 4 files, ~30 min)

The `getLegalKnowledge` function checks for reference data at `route.ts:653-666` but all 4 reference paths return null:

| S3 Key               | `reference/` file                   | Status  |
| -------------------- | ----------------------------------- | ------- |
| `bailable-offenses`  | `reference/bailable-offenses.json`  | MISSING |
| `limitation-periods` | `reference/limitation-periods.json` | MISSING |
| `writ-types`         | `reference/writ-types.json`         | MISSING |
| `court-hierarchy`    | `reference/court-hierarchy.json`    | MISSING |

These are small structured JSON files. The code already handles absence gracefully (empty string appended), but providing this data gives the LLM structured reference tables (e.g., which offenses are bailable, limitation periods for different case types).

**Fix:** Create and upload 4 small JSON files to `reference/{key}.json`.

**Example structure for `reference/bailable-offenses.json`:**

```json
[
  { "offense": "Dowry death (IPC 304B)", "bailable": false },
  { "offense": "Theft (IPC 379)", "bailable": true }
]
```

---

### Tier 3 — Content Gap (84 acts with no S3 data)

These acts are in `actMap` / `fullTextActs` but have zero S3 objects. When a user queries these, `getLegalKnowledge` returns empty string, and the LLM responds from training data alone.

#### By category (gaps only):

**Criminal Law (7/12 missing):**
`ipc`, `crpc`, `evidence-act`, `arms-act`, `dowry-prohibition-act`, `uapa-act`, `pmla-act`, `explosive-substances-act`, `prevention-of-corruption-amended-act`, `armed-forces-special-powers-act`

**Family Law (14/17 missing):**
`hindu-marriage-act`, `special-marriage-act`, `hindu-adoption-maintenance-act`, `hindu-minority-guardianship-act`, `muslim-personal-law-act`, `dissolution-of-muslim-marriages-act`, `indian-divorce-act`, `indian-christian-marriage-act`, `parsi-marriage-divorce-act`, `prohibition-child-marriage-act`, `guardian-wards-act`, `maintenance-parents-senior-citizens-act`, `consumer-protection-act`

**Environmental Law (7/7 missing):**
`wildlife-protection-act`, `forest-conservation-act`, `water-act`, `air-act`, `national-green-tribunal-act`, `biological-diversity-act`, `environment-protection-act`

**Corporate & Business (8/9 missing):**
`competition-act`, `sebi-act`, `fema-act`, `fema-non-pci-act`, `msme-act`, `benami-transactions-act`, `black-money-act`, `rera`

**Labour & Employment (2/8 missing):**
`factories-act`, `essential-commodities-act`

**Constitutional Reference (4/4 missing):**
`fundamental-rights`, `dpsp-fundamental-duties`, `constitutional-schedules`, `constitutional-parts`

**Reference & Practical Guides (12/12 missing):**
`landmark-judgments`, `more-landmark-judgments`, `constitutional-amendments`, `legal-reference`, `legal-dictionary`, `court-hierarchy-procedure`, `indian-legal-system`, `practical-guides`, `practical-guides-2`, `practical-guides-3`, `practical-guides-4`

**Pre-existing S3 KB Acts (19/19 missing):**
`arbitration-act`, `negotiable-instruments-act`, `limitation-act`, `companies-act`, `motor-vehicles-act`, `sale-of-goods-act`, `ndps-act`, `copyright-act`, `juvenile-justice-act`, `pocso-act`, `registration-act`, `indian-stamp-act`, `indian-partnership-act`, `sc-st-act`, `trade-marks-act`, `sarfaesi-act`, `prevention-of-corruption-act`, `ibc`, `banking-regulation-act`

**Others:** `constitution`, `posh-act`, `maternity-benefit-act`, `mental-healthcare-act`, `national-food-security-act`, `rpwd-act`, `child-labour-act`, `larr-act`, `lokpal-act`, `food-safety-standards-act`, `drugs-cosmetics-act`, `dpdp-act`, `aadhaar-act`, `right-to-information-act`, `patents-act`, `geographical-indications-act`, `rbi-act`, `irdai-act`, `contempt-of-courts-act`, `official-secrets-act`, `passport-act`, `indian-telegraph-act`, `census-act`, `epidemic-diseases-act`

---

## Recommended Action Plan

### Phase 1 — Fix the quick wins (est. 1-2 hours)

| Step | Action                   | Details                                                                                                                                                                      |
| ---- | ------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1.1  | Upload 4 reference JSONs | `reference/bailable-offenses.json`, `limitation-periods.json`, `writ-types.json`, `court-hierarchy.json`                                                                     |
| 1.2  | Fix placeholder acts     | Replace `full.txt` for `revision-of-courts`, `public-administration`, `prisoner-rights` with real bare act text                                                              |
| 1.3  | Prune dead code          | Remove entries from `actMap` and `fullTextActs` in `route.ts` for acts you don't plan to ingest in the next sprint. This prevents wasted S3 calls and makes the gap explicit |

### Phase 2 — High-priority ingestion (est. 1-2 days)

Priority order based on user query frequency:

| Priority | Acts                                                             | Why                                                                               |
| -------- | ---------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| P0       | `ipc`, `crpc`, `evidence-act`                                    | Foundation of all criminal law queries; IPC/BNS overlap is confusing without both |
| P1       | `constitution`, `fundamental-rights`, `dpsp-fundamental-duties`  | Constitutional law is the most common legal query category                        |
| P2       | `companies-act`, `arbitration-act`, `negotiable-instruments-act` | "Pre-existing" acts that the code already assumes are in S3                       |

### Phase 3 — Bulk ingestion (est. 1 week)

Process remaining 60+ acts using the same pipeline that produced the existing 60:

1. Source bare act texts (India Code / legislative.gov.in) as plain text
2. Parse into sections with heading detection
3. Upload to S3: `bare-acts/{id}/index.json`, `_sections.json`, `full.txt`, `sections/{N}.json`
4. Update `_index.json`

### Phase 4 — Ongoing maintenance

1. **Run the test** (`npx vitest run tests/s3/acts.test.ts`) after every ingestion batch
2. **Keep `actMap` in sync** — when a new act is uploaded, add its keyword triggers to `actMap`
3. **Monitor** — the test acts as a living gap analysis. Aim for <10% missing

---

## How to upload a single act to S3

Use the `s3kb` module or direct S3 CLI:

```bash
# Required files per act:
# bare-acts/{id}/index.json
# bare-acts/{id}/_sections.json
# bare-acts/{id}/full.txt
# bare-acts/{id}/sections/{section}.json (optional, parsed from full.txt)

# Upload example:
aws s3 cp ./bns/full.txt s3://lawbite-app-storage/bare-acts/bharatiya-nyaya-sanhita/full.txt
aws s3 cp ./bns/_sections.json s3://lawbite-app-storage/bare-acts/bharatiya-nyaya-sanhita/_sections.json
aws s3 cp ./bns/index.json s3://lawbite-app-storage/bare-acts/bharatiya-nyaya-sanhita/index.json
```

The `index.json` format:

```json
{
  "id": "bharatiya-nyaya-sanhita",
  "title": "Bharatiya Nyaya Sanhita, 2023",
  "totalSections": 332,
  "source": "legislative.gov.in"
}
```

The `_sections.json` format (array of `{section, title}`):

```json
[
  { "section": "1", "title": "Short title, commencement and application" },
  { "section": "2", "title": "Definitions" }
]
```
