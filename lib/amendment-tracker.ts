/**
 * Indian Legal Amendment Tracker
 *
 * Provides authoritative historical tracking of amendments to Indian Central
 * and State legislation, grounded in Gazette of India notifications and India Code.
 * Displays original vs amended text, enactment vs effective dates, and litigation impact.
 */

export type AmendmentCategory =
  | "Criminal"
  | "Commercial"
  | "Procedural"
  | "Consumer & Civil"
  | "Tech & Data";

export interface HistoricalVersion {
  versionTitle: string;
  era: string;
  provisionText: string;
}

export interface LegalAmendment {
  id: string;
  actName: string;
  amendmentActName: string;
  gazetteNumber: string;
  enactmentDate: string; // YYYY-MM-DD
  effectiveDate: string; // YYYY-MM-DD
  affectedSections: string[];
  category: AmendmentCategory;
  originalProvisionSummary: string;
  amendedProvisionSummary: string;
  practicalSignificance: string;
  authoritativeSourceUrl: string;
  historicalVersions?: HistoricalVersion[];
}

export interface AmendmentFilter {
  act?: string;
  section?: string;
  query?: string;
  category?: AmendmentCategory | "all";
  yearFrom?: number;
  yearTo?: number;
}

export const AUTHORITATIVE_AMENDMENTS: LegalAmendment[] = [
  // 1. Criminal Law Overhaul: BNS 2023 replacing IPC 1860
  {
    id: "amend-bns-2023",
    actName: "Indian Penal Code, 1860 → Bharatiya Nyaya Sanhita, 2023",
    amendmentActName: "Bharatiya Nyaya Sanhita, 2023 (Act No. 45 of 2023)",
    gazetteNumber: "The Gazette of India, Extraordinary, Part II, Section 1, No. 59; S.O. 848(E)",
    enactmentDate: "2023-12-25",
    effectiveDate: "2024-07-01",
    affectedSections: ["Section 103", "Section 106", "Section 152", "Section 304", "Section 318", "Section 356"],
    category: "Criminal",
    originalProvisionSummary:
      "Colonial penal code of 1860 containing sedition (Sec 124A), capital murder (Sec 302), negligence up to 2 years (Sec 304A), cheating (Sec 420), and lack of specific provisions for mob lynching or organized crime.",
    amendedProvisionSummary:
      "Modernized penal code effective 1 July 2024: repeals colonial sedition; introduces Section 152 (acts endangering sovereignty); Section 103(2) penalizes group/mob murder; Section 106 increases negligence penalty to 5 years (and hit-and-run up to 10 years); Section 304 introduces snatching; introduces community service as alternative sentence.",
    practicalSignificance:
      "Offences committed on or after 1 July 2024 must be registered under BNS. Prior offences continue under IPC per Section 358 BNS and Article 20(1) Constitution non-retroactivity.",
    authoritativeSourceUrl: "https://www.indiacode.nic.in/handle/123456789/20062",
    historicalVersions: [
      {
        versionTitle: "Indian Penal Code, 1860",
        era: "1860 - 30 June 2024",
        provisionText: "Section 302: Whoever commits murder shall be punished with death, or imprisonment for life, and shall also be liable to fine.",
      },
      {
        versionTitle: "Bharatiya Nyaya Sanhita, 2023",
        era: "1 July 2024 - Present",
        provisionText: "Section 103(1): Whoever commits murder shall be punished with death or imprisonment for life, and shall also be liable to fine. Section 103(2): Murder by group of five or more on ground of race, caste, sex, language, etc.",
      },
    ],
  },

  // 2. Specific Relief (Amendment) Act, 2018 - Shifting from Damages to Mandatory Specific Performance
  {
    id: "amend-sra-2018",
    actName: "Specific Relief Act, 1963",
    amendmentActName: "Specific Relief (Amendment) Act, 2018 (Act No. 18 of 2018)",
    gazetteNumber: "The Gazette of India, Extraordinary, Part II, Section 1, No. 22; S.O. 5046(E)",
    enactmentDate: "2018-08-01",
    effectiveDate: "2018-10-01",
    affectedSections: ["Section 10", "Section 14", "Section 14A", "Section 20"],
    category: "Commercial",
    originalProvisionSummary:
      "Specific performance of a contract was discretionary for courts; damages were the general default remedy and specific performance was granted only if monetary compensation was inadequate.",
    amendedProvisionSummary:
      "Specific performance is made MANDATORY under Section 10 ('shall be enforced by the court subject to limited exceptions in Section 11(2), 14 and 16'). Introduces Section 20 allowing 'Substituted Performance' through third parties with recovery of costs.",
    practicalSignificance:
      "Revolutionized Indian commercial litigation: contracts are now strictly enforceable by default rather than compensated with damages. The Supreme Court in B. Santoshamma v. D. Sarala (2020) confirmed this paradigm shift.",
    authoritativeSourceUrl: "https://www.indiacode.nic.in/handle/123456789/1583",
    historicalVersions: [
      {
        versionTitle: "Specific Relief Act 1963 (Original)",
        era: "1963 - September 2018",
        provisionText: "Section 10: The specific performance of any contract may, in the discretion of the court, be enforced when there exists no standard for ascertaining actual damage.",
      },
      {
        versionTitle: "Specific Relief Act 1963 (As Amended in 2018)",
        era: "1 October 2018 - Present",
        provisionText: "Section 10: The specific performance of a contract shall be enforced by the court subject to the provisions contained in sub-section (2) of section 11, section 14 and section 16.",
      },
    ],
  },

  // 3. Negotiable Instruments (Amendment) Act, 2018 - Interim Compensation in Section 138
  {
    id: "amend-ni-2018",
    actName: "Negotiable Instruments Act, 1881",
    amendmentActName: "Negotiable Instruments (Amendment) Act, 2018 (Act No. 20 of 2018)",
    gazetteNumber: "The Gazette of India, Extraordinary, Part II, Section 1, No. 24; S.O. 3965(E)",
    enactmentDate: "2018-08-02",
    effectiveDate: "2018-09-01",
    affectedSections: ["Section 143A", "Section 148"],
    category: "Commercial",
    originalProvisionSummary:
      "In cheque bounce complaints under Section 138, complainants received no financial relief until final conviction and appeal disposal, often taking 5 to 10 years.",
    amendedProvisionSummary:
      "Section 143A empowers trial courts to direct the drawer of the dishonoured cheque to pay interim compensation up to 20% of the cheque amount during trial. Section 148 empowers appellate courts to order deposit of minimum 20% of fine/compensation before hearing appeal.",
    practicalSignificance:
      "Significantly curtails dilatory tactics by cheque defaulters. Supreme Court in Surinder Singh Deswal (2019) held Section 148 applies even to complaints filed prior to the amendment date.",
    authoritativeSourceUrl: "https://www.indiacode.nic.in/handle/123456789/2189",
  },

  // 4. Consumer Protection Act, 2019 - E-Commerce, Product Liability, and Mediation
  {
    id: "amend-cpa-2019",
    actName: "Consumer Protection Act, 1986 → Consumer Protection Act, 2019",
    amendmentActName: "Consumer Protection Act, 2019 (Act No. 35 of 2019)",
    gazetteNumber: "The Gazette of India, Extraordinary, Part II, Section 1, No. 54; S.O. 2351(E)",
    enactmentDate: "2019-08-09",
    effectiveDate: "2020-07-20",
    affectedSections: ["Section 2(7)", "Section 2(16)", "Section 82-87", "Section 34", "Section 47", "Section 58"],
    category: "Consumer & Civil",
    originalProvisionSummary:
      "1986 Act did not cover e-commerce, digital transactions, product liability, or misleading celebrity endorsements. Territorial jurisdiction was strictly restricted to the seller's place of business.",
    amendedProvisionSummary:
      "Repealed 1986 Act. Brings e-commerce and direct selling under statutory regulation; allows consumers to file complaints where the CONSUMER resides; introduces strict Product Liability (Chapter VI) against manufacturers, sellers, and service providers; establishes Central Consumer Protection Authority (CCPA) with suo motu recall powers; institutionalizes statutory Mediation.",
    practicalSignificance:
      "Massively empowers consumers to litigate locally against national/international e-commerce corporations without traveling to corporate headquarters.",
    authoritativeSourceUrl: "https://www.indiacode.nic.in/handle/123456789/15256",
  },

  // 5. Arbitration and Conciliation (Amendment) Act, 2019 & 2021
  {
    id: "amend-arbitration-2019-2021",
    actName: "Arbitration and Conciliation Act, 1996",
    amendmentActName: "Arbitration and Conciliation (Amendment) Acts, 2019 & 2021 (Act No. 33 of 2019 & Act No. 3 of 2021)",
    gazetteNumber: "The Gazette of India, Extraordinary, Part II, Section 1; S.O. 3154(E)",
    enactmentDate: "2019-08-09",
    effectiveDate: "2019-08-30",
    affectedSections: ["Section 23(4)", "Section 29A", "Section 34", "Section 36"],
    category: "Procedural",
    originalProvisionSummary:
      "Section 29A imposed strict 12-month time limit for all arbitrations including international commercial arbitrations; filing Section 34 automatic stay issues.",
    amendedProvisionSummary:
      "Section 23(4) mandates statement of claim and defence to be completed within 6 months. Section 29A relaxes the 12-month deadline for International Commercial Arbitrations. Section 36(3) proviso (2021 amendment) provides unconditional stay of award if the arbitration agreement or contract was induced by fraud or corruption.",
    practicalSignificance:
      "Streamlines institutional arbitration timelines and provides fraud safeguards against tainted awards.",
    authoritativeSourceUrl: "https://www.indiacode.nic.in/handle/123456789/1978",
  },

  // 6. Criminal Law (Amendment) Act, 2018 - Stringent Penalties for Child Sexual Assault
  {
    id: "amend-cla-2018",
    actName: "Indian Penal Code / POCSO Act",
    amendmentActName: "Criminal Law (Amendment) Act, 2018 (Act No. 22 of 2018)",
    gazetteNumber: "The Gazette of India, Extraordinary, Part II, Section 1, No. 27",
    enactmentDate: "2018-08-11",
    effectiveDate: "2018-04-21",
    affectedSections: ["Section 376AB", "Section 376DA", "Section 376DB"],
    category: "Criminal",
    originalProvisionSummary:
      "Rape of girls under 12 or 16 was punishable under general Section 376 IPC or Section 5/6 POCSO with minimum 10 or 20 years.",
    amendedProvisionSummary:
      "Introduced Sections 376AB (rape of woman under 12 years punishable with rigorous imprisonment of 20 years up to life imprisonment or DEATH) and Section 376DB (gang rape of girl under 12 punishable with life imprisonment or DEATH). Barred anticipatory bail in such cases.",
    practicalSignificance:
      "Established capital punishment and non-bailable stringent thresholds for child sexual offences in India.",
    authoritativeSourceUrl: "https://www.indiacode.nic.in/handle/123456789/2263",
  },

  // 7. Digital Personal Data Protection Act, 2023 - Digital Privacy Architecture
  {
    id: "amend-dpdp-2023",
    actName: "Information Technology Act, 2000 → DPDP Act, 2023",
    amendmentActName: "Digital Personal Data Protection Act, 2023 (Act No. 22 of 2023)",
    gazetteNumber: "The Gazette of India, Extraordinary, Part II, Section 1, No. 26",
    enactmentDate: "2023-08-11",
    effectiveDate: "2023-08-11",
    affectedSections: ["Section 43A IT Act (omitted)", "Sections 1-44 DPDP"],
    category: "Tech & Data",
    originalProvisionSummary:
      "Section 43A of IT Act 2000 provided weak compensation for failure to protect sensitive personal data under SPDI Rules 2011.",
    amendedProvisionSummary:
      "Omitted Section 43A IT Act. Established comprehensive digital privacy regime requiring clear notice and consent; rights of Data Principals; penalties up to 250 crore rupees for data breaches (Schedule); establishes Data Protection Board of India.",
    practicalSignificance:
      "Transforms enterprise compliance across India; mandatory breach notifications and strict consent architecture.",
    authoritativeSourceUrl: "https://www.indiacode.nic.in/handle/123456789/20061",
  },
];

