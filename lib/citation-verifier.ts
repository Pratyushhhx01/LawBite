import type { Citation } from "@/lib/citations";
import { isTrustedLegalSource } from "@/lib/legal-sources";

/**
 * Citation verification for Indian bare acts.
 *
 * The chat route already returns structured citations from the S3 knowledge
 * base, but the model also writes citations inline in its answer. This module
 * normalises both sources, resolves the act name to an S3 act key, and checks
 * the section against the bare act before a citation is presented as verified.
 *
 * It is deliberately lookup-injectable so tests never touch S3.
 */

export type CitationCandidateKind = "section" | "reference" | "web";

export type CitationCandidate = {
  kind: CitationCandidateKind;
  type: "act" | "web";
  raw: string;
  label: string;
  snippet?: string;
  url?: string;
  actKey: string | null;
  actName: string | null;
  section: string | null;
  source: "text" | "structured";
};

export type CitationVerificationReason =
  | "verified"
  | "section_not_found"
  | "act_not_resolved"
  | "section_not_parsed"
  | "reference_not_section"
  | "web_source"
  | "untrusted_web_source"
  | "lookup_error";

export type CitationVerification = CitationCandidate & {
  verified: boolean;
  reason: CitationVerificationReason;
  matchedSection?: string;
  sectionTitle?: string;
  sectionText?: string;
  error?: string;
};

export type CitationVerificationSummary = {
  total: number;
  sectionTotal: number;
  sectionVerified: number;
  sectionUnverified: number;
  sectionLookupErrors: number;
  verifiableSectionTotal: number;
  precision: number | null;
  hallucinationRate: number | null;
  referenceTotal: number;
  webTotal: number;
  webTrusted: number;
};

export type SectionLookup = {
  getSection(
    actKey: string,
    section: string,
  ): Promise<{ section: string; title: string; text: string } | null>;
  getSectionList?(
    actKey: string,
  ): Promise<Array<{ section: string; title: string }> | null>;
};

type ActDefinition = {
  key: string;
  name: string;
  aliases: string[];
};

/**
 * Act keys must match the S3 bare-act folder names used by `lib/s3.ts`.
 * Aliases are matched on word boundaries, longest first.
 */
