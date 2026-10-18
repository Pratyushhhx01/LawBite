export interface SectionMapping {
  code: "IPC" | "CrPC" | "Evidence Act";
  oldSection: string;
  actKey: string;
  newCode: "BNS" | "BNSS" | "BSA";
  newSection: string;
  newActKey: string;
  offence: string;
}

const IPC_OLD_KEY = "ipc";
const BNS_KEY = "bharatiya-nyaya-sanhita";
const CRPC_OLD_KEY = "crpc";
const BNSS_KEY = "bharatiya-nagrik-suraksha-sanhita";
const EVIDENCE_KEY = "evidence-act";
const BSA_KEY = "bharatiya-sakshya-adhiniyam";

/**
 * Verified mappings of commonly cited OLD sections (IPC/CrPC/Evidence Act)
 * to their NEW equivalents (BNS/BNSS/BSA) effective 1 July 2024.
 * Cross-verified against Gazette-published bare acts and multiple practitioner references.
 */
export const SECTION_MAPPINGS: SectionMapping[] = [
  // ── IPC → BNS ──────────────────────────────────────────────
  {
    code: "IPC",
    oldSection: "302",
    actKey: IPC_OLD_KEY,
    newCode: "BNS",
    newSection: "103",
    newActKey: BNS_KEY,
    offence: "Murder",
  },
  {
    code: "IPC",
    oldSection: "304",
    actKey: IPC_OLD_KEY,
    newCode: "BNS",
    newSection: "105",
    newActKey: BNS_KEY,
    offence: "Culpable homicide not amounting to murder",
  },
  {
    code: "IPC",
    oldSection: "304A",
    actKey: IPC_OLD_KEY,
    newCode: "BNS",
    newSection: "106",
    newActKey: BNS_KEY,
    offence: "Causing death by negligence",
  },
  {
    code: "IPC",
    oldSection: "304B",
    actKey: IPC_OLD_KEY,
    newCode: "BNS",
    newSection: "80",
    newActKey: BNS_KEY,
    offence: "Dowry death",
  },
  {
    code: "IPC",
    oldSection: "307",
    actKey: IPC_OLD_KEY,
    newCode: "BNS",
    newSection: "109",
    newActKey: BNS_KEY,
    offence: "Attempt to murder",
  },
  {
    code: "IPC",
    oldSection: "306",
    actKey: IPC_OLD_KEY,
    newCode: "BNS",
    newSection: "108",
    newActKey: BNS_KEY,
    offence: "Abetment of suicide",
  },
  {
    code: "IPC",
    oldSection: "323",
    actKey: IPC_OLD_KEY,
    newCode: "BNS",
    newSection: "115",
    newActKey: BNS_KEY,
    offence: "Voluntarily causing hurt",
  },
  {
    code: "IPC",
    oldSection: "326",
    actKey: IPC_OLD_KEY,
    newCode: "BNS",
    newSection: "118",
    newActKey: BNS_KEY,
    offence: "Grievous hurt by dangerous weapons",
  },
  {
    code: "IPC",
    oldSection: "341",
    actKey: IPC_OLD_KEY,
    newCode: "BNS",
    newSection: "126",
    newActKey: BNS_KEY,
    offence: "Wrongful restraint",
  },
  {
    code: "IPC",
    oldSection: "354",
    actKey: IPC_OLD_KEY,
    newCode: "BNS",
    newSection: "74",
    newActKey: BNS_KEY,
    offence: "Outraging a woman's modesty",
  },
  {
    code: "IPC",
    oldSection: "354A",
    actKey: IPC_OLD_KEY,
    newCode: "BNS",
    newSection: "75",
    newActKey: BNS_KEY,
    offence: "Sexual harassment",
  },
  {
    code: "IPC",
    oldSection: "375",
    actKey: IPC_OLD_KEY,
    newCode: "BNS",
    newSection: "63",
    newActKey: BNS_KEY,
    offence: "Rape (definition)",
  },
  {
    code: "IPC",
    oldSection: "376",
    actKey: IPC_OLD_KEY,
    newCode: "BNS",
    newSection: "64",
    newActKey: BNS_KEY,
    offence: "Rape (punishment)",
  },
  {
    code: "IPC",
    oldSection: "377",
    actKey: IPC_OLD_KEY,
    newCode: "BNS",
    newSection: "68",
    newActKey: BNS_KEY,
    offence: "Unnatural offences",
  },
  {
    code: "IPC",
    oldSection: "379",
    actKey: IPC_OLD_KEY,
    newCode: "BNS",
    newSection: "303",
    newActKey: BNS_KEY,
    offence: "Theft",
  },
  {
    code: "IPC",
    oldSection: "406",
    actKey: IPC_OLD_KEY,
    newCode: "BNS",
    newSection: "316",
    newActKey: BNS_KEY,
    offence: "Criminal breach of trust",
  },
  {
    code: "IPC",
    oldSection: "420",
    actKey: IPC_OLD_KEY,
    newCode: "BNS",
    newSection: "318",
    newActKey: BNS_KEY,
    offence: "Cheating",
  },
  {
    code: "IPC",
    oldSection: "498A",
    actKey: IPC_OLD_KEY,
    newCode: "BNS",
    newSection: "85",
    newActKey: BNS_KEY,
    offence: "Cruelty by husband or relatives",
  },
  {
    code: "IPC",
    oldSection: "506",
    actKey: IPC_OLD_KEY,
    newCode: "BNS",
    newSection: "351",
    newActKey: BNS_KEY,
    offence: "Criminal intimidation",
  },
  {
    code: "IPC",
    oldSection: "509",
    actKey: IPC_OLD_KEY,
    newCode: "BNS",
    newSection: "79",
    newActKey: BNS_KEY,
    offence: "Insulting a woman's modesty (word/gesture)",
  },
  {
    code: "IPC",
    oldSection: "34",
    actKey: IPC_OLD_KEY,
    newCode: "BNS",
    newSection: "3(5)",
    newActKey: BNS_KEY,
    offence: "Common intention",
  },
  {
    code: "IPC",
    oldSection: "120B",
    actKey: IPC_OLD_KEY,
    newCode: "BNS",
    newSection: "61",
    newActKey: BNS_KEY,
    offence: "Criminal conspiracy",
  },
  {
    code: "IPC",
    oldSection: "124A",
    actKey: IPC_OLD_KEY,
    newCode: "BNS",
    newSection: "152",
    newActKey: BNS_KEY,
    offence: "Sedition (recast, narrowed scope)",
  },

  // ── CrPC → BNSS ────────────────────────────────────────────
  {
    code: "CrPC",
    oldSection: "144",
    actKey: CRPC_OLD_KEY,
    newCode: "BNSS",
    newSection: "163",
    newActKey: BNSS_KEY,
    offence:
      "Power to issue order in urgent cases of nuisance or apprehended danger",
  },
  {
    code: "CrPC",
    oldSection: "154",
    actKey: CRPC_OLD_KEY,
    newCode: "BNSS",
    newSection: "173",
    newActKey: BNSS_KEY,
    offence: "FIR / information in cognizable offence (Zero FIR)",
  },
  {
    code: "CrPC",
    oldSection: "167",
    actKey: CRPC_OLD_KEY,
    newCode: "BNSS",
    newSection: "187",
    newActKey: BNSS_KEY,
    offence: "Remand / detention when investigation incomplete",
  },
  {
    code: "CrPC",
    oldSection: "438",
    actKey: CRPC_OLD_KEY,
    newCode: "BNSS",
    newSection: "482",
    newActKey: BNSS_KEY,
    offence: "Anticipatory bail",
  },
  {
    code: "CrPC",
    oldSection: "482",
    actKey: CRPC_OLD_KEY,
    newCode: "BNSS",
    newSection: "528",
    newActKey: BNSS_KEY,
    offence: "Inherent powers of High Court",
  },
  {
    code: "CrPC",
    oldSection: "436",
    actKey: CRPC_OLD_KEY,
    newCode: "BNSS",
    newSection: "478",
    newActKey: BNSS_KEY,
    offence: "Bail in bailable offences",
  },
  {
    code: "CrPC",
    oldSection: "437",
    actKey: CRPC_OLD_KEY,
    newCode: "BNSS",
    newSection: "480",
    newActKey: BNSS_KEY,
    offence: "Bail in non-bailable offences",
  },

  // ── Evidence Act → BSA ─────────────────────────────────────
  {
    code: "Evidence Act",
    oldSection: "65B",
    actKey: EVIDENCE_KEY,
    newCode: "BSA",
    newSection: "63",
    newActKey: BSA_KEY,
    offence: "Admissibility of electronic records",
  },
  {
    code: "Evidence Act",
    oldSection: "45",
    actKey: EVIDENCE_KEY,
    newCode: "BSA",
    newSection: "39",
    newActKey: BSA_KEY,
    offence: "Opinions of experts",
  },
  {
    code: "Evidence Act",
    oldSection: "32",
    actKey: EVIDENCE_KEY,
    newCode: "BSA",
    newSection: "26",
    newActKey: BSA_KEY,
    offence: "Dying declaration / statements of persons who cannot be called",
  },
];

const byOld = new Map<string, SectionMapping>();
for (const m of SECTION_MAPPINGS) byOld.set(`${m.code}:${m.oldSection}`, m);

const byNew = new Map<string, SectionMapping>();
for (const m of SECTION_MAPPINGS) byNew.set(`${m.newCode}:${m.newSection}`, m);

export function findMappingByOld(
  code: string,
  section: string,
): SectionMapping | undefined {
  return byOld.get(`${code}:${section}`);
}

export function findMappingByNew(
  code: string,
  section: string,
): SectionMapping | undefined {
  return byNew.get(`${code}:${section}`);
}

export function mappingPromptBlock(): string {
  return SECTION_MAPPINGS.map(
    (m) =>
      `${m.code} ${m.oldSection} (${m.offence}) → ${m.newCode} ${m.newSection}`,
  ).join("\n");
}
