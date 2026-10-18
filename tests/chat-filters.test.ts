import { describe, it, expect } from "vitest";
import {
  isNonLegalQuery,
  mentionsForeignJurisdiction,
  classifyQuery,
} from "@/app/api/chat/route";

// ─── isNonLegalQuery ────────────────────────────────────────────────

describe("isNonLegalQuery", () => {
  // ── NON-LEGAL: should be BLOCKED ──

  describe("sports queries — BLOCKED", () => {
    const sportsQueries = [
      "who is ms dhoni",
      "Who is MS Dhoni?",
      "who won the IPL 2024",
      "what is cricket",
      "explain football rules",
      "who is the best basketball player",
      "tell me about formula 1",
      "who won the olympics",
      "what is the world cup schedule",
      "who is the bcci president",
      "icc cricket rankings",
      "who is Sachin Tendulkar",
      "tell me about tennis scores",
      "what is a wicket in cricket",
      "who scored the most goals",
      "who won the champions league",
      "premier league standings",
      "who is the best bowler",
      "what is a hat trick in cricket",
      "who won the match yesterday",
      "tell me about f1 racing",
      "what is the tournament schedule",
      "who is the ipl team captain",
      "cricket team performance",
      "football team lineup",
      "tell me about the batsman",
      "explain the role of a bowler",
    ];
    sportsQueries.forEach((q) => {
      it(`should BLOCK: "${q}"`, () => {
        expect(isNonLegalQuery(q)).toBe(true);
      });
    });
  });

  describe("entertainment queries — BLOCKED", () => {
    const entertainmentQueries = [
      "who is Shah Rukh Khan",
      "tell me about the movie Pathaan",
      "who is the director of Dangal",
      "what is the latest bollywood movie",
      "who is the best actor in India",
      "tell me about Netflix series",
      "who is Taylor Swift",
      "what songs did Arijit Singh sing",
      "who won the filmfare award",
      "explain the plot of Pushpa",
      "tell me about the film",
      "who is the actress in this movie",
      "what albums did AR Rahman release",
      "tell me about the singer",
      "who performs at the concert",
      "what is on Disney Plus",
    ];
    entertainmentQueries.forEach((q) => {
      it(`should BLOCK: "${q}"`, () => {
        expect(isNonLegalQuery(q)).toBe(true);
      });
    });
  });

  describe("tech/business queries — BLOCKED", () => {
    const techQueries = [
      "what is google",
      "tell me about Apple products",
      "who is Elon Musk",
      "what is ChatGPT",
      "explain machine learning",
      "what is bitcoin",
      "who is the CEO of Microsoft",
      "what is deep learning",
      "explain neural networks",
      "what is OpenAI",
      "explain neural network architecture",
      "tell me about spacex",
      "what is ethereum",
      "explain ai model training",
      "tell me about the startup ecosystem",
      "what is cryptocurrency",
    ];
    techQueries.forEach((q) => {
      it(`should BLOCK: "${q}"`, () => {
        expect(isNonLegalQuery(q)).toBe(true);
      });
    });
  });

  describe("lifestyle/general queries — BLOCKED", () => {
    const lifestyleQueries = [
      "what is the weather today",
      "tell me a recipe for biryani",
      "best restaurants in Delhi",
      "how to lose weight",
      "tell me about yoga",
      "what is my horoscope today",
      "best places to travel in India",
      "how to cook pasta",
      "what is the temperature in Mumbai",
      "tell me about meditation",
      "best restaurant near me",
      "how to cook a meal",
      "tell me about flights to Goa",
      "best hotels in Jaipur",
      "what is the forecast",
      "how to workout at home",
      "tell me about diet plans",
      "best tourist destinations",
      "explain zodiac signs",
      "what is palm reading",
    ];
    lifestyleQueries.forEach((q) => {
      it(`should BLOCK: "${q}"`, () => {
        expect(isNonLegalQuery(q)).toBe(true);
      });
    });
  });

  describe("general knowledge (non-legal) — BLOCKED", () => {
    const gkQueries = [
      "tell me about history",
      "who invented the telephone",
      "what is science",
      "explain geography of India",
      "who is the scientist behind relativity",
      "tell me about world history",
      "what is the scientific method",
      "who discovered gravity",
    ];
    gkQueries.forEach((q) => {
      it(`should BLOCK: "${q}"`, () => {
        expect(isNonLegalQuery(q)).toBe(true);
      });
    });
  });

  // ── LEGAL: should PASS through ──

  describe("Indian Constitution queries — PASS", () => {
    const constitutionalQueries = [
      "what is Article 21 of the Indian Constitution",
      "explain fundamental rights under the Constitution",
      "what is Article 14",
      "tell me about the Right to Equality",
      "what are Directive Principles of State Policy",
      "explain the Preamble of the Constitution",
      "what is Article 19(1)(a)",
      "what is judicial review",
      "explain Article 32 of the Constitution",
      "what is the 42nd amendment",
      "tell me about the basic structure doctrine",
      "what is Article 370",
      "explain Article 226",
      "what are fundamental duties",
      "who can amend the Constitution",
      "who is the chief justice of India",
      "who is the president of India",
      "who is the prime minister of India",
      "who is the governor of Maharashtra",
      "who is the speaker of Lok Sabha",
    ];
    constitutionalQueries.forEach((q) => {
      it(`should PASS: "${q}"`, () => {
        expect(isNonLegalQuery(q)).toBe(false);
      });
    });
  });

  describe("Criminal law queries — PASS", () => {
    const criminalQueries = [
      "what is Section 302 BNS",
      "explain Section 498A IPC",
      "what is the punishment for murder under BNS",
      "tell me about FIR process",
      "what is anticipatory bail",
      "explain Section 420 BNS",
      "what is cognizable offence",
      "how does bail work in India",
      "what is the punishment for cheating",
      "explain Section 144 BNSS",
      "what is non-bailable offence",
      "tell me about arrest procedures",
      "what is a charge sheet",
      "explain the NDPS Act",
      "what is POCSO",
    ];
    criminalQueries.forEach((q) => {
      it(`should PASS: "${q}"`, () => {
        expect(isNonLegalQuery(q)).toBe(false);
      });
    });
  });

  describe("Civil law queries — PASS", () => {
    const civilQueries = [
      "what is the Limitation Act",
      "explain the Transfer of Property Act",
      "what is arbitration under Indian law",
      "tell me about consumer protection in India",
      "how does property registration work",
      "what is the Indian Contract Act",
      "explain specific relief act",
      "what is the Sale of Goods Act",
      "tell me about the Negotiable Instruments Act",
      "what is RERA",
    ];
    civilQueries.forEach((q) => {
      it(`should PASS: "${q}"`, () => {
        expect(isNonLegalQuery(q)).toBe(false);
      });
    });
  });

  describe("Family law queries — PASS", () => {
    const familyQueries = [
      "what are grounds for divorce in Hindu law",
      "explain mutual consent divorce",
      "what is Section 125 CrPC maintenance",
      "tell me about domestic violence act",
      "what is the Hindu Marriage Act",
      "explain child custody laws in India",
      "what is the Special Marriage Act",
      "how does Muslim personal law work",
      "what is the Dowry Prohibition Act",
      "explain the Guardianship Act",
    ];
    familyQueries.forEach((q) => {
      it(`should PASS: "${q}"`, () => {
        expect(isNonLegalQuery(q)).toBe(false);
      });
    });
  });

  describe("Labour law queries — PASS", () => {
    const labourQueries = [
      "what are the minimum wages in India",
      "explain the Factories Act",
      "what is the Industrial Disputes Act",
      "tell me about POSH Act",
      "what are the new Labour Codes",
      "explain payment of wages act",
      "what is social security under labour law",
      "how does provident fund work",
    ];
    labourQueries.forEach((q) => {
      it(`should PASS: "${q}"`, () => {
        expect(isNonLegalQuery(q)).toBe(false);
      });
    });
  });

  describe("Tax law queries — PASS", () => {
    const taxQueries = [
      "what is the income tax slab for 2024",
      "explain GST in India",
      "what is the new income tax act 2025",
      "tell me about TDS",
      "what is the customs act",
      "explain capital gains tax in India",
      "what is the income tax rate",
      "how does income tax work",
    ];
    taxQueries.forEach((q) => {
      it(`should PASS: "${q}"`, () => {
        expect(isNonLegalQuery(q)).toBe(false);
      });
    });
  });

  describe("Corporate law queries — PASS", () => {
    const corporateQueries = [
      "what is the Companies Act",
      "explain the Insolvency and Bankruptcy Code",
      "what is FEMA",
      "tell me about SEBI regulations",
      "what is the Competition Act",
      "explain the LLP Act",
    ];
    corporateQueries.forEach((q) => {
      it(`should PASS: "${q}"`, () => {
        expect(isNonLegalQuery(q)).toBe(false);
      });
    });
  });

  describe("Cyber law queries — PASS", () => {
    const cyberQueries = [
      "what is the IT Act",
      "explain cyber crime laws in India",
      "what is the DPDP Act",
      "tell me about data protection in India",
      "what is hacking under Indian law",
      "explain Section 66A IT Act",
    ];
    cyberQueries.forEach((q) => {
      it(`should PASS: "${q}"`, () => {
        expect(isNonLegalQuery(q)).toBe(false);
      });
    });
  });

  describe("Environmental law queries — PASS", () => {
    const envQueries = [
      "what is the Wildlife Protection Act",
      "explain the Forest Conservation Act",
      "what is the Water Act",
      "tell me about the Air Act",
      "what is the National Green Tribunal",
      "explain the Environment Protection Act",
    ];
    envQueries.forEach((q) => {
      it(`should PASS: "${q}"`, () => {
        expect(isNonLegalQuery(q)).toBe(false);
      });
    });
  });

  describe("IPR queries — PASS", () => {
    const iprQueries = [
      "what is the Copyright Act",
      "explain the Patents Act",
      "what is trademark registration in India",
      "tell me about the Trade Marks Act",
      "what are geographical indications",
    ];
    iprQueries.forEach((q) => {
      it(`should PASS: "${q}"`, () => {
        expect(isNonLegalQuery(q)).toBe(false);
      });
    });
  });

  describe("Common legal help queries — PASS", () => {
    const helpQueries = [
      "my landlord is not returning my security deposit",
      "my employer is not paying salary",
      "how do I file a police complaint",
      "my neighbor is encroaching my property",
      "how do I get a divorce",
      "my employer terminated me without notice",
      "how to file a consumer complaint",
      "my husband is not paying maintenance",
      "someone is defaming me online",
      "how to apply for bail",
    ];
    helpQueries.forEach((q) => {
      it(`should PASS: "${q}"`, () => {
        expect(isNonLegalQuery(q)).toBe(false);
      });
    });
  });

  describe("Legal system queries — PASS", () => {
    const systemQueries = [
      "what is the hierarchy of courts in India",
      "explain the Indian legal system",
      "what is the Supreme Court jurisdiction",
      "tell me about High Courts",
      "what is PIL",
      "explain writ jurisdiction",
    ];
    systemQueries.forEach((q) => {
      it(`should PASS: "${q}"`, () => {
        expect(isNonLegalQuery(q)).toBe(false);
      });
    });
  });

  describe("Edge cases — PASS", () => {
    const edgeCases = [
      "hi",
      "hello",
      "what is law",
      "explain legal terminology",
      "what are legal maxims",
      "tell me about legal drafting",
      "what is contempt of court",
      "explain the RTI Act",
      "what is Aadhaar Act",
      "tell me about the Passport Act",
    ];
    edgeCases.forEach((q) => {
      it(`should PASS: "${q}"`, () => {
        expect(isNonLegalQuery(q)).toBe(false);
      });
    });
  });
});