export const ACT_DEFINITIONS: ActDefinition[] = [
  {
    key: "bharatiya-nyaya-sanhita",
    name: "BNS",
    aliases: ["Bharatiya Nyaya Sanhita", "BNS"],
  },
  {
    key: "ipc",
    name: "IPC",
    aliases: ["Indian Penal Code", "IPC"],
  },
  {
    key: "bharatiya-nagrik-suraksha-sanhita",
    name: "BNSS",
    aliases: ["Bharatiya Nagarik Suraksha Sanhita", "BNSS"],
  },
  {
    key: "crpc",
    name: "CrPC",
    aliases: ["Code of Criminal Procedure", "Criminal Procedure Code", "CrPC"],
  },
  {
    key: "bharatiya-sakshya-adhiniyam",
    name: "BSA",
    aliases: ["Bharatiya Sakshya Adhiniyam", "BSA"],
  },
  {
    key: "evidence-act",
    name: "Evidence Act",
    aliases: ["Indian Evidence Act", "Evidence Act"],
  },
  {
    key: "constitution",
    name: "Constitution",
    aliases: ["Constitution of India", "Indian Constitution", "Constitution"],
  },
  {
    key: "code-of-civil-procedure",
    name: "CPC",
    aliases: ["Code of Civil Procedure", "CPC"],
  },
  {
    key: "information-technology-act",
    name: "IT Act",
    aliases: ["Information Technology Act", "IT Act"],
  },
  {
    key: "dpdp-act",
    name: "DPDP Act",
    aliases: ["Digital Personal Data Protection Act", "DPDP Act", "DPDP"],
  },
  {
    key: "indian-contract-act",
    name: "Indian Contract Act",
    aliases: ["Indian Contract Act", "Contract Act"],
  },
  {
    key: "transfer-of-property-act",
    name: "Transfer of Property Act",
    aliases: ["Transfer of Property Act", "TP Act"],
  },
  {
    key: "specific-relief-act",
    name: "Specific Relief Act",
    aliases: ["Specific Relief Act"],
  },
  {
    key: "limitation-act",
    name: "Limitation Act",
    aliases: ["Limitation Act"],
  },
  {
    key: "arbitration-act",
    name: "Arbitration Act",
    aliases: ["Arbitration and Conciliation Act", "Arbitration Act"],
  },
  {
    key: "negotiable-instruments-act",
    name: "Negotiable Instruments Act",
    aliases: ["Negotiable Instruments Act", "NI Act"],
  },
  {
    key: "consumer-protection-act",
    name: "Consumer Protection Act",
    aliases: ["Consumer Protection Act"],
  },
  {
    key: "companies-act",
    name: "Companies Act",
    aliases: ["Companies Act", "Company Act"],
  },
  {
    key: "right-to-information-act",
    name: "RTI Act",
    aliases: ["Right to Information Act", "RTI Act", "RTI"],
  },
  {
    key: "aadhaar-act",
    name: "Aadhaar Act",
    aliases: ["Aadhaar Act"],
  },
  {
    key: "motor-vehicles-act",
    name: "Motor Vehicles Act",
    aliases: ["Motor Vehicles Act"],
  },
  {
    key: "ndps-act",
    name: "NDPS Act",
    aliases: [
      "Narcotic Drugs and Psychotropic Substances Act",
      "NDPS Act",
      "NDPS",
    ],
  },
  {
    key: "pmla-act",
    name: "PMLA",
    aliases: ["Prevention of Money Laundering Act", "PMLA"],
  },
  {
    key: "uapa-act",
    name: "UAPA",
    aliases: ["Unlawful Activities Prevention Act", "UAPA"],
  },
  {
    key: "arms-act",
    name: "Arms Act",
    aliases: ["Arms Act"],
  },
  {
    key: "dowry-prohibition-act",
    name: "Dowry Prohibition Act",
    aliases: ["Dowry Prohibition Act"],
  },
  {
    key: "sc-st-act",
    name: "SC/ST Act",
    aliases: [
      "Scheduled Castes and Scheduled Tribes Prevention of Atrocities Act",
      "SC/ST Act",
      "SC ST Act",
    ],
  },
  {
    key: "posh-act",
    name: "POSH Act",
    aliases: [
      "Sexual Harassment of Women at Workplace Act",
      "POSH Act",
      "POSH",
    ],
  },
  {
    key: "pocso-act",
    name: "POCSO Act",
    aliases: [
      "Protection of Children from Sexual Offences Act",
      "POCSO Act",
      "POCSO",
    ],
  },
  {
    key: "domestic-violence-act",
    name: "Domestic Violence Act",
    aliases: [
      "Protection of Women from Domestic Violence Act",
      "Domestic Violence Act",
      "DV Act",
    ],
  },
  {
    key: "hindu-marriage-act",
    name: "Hindu Marriage Act",
    aliases: ["Hindu Marriage Act"],
  },
  {
    key: "special-marriage-act",
    name: "Special Marriage Act",
    aliases: ["Special Marriage Act"],
  },
  {
    key: "hindu-succession-act",
    name: "Hindu Succession Act",
    aliases: ["Hindu Succession Act"],
  },
  {
    key: "indian-succession-act",
    name: "Indian Succession Act",
    aliases: ["Indian Succession Act"],
  },
  {
    key: "guardian-wards-act",
    name: "Guardians and Wards Act",
    aliases: ["Guardians and Wards Act", "Guardian and Wards Act"],
  },
  {
    key: "maintenance-parents-senior-citizens-act",
    name: "Maintenance and Welfare of Parents Act",
    aliases: [
      "Maintenance and Welfare of Parents and Senior Citizens Act",
      "Maintenance and Welfare of Parents Act",
      "Senior Citizens Act",
    ],
  },
  {
    key: "prohibition-child-marriage-act",
    name: "Prohibition of Child Marriage Act",
    aliases: ["Prohibition of Child Marriage Act", "Child Marriage Act"],
  },
  {
    key: "juvenile-justice-act",
    name: "Juvenile Justice Act",
    aliases: ["Juvenile Justice Act"],
  },
  {
    key: "mental-healthcare-act",
    name: "Mental Healthcare Act",
    aliases: ["Mental Healthcare Act"],
  },
  {
    key: "maternity-benefit-act",
    name: "Maternity Benefit Act",
    aliases: ["Maternity Benefit Act"],
  },
  {
    key: "rpwd-act",
    name: "RPWD Act",
    aliases: ["Rights of Persons with Disabilities Act", "RPWD Act", "RPWD"],
  },
  {
    key: "food-safety-standards-act",
    name: "Food Safety and Standards Act",
    aliases: ["Food Safety and Standards Act", "FSS Act"],
  },
  {
    key: "environment-protection-act",
    name: "Environment Protection Act",
    aliases: ["Environment Protection Act", "Environmental Protection Act"],
  },
  {
    key: "wildlife-protection-act",
    name: "Wildlife Protection Act",
    aliases: ["Wildlife Protection Act"],
  },
  {
    key: "national-green-tribunal-act",
    name: "NGT Act",
    aliases: ["National Green Tribunal Act", "NGT Act", "NGT"],
  },
  {
    key: "rera",
    name: "RERA",
    aliases: [
      "Real Estate Regulation and Development Act",
      "Real Estate Regulation Act",
      "RERA",
    ],
  },
  {
    key: "cgst-act",
    name: "CGST Act",
    aliases: [
      "Central Goods and Services Tax Act",
      "CGST Act",
      "GST Act",
      "CGST",
    ],
  },
  {
    key: "income-tax-act",
    name: "Income Tax Act",
    aliases: ["Income Tax Act", "Income-tax Act"],
  },
  {
    key: "customs-act",
    name: "Customs Act",
    aliases: ["Customs Act"],
  },
  {
    key: "factories-act",
    name: "Factories Act",
    aliases: ["Factories Act"],
  },
  {
    key: "minimum-wages-act",
    name: "Minimum Wages Act",
    aliases: ["Minimum Wages Act"],
  },
  {
    key: "payment-of-wages-act",
    name: "Payment of Wages Act",
    aliases: ["Payment of Wages Act"],
  },
  {
    key: "industrial-disputes-act",
    name: "Industrial Disputes Act",
    aliases: ["Industrial Disputes Act", "ID Act"],
  },
  {
    key: "trade-unions-act",
    name: "Trade Unions Act",
    aliases: ["Trade Unions Act"],
  },
  {
    key: "copyright-act",
    name: "Copyright Act",
    aliases: ["Copyright Act"],
  },
  {
    key: "trade-marks-act",
    name: "Trade Marks Act",
    aliases: ["Trade Marks Act", "Trademarks Act"],
  },
  {
    key: "patents-act",
    name: "Patents Act",
    aliases: ["Patents Act", "Patent Act"],
  },
  {
    key: "sale-of-goods-act",
    name: "Sale of Goods Act",
    aliases: ["Sale of Goods Act"],
  },
  {
    key: "registration-act",
    name: "Registration Act",
    aliases: ["Registration Act"],
  },
  {
    key: "indian-partnership-act",
    name: "Indian Partnership Act",
    aliases: ["Indian Partnership Act", "Partnership Act"],
  },
  {
    key: "indian-stamp-act",
    name: "Indian Stamp Act",
    aliases: ["Indian Stamp Act", "Stamp Act"],
  },
  {
    key: "banking-regulation-act",
    name: "Banking Regulation Act",
    aliases: ["Banking Regulation Act"],
  },
  {
    key: "sarfaesi-act",
    name: "SARFAESI Act",
    aliases: ["SARFAESI Act", "SARFAESI"],
  },
  {
    key: "competition-act",
    name: "Competition Act",
    aliases: ["Competition Act"],
  },
  {
    key: "sebi-act",
    name: "SEBI Act",
    aliases: ["Securities and Exchange Board of India Act", "SEBI Act", "SEBI"],
  },
  {
    key: "fema-act",
    name: "FEMA",
    aliases: ["Foreign Exchange Management Act", "FEMA"],
  },
  {
    key: "msme-act",
    name: "MSME Act",
    aliases: [
      "Micro Small and Medium Enterprises Development Act",
      "MSME Act",
      "MSME",
    ],
  },
  {
    key: "benami-transactions-act",
    name: "Benami Transactions Act",
    aliases: ["Benami Transactions Prohibition Act", "Benami Act"],
  },
  {
    key: "black-money-act",
    name: "Black Money Act",
    aliases: ["Black Money Act"],
  },
  {
    key: "code-on-wages",
    name: "Code on Wages",
    aliases: ["Code on Wages"],
  },
  {
    key: "prevention-of-corruption-act",
    name: "Prevention of Corruption Act",
    aliases: ["Prevention of Corruption Act"],
  },
];

