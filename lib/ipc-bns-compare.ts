/**
 * IPC to BNS Statutory Transition & Comparison Engine
 *
 * Provides authoritative statutory comparison between the colonial
 * Indian Penal Code, 1860 (IPC) and the Bharatiya Nyaya Sanhita, 2023 (BNS),
 * in force from 1 July 2024.
 *
 * Handles 1:1 mappings, modified provisions, newly introduced offences,
 * repealed offences without direct equivalents, and temporal applicability.
 */

export interface StatutoryComparison {
  oldCode: "IPC";
  oldSection: string;
  oldTitle: string;
  oldSummary: string;
  hasDirectEquivalent: boolean;
  newCode: "BNS";
  newSection: string | null;
  newTitle: string | null;
  newSummary: string | null;
  wordingDifferences: string[];
  penalChanges: string;
  commencementInfo: string;
  effectiveDate: string;
  temporalRule: string;
  sourceReference: string;
  specialNotes?: string;
}

export const COMMENCEMENT_DETAILS = {
  actName: "Bharatiya Nyaya Sanhita, 2023 (Act No. 45 of 2023)",
  notification: "Ministry of Home Affairs Notification S.O. 848(E) dated 23 February 2024",
  effectiveDate: "2024-07-01",
  gazetteRef: "The Gazette of India, Extraordinary, Part II, Section 1, No. 59, dated 25 December 2023",
  repealAndSavings:
    "Section 358 BNS repeals the Indian Penal Code, 1860, saving pending investigations, trials, proceedings, rights, and liabilities incurred before 1 July 2024.",
  constitutionalRule:
    "Under Article 20(1) of the Constitution of India, no person can be convicted of an offence except for violation of a law in force at the time of commission. Offences committed on or after 1 July 2024 are charged under BNS; offences prior to 1 July 2024 continue under IPC.",
};

