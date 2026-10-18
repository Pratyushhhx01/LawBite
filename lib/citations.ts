export type Citation = {
  type: "act" | "web";
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
  "Dissolution of Muslim Marriages Act": "1939",
  "Indian Divorce Act": "1869",
  "Indian Christian Marriage Act": "1872",
  "Parsi Marriage and Divorce Act": "1936",
  "Prohibition of Child Marriage Act": "2006",
  "Guardians and Wards Act": "1890",
  "Maintenance and Welfare of Parents and Senior Citizens Act": "2007",

  // Police & Procedure
  "Police Act": "1861",
  "National Investigation Agency Act": "2008",

  // Human Rights & Social Welfare
  "Protection of Human Rights Act": "1993",
  "Sexual Harassment of Women at Workplace Act": "2013",
  "Maternity Benefit Act": "1961",
  "Mental Healthcare Act": "2017",
  "National Food Security Act": "2013",
  "Rights of Persons with Disabilities Act": "2016",
  "Child Labour Prohibition and Regulation Act": "1986",

  // Cyber Law & IT
  "Information Technology Act": "2000",
  "Digital Personal Data Protection Act": "2023",
  "Aadhaar Act": "2016",
  "Right to Information Act": "2005",

  // Corporate & Business Law
  "Companies Act": "2013",
  "Competition Act": "2002",
  "Securities and Exchange Board of India Act": "1992",
  "Foreign Exchange Management Act": "1999",
  "Micro Small and Medium Enterprises Development Act": "2006",
  "Benami Transactions Prohibition Act": "1988",
  "Black Money Act": "2015",
  "Securitisation and Reconstruction of Financial Assets Act": "2002",

  // Labour & Employment
  "Minimum Wages Act": "1948",
  "Payment of Wages Act": "1936",
  "Industrial Disputes Act": "1947",
  "Trade Unions Act": "1926",
  "Factories Act": "1948",
  "Essential Commodities Act": "1955",

  // Taxation
  "Income Tax Act": "1961",
  "Central Goods and Services Tax Act": "2017",
  "Customs Act": "1962",
  "Central Excise Act": "1944",

  // Land & Environment
  "Right to Fair Compensation and Transparency in Land Acquisition Act": "2013",
  "Lokpal and Lokayuktas Act": "2013",
  "Wildlife Protection Act": "1972",
  "Forest Conservation Act": "1980",
  "Water Prevention and Control of Pollution Act": "1974",
  "Air Prevention and Control of Pollution Act": "1981",
  "National Green Tribunal Act": "2010",
  "Biological Diversity Act": "2002",
  "Environment Protection Act": "1986",

  // Consumer & Food
  "Food Safety and Standards Act": "2006",
  "Drugs and Cosmetics Act": "1940",

  // Intellectual Property
  "Patents Act": "1970",
  "Copyright Act": "1957",
  "Trade Marks Act": "1999",
  "Geographical Indications of Goods Act": "1999",

  // Banking & Finance
  "Reserve Bank of India Act": "1934",
  "Banking Regulation Act": "1949",
  "Insurance Regulatory and Development Authority Act": "1999",
  "Motor Vehicles Act": "1988",

  // Miscellaneous
  "Contempt of Courts Act": "1971",
  "Official Secrets Act": "1923",
  "Passport Act": "1967",
  "Indian Telegraph Act": "1885",
  "Census Act": "1948",
  "Epidemic Diseases Act": "1897",
  "Scheduled Castes and Scheduled Tribes Prevention of Atrocities Act": "1989",
};

export function formatCitation(cit: Citation): string {
  if (cit.type === "web") {
    return cit.url ? cit.label : `${cit.label} (web source)`;
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