const ACT_ALIAS_INDEX = ACT_DEFINITIONS.flatMap((definition) =>
  definition.aliases.map((alias) => ({
    alias: alias.toLowerCase(),
    key: definition.key,
    name: definition.name,
  })),
).sort((a, b) => b.alias.length - a.alias.length);

const SECTION_LIST_PATTERN =
  /\b(?:sections?|secs?\.?|s\.)\s*((?:\d+[A-Za-z]?(?:\s*\([^)]{1,16}\))?)(?:\s*(?:,|&|and|or)\s*\d+[A-Za-z]?(?:\s*\([^)]{1,16}\))?)*)/gi;

const ARTICLE_LIST_PATTERN =
  /\b(?:articles?|arts?\.?)\s*((?:\d+[A-Za-z]?(?:\s*\([^)]{1,16}\))?)(?:\s*(?:,|&|and|or)\s*\d+[A-Za-z]?(?:\s*\([^)]{1,16}\))?)*)/gi;

const NUMBER_PATTERN = /\d+[A-Za-z]?(?:\s*\([^)]{1,16}\))?/g;

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function normaliseSection(value: string): string {
  return value.replace(/\s+/g, "").replace(/[.,;:]+$/, "");
}

function sectionVariants(section: string): string[] {
  const variants = new Set<string>();
  const add = (value: string) => {
    if (value) variants.add(value);
  };

  add(section);
  add(section.toUpperCase());
  add(section.toLowerCase());

  const base = section.replace(/\(.*$/, "");
  add(base);
  add(base.toUpperCase());
  add(base.toLowerCase());

  return [...variants];
}

function containsAlias(haystack: string, alias: string): boolean {
  return new RegExp(
    `(^|[^a-z0-9])${escapeRegExp(alias)}([^a-z0-9]|$)`,
    "i",
  ).test(haystack);
}

/** Resolve an act name or abbreviation to its S3 act key. */
export function resolveAct(
  label: string,
): { key: string; name: string } | null {
  if (!label) return null;
  const lower = label.toLowerCase();
  for (const entry of ACT_ALIAS_INDEX) {
    if (containsAlias(lower, entry.alias)) {
      return { key: entry.key, name: entry.name };
    }
  }
  return null;
}

type ActMatch = {
  key: string;
  name: string;
  index: number;
  length: number;
};

function findActMatches(text: string): ActMatch[] {
  const lower = text.toLowerCase();
  const matches: ActMatch[] = [];

  for (const entry of ACT_ALIAS_INDEX) {
    const pattern = new RegExp(
      `(^|[^a-z0-9])${escapeRegExp(entry.alias)}([^a-z0-9]|$)`,
      "gi",
    );
    let match: RegExpExecArray | null;
    while ((match = pattern.exec(lower))) {
      const start = match.index + match[1].length;
      matches.push({
        key: entry.key,
        name: entry.name,
        index: start,
        length: entry.alias.length,
      });
      if (match.index === pattern.lastIndex) pattern.lastIndex++;
    }
  }

  return matches;
}

function findClosestAct(
  text: string,
  matchStart: number,
  matchEnd: number,
): { key: string; name: string } | null {
  const windowStart = Math.max(0, matchStart - 140);
  const windowEnd = Math.min(text.length, matchEnd + 140);
  const window = text.slice(windowStart, windowEnd);
  const matches = findActMatches(window).filter((match) => {
    const absoluteStart = windowStart + match.index;
    const absoluteEnd = absoluteStart + match.length;
    return absoluteEnd >= windowStart && absoluteStart <= windowEnd;
  });

  if (matches.length === 0) return null;

  let best: ActMatch | null = null;
  let bestDistance = Number.POSITIVE_INFINITY;

  for (const match of matches) {
    const absoluteStart = windowStart + match.index;
    const absoluteEnd = absoluteStart + match.length;
    const distance =
      absoluteEnd < matchStart
        ? matchStart - absoluteEnd
        : absoluteStart > matchEnd
          ? absoluteStart - matchEnd
          : 0;
    if (distance < bestDistance) {
      best = match;
      bestDistance = distance;
    }
  }

  return best ? { key: best.key, name: best.name } : null;
}

function extractNumbers(list: string): string[] {
  return (list.match(NUMBER_PATTERN) ?? [])
    .map(normaliseSection)
    .filter(Boolean);
}

function textCandidates(text: string): CitationCandidate[] {
  const candidates: CitationCandidate[] = [];

  const patterns: Array<{
    pattern: RegExp;
    type: "section" | "article";
  }> = [
    { pattern: SECTION_LIST_PATTERN, type: "section" },
    { pattern: ARTICLE_LIST_PATTERN, type: "article" },
  ];

  for (const { pattern, type } of patterns) {
    pattern.lastIndex = 0;
    let match: RegExpExecArray | null;
    while ((match = pattern.exec(text))) {
      const numbers = extractNumbers(match[1]);
      const act =
        type === "article"
          ? (findClosestAct(text, match.index, pattern.lastIndex) ?? {
              key: "constitution",
              name: "Constitution",
            })
          : findClosestAct(text, match.index, pattern.lastIndex);

      for (const section of numbers) {
        candidates.push({
          kind: "section",
          type: "act",
          raw: `${type === "article" ? "Article" : "Section"} ${section}`,
          label: act ? `${act.name} ${section}` : `Section ${section}`,
          actKey: act?.key ?? null,
          actName: act?.name ?? null,
          section,
          source: "text",
        });
      }
    }
  }

  return candidates;
}

function firstSectionFromLabel(label: string): string | null {
  for (const pattern of [SECTION_LIST_PATTERN, ARTICLE_LIST_PATTERN]) {
    pattern.lastIndex = 0;
    const match = pattern.exec(label);
    if (match) {
      const numbers = extractNumbers(match[1]);
      if (numbers[0]) return numbers[0];
    }
  }

  const trailing = label.match(
    /(?:^|[\s,;])(\d+[A-Za-z]?(?:\s*\([^)]{1,16}\))?)\s*$/,
  );
  return trailing ? normaliseSection(trailing[1]) : null;
}

