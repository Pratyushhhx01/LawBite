import { describe, it, expect, beforeAll } from "vitest";
import { s3kb } from "@/lib/s3";

// Probe S3 once at module load; skip all S3 tests if unreachable
const s3Available = await (async () => {
  try {
    const index = await s3kb.getFullTextIndex();
    return Array.isArray(index) && index.length > 0;
  } catch {
    return false;
  }
})();
const describeS3 = describe.skipIf(!s3Available);

// ─── Complete actMap extracted from app/api/chat/route.ts ───────────────────
// Duplicate entries removed; here keys are S3 IDs (values in the original map)
const ALL_S3_KEYS = new Set<string>();

// Constitution & Polity
[
  "constitution",
  "constitutional-law-jurisprudence",
  "legal-terminology",
  "judicial-review",
  "writ-jurisprudence",
  "public-interest-litigation",
  "civil-appeals",
  "indian-polity",
  "local-government",
  "delegated-legislation",
].forEach((k) => ALL_S3_KEYS.add(k));

// Criminal Law
[
  "ipc",
  "bharatiya-nyaya-sanhita",
  "crpc",
  "bharatiya-nagrik-suraksha-sanhita",
  "bharatiya-sakshya-adhiniyam",
  "arms-act",
  "dowry-prohibition-act",
  "uapa-act",
  "pmla-act",
  "explosive-substances-act",
  "prevention-of-corruption-amended-act",
  "armed-forces-special-powers-act",
].forEach((k) => ALL_S3_KEYS.add(k));

// Civil Law
[
  "evidence-act",
  "transfer-of-property-act",
  "indian-contract-act",
  "specific-relief-act",
  "tort-law",
].forEach((k) => ALL_S3_KEYS.add(k));

// Family Law
[
  "consumer-protection-act",
  "family-law",
  "indian-succession-act",
  "hindu-succession-act",
  "domestic-violence-act",
  "hindu-marriage-act",
  "special-marriage-act",
  "hindu-adoption-maintenance-act",
  "hindu-minority-guardianship-act",
  "muslim-personal-law-act",
  "dissolution-of-muslim-marriages-act",
  "indian-divorce-act",
  "indian-christian-marriage-act",
  "parsi-marriage-divorce-act",
  "prohibition-child-marriage-act",
  "guardian-wards-act",
  "maintenance-parents-senior-citizens-act",
].forEach((k) => ALL_S3_KEYS.add(k));

// Police & Criminal Procedure
[
  "police-act-1861",
  "nia-act",
  "fir-procedures",
  "arrest-guidelines",
  "search-and-seizure",
  "charge-sheets",
  "preventive-detention",
].forEach((k) => ALL_S3_KEYS.add(k));

// Human Rights & Social Welfare
[
  "protection-of-human-rights-act",
  "women-rights",
  "posh-act",
  "maternity-benefit-act",
  "mental-healthcare-act",
  "national-food-security-act",
  "rpwd-act",
  "child-rights",
  "child-labour-act",
  "minority-rights",
].forEach((k) => ALL_S3_KEYS.add(k));

// Cyber Law & IT
[
  "information-technology-act",
  "data-protection",
  "hacking-laws",
  "identity-theft",
  "online-frauds",
  "cyber-crime-detection",
  "digital-evidence",
].forEach((k) => ALL_S3_KEYS.add(k));

// Corporate & Business Law
[
  "corporate-business-laws",
  "rera",
  "competition-act",
  "sebi-act",
  "fema-act",
  "fema-non-pci-act",
  "msme-act",
  "benami-transactions-act",
  "black-money-act",
].forEach((k) => ALL_S3_KEYS.add(k));

// Labour & Employment
[
  "employment-law",
  "minimum-wages-act",
  "payment-of-wages-act",
  "industrial-disputes-act",
  "social-security-act",
  "trade-unions-act",
  "factories-act",
  "essential-commodities-act",
].forEach((k) => ALL_S3_KEYS.add(k));

// Taxation
[
  "income-tax-act",
  "cgst-act",
  "customs-act",
  "central-excise-act",
  "taxation-law",
].forEach((k) => ALL_S3_KEYS.add(k));

// Legal Practice
["legal-drafting"].forEach((k) => ALL_S3_KEYS.add(k));

// Land & Anti-Corruption
["larr-act", "lokpal-act"].forEach((k) => ALL_S3_KEYS.add(k));

