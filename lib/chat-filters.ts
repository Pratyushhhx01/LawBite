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

/**
 * Document Drafter scope.
 *
 * The drafter is a focused tool, not a general legal chat. A query is in scope
 * when it names an Indian legal document, asks how to draft/format/edit one, or
 * is a short factual answer in an active drafting conversation. Free-standing
 * questions such as "What is Article 370?" or "What is Section 144?" are not.
 */
const DRAFT_DOCUMENT_TERM_PATTERN = new RegExp(
  [
    "\\blegal\\s+notice\\b",
    "\\bdemand\\s+notice\\b",
    "\\beviction\\s+notice\\b",
    "\\bshow\\s+cause\\s+notice\\b",
    "\\bnotice\\s+to\\s+quit\\b",
    "\\bnotice\\s+(?:of|for)\\s+(?:termination|dishonou?r|recovery|payment|demand|eviction|breach)\\b",
    "\\bcheque\\s+(?:bounce|dishonou?r)\\s+notice\\b",
    "\\b(?:draft|prepare|write|create|make|format|template|send|reply|mention|include|cite)\\b[^.!?]{0,50}\\bnotice\\b",
    "\\bfir\\b",
    "\\bfirst\\s+information\\s+report\\b",
    "\\b(?:consumer|police|criminal|written)\\s+complaint\\b",
    "\\brti\\s+(?:application|request|draft|reply)\\b",
    "\\bright\\s+to\\s+information\\b",
    "\\b(?:last\\s+will|will\\s+and\\s+testament|codicil)\\b",
    "\\b(?:a|the|my|his|her)\\s+will\\b",
    "\\b(?:draft|prepare|create|write|make|format|template)\\s+(?:a|an|my|the)\\s+will\\b",
    "\\bwill\\s+(?:draft|format|template|registration|probate|executor|attestation)\\b",
    "\\baffidavit\\b",
    "\\b(?:writ|divorce|maintenance|probate|succession|bail|anticipatory\\s+bail)\\s+petition\\b",
    "\\bpetition\\b",
    "\\bplaint\\b",
    "\\bwritten\\s+statement\\b",
    "\\b(?:legal|commercial|employment|service|vendor|consultancy|loan|rent|rental|lease|partnership|joint\\s+venture|shareholders|franchise|non-?disclosure|nda|settlement|arbitration)\\s+(?:agreement|contract|deed)\\b",
    "\\b(?:agreement|contract)\\b",
    "\\b(?:sale|gift|lease|mortgage|partnership|trust|relinquishment|settlement|exchange)\\s+deed\\b",
    "\\bdeed\\b",
    "\\bpower\\s+of\\s+attorney\\b",
    "\\b(?:non-?disclosure\\s+agreement|nda)\\b",
    "\\b(?:indemnity|performance|surety|bank)\\s+bond\\b",
    "\\bpromissory\\s+note\\b",
    "\\b(?:legal|court|official)\\s+document\\b",
    "\\b(?:bail|anticipatory\\s+bail|writ|consumer|maintenance|divorce|probate|succession|rti)\\s+application\\b",
    "\\bmemorandum\\s+of\\s+appeal\\b",
    "\\blegal\\s+draft\\b",
    "\\b(?:draft|prepare|create|write|make|format|template)\\s+(?:a|an|my|the)\\s+(?:legal\\s+)?(?:document|notice|complaint|petition|application|agreement|contract|deed|affidavit|will)\\b",
  ].join("|"),
  "i",
);

/**
 * Statute names can contain document nouns ("Indian Contract Act"). They are
 * general legal questions, not drafting requests, unless the user also asks to
 * draft or edit a document.
 */
const DRAFT_STATUTE_NAME_PATTERN =
  /\b(?:indian\s+)?contract\s+act\b|\bcontract\s+(?:labour|law|code)\b|\blaw\s+of\s+contracts?\b|\b(?:indian\s+)?partnership\s+act\b|\b(?:sale\s+of\s+goods|transfer\s+of\s+property|specific\s+relief|arbitration\s+and\s+conciliation|companies|negotiable\s+instruments|limitation|(?:indian\s+)?evidence)\s+act\b/i;