function structuredCandidates(citations: Citation[]): CitationCandidate[] {
  const candidates: CitationCandidate[] = [];

  for (const citation of citations) {
    const label = citation.label || "";
    const snippet = citation.snippet || "";

    if (citation.type === "web") {
      candidates.push({
        kind: "web",
        type: "web",
        raw: label || citation.url || "Web source",
        label: label || citation.url || "Web source",
        snippet,
        url: citation.url,
        actKey: null,
        actName: null,
        section: null,
        source: "structured",
      });
      continue;
    }

    const section =
      firstSectionFromLabel(label) ??
      firstSectionFromLabel(snippet.slice(0, 240));
    const act = resolveAct(label) ?? resolveAct(snippet.slice(0, 320));

    candidates.push({
      kind: section ? "section" : "reference",
      type: "act",
      raw: label || snippet.slice(0, 120),
      label: label || "Legal source",
      snippet,
      actKey: act?.key ?? null,
      actName: act?.name ?? null,
      section,
      source: "structured",
    });
  }

  return candidates;
}

function candidateKey(candidate: CitationCandidate): string {
  if (candidate.kind === "web") {
    return `web:${candidate.url ?? candidate.label}`.toLowerCase();
  }
  if (candidate.kind === "reference") {
    return `reference:${candidate.label}`.toLowerCase();
  }
  return `section:${candidate.actKey ?? "unknown"}:${(
    candidate.section ?? ""
  ).toLowerCase()}`;
}