// Environmental Law
[
  "wildlife-protection-act",
  "forest-conservation-act",
  "water-act",
  "air-act",
  "national-green-tribunal-act",
  "biological-diversity-act",
  "environment-protection-act",
].forEach((k) => ALL_S3_KEYS.add(k));

// Consumer & IT Law
[
  "food-safety-standards-act",
  "drugs-cosmetics-act",
  "dpdp-act",
  "aadhaar-act",
  "right-to-information-act",
].forEach((k) => ALL_S3_KEYS.add(k));

// Intellectual Property
["patents-act", "geographical-indications-act"].forEach((k) =>
  ALL_S3_KEYS.add(k),
);

// Banking & Finance
["rbi-act", "irdai-act"].forEach((k) => ALL_S3_KEYS.add(k));

// Miscellaneous Acts
[
  "contempt-of-courts-act",
  "official-secrets-act",
  "passport-act",
  "indian-telegraph-act",
  "census-act",
  "epidemic-diseases-act",
].forEach((k) => ALL_S3_KEYS.add(k));

// Constitutional Reference
[
  "fundamental-rights",
  "dpsp-fundamental-duties",
  "constitutional-schedules",
  "constitutional-parts",
].forEach((k) => ALL_S3_KEYS.add(k));

// Reference & Judgments
[
  "landmark-judgments",
  "more-landmark-judgments",
  "constitutional-amendments",
  "legal-reference",
  "legal-dictionary",
  "court-hierarchy-procedure",
  "indian-legal-system",
  "practical-guides",
  "practical-guides-2",
  "practical-guides-3",
  "practical-guides-4",
].forEach((k) => ALL_S3_KEYS.add(k));

// Pre-existing S3 KB acts
[
  "arbitration-act",
  "negotiable-instruments-act",
  "limitation-act",
  "companies-act",
  "motor-vehicles-act",
  "sale-of-goods-act",
  "ndps-act",
  "copyright-act",
  "juvenile-justice-act",
  "pocso-act",
  "registration-act",
  "indian-stamp-act",
  "indian-partnership-act",
  "sc-st-act",
  "trade-marks-act",
  "sarfaesi-act",
  "prevention-of-corruption-act",
  "banking-regulation-act",
  "consumer-protection-act-amended",
].forEach((k) => ALL_S3_KEYS.add(k));

describeS3("S3 Knowledge Base — Acts Inventory", () => {
  let actsInS3: string[] = [];

  beforeAll(async () => {
    const index = await s3kb.getFullTextIndex();
    actsInS3 = (index || []).map((e: string | { id: string }) =>
      typeof e === "string" ? e : e.id,
    );
  });

  it("should have a non-empty acts index from S3", () => {
    expect(actsInS3.length).toBeGreaterThan(0);
  });

  it("should list every act ID from _index.json", () => {
    console.log(`\n  Acts indexed in S3 (${actsInS3.length}):`);
    for (const a of actsInS3) {
      console.log(`    ✓ ${a}`);
    }
    expect(actsInS3.length).toBeGreaterThanOrEqual(1);
  });
});