const DRAFT_ACTION_PATTERN =
  /\b(?:draft|drafting|prepare|preparing|create|creating|write|writing|make|making|fill|filling|complete|completing)\b/i;

const DRAFT_MECHANICS_PATTERN =
  /\b(?:format|formatting|template|sample|specimen|stamp\s+paper|stamp\s+duty|notar(?:y|ize|ise|ization|isation)|register|registering|registration|attest|attesting|attestation|execute|executing|execution|sign|signing|signature|witness|witnesses|annexure|annexures|schedule|schedules)\b/i;

const DRAFT_CLAUSE_PATTERN =
  /\b(?:clause|clauses|wording|recital|recitals|confidentiality\s+clause|indemnity\s+clause|termination\s+clause|jurisdiction\s+clause|governing\s+law\s+clause|dispute\s+resolution\s+clause|force\s+majeure\s+clause|severability\s+clause|waiver\s+clause|entire\s+agreement\s+clause|non-?compete\s+clause|non-?solicit\s+clause|liability\s+clause|warranty\s+clause|representations?\s+clause|covenants?)\b/i;

const DRAFT_LEGAL_CONTEXT_PATTERN = new RegExp(
  `${LEGAL_SIGNAL_PATTERN.source}|\\b(?:case|matter|client|party|parties|document|confidentiality|indemnity|termination|jurisdiction|governing\\s+law|dispute\\s+resolution|consideration|force\\s+majeure|severability|waiver|liability|warranty|representations?|covenants?|stamp\\s+paper|stamp\\s+duty|notar(?:y|ization|isation)|registration)\\b`,
  "i",
);

const DRAFT_MECHANICS_OBJECT_PATTERN =
  /\b(?:stamp\s+paper|document|paper|letter|affidavit|agreement|contract|deed|will|petition|notice|fir|complaint|application|bond|note)\b/i;

const DRAFT_CLARIFICATION_PATTERN =
  /\b(?:what|which|how\s+many|how\s+much|do\s+you\s+need|do\s+i\s+need|should\s+i|can\s+i|is\s+it|are\s+there|please\s+tell\s+me)\b[^?]*\b(?:details?|information|documents?|papers?|fields?|options?|clauses?|annexures?|copies|attachments?)\b/i;