// ─── mentionsForeignJurisdiction ────────────────────────────────────

describe("mentionsForeignJurisdiction", () => {
  describe("foreign jurisdiction — BLOCKED", () => {
    const foreignQueries = [
      "what is US copyright law",
      "tell me about UK criminal law",
      "explain Australian employment law",
      "what is the law in Dubai",
      "explain Singapore legal system",
      "what is Pakistan criminal code",
      "tell me about Nepal law",
      "what is the law in California",
      "explain New York tax law",
      "what is Texas property law",
      "tell me about German law",
      "explain French legal system",
      "what is Canadian criminal law",
      "tell me about Japanese law",
      "what is EU competition law",
    ];
    foreignQueries.forEach((q) => {
      it(`should BLOCK: "${q}"`, () => {
        expect(mentionsForeignJurisdiction(q)).toBe(true);
      });
    });
  });

  describe("Indian context with foreign mention — still detected", () => {
    const indianWithForeign = [
      "what is the difference between Indian and US copyright law",
      "how does Indian law compare to UK law",
      "Indian citizen in Dubai legal rights",
    ];
    indianWithForeign.forEach((q) => {
      it(`should detect foreign mention: "${q}"`, () => {
        // mentionsForeignJurisdiction returns true for these
        // but the POST handler allows them if they contain india/indian/bharat
        expect(mentionsForeignJurisdiction(q)).toBe(true);
      });
    });
  });

  describe("pure Indian queries — PASS", () => {
    const indianQueries = [
      "what is Section 302 BNS",
      "explain fundamental rights",
      "how does consumer protection work",
      "what is the punishment for murder",
      "tell me about Hindu Marriage Act",
      "what is anticipatory bail",
      "explain Article 21",
      "what are the new criminal laws",
    ];
    indianQueries.forEach((q) => {
      it(`should PASS: "${q}"`, () => {
        expect(mentionsForeignJurisdiction(q)).toBe(false);
      });
    });
  });
});

