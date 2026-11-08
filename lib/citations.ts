export type Citation = {
  type: "act" | "web" | "case";
  label: string;
  snippet: string;
  url?: string;
};

const ACT_YEARS: Record<string, string> = {
  // Constitution & Polity
  "Constitution of India": "1950",

  // Criminal Law
  "Indian Penal Code": "1860",
  "Bharatiya Nyaya Sanhita": "2023",
  "Code of Criminal Procedure": "1973",
  "Bharatiya Nagarik Suraksha Sanhita": "2023",
  "Indian Evidence Act": "1872",
  "Bharatiya Sakshya Adhiniyam": "2023",
  "Arms Act": "1959",
  "Dowry Prohibition Act": "1961",
  "Unlawful Activities Prevention Act": "1967",
  "Prevention of Money Laundering Act": "2002",
  "Explosive Substances Act": "1908",
  "Prevention of Corruption Act": "1988",
  "Armed Forces Special Powers Act": "1958",
  "Narcotic Drugs and Psychotropic Substances Act": "1985",
  "Protection of Children from Sexual Offences Act": "2012",
  "Juvenile Justice Act": "2015",

  // Civil Law
  "Code of Civil Procedure": "1908",
  "Transfer of Property Act": "1882",
  "Indian Contract Act": "1872",
  "Specific Relief Act": "1963",
  "Arbitration Act": "1996",
  "Limitation Act": "1963",
  "Sale of Goods Act": "1930",
  "Negotiable Instruments Act": "1881",
  "Registration Act": "1908",
  "Indian Partnership Act": "1932",
  "Indian Stamp Act": "1899",

  // Family Law
  "Consumer Protection Act": "2019",
  "Indian Succession Act": "1925",
  "Hindu Succession Act": "1956",
  "Protection of Women from Domestic Violence Act": "2005",
  "Hindu Marriage Act": "1955",
  "Special Marriage Act": "1954",
  "Hindu Adoption and Maintenance Act": "1956",
  "Hindu Minority and Guardianship Act": "1956",
  "Muslim Personal Law Application Act": "1937",
  "Dissolution of Muslim Marriages Act": "1939",
  "Mussalman Wakf Act": "1923",
  "Wakf Act": "1995",
  "Guardians and Wards Act": "1890",
  "Foreign Marriage Act": "1969",

  // Commercial Law
  "Companies Act": "2013",
  "Insolvency and Bankruptcy Code": "2016",
  "Competition Act": "2002",
  "Foreign Exchange Management Act": "1999",
  "Securitisation and Reconstruction of Financial Assets and Enforcement of Security Interest Act":
    "2002",
  "SARFAESI Act": "2002",
  "Recovery of Debts and Bankruptcy Act": "1993",
  "Micro Small and Medium Enterprises Development Act": "2006",
  "Real Estate Regulation and Development Act": "2016",
  "RERA": "2016",
  "Securities and Exchange Board of India Act": "1992",
  "SEBI Act": "1992",

  // Labour & Service Law
  "Industrial Disputes Act": "1947",
  "Factories Act": "1948",
  "Employees Provident Funds Act": "1952",
  "Payment of Gratuity Act": "1972",
  "Payment of Wages Act": "1936",
  "Minimum Wages Act": "1948",
  "Maternity Benefit Act": "1961",
  "Equal Remuneration Act": "1976",
  "Trade Unions Act": "1926",
  "Sexual Harassment of Women at Workplace Act": "2013",
  "POSH Act": "2013",
  "Apprentices Act": "1961",
  "Contract Labour Act": "1970",

  // IP & Tech Law
  "Information Technology Act": "2000",
  "IT Act": "2000",
  "Copyright Act": "1957",
  "Patents Act": "1970",
  "Trade Marks Act": "1999",
  "Design Act": "2000",
  "Geographical Indications Act": "1999",
  "Digital Personal Data Protection Act": "2023",
  "DPDP Act": "2023",

  // Environmental Law
  "Environment Protection Act": "1986",
  "Water Prevention and Control of Pollution Act": "1974",
  "Air Prevention and Control of Pollution Act": "1981",
  "Forest Conservation Act": "1980",
  "Wild Life Protection Act": "1972",
  "National Green Tribunal Act": "2010",
  "NGT Act": "2010",
  "Biological Diversity Act": "2002",
  "Public Liability Insurance Act": "1991",

  // Taxation & Revenue
  "Income Tax Act": "1961",
  "Central Goods and Services Tax Act": "2017",
  "CGST Act": "2017",
  "Integrated Goods and Services Tax Act": "2017",
  "IGST Act": "2017",
  "Customs Act": "1962",
  "Central Excise Act": "1944",
  "Black Money Act": "2015",
  "Fugitive Economic Offenders Act": "2018",

  // Administrative & Public Law
  "Right to Information Act": "2005",
  "RTI Act": "2005",
  "Lokpal and Lokayuktas Act": "2013",
  "Central Vigilance Commission Act": "2003",
  "CVC Act": "2003",
  "Commissions of Inquiry Act": "1952",
  "Disaster Management Act": "2005",
  "National Investigation Agency Act": "2008",
  "NIA Act": "2008",
  "Right to Fair Compensation and Transparency in Land Acquisition Act":
    "2013",
  "Land Acquisition Act": "2013",
  "Motor Vehicles Act": "1988",
  "Electricity Act": "2003",
  "Telecom Regulatory Authority of India Act": "1997",
  "TRAI Act": "1997",
  "Food Safety and Standards Act": "2006",
  "FSSAI Act": "2006",
  "Drugs and Cosmetics Act": "1940",
  "Medical Termination of Pregnancy Act": "1971",
  "MTP Act": "1971",
  "Surrogacy Regulation Act": "2021",
  "Assisted Reproductive Technology Regulation Act": "2021",
  "Mental Healthcare Act": "2017",
  "Rights of Persons with Disabilities Act": "2016",
  "RPWD Act": "2016",
  "Citizenship Act": "1955",
  "Passports Act": "1967",
  "Foreigners Act": "1946",
  "Extradition Act": "1962",
  "Emigration Act": "1983",
  "Census Act": "1948",
  "Epidemic Diseases Act": "1897",
  "Scheduled Castes and Scheduled Tribes Prevention of Atrocities Act": "1989",
};

export function formatCitation(cit: Citation): string {
  if (cit.type === "web") {
    return cit.url ? cit.label : `${cit.label} (web source)`;
  }

  if (cit.type === "case") {
    return cit.label;
  }

  const label = cit.label
    .replace(/\(Section[s]? \d+(?:[a-z])?[^)]*\)/i, "")
    .trim();
  const secMatch = cit.label.match(
    /\(Section[s]? (\d+(?:[a-z])?(?:[-–—]\d+(?:[a-z])?)?)[^)]*\)/i,
  );

  let actName = label;
  let year = "";
  for (const [name, y] of Object.entries(ACT_YEARS)) {
    if (label.toLowerCase().includes(name.toLowerCase())) {
      actName = name;
      year = y;
      break;
    }
  }

  const actWithYear = year ? `${actName}, ${year}` : actName;
  if (secMatch) {
    return `The ${actWithYear}, s. ${secMatch[1]}`;
  }
  return `The ${actWithYear}`;
}

export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    /* fall through to legacy path */
  }
  try {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.style.position = "fixed";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.focus();
    ta.select();
    const ok = document.execCommand("copy");
    document.body.removeChild(ta);
    return ok;
  } catch {
    return false;
  }
}