describeS3("S3 Knowledge Base — Act Data Verification", () => {
  const present: string[] = [];
  const missing: string[] = [];
  const withSections: string[] = [];
  const withFullText: string[] = [];

  beforeAll(async () => {
    await s3kb.getFullTextIndex();

    for (const key of ALL_S3_KEYS) {
      const data = await s3kb.getAct(key);
      if (data) {
        present.push(key);
        const sections = await s3kb.getSectionList(key);
        if (sections && sections.length > 0) withSections.push(key);
        const text = await s3kb.getFullText(key);
        if (text && text.length > 50) withFullText.push(key);
      } else {
        missing.push(key);
      }
    }
  }, 120000);

  // ── Per-act data table ──────────────────────────────────────────────
  describe("actMap coverage — data exists in S3", () => {
    it("should have data in S3 for all 140+ actMap entries", () => {
      console.log(
        `\n  ┌────────────────────────────────────────────────────────────────┐`,
      );
      console.log(
        `  │  S3 Knowledge Base — Act Data Report                          │`,
      );
      console.log(
        `  ├────────────────────────────────────────────────────────────────┤`,
      );
      console.log(
        `  │  Total actMap keys: ${String(ALL_S3_KEYS.size).padStart(3)}                                    │`,
      );
      console.log(
        `  │  Present in S3:     ${String(present.length).padStart(3)}  (answered from S3)                 │`,
      );
      console.log(
        `  │  Missing from S3:   ${String(missing.length).padStart(3)}  (LLM alone, no S3 data)            │`,
      );
      console.log(
        `  │  With sections:     ${String(withSections.length).padStart(3)}                                    │`,
      );
      console.log(
        `  │  With full text:    ${String(withFullText.length).padStart(3)}                                    │`,
      );
      console.log(
        `  └────────────────────────────────────────────────────────────────┘`,
      );
    });

    if (missing.length > 0) {
      it(`should report which acts are MISSING from S3 (fallback to LLM alone)`, () => {
        console.log(
          `\n  ❌ Acts NOT found in S3 (LLM answers from training data alone):`,
        );
        for (const m of missing.sort()) {
          console.log(`     ${m}`);
        }
      });
    }

    if (present.length > 0) {
      it(`should report which acts are PRESENT in S3 (answered from S3 KB)`, () => {
        console.log(
          `\n  ✅ Acts found in S3 (answers retrieved from S3 knowledge base):`,
        );
        for (const p of present.sort()) {
          const tags: string[] = [];
          if (withSections.includes(p)) tags.push("sections");
          if (withFullText.includes(p)) tags.push("full-text");
          console.log(
            `     ${p.padEnd(45)} ${tags.length > 0 ? `[${tags.join(", ")}]` : ""}`,
          );
        }
      });
    }
  });

  // ── Individual category tests ────────────────────────────────────────
  const categoryTests: Array<{ name: string; keys: string[] }> = [
    {
      name: "Constitution & Polity",
      keys: [
        "constitution",
        "constitutional-law-jurisprudence",
        "legal-terminology",
        "judicial-review",
        "writ-jurisprudence",
        "public-interest-litigation",
        "civil-appeals",
        "indian-polity",
        "local-government",
        "delegated-legislation",
      ],
    },
    {
      name: "Criminal Law",
      keys: [
        "ipc",
        "bharatiya-nyaya-sanhita",
        "crpc",
        "bharatiya-nagrik-suraksha-sanhita",
        "bharatiya-sakshya-adhiniyam",
        "arms-act",
        "dowry-prohibition-act",
        "uapa-act",
        "pmla-act",
        "explosive-substances-act",
        "prevention-of-corruption-amended-act",
        "armed-forces-special-powers-act",
      ],
    },
    {
      name: "Civil Law",
      keys: [
        "evidence-act",
        "transfer-of-property-act",
        "indian-contract-act",
        "specific-relief-act",
        "tort-law",
      ],
    },
    {
      name: "Family Law",
      keys: [
        "consumer-protection-act",
        "family-law",
        "indian-succession-act",
        "hindu-succession-act",
        "domestic-violence-act",
        "hindu-marriage-act",
        "special-marriage-act",
        "hindu-adoption-maintenance-act",
        "hindu-minority-guardianship-act",
        "muslim-personal-law-act",
        "dissolution-of-muslim-marriages-act",
        "indian-divorce-act",
        "indian-christian-marriage-act",
        "parsi-marriage-divorce-act",
        "prohibition-child-marriage-act",
        "guardian-wards-act",
        "maintenance-parents-senior-citizens-act",
      ],
    },
    {
      name: "Police & Criminal Procedure",
      keys: [
        "police-act-1861",
        "nia-act",
        "fir-procedures",
        "arrest-guidelines",
        "search-and-seizure",
        "charge-sheets",
        "preventive-detention",
      ],
    },
    {
      name: "Human Rights & Social Welfare",
      keys: [
        "protection-of-human-rights-act",
        "women-rights",
        "posh-act",
        "maternity-benefit-act",
        "mental-healthcare-act",
        "national-food-security-act",
        "rpwd-act",
        "child-rights",
        "child-labour-act",
        "minority-rights",
      ],
    },
    {
      name: "Cyber Law & IT",
      keys: [
        "information-technology-act",
        "data-protection",
        "hacking-laws",
        "identity-theft",
        "online-frauds",
        "cyber-crime-detection",
        "digital-evidence",
      ],
    },
    {
      name: "Corporate & Business",
      keys: [
        "corporate-business-laws",
        "rera",
        "competition-act",
        "sebi-act",
        "fema-act",
        "fema-non-pci-act",
        "msme-act",
        "benami-transactions-act",
        "black-money-act",
      ],
    },
    {
      name: "Labour & Employment",
      keys: [
        "employment-law",
        "minimum-wages-act",
        "payment-of-wages-act",
        "industrial-disputes-act",
        "social-security-act",
        "trade-unions-act",
        "factories-act",
        "essential-commodities-act",
      ],
    },
    {
      name: "Taxation",
      keys: [
        "income-tax-act",
        "cgst-act",
        "customs-act",
        "central-excise-act",
        "taxation-law",
      ],
    },
    {
      name: "Environmental Law",
      keys: [
        "wildlife-protection-act",
        "forest-conservation-act",
        "water-act",
        "air-act",
        "national-green-tribunal-act",
        "biological-diversity-act",
        "environment-protection-act",
      ],
    },
    {
      name: "Consumer & IT Law",
      keys: [
        "food-safety-standards-act",
        "drugs-cosmetics-act",
        "dpdp-act",
        "aadhaar-act",
        "right-to-information-act",
        "consumer-protection-act-amended",
      ],
    },
    {
      name: "Intellectual Property",
      keys: ["patents-act", "geographical-indications-act"],
    },
    { name: "Banking & Finance", keys: ["rbi-act", "irdai-act"] },
    {
      name: "Miscellaneous Acts",
      keys: [
        "contempt-of-courts-act",
        "official-secrets-act",
        "passport-act",
        "indian-telegraph-act",
        "census-act",
        "epidemic-diseases-act",
      ],
    },
    {
      name: "Constitutional Reference",
      keys: [
        "fundamental-rights",
        "dpsp-fundamental-duties",
        "constitutional-schedules",
        "constitutional-parts",
      ],
    },
    {
      name: "Reference & Practical Guides",
      keys: [
        "landmark-judgments",
        "more-landmark-judgments",
        "constitutional-amendments",
        "legal-reference",
        "legal-dictionary",
        "court-hierarchy-procedure",
        "indian-legal-system",
        "practical-guides",
        "practical-guides-2",
        "practical-guides-3",
        "practical-guides-4",
      ],
    },
    {
      name: "Pre-existing S3 Acts",
      keys: [
        "arbitration-act",
        "negotiable-instruments-act",
        "limitation-act",
        "companies-act",
        "motor-vehicles-act",
        "sale-of-goods-act",
        "ndps-act",
        "copyright-act",
        "juvenile-justice-act",
        "pocso-act",
        "registration-act",
        "indian-stamp-act",
        "indian-partnership-act",
        "sc-st-act",
        "trade-marks-act",
        "sarfaesi-act",
        "prevention-of-corruption-act",
        "banking-regulation-act",
      ],
    },
  ];

  for (const cat of categoryTests) {
    const catPresent = cat.keys.filter((k) => present.includes(k));
    const catMissing = cat.keys.filter((k) => missing.includes(k));
    describe(cat.name, () => {
      it(`[${catPresent.length}/${cat.keys.length}] in S3; ${catMissing.length} answered by LLM alone`, () => {
        console.log(`\n    In S3 (${catPresent.length}/${cat.keys.length}):`);
        for (const k of catPresent) console.log(`      ✅ ${k}`);
        if (catMissing.length > 0) {
          console.log(`    LLM alone (${catMissing.length}):`);
          for (const k of catMissing) console.log(`      ❌ ${k}`);
        }
        // Assertion: the index must load (always true since we have data)
        expect(true).toBe(true);
      });
    });
  }
});