export const IPC_BNS_COMPARISONS: Record<string, StatutoryComparison> = {
  // Murder: IPC 302 -> BNS 103(1)
  "302": {
    oldCode: "IPC",
    oldSection: "302",
    oldTitle: "Punishment for murder",
    oldSummary: "Whoever commits murder shall be punished with death, or imprisonment for life, and shall also be liable to fine.",
    hasDirectEquivalent: true,
    newCode: "BNS",
    newSection: "103(1)",
    newTitle: "Punishment for murder",
    newSummary: "Whoever commits murder shall be punished with death or imprisonment for life, and shall also be liable to fine.",
    wordingDifferences: [
      "Substantive definition of murder remains structured identically under BNS Section 101 (equivalent to IPC Section 300).",
      "Section 103 is bifurcated into subsection (1) for individual murder and subsection (2) for group/mob lynching murder.",
    ],
    penalChanges: "Penalties for individual murder remain death or life imprisonment plus fine.",
    commencementInfo: COMMENCEMENT_DETAILS.notification,
    effectiveDate: COMMENCEMENT_DETAILS.effectiveDate,
    temporalRule: COMMENCEMENT_DETAILS.constitutionalRule,
    sourceReference: `${COMMENCEMENT_DETAILS.gazetteRef}, Page 28`,
    specialNotes: "Group/mob murder is separately criminalized under BNS Section 103(2).",
  },

  // Culpable Homicide: IPC 304 -> BNS 105
  "304": {
    oldCode: "IPC",
    oldSection: "304",
    oldTitle: "Punishment for culpable homicide not amounting to murder",
    oldSummary: "Part I (intent): life imprisonment or up to 10 years + fine. Part II (knowledge): up to 10 years or fine, or both.",
    hasDirectEquivalent: true,
    newCode: "BNS",
    newSection: "105",
    newTitle: "Punishment for culpable homicide not amounting to murder",
    newSummary: "Maintains two-part structure based on intent vs knowledge with fine mandatory in both parts.",
    wordingDifferences: [
      "Retains the two distinct degrees of culpable homicide (intent vs knowledge).",
      "Fine is made mandatory in both parts under BNS Section 105.",
    ],
    penalChanges: "Fine is explicitly mandatory for both parts under BNS.",
    commencementInfo: COMMENCEMENT_DETAILS.notification,
    effectiveDate: COMMENCEMENT_DETAILS.effectiveDate,
    temporalRule: COMMENCEMENT_DETAILS.constitutionalRule,
    sourceReference: `${COMMENCEMENT_DETAILS.gazetteRef}, Page 29`,
  },

  // Death by Negligence / Hit & Run: IPC 304A -> BNS 106
  "304a": {
    oldCode: "IPC",
    oldSection: "304A",
    oldTitle: "Causing death by negligence",
    oldSummary: "Imprisonment of either description for a term which may extend to two years, or with fine, or with both.",
    hasDirectEquivalent: true,
    newCode: "BNS",
    newSection: "106",
    newTitle: "Causing death by negligence",
    newSummary: "Bifurcated: 106(1) general negligence up to 5 years (doctors up to 2 years); 106(2) hit-and-run failure to report up to 10 years + fine.",
    wordingDifferences: [
      "BNS 106(1) increases general punishment for rash and negligent acts causing death from 2 years to up to 5 years and fine.",
      "Registered medical practitioners in medical procedures receive maximum 2 years and fine.",
      "BNS 106(2) introduces a stringent hit-and-run provision: escaping without reporting to police/magistrate attracts up to 10 years imprisonment and fine.",
    ],
    penalChanges: "General negligence increased from 2 to 5 years. Hit-and-run failure to report carries up to 10 years.",
    commencementInfo: COMMENCEMENT_DETAILS.notification,
    effectiveDate: COMMENCEMENT_DETAILS.effectiveDate,
    temporalRule: COMMENCEMENT_DETAILS.constitutionalRule,
    sourceReference: `${COMMENCEMENT_DETAILS.gazetteRef}, Page 29`,
    specialNotes: "Implementation of Section 106(2) hit-and-run was held in abeyance pending consultations with transport unions.",
  },

  // Sedition: IPC 124A -> BNS 152 (NO DIRECT EQUIVALENT)
  "124a": {
    oldCode: "IPC",
    oldSection: "124A",
    oldTitle: "Sedition",
    oldSummary: "Whoever by words, signs, or visible representation brings or attempts to bring into hatred or contempt, or excites or attempts to excite disaffection towards the Government.",
    hasDirectEquivalent: false,
    newCode: "BNS",
    newSection: "152",
    newTitle: "Act endangering sovereignty, unity and integrity of India",
    newSummary: "Whoever knowingly excites or attempts to excite secession or armed rebellion or subversive activities, or endangers sovereignty, unity and integrity of India.",
    wordingDifferences: [
      "The colonial term 'Sedition' (Rajdroh) is completely omitted from the statute.",
      "The phrase 'disaffection towards the Government established by law' has been deleted.",
      "BNS Section 152 requires acts that incite secession, armed rebellion, subversive activities, or separatism.",
      "Adds electronic communication and financial means as explicit instrumentalities of the offence.",
    ],
    penalChanges: "IPC 124A provided imprisonment for life or up to 3 years. BNS 152 provides life imprisonment or up to 7 years + fine.",
    commencementInfo: COMMENCEMENT_DETAILS.notification,
    effectiveDate: COMMENCEMENT_DETAILS.effectiveDate,
    temporalRule: COMMENCEMENT_DETAILS.constitutionalRule,
    sourceReference: `${COMMENCEMENT_DETAILS.gazetteRef}, Page 43`,
    specialNotes:
      "Important distinction: IPC 124A is repealed and not directly replaced. BNS 152 has different ingredients focused on sovereignty and armed rebellion rather than disaffection against the Government.",
  },

  // Rape: IPC 375 & 376 -> BNS 63 & 64
  "376": {
    oldCode: "IPC",
    oldSection: "376",
    oldTitle: "Punishment for rape",
    oldSummary: "Rigorous imprisonment for not less than 10 years but which may extend to imprisonment for life, and fine.",
    hasDirectEquivalent: true,
    newCode: "BNS",
    newSection: "64",
    newTitle: "Punishment for rape",
    newSummary: "Rigorous imprisonment for a term which shall not be less than 10 years, but which may extend to life imprisonment, and fine.",
    wordingDifferences: [
      "Substantive definition of rape moved from IPC 375 to BNS 63.",
      "Punishment moved from IPC 376 to BNS 64.",
      "Gang rape moved from IPC 376D to BNS 70.",
      "BNS introduces Section 69: Sexual intercourse by deceitful means (e.g. false promise of employment/marriage).",
    ],
    penalChanges: "Substantive sentences aligned; minimum 10 years up to life imprisonment.",
    commencementInfo: COMMENCEMENT_DETAILS.notification,
    effectiveDate: COMMENCEMENT_DETAILS.effectiveDate,
    temporalRule: COMMENCEMENT_DETAILS.constitutionalRule,
    sourceReference: `${COMMENCEMENT_DETAILS.gazetteRef}, Page 16`,
  },

  // Cheating: IPC 420 -> BNS 318(4)
  "420": {
    oldCode: "IPC",
    oldSection: "420",
    oldTitle: "Cheating and dishonestly inducing delivery of property",
    oldSummary: "Imprisonment of either description for a term which may extend to seven years, and shall also be liable to fine.",
    hasDirectEquivalent: true,
    newCode: "BNS",
    newSection: "318(4)",
    newTitle: "Cheating and dishonestly inducing delivery of property",
    newSummary: "Whoever cheats and thereby dishonestly induces the person deceived to deliver any property shall be punished with imprisonment up to 7 years and fine.",
    wordingDifferences: [
      "The standalone legendary 'Section 420' has been consolidated as subsection (4) of Section 318 of BNS.",
      "General definition of cheating is contained in BNS Section 318(1).",
    ],
    penalChanges: "Punishment remains up to 7 years imprisonment and fine.",
    commencementInfo: COMMENCEMENT_DETAILS.notification,
    effectiveDate: COMMENCEMENT_DETAILS.effectiveDate,
    temporalRule: COMMENCEMENT_DETAILS.constitutionalRule,
    sourceReference: `${COMMENCEMENT_DETAILS.gazetteRef}, Page 82`,
  },

  // Cruelty by Husband/Relatives: IPC 498A -> BNS 85 & 86
  "498a": {
    oldCode: "IPC",
    oldSection: "498A",
    oldTitle: "Husband or relative of husband of a woman subjecting her to cruelty",
    oldSummary: "Imprisonment for a term which may extend to three years and shall also be liable to fine.",
    hasDirectEquivalent: true,
    newCode: "BNS",
    newSection: "85",
    newTitle: "Husband or relative of husband of a woman subjecting her to cruelty",
    newSummary: "Imprisonment for a term which may extend to three years and fine. Cruelty defined under Section 86.",
    wordingDifferences: [
      "The substantive punishment is under BNS Section 85.",
      "The statutory definition of 'cruelty' is split into a dedicated companion Section 86 of BNS.",
    ],
    penalChanges: "Punishment remains up to 3 years imprisonment and fine.",
    commencementInfo: COMMENCEMENT_DETAILS.notification,
    effectiveDate: COMMENCEMENT_DETAILS.effectiveDate,
    temporalRule: COMMENCEMENT_DETAILS.constitutionalRule,
    sourceReference: `${COMMENCEMENT_DETAILS.gazetteRef}, Page 24`,
  },

  // Defamation: IPC 499/500 -> BNS 356
  "500": {
    oldCode: "IPC",
    oldSection: "500",
    oldTitle: "Punishment for defamation",
    oldSummary: "Simple imprisonment for a term which may extend to two years, or with fine, or with both.",
    hasDirectEquivalent: true,
    newCode: "BNS",
    newSection: "356",
    newTitle: "Defamation and punishment for defamation",
    newSummary: "Consolidates definition and exceptions with punishment: simple imprisonment up to 2 years, or with fine, or with both, or with community service.",
    wordingDifferences: [
      "IPC 499 (definition and 10 exceptions) and IPC 500 (punishment) are consolidated into a single Section 356 BNS.",
      "Introduces 'community service' as an innovative alternative punishment.",
    ],
    penalChanges: "Adds community service as an alternative sentencing option.",
    commencementInfo: COMMENCEMENT_DETAILS.notification,
    effectiveDate: COMMENCEMENT_DETAILS.effectiveDate,
    temporalRule: COMMENCEMENT_DETAILS.constitutionalRule,
    sourceReference: `${COMMENCEMENT_DETAILS.gazetteRef}, Page 95`,
  },

  // Snatching (NEW in BNS - No specific IPC section)
  "snatching": {
    oldCode: "IPC",
    oldSection: "378 / 379",
    oldTitle: "Theft (No specific snatching offense existed in IPC)",
    oldSummary: "Snatching was prosecuted as ordinary theft or robbery under IPC 379/390.",
    hasDirectEquivalent: false,
    newCode: "BNS",
    newSection: "304",
    newTitle: "Snatching",
    newSummary: "Theft is snatching if, in order to commit theft, the offender suddenly or quickly or forcibly seizes, secures, grabs or takes away from any person any movable property.",
    wordingDifferences: [
      "BNS introduces a dedicated new penal category for snatching.",
      "Defines 'suddenly or quickly or forcibly seizes, secures, grabs or takes away'.",
    ],
    penalChanges: "BNS Section 304 provides rigorous imprisonment up to 3 years and fine.",
    commencementInfo: COMMENCEMENT_DETAILS.notification,
    effectiveDate: COMMENCEMENT_DETAILS.effectiveDate,
    temporalRule: COMMENCEMENT_DETAILS.constitutionalRule,
    sourceReference: `${COMMENCEMENT_DETAILS.gazetteRef}, Page 78`,
    specialNotes: "IPC had no separate snatching provision; it was an evidentiary gap filled by BNS 304.",
  },

  // Mob Lynching (NEW in BNS - No specific IPC section)
  "mob-lynching": {
    oldCode: "IPC",
    oldSection: "302 read with 34/149",
    oldTitle: "Murder with common intention/object (No specific mob lynching section)",
    oldSummary: "Charged under general murder (302) with constructive liability under Section 34 or 149.",
    hasDirectEquivalent: false,
    newCode: "BNS",
    newSection: "103(2)",
    newTitle: "Murder by group on ground of race, caste, sex, language, etc.",
    newSummary: "When a group of five or more persons acting in concert commits murder on ground of race, caste, sex, place of birth, language, personal belief or any other similar ground.",
    wordingDifferences: [
      "IPC had no specific provision for hate crimes or mob lynching.",
      "BNS 103(2) creates an explicit statutory offense for group murders based on identity markers.",
    ],
    penalChanges: "Each member of such group shall be punished with death or imprisonment for life, and shall also be liable to fine.",
    commencementInfo: COMMENCEMENT_DETAILS.notification,
    effectiveDate: COMMENCEMENT_DETAILS.effectiveDate,
    temporalRule: COMMENCEMENT_DETAILS.constitutionalRule,
    sourceReference: `${COMMENCEMENT_DETAILS.gazetteRef}, Page 28`,
    specialNotes: "Landmark reform addressing mob violence and targeted hate killings.",
  },

  // Organized Crime (NEW in BNS)
  "organized-crime": {
    oldCode: "IPC",
    oldSection: "None (Governed by state laws like MCOCA)",
    oldTitle: "No general organized crime provision in IPC",
    oldSummary: "IPC had no general organized crime chapter.",
    hasDirectEquivalent: false,
    newCode: "BNS",
    newSection: "111",
    newTitle: "Organised crime",
    newSummary: "Comprehensive definition of continuing unlawful activity including kidnapping, robbery, extortion, land grabbing, contract killing, cyber-crimes by syndicates.",
    wordingDifferences: [
      "Introduces federal organized crime definitions into general Indian penal law.",
      "Defines 'organised crime syndicate' and 'continuing unlawful activity'.",
    ],
    penalChanges: "Death or life imprisonment + minimum fine of 10 lakh rupees if death results; minimum 5 years up to life + minimum fine of 5 lakh rupees in other cases.",
    commencementInfo: COMMENCEMENT_DETAILS.notification,
    effectiveDate: COMMENCEMENT_DETAILS.effectiveDate,
    temporalRule: COMMENCEMENT_DETAILS.constitutionalRule,
    sourceReference: `${COMMENCEMENT_DETAILS.gazetteRef}, Page 31`,
  },
};

