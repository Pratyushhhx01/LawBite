/**
 * Pure query-classification helpers used by the chat route and its tests.
 *
 * Keeping these out of `app/api/chat/route.ts` keeps the route file limited to
 * Next.js route exports (Next rejects arbitrary exports from route modules) and
 * makes the filters directly testable without importing the whole chat route.
 */

const NON_LEGAL_TOPIC_PATTERNS: RegExp[] = [
  /\b(who is|who was|who's)\s+(?!the\s*(?:chief justice|president|prime minister|pm|governor|cji|cm|chief minister|speaker|chairman|chairperson|justice|minister|court|commissioner))/i,
  /\b(cricket|football|soccer|tennis|basketball|baseball|golf|formula\s*1|f1\s*racing|olympics|world\s*cup|ipl|premier\s*league|champions\s*league|bcci|icc)\b/i,
  /\b(movie|movies|film|films|bollywood|hollywood|actor|actress|actresses|directors?|singers?|albums?|songs?|concerts?|netflix|amazon\s*prime|disney|filmfare|plot\s+of)\b/i,
  /\b(recipe|recipes|cooking|cook|cook(?:ing)?\s+(?:a|the|some)|restaurant|restaurants?|food|cuisine|chef|chefs|dishes?|ingredients?)\b/i,
  /\b(weather|temperature|forecast|rain|sunny|cloudy)\b/i,
  /\b(google|apple|microsoft|amazon(?!\s*(?:prim|aws|s3))|tesla|spacex|openai|chatgpt|ai\s+model|machine\s+learning|deep\s+learning|neural\s+networks?)\b/i,
  /\b(cricket(?:er)?|football(?:er)?|batsman|batsmen|bowler|bowlers|wickets?|goals?|tournaments?|ipl\s+team|match(?:es)?|scores?)\b/i,
  /\b(population|gdp|economy|economies|inflation|stock\s+market|share\s+prices?|crypto(?:currency)?|bitcoin|ethereum)\b/i,
  /\b(relationship|dating|boyfriend|girlfriend|breakup|break\s+up)\b/i,
  /\b(gym|workout|workouts|diet|diets|weight\s+loss|lose\s+weight|exercises?|yoga|meditation|health\s+tips?)\b/i,
  /\b(travel|tourism|tourist|flights?|hotels?|airlines?|airports?|destinations?)\b/i,
  /\b(horoscope|astrology|zodiac|tarot|palm\s+reading|numerology)\b/i,
  /\b(history|historian|invented|invention|telephone|science|scientist|scientific|geography|gravity|discovered)\b/i,
  /\b(business\s+strategy|startup|startups|entrepreneurship|entrepreneur)\b/i,
];

/**
 * Strong signals that a query is about Indian law. The non-legal blocklist
 * above is deliberately broad, so a single generic word ("history",
 * "relationship", "scientific", "us") must never be enough to refuse a
 * genuine legal question. When any of these appear, the model decides instead
 * of the keyword filter.
 */
const LEGAL_SIGNAL_PATTERN = new RegExp(
  [
    // Statute, section and article references.
    "\\b(?:section|article)\\s+\\d+",
    "\\b(?:ipc|crpc|bnss|bns|bsa|cpc|hma|ida|sma|pwdva|posh|rera|dpdp|gst|ni act)\\b",
    "\\b(?:indian penal code|penal code|criminal procedure code|evidence act|constitution|companies act|contract act|consumer protection act|arbitration and conciliation act|limitation act|negotiable instruments act)\\b",
    // Courts, legal actors and procedure.
    "\\b(?:law|laws|legal|lawful|unlawful|illegal|legality|lawsuit|litigation|court|courts|tribunal|judge|justice|magistrate|chief justice|supreme court|high court|district court|sessions court|advocate|lawyer|attorney|solicitor|notary|prosecutor|prosecution|defendant|plaintiff|petitioner|respondent|accused|victim|complainant|witness|complaint|petition|plaint|suit|fir|bail|arrest|custody|police|crime|criminal|civil|offence|offense|punishment|penalty|fine|imprisonment|sentence|conviction|acquittal|appeal|revision|writ|habeas corpus|mandamus|certiorari|quo warranto)\\b",
    // Constitution, rights and remedies.
    "\\b(?:constitution|constitutional|fundamental rights?|directive principles?|legal rights?|human rights?|consumer rights?|property rights?|women'?s rights?|right to|duties|obligation|liability|liable|damages|compensation|injury|accident|insurance)\\b",
    // Transactions, property, employment and family.
    "\\b(?:contract|agreement|deed|lease|landlord|tenant|eviction|rent control|property|possession|mortgage|loan|salary|wages|employer|employee|employment|termination|labour|labor|provident fund|gratuity|bonus|divorce|maintenance|alimony|custody|dowry|marriage|marital|adoption|guardianship|succession|inheritance|testament|probate|cheque|negotiable|consumer|refund|defective|deficiency)\\b",
    // Offences, disputes, tax and constitutional offices.
    "\\b(?:fraud|cheating|forgery|defamation|cyber|data protection|privacy|trademark|copyright|patent|insolvency|bankruptcy|company|partnership|arbitration|mediation|tax|gst|income tax|assessment|summons|decree|execution|jurisdiction|limitation|evidence|burden of proof|confession|anticipatory bail|quash|discharge|compromise|settlement)\\b",
    // Common legal phrases built from otherwise generic words.
    "\\b(?:legal|show\\s+cause|eviction|demand|service\\s+of)\\s+notice\\b",
    "\\bnotice\\s+period\\b",
  ].join("|"),
  "i",
);

/**
 * Questions about the assistant itself are out of scope even when the words
 * around them look legal. These patterns are unambiguous ("which model are you
 * using", "ignore previous instructions"), so they are refused regardless of
 * any legal keyword in the sentence.
 */
const STRONG_ASSISTANT_META_PATTERNS: RegExp[] = [
  /\b(?:which|what)\s+(?:ai\s+|a\.i\.\s+)?(?:llm|language\s+model|model)\s+(?:are|r|do|does)\s+(?:you|u)\b/i,
  /\b(?:which|what)\s+(?:ai|a\.i\.|llm|language\s+model|model)\s+(?:is|are)\s+(?:you|u)\b/i,
  /\b(?:who|what)\s+(?:are|r)\s+(?:you|u)\s*[?.!]*$/i,
  /\b(?:are|r)\s+(?:you|u)\s+(?:an?\s+)?(?:ai|a\.i\.|bot|chatbot|llm|gpt|chatgpt|claude|gemini|llama|mercury)\b/i,
  /\b(?:are|r)\s+(?:you|u)\s+(?:an?\s+)?(?:human|real|machine|model)\s*[?.!]*$/i,
  /\b(?:who|what)\s+(?:made|created|built|trained|owns|developed)\s+(?:you|u)\b/i,
  /\bwhere\s+(?:are|r)\s+(?:you|u)\s+from\s*[?.!]*$/i,
  /\b(?:system\s+prompt|developer\s+message|prompt\s+injection|jailbreak|ignore\s+(?:all\s+)?(?:previous|prior|above)\s+instructions?|reveal\s+your\s+(?:prompt|instructions?|model))\b/i,
  /\b(?:how\s+(?:do|does)\s+(?:you|it)\s+work|how\s+(?:were|are)\s+you\s+trained|what\s+(?:data|corpus)\s+(?:are|were)\s+you\s+trained\s+on|are\s+you\s+sentient|do\s+you\s+have\s+feelings|can\s+you\s+think)\b/i,
];

/**
 * Weaker identity signals ("your model", "what AI", model brand names). These
 * only count when the sentence carries no substantive legal signal, so genuine
 * questions such as "what model form of contract should I use" still reach the
 * model.
 */
const WEAK_ASSISTANT_META_PATTERNS: RegExp[] = [
  /\b(?:which|what)\s+(?:ai|a\.i\.|llm|language\s+model)\b/i,
  /\b(?:which|what)\s+(?:ai\s+|a\.i\.\s+)?(?:llm|language\s+model|model)\s+(?:is|are)\s+(?:this|it|behind)\b/i,
  /\b(?:which|what)\s+(?:ai\s+|a\.i\.\s+)?(?:llm|language\s+model|model)\s+(?:does|do)\s+(?:this|the|it|lawbite)\b/i,
  /\b(?:what|which)\s+(?:ai|a\.i\.|llm)\s+(?:powers?|runs?|drives?|is\s+behind)\b/i,
  /\byour\s+(?:name|model|provider|version|creator|maker|developer|company|owner|architecture|parameters?|training\s+data|system\s+prompt|purpose)\b/i,
  /\bthe\s+(?:model|provider|version|creator|maker|developer|company|owner|architecture|parameters?|training\s+data|system\s+prompt)\b/i,
  /\b(?:chatgpt|openai|gpt-?[0-9]|claude|gemini|llama|mercury|inception\s+labs|anthropic|deepseek)\b/i,
  /\b(?:what\s+can\s+you\s+do|what\s+are\s+your\s+capabilities|help\s+me\s+use\s+(?:this|the)\s+app)\b/i,
  /\b(?:what|which)\s+(?:is|are)\s+(?:this|the)\s+(?:app|website|service|product|platform|lawbite)\b/i,
  /\bhow\s+(?:do|can)\s+i\s+use\s+(?:this|the)\s+(?:app|website|service|platform)\b/i,
];

/**
 * "Model" is a normal legal word ("model code of conduct", "model form of
 * contract"). Keep those out of the meta bucket even though they use a term
 * that also appears in identity questions.
 */
const LEGAL_MODEL_TERMS =
  /\bmodel\s+(?:code\s+of\s+conduct|rules?|form|clause|contract|agreement|bye-?laws?|standing\s+orders?|employer|tenant|landlord|scheme|policy)\b/i;

/**
 * True when the user is asking about the assistant, its model/provider, its
 * hidden instructions, or product capabilities rather than Indian law.
 */
export function isAssistantMetaQuery(query: string): boolean {
  const lower = query.toLowerCase();
  if (STRONG_ASSISTANT_META_PATTERNS.some((re) => re.test(lower))) return true;
  if (LEGAL_MODEL_TERMS.test(lower)) return false;
  if (LEGAL_SIGNAL_PATTERN.test(lower)) return false;
  return WEAK_ASSISTANT_META_PATTERNS.some((re) => re.test(lower));
}

export function isNonLegalQuery(query: string): boolean {
  const lower = query.toLowerCase();
  // Meta/identity questions are never Indian-law questions, even if they
  // arrive in the middle of a legal conversation.
  if (isAssistantMetaQuery(query)) return true;
  // Never refuse a query that carries a substantive legal signal. The model
  // still applies the Indian-law-only rule, but the cheap keyword filter must
  // not produce false positives such as "who is liable", "history of the
  // Dowry Prohibition Act", or "scientific evidence under BSA".
  if (LEGAL_SIGNAL_PATTERN.test(lower)) return false;
  return NON_LEGAL_TOPIC_PATTERNS.some((re) => re.test(lower));
}

const FOREIGN_JURISDICTION_KEYWORDS = [
  "usa",
  "united states",
  "america",
  "american",
  "u.s.a",
  "united kingdom",
  "britain",
  "british",
  "england",
  "canada",
  "australia",
  "europe",
  "european",
  "germany",
  "france",
  "italy",
  "spain",
  "china",
  "japan",
  "russia",
  "brazil",
  "mexico",
  "new york",
  "california",
  "texas",
  "canadian",
  "australian",
  "european union",
  "french",
  "german",
  "japanese",
  "dubai",
  "singapore",
  "hong kong",
  "pakistan",
  "bangladesh",
  "nepal",
  "sri lanka",
  "chinese",
  "russian",
  "brazilian",
  "mexican",
  "italian",
  "spanish",
  "pakistani",
  "bangladeshi",
  "nepali",
  "sri lankan",
  "new zealand",
  "south africa",
  "ireland",
  "scotland",
  "wales",
];

/** True when a query asks about a law outside India. */
export function mentionsForeignJurisdiction(query: string): boolean {
  const lower = query.toLowerCase();
  const keywordHit = FOREIGN_JURISDICTION_KEYWORDS.some((kw) => {
    const escaped = kw.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    return new RegExp(`\\b${escaped}\\b`, "i").test(lower);
  });
  if (keywordHit) return true;

  // Two-letter codes are ambiguous in lowercase ("tell us", "eu"), and the
  // original code matched "us" in ordinary prose, refusing valid questions
  // such as "help us file a consumer complaint". Match them only when they
  // are uppercase or in an unmistakably legal phrase.
  return (
    /\bU\.S\.(?:A\.?)?/i.test(query) ||
    /\bUS\b/.test(query) ||
    /\bUK\b/.test(query) ||
    /\bEU\b/.test(query) ||
    /\bUAE\b/.test(query)
  );
}

const INDIAN_CONTEXT_PATTERN =
  /\b(india|indian|bharat|bharatiya|nri|oci|person of indian origin)\b/i;
const INDIAN_LEGAL_REFERENCE_PATTERN =
  /\b(?:ipc|crpc|bnss|bns|bsa|cpc|hma|ida|sma|pwdva|posh|rera|dpdp|gst|ni act)\b|\b(?:section|article)\s+\d+/i;

/** True when the query is anchored in Indian law, even if it mentions abroad. */
export function hasIndianContext(query: string): boolean {
  return (
    INDIAN_CONTEXT_PATTERN.test(query) ||
    INDIAN_LEGAL_REFERENCE_PATTERN.test(query)
  );
}

/**
 * Bare acronyms like "ipc" are unambiguously Indian statutes to a lawyer, but
 * models often read them as generic tech/government abbreviations and refuse.
 * Inject the expansion so a one-word acronym question is answered instead of
 * rejected as non-legal.
 */
const LEGAL_ACRONYMS: Array<{ pattern: RegExp; definition: string }> = [
  {
    pattern: /\bipc\b/i,
    definition:
      "IPC = Indian Penal Code, 1860. Replaced by the Bharatiya Nyaya Sanhita (BNS), 2023, with effect from 1 July 2024.",
  },
  {
    pattern: /\bcrpc\b/i,
    definition:
      "CrPC = Code of Criminal Procedure, 1973. Replaced by the Bharatiya Nagarik Suraksha Sanhita (BNSS), 2023, with effect from 1 July 2024.",
  },
  {
    pattern: /\bevidence\s+act\b/i,
    definition:
      "Evidence Act = Indian Evidence Act, 1872. Replaced by the Bharatiya Sakshya Adhiniyam (BSA), 2023, with effect from 1 July 2024.",
  },
  {
    pattern: /\bbns\b/i,
    definition:
      "BNS = Bharatiya Nyaya Sanhita, 2023 — the current Indian criminal code, replacing the IPC.",
  },
  {
    pattern: /\bbnss\b/i,
    definition:
      "BNSS = Bharatiya Nagarik Suraksha Sanhita, 2023 — the current Indian criminal procedure code, replacing the CrPC.",
  },
  {
    pattern: /\bbsa\b/i,
    definition:
      "BSA = Bharatiya Sakshya Adhiniyam, 2023 — the current Indian evidence law, replacing the Indian Evidence Act.",
  },
  {
    pattern: /\bcpc\b/i,
    definition:
      "CPC = Code of Civil Procedure, 1908 — the Indian law governing civil procedure.",
  },
];

export function legalAcronymContext(query: string): string {
  const definitions = LEGAL_ACRONYMS.filter(({ pattern }) =>
    pattern.test(query),
  ).map(({ definition }) => `- ${definition}`);
  if (definitions.length === 0) return "";
  return `REFERENCE — INDIAN LEGAL ACRONYMS (these are Indian statutes; a question that uses only an acronym is still a legal question and MUST be answered):\n${definitions.join(
    "\n",
  )}\nIf the user asks what an acronym means, identify the Act, its year, and whether it remains in force or has been replaced.`;
}

export async function classifyQuery(query: string): Promise<boolean> {
  const lower = query.toLowerCase();
  const currentYear = new Date().getFullYear();
  const yearPattern = new RegExp(
    `\\b(${currentYear}|${currentYear - 1}|${currentYear - 2})\\b`,
  );

  const currentPositionPattern =
    /\b(who is|who was)\s+(the\s+)?(chief justice|president|prime minister|pm|governor|cji|cm|chief minister|speaker|chairman|chairperson)\b/i;

  const timePattern =
    /\b(current|latest|recent|today|now|updat|breaking|newly)\b/i;

  if (currentPositionPattern.test(lower)) return true;
  if (timePattern.test(lower)) return true;
  if (yearPattern.test(lower)) return true;

  return false;
}