const DRAFT_FOLLOW_UP_PATTERN =
  /^(?:yes|no|ok|okay|sure|please\s+do|go\s+ahead|continue|proceed|next|what\s+next|what\s+else|more|thanks|thank\s+you|correct|right|not\s+sure|i\s+don'?t\s+know|none|nil|n\/a)\b/i;

const DRAFT_EDIT_PATTERN =
  /\b(?:add|remove|delete|change|replace|update|shorten|expand|rewrite|revise|edit|include|exclude|use|modify|amend|adjust|reword|make\s+it)\b/i;

const DRAFT_REQUEST_PATTERN =
  /^(?:please\s+)?(?:draft|drafting|prepare|create|write|make|fill|complete|format|edit|revise|rewrite|add|remove|delete|change|replace|update|shorten|expand)\b|\b(?:how\s+(?:do|can|should)\s+i|can\s+you|could\s+you|please|i\s+need|i\s+want)\b/i;

const GENERAL_LEGAL_QUESTION_PATTERN =
  /^(?:what|which|who|when|where|why|how|explain|define|describe|tell\s+me|meaning\s+of|difference\s+between|compare|can|could|should|is|are|does|do|did)\b|\b(?:want\s+to\s+know|tell\s+me\s+about|explain\s+to\s+me|what\s+is|what\s+are|who\s+is|who\s+was|meaning\s+of|difference\s+between|what\s+should\s+i\s+do)\b/i;

const GENERAL_LEGAL_REFERENCE_PATTERN = /\b(?:article|section)\s+\d+/i;

const GENERAL_LEGAL_CONSEQUENCE_PATTERN =
  /\b(?:punishment|sentence|imprisonment|fine|damages|remed(?:y|ies)|liability|breach|limitation\s+period|jurisdiction|arrest|conviction|acquittal)\b/i;

const NON_DOCUMENT_CREATIVE_PATTERN =
  /\b(?:poem|story|essay|song|blog|tweet|social\s+media\s+post|speech|novel|script)\b/i;

export interface DocumentDraftingQueryOptions {
  /** True when an earlier turn already started a document draft. */
  hasDraftContext?: boolean;
  /** True when the last assistant message ended with a clarifying question. */
  awaitingDraftAnswer?: boolean;
}

/**
 * True when a query belongs in the Document Drafter rather than general legal
 * chat. The route uses this as a deterministic guard before any provider call.
 */
export function isDocumentDraftingQuery(
  query: string,
  options: DocumentDraftingQueryOptions = {},
): boolean {
  const text = query.trim();
  if (!text) return false;
  const lower = text.toLowerCase();

  const hasDocumentTerm = DRAFT_DOCUMENT_TERM_PATTERN.test(lower);
  const hasAction = DRAFT_ACTION_PATTERN.test(lower);
  const hasMechanics = DRAFT_MECHANICS_PATTERN.test(lower);
  const hasClause = DRAFT_CLAUSE_PATTERN.test(lower);
  const hasLegalContext = DRAFT_LEGAL_CONTEXT_PATTERN.test(lower);
  const asksGeneralQuestion = GENERAL_LEGAL_QUESTION_PATTERN.test(text);
  const isDraftingRequest = DRAFT_REQUEST_PATTERN.test(text);
  const hasMechanicsObject = DRAFT_MECHANICS_OBJECT_PATTERN.test(lower);

  // "What is the Indian Contract Act?" contains "contract", but it is a
  // general statute question, not a drafting request.
  if (DRAFT_STATUTE_NAME_PATTERN.test(lower) && !isDraftingRequest) {
    return false;
  }

  if (hasDocumentTerm) {
    // "What is the punishment for breach of contract?" is still general legal
    // advice, not a document-drafting question.
    if (
      asksGeneralQuestion &&
      GENERAL_LEGAL_CONSEQUENCE_PATTERN.test(lower) &&
      !hasAction &&
      !hasMechanics &&
      !hasClause &&
      !isDraftingRequest
    ) {
      return false;
    }
    return true;
  }

  if (NON_DOCUMENT_CREATIVE_PATTERN.test(lower)) return false;

  // Drafting verbs are enough when the query is anchored in a legal matter.
  if (hasAction && hasLegalContext && (isDraftingRequest || options.hasDraftContext)) {
    return true;
  }

  // Clause questions are document-drafting questions.
  if (hasClause && (hasLegalContext || hasAction || options.hasDraftContext)) {
    return true;
  }

  // Format/stamp/notary/registration questions need a document object.
  if (hasMechanics && hasLegalContext && hasMechanicsObject) {
    return true;
  }

  // "Do I need stamp paper?" / "Is notarisation required?"
  if (
    hasMechanics &&
    /\b(?:need|needed|required|necessary|mandatory)\b/i.test(lower) &&
    (hasMechanicsObject || options.hasDraftContext)
  ) {
    return true;
  }

  // "What details do you need?" / "Which documents should I attach?"
  if (DRAFT_CLARIFICATION_PATTERN.test(lower)) return true;

  if (options.hasDraftContext) {
    if (DRAFT_FOLLOW_UP_PATTERN.test(lower)) return true;
    if (DRAFT_EDIT_PATTERN.test(lower) && !asksGeneralQuestion) return true;
    if (asksGeneralQuestion) return false;
    if (
      GENERAL_LEGAL_REFERENCE_PATTERN.test(lower) &&
      !options.awaitingDraftAnswer
    ) {
      return false;
    }
    return true;
  }

  return false;
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