// ─── classifyQuery ──────────────────────────────────────────────────

describe("classifyQuery", () => {
  describe("time-sensitive queries — needs web search", () => {
    const timeQueries = [
      "who is the current Chief Justice of India",
      "who is the president of India now",
      "who is the current Prime Minister",
      "latest Supreme Court judgment",
      "recent amendment to the Constitution",
      "who is the governor of Maharashtra",
      "who is the current CJI",
      "who is the speaker of Lok Sabha",
      "recent changes in BNS",
      "newly enacted laws in India",
    ];
    timeQueries.forEach((q) => {
      it(`should NEED web search: "${q}"`, async () => {
        expect(await classifyQuery(q)).toBe(true);
      });
    });
  });

  describe("non-time-sensitive legal queries — no web search needed", () => {
    const staticQueries = [
      "what is Section 302 BNS",
      "explain fundamental rights",
      "what is the punishment for murder",
      "how does bail work",
      "what is the Hindu Marriage Act",
      "explain Article 21",
      "what is consumer protection",
      "what are the grounds for divorce",
    ];
    staticQueries.forEach((q) => {
      it(`should NOT need web search: "${q}"`, async () => {
        expect(await classifyQuery(q)).toBe(false);
      });
    });
  });
});

// ─── Combined pipeline tests ────────────────────────────────────────