/**
 * Search and filter amendments with keyword, act, section, category, and date criteria.
 */
export function searchAmendments(filter: AmendmentFilter = {}): {
  total: number;
  results: LegalAmendment[];
} {
  let list = [...AUTHORITATIVE_AMENDMENTS];

  if (filter.category && filter.category !== "all") {
    list = list.filter((a) => a.category === filter.category);
  }

  if (filter.act) {
    const actQ = filter.act.toLowerCase().trim();
    list = list.filter(
      (a) =>
        a.actName.toLowerCase().includes(actQ) ||
        a.amendmentActName.toLowerCase().includes(actQ),
    );
  }

  if (filter.section) {
    const secQ = filter.section.toLowerCase().replace(/^section\s+/i, "").trim();
    list = list.filter((a) =>
      a.affectedSections.some((s) =>
        s.toLowerCase().replace(/[^a-z0-9]/g, "").includes(secQ),
      ),
    );
  }

  if (filter.yearFrom) {
    list = list.filter(
      (a) => parseInt(a.effectiveDate.slice(0, 4), 10) >= filter.yearFrom!,
    );
  }

  if (filter.yearTo) {
    list = list.filter(
      (a) => parseInt(a.effectiveDate.slice(0, 4), 10) <= filter.yearTo!,
    );
  }

  if (filter.query) {
    const q = filter.query.toLowerCase().trim();
    list = list.filter(
      (a) =>
        a.actName.toLowerCase().includes(q) ||
        a.amendmentActName.toLowerCase().includes(q) ||
        a.originalProvisionSummary.toLowerCase().includes(q) ||
        a.amendedProvisionSummary.toLowerCase().includes(q) ||
        a.practicalSignificance.toLowerCase().includes(q) ||
        a.affectedSections.some((s) => s.toLowerCase().includes(q)),
    );
  }

  return {
    total: list.length,
    results: list,
  };
}


export class AmendmentTrackerService {
  public static getAmendments(filter?: AmendmentFilter): LegalAmendment[] {
    return searchAmendments(filter).results;
  }
  public static getAmendmentById(id: string): LegalAmendment | undefined {
    return AUTHORITATIVE_AMENDMENTS.find((a) => a.id === id);
  }
}