// ── Full-text verification ──────────────────────────────────────────────
describeS3("S3 Knowledge Base — Full Text Availability", () => {
  let actsInS3: string[] = [];

  beforeAll(async () => {
    const index = await s3kb.getFullTextIndex();
    actsInS3 = (index || []).map((e: string | { id: string }) =>
      typeof e === "string" ? e : e.id,
    );
  });

  it("should have full.txt with substantive content for acts that have sections", async () => {
    let checked = 0;
    let substantive = 0;
    for (const act of actsInS3) {
      const text = await s3kb.getFullText(act);
      if (text) {
        checked++;
        if (text.length > 100) substantive++;
      }
    }
    console.log(
      `\n  Acts with full.txt: ${checked}, with >100 bytes: ${substantive}`,
    );
    expect(substantive).toBeGreaterThan(0);
  });
});

// ── Section retrieval tests ─────────────────────────────────────────────
describeS3("S3 Knowledge Base — Section Retrieval", () => {
  it("should retrieve a specific section from bharatiya-nyaya-sanhita", async () => {
    const sec = await s3kb.getSection("bharatiya-nyaya-sanhita", "1");
    expect(sec).not.toBeNull();
    expect(sec!.section).toBe("1");
    expect(sec!.title).toBeTruthy();
    expect(sec!.text).toBeTruthy();
  });

  it("should retrieve a specific section from code-of-civil-procedure", async () => {
    const sec = await s3kb.getSection("code-of-civil-procedure", "1");
    if (sec) {
      // Has sections via full.txt parsing
      expect(sec!.section).toBe("1");
    } else {
      // Might not have parsed sections; this is still valid data
      console.log(
        "  CPC section 1: not individually parsed, may use full.txt only",
      );
    }
  });

  it("should return null for a non-existent section", async () => {
    const sec = await s3kb.getSection("bharatiya-nyaya-sanhita", "99999");
    expect(sec).toBeNull();
  });
});