function sectionOnlyKey(section: string): string {
  return section.replace(/\s+/g, "").toLowerCase();
}

/**
 * Extract and de-duplicate citations from answer text plus the structured
 * citations emitted by the chat route.
 */
export function parseCitationCandidates(
  text: string,
  citations: Citation[] = [],
): CitationCandidate[] {
  const combined = [
    ...textCandidates(text),
    ...structuredCandidates(citations),
  ];
  const byKey = new Map<string, CitationCandidate>();

  for (const candidate of combined) {
    const key = candidateKey(candidate);
    const existing = byKey.get(key);
    if (!existing) {
      byKey.set(key, candidate);
      continue;
    }

    // Structured citations carry the S3 snippet, so prefer them when both the
    // answer text and the citation frame mention the same provision.
    if (existing.source === "text" && candidate.source === "structured") {
      byKey.set(key, candidate);
    }
  }

  const candidates = [...byKey.values()];
  const resolvedSections = new Map<string, CitationCandidate[]>();

  for (const candidate of candidates) {
    if (candidate.kind === "section" && candidate.actKey && candidate.section) {
      const key = sectionOnlyKey(candidate.section);
      const list = resolvedSections.get(key) ?? [];
      list.push(candidate);
      resolvedSections.set(key, list);
    }
  }

  // Drop an unresolved "Section 103" when exactly one structured/resolved
  // candidate for the same section exists. This avoids counting the same
  // provision twice just because the prose omitted the act name.
  return candidates.filter((candidate) => {
    if (
      candidate.kind !== "section" ||
      candidate.actKey ||
      !candidate.section
    ) {
      return true;
    }
    const matches = resolvedSections.get(sectionOnlyKey(candidate.section));
    return !matches || matches.length !== 1;
  });
}