describe("Combined pipeline: non-legal + foreign jurisdiction", () => {
  it("non-legal query should be blocked by isNonLegalQuery", () => {
    expect(isNonLegalQuery("who is ms dhoni")).toBe(true);
    expect(isNonLegalQuery("what is cricket")).toBe(true);
    expect(isNonLegalQuery("tell me about a movie")).toBe(true);
    expect(isNonLegalQuery("explain machine learning")).toBe(true);
    expect(isNonLegalQuery("what is the weather")).toBe(true);
    expect(isNonLegalQuery("tell me a recipe")).toBe(true);
  });

  it("foreign-only query should be blocked by mentionsForeignJurisdiction", () => {
    expect(mentionsForeignJurisdiction("what is US law")).toBe(true);
    expect(mentionsForeignJurisdiction("UK criminal law")).toBe(true);
    expect(mentionsForeignJurisdiction("Australian employment law")).toBe(true);
  });

  it("legal queries should pass BOTH filters", () => {
    const legalQueries = [
      "what is Section 302 BNS",
      "explain Article 21",
      "how does bail work in India",
      "what is the punishment for murder",
      "tell me about consumer protection",
      "what is the Hindu Marriage Act",
      "explain fundamental rights",
      "what are the new criminal laws BNS BNSS BSA",
      "how to file an FIR",
      "what is anticipatory bail",
      "my employer is not paying salary",
      "what is the income tax slab",
      "explain the IT Act",
      "what is the Wildlife Protection Act",
      "how does property registration work",
    ];
    legalQueries.forEach((q) => {
      expect(isNonLegalQuery(q)).toBe(false);
      expect(mentionsForeignJurisdiction(q)).toBe(false);
    });
  });

  it("constitutional position queries should PASS isNonLegalQuery", () => {
    const constitutionalPositionQueries = [
      "who is the chief justice of India",
      "who is the president of India",
      "who is the prime minister",
      "who is the governor of RBI",
      "who is the speaker of Lok Sabha",
      "who is the chief minister of Delhi",
    ];
    constitutionalPositionQueries.forEach((q) => {
      expect(isNonLegalQuery(q)).toBe(false);
    });
  });

  it("non-legal 'who is' queries should be BLOCKED", () => {
    const nonLegalWhoIs = [
      "who is ms dhoni",
      "who is Virat Kohli",
      "who is Shah Rukh Khan",
      "who is Elon Musk",
      "who is Taylor Swift",
      "who is Sachin Tendulkar",
    ];
    nonLegalWhoIs.forEach((q) => {
      expect(isNonLegalQuery(q)).toBe(true);
    });
  });
});