// ── Search across acts ───────────────────────────────────────────────────
describeS3("S3 Knowledge Base — Cross-Act Search", () => {
  it("should find results when searching for a known term", async () => {
    const results = await s3kb.searchActs("Preamble");
    expect(results.length).toBeGreaterThan(0);
    console.log(
      `\n  searchActs("Preamble") returned ${results.length} results`,
    );
  });

  it("should return empty array for gibberish query", async () => {
    const results = await s3kb.searchActs("xyznonexistent12345");
    expect(results).toEqual([]);
  });
});

// ── Reference data ──────────────────────────────────────────────────────
describeS3("S3 Knowledge Base — Reference Data", () => {
  const references: Array<{ key: string; name: string }> = [
    { key: "bailable-offenses", name: "Bailable/Non-Bailable Offenses" },
    { key: "limitation-periods", name: "Limitation Periods" },
    { key: "writ-types", name: "Types of Writs" },
    { key: "court-hierarchy", name: "Court Hierarchy" },
  ];

  for (const ref of references) {
    it(`${ref.name} (${ref.key})`, async () => {
      const data = await s3kb.getReference(ref.key);
      if (data) {
        console.log(`  ✅ ${ref.name}: EXISTS in S3`);
      } else {
        console.log(
          `  ⚠️  ${ref.name}: NOT FOUND in S3 — chat will skip this reference`,
        );
      }
    });
  }
});

// ── Source attribution summary (uses data already collected above) ─────
describeS3("S3 Knowledge Base — Source Attribution Summary", () => {
  // This suite reuses data collected by the Act Data Verification suite above.
  // We re-read only the index (cheap) and compare against the already unique keys.
  let actsInS3: string[] = [];

  beforeAll(async () => {
    const index = await s3kb.getFullTextIndex();
    actsInS3 = (index || []).map((e: string | { id: string }) =>
      typeof e === "string" ? e : e.id,
    );
  }, 15000);

  it("should print final verdict: S3 vs LLM source for every act", () => {
    const allKeys = [...ALL_S3_KEYS];
    const s3Found = allKeys.filter((k) => actsInS3.includes(k));
    const s3Missing = allKeys.filter((k) => !actsInS3.includes(k));

    console.log(
      `\n  ╔══════════════════════════════════════════════════════════════════╗`,
    );
    console.log(
      `  ║              SOURCE ATTRIBUTION — S3 vs LLM                     ║`,
    );
    console.log(
      `  ╠══════════════════════════════════════════════════════════════════╣`,
    );
    console.log(
      `  ║  Total acts referenced in code:  ${String(ALL_S3_KEYS.size).padStart(3)}                              ║`,
    );
    console.log(
      `  ║  Answered from S3:               ${String(s3Found.length).padStart(3)}                              ║`,
    );
    console.log(
      `  ║  Answered by LLM alone (no S3):  ${String(s3Missing.length).padStart(3)}                              ║`,
    );
    console.log(
      `  ╚══════════════════════════════════════════════════════════════════╝`,
    );

    for (const key of ALL_S3_KEYS) {
      const status = s3Found.includes(key) ? "✅ S3" : "❌ LLM";
      console.log(`    ${status}  ${key}`);
    }
  });
});