async function verifyCandidate(
  candidate: CitationCandidate,
  lookup: SectionLookup,
  availability: Map<string, boolean>,
): Promise<CitationVerification> {
  if (candidate.kind === "web") {
    const trusted = isTrustedLegalSource(candidate.url);
    return {
      ...candidate,
      verified: trusted,
      reason: trusted ? "web_source" : "untrusted_web_source",
    };
  }

  if (candidate.kind === "reference") {
    return {
      ...candidate,
      verified: false,
      reason: "reference_not_section",
    };
  }

  if (!candidate.actKey) {
    return {
      ...candidate,
      verified: false,
      reason: "act_not_resolved",
    };
  }

  if (!candidate.section) {
    return {
      ...candidate,
      verified: false,
      reason: "section_not_parsed",
    };
  }

  try {
    for (const variant of sectionVariants(candidate.section)) {
      const section = await lookup.getSection(candidate.actKey, variant);
      if (section) {
        return {
          ...candidate,
          verified: true,
          reason: "verified",
          matchedSection: section.section,
          sectionTitle: section.title,
          sectionText: section.text.slice(0, 1000),
        };
      }
    }
  } catch (error) {
    return {
      ...candidate,
      verified: false,
      reason: "lookup_error",
      error: error instanceof Error ? error.message : String(error),
    };
  }

  if (availability.get(candidate.actKey) === false) {
    return {
      ...candidate,
      verified: false,
      reason: "lookup_error",
      error: `Bare-act index unavailable for ${candidate.actKey}`,
    };
  }

  return {
    ...candidate,
    verified: false,
    reason: "section_not_found",
  };
}