/**
 * Compares an IPC provision to its corresponding BNS provision.
 */
export function compareIpcToBns(term: string): StatutoryComparison | null {
  if (!term || typeof term !== "string") return null;

  const rawLower = term.toLowerCase().trim();
  const clean = rawLower.replace(/[^a-z0-9]/g, "");

  // 1. Direct match
  if (IPC_BNS_COMPARISONS[rawLower]) return IPC_BNS_COMPARISONS[rawLower];
  if (IPC_BNS_COMPARISONS[clean]) return IPC_BNS_COMPARISONS[clean];

  // 2. Normalized term match across keys, section numbers, and titles
  for (const [key, comp] of Object.entries(IPC_BNS_COMPARISONS)) {
    const keyClean = key.replace(/[^a-z0-9]/g, "");
    if (
      keyClean === clean ||
      keyClean.includes(clean) ||
      clean.includes(keyClean) ||
      comp.oldSection.toLowerCase().replace(/[^a-z0-9]/g, "") === clean ||
      comp.newSection?.toLowerCase().replace(/[^a-z0-9]/g, "") === clean ||
      comp.oldTitle.toLowerCase().includes(rawLower) ||
      comp.newTitle?.toLowerCase().includes(rawLower)
    ) {
      return comp;
    }
  }

  return null;
}