function summarise(
  results: CitationVerification[],
): CitationVerificationSummary {
  const sections = results.filter((result) => result.kind === "section");
  const lookupErrors = sections.filter(
    (result) => result.reason === "lookup_error",
  );
  const verifiableSections = sections.filter(
    (result) => result.reason !== "lookup_error",
  );
  const sectionVerified = verifiableSections.filter(
    (result) => result.verified,
  ).length;
  const sectionUnverified = verifiableSections.length - sectionVerified;
  const precision =
    verifiableSections.length > 0
      ? sectionVerified / verifiableSections.length
      : null;
  const web = results.filter((result) => result.kind === "web");

  return {
    total: results.length,
    sectionTotal: sections.length,
    sectionVerified,
    sectionUnverified,
    sectionLookupErrors: lookupErrors.length,
    verifiableSectionTotal: verifiableSections.length,
    precision,
    hallucinationRate: precision === null ? null : 1 - precision,
    referenceTotal: results.filter((result) => result.kind === "reference")
      .length,
    webTotal: web.length,
    webTrusted: web.filter((result) => result.verified).length,
  };
}

async function mapWithConcurrency<T, R>(
  items: T[],
  limit: number,
  mapper: (item: T) => Promise<R>,
): Promise<R[]> {
  if (items.length === 0) return [];

  const results = new Array<R>(items.length);
  let nextIndex = 0;

  async function worker() {
    while (true) {
      const index = nextIndex++;
      if (index >= items.length) return;
      results[index] = await mapper(items[index]);
    }
  }

  await Promise.all(
    Array.from({ length: Math.min(limit, items.length) }, () => worker()),
  );
  return results;
}

/**
 * Verify every citation in a chat answer.
 *
 * Pass a `lookup` in tests. In production the S3 knowledge base is loaded
 * lazily so importing this module never initialises AWS credentials.
 */
export async function verifyCitations(
  input: { text?: string; citations?: Citation[] },
  lookup?: SectionLookup,
): Promise<{
  results: CitationVerification[];
  summary: CitationVerificationSummary;
}> {
  const candidates = parseCitationCandidates(
    input.text ?? "",
    input.citations ?? [],
  );
  const resolvedLookup = lookup ?? (await import("@/lib/s3")).s3kb;
  const actKeys = [
    ...new Set(
      candidates
        .filter(
          (candidate) =>
            candidate.kind === "section" && candidate.actKey !== null,
        )
        .map((candidate) => candidate.actKey as string),
    ),
  ];
  const availability = new Map<string, boolean>();

  const getSectionList = resolvedLookup.getSectionList;
  if (getSectionList && actKeys.length > 0) {
    await mapWithConcurrency(actKeys, 4, async (actKey) => {
      try {
        const sectionList = await getSectionList(actKey);
        availability.set(actKey, sectionList !== null);
      } catch {
        availability.set(actKey, false);
      }
    });
  }

  const results = await mapWithConcurrency(candidates, 6, (candidate) =>
    verifyCandidate(candidate, resolvedLookup, availability),
  );

  return { results, summary: summarise(results) };
}
