import { describe, expect, it } from "vitest";
import {
  parseCitationCandidates,
  resolveAct,
  verifyCitations,
  type SectionLookup,
} from "@/lib/citation-verifier";

const fakeSections: Record<
  string,
  Record<string, { section: string; title: string; text: string }>
> = {
  "bharatiya-nyaya-sanhita": {
    "103": {
      section: "103",
      title: "Punishment for murder",
      text: "Whoever commits murder shall be punished with death or imprisonment for life.",
    },
    "302": {
      section: "302",
      title: "Uttering words to wound religious feelings",
      text: "Whoever deliberately utters words with intent to wound religious feelings.",
    },
  },
  ipc: {
    "302": {
      section: "302",
      title: "Punishment for murder",
      text: "Whoever commits murder shall be punished with death or imprisonment for life.",
    },
  },
  constitution: {
    "21": {
      section: "21",
      title: "Protection of life and personal liberty",
      text: "No person shall be deprived of life or personal liberty except according to procedure established by law.",
    },
    "302": {
      section: "302",
      title: "Restrictions on trade, commerce and intercourse",
      text: "Parliament may impose restrictions on trade, commerce and intercourse among States.",
    },
  },
  "negotiable-instruments-act": {
    "138": {
      section: "138",
      title: "Dishonour of cheque",
      text: "Dishonour of a cheque for insufficiency of funds is an offence.",
    },
  },
  "indian-contract-act": {
    "2": {
      section: "2",
      title: "Interpretation clause",
      text: "In this Act the following words and expressions are used.",
    },
  },
};

const lookup: SectionLookup = {
  async getSection(actKey, section) {
    return fakeSections[actKey]?.[section] ?? null;
  },
};

function bySection(
  candidates: ReturnType<typeof parseCitationCandidates>,
  section: string,
) {
  return candidates.find((candidate) => candidate.section === section);
}

describe("citation verifier — act resolution", () => {
  it("resolves full names and abbreviations", () => {
    expect(resolveAct("Bharatiya Nyaya Sanhita")?.key).toBe(
      "bharatiya-nyaya-sanhita",
    );
    expect(resolveAct("BNS")?.key).toBe("bharatiya-nyaya-sanhita");
    expect(resolveAct("Negotiable Instruments Act")?.key).toBe(
      "negotiable-instruments-act",
    );
    expect(resolveAct("Constitution of India")?.key).toBe("constitution");
    expect(resolveAct("not a real statute")).toBeNull();
  });
});

describe("citation verifier — text parsing", () => {
  it("parses a section before the act name", () => {
    const [candidate] = parseCitationCandidates(
      "Section 103 of the Bharatiya Nyaya Sanhita",
    );
    expect(candidate).toMatchObject({
      kind: "section",
      actKey: "bharatiya-nyaya-sanhita",
      section: "103",
      source: "text",
    });
  });

  it("parses an act name before the section", () => {
    const [candidate] = parseCitationCandidates("BNS Section 103");
    expect(candidate).toMatchObject({
      actKey: "bharatiya-nyaya-sanhita",
      section: "103",
    });
  });

  it("defaults articles without an act name to the Constitution", () => {
    const [candidate] = parseCitationCandidates("Article 21");
    expect(candidate).toMatchObject({
      actKey: "constitution",
      section: "21",
    });
  });

  it("parses article citations with an explicit Constitution reference", () => {
    const [candidate] = parseCitationCandidates(
      "Article 21 of the Constitution",
    );
    expect(candidate).toMatchObject({
      actKey: "constitution",
      section: "21",
    });
  });

  it("preserves sub-clause section numbers", () => {
    const [candidate] = parseCitationCandidates(
      "Section 2(h) of the Indian Contract Act",
    );
    expect(candidate).toMatchObject({
      actKey: "indian-contract-act",
      section: "2(h)",
    });
  });

  it("assigns each section to the nearest act in a multi-act sentence", () => {
    const candidates = parseCitationCandidates(
      "Section 302 IPC and Section 103 BNS",
    );
    expect(bySection(candidates, "302")?.actKey).toBe("ipc");
    expect(bySection(candidates, "103")?.actKey).toBe(
      "bharatiya-nyaya-sanhita",
    );
  });

  it("parses a list of sections", () => {
    const candidates = parseCitationCandidates(
      "Sections 103, 104 and 105 of the BNS",
    );
    expect(candidates.map((candidate) => candidate.section)).toEqual([
      "103",
      "104",
      "105",
    ]);
    expect(
      candidates.every(
        (candidate) => candidate.actKey === "bharatiya-nyaya-sanhita",
      ),
    ).toBe(true);
  });
});

describe("citation verifier — structured citations", () => {
  it("parses the label format emitted by the chat route", () => {
    const [candidate] = parseCitationCandidates("", [
      {
        type: "act",
        label: "BNS 103",
        snippet: "Punishment for murder.",
      },
    ]);
    expect(candidate).toMatchObject({
      kind: "section",
      actKey: "bharatiya-nyaya-sanhita",
      section: "103",
      source: "structured",
    });
  });

  it("keeps reference-only citations out of the section precision score", () => {
    const [candidate] = parseCitationCandidates("", [
      {
        type: "act",
        label: "Limitation Periods",
        snippet: "A table of limitation periods.",
      },
    ]);
    expect(candidate).toMatchObject({
      kind: "reference",
      section: null,
    });
  });

  it("marks trusted and untrusted web citations separately", async () => {
    const { results, summary } = await verifyCitations(
      {
        citations: [
          {
            type: "web",
            label: "Supreme Court",
            snippet: "Judgment",
            url: "https://main.sci.gov.in/",
          },
          {
            type: "web",
            label: "Social post",
            snippet: "Comment",
            url: "https://www.instagram.com/p/example/",
          },
        ],
      },
      lookup,
    );

    expect(results[0].verified).toBe(true);
    expect(results[0].reason).toBe("web_source");
    expect(results[1].verified).toBe(false);
    expect(results[1].reason).toBe("untrusted_web_source");
    expect(summary.webTotal).toBe(2);
    expect(summary.webTrusted).toBe(1);
    expect(summary.sectionTotal).toBe(0);
  });

  it("prefers the structured citation when prose and citation frame overlap", () => {
    const candidates = parseCitationCandidates(
      "Section 103 of the BNS is the murder provision.",
      [
        {
          type: "act",
          label: "BNS 103",
          snippet: "Punishment for murder.",
        },
      ],
    );
    expect(candidates).toHaveLength(1);
    expect(candidates[0].source).toBe("structured");
    expect(candidates[0].snippet).toBe("Punishment for murder.");
  });
});

describe("citation verifier — verification", () => {
  it("verifies an existing section", async () => {
    const { results, summary } = await verifyCitations(
      { text: "Section 103 of the BNS" },
      lookup,
    );
    expect(results[0]).toMatchObject({
      verified: true,
      reason: "verified",
      sectionTitle: "Punishment for murder",
    });
    expect(summary.sectionTotal).toBe(1);
    expect(summary.sectionVerified).toBe(1);
    expect(summary.precision).toBe(1);
    expect(summary.hallucinationRate).toBe(0);
  });

  it("falls back from a sub-clause to its base section", async () => {
    const { results } = await verifyCitations(
      { text: "Section 2(h) of the Indian Contract Act" },
      lookup,
    );
    expect(results[0]).toMatchObject({
      verified: true,
      section: "2(h)",
      matchedSection: "2",
    });
  });

  it("flags a section that does not exist", async () => {
    const { results, summary } = await verifyCitations(
      { text: "Section 999 of the BNS" },
      lookup,
    );
    expect(results[0]).toMatchObject({
      verified: false,
      reason: "section_not_found",
    });
    expect(summary.sectionUnverified).toBe(1);
    expect(summary.precision).toBe(0);
    expect(summary.hallucinationRate).toBe(1);
  });

  it("flags a section whose act cannot be resolved", async () => {
    const { results } = await verifyCitations(
      { text: "Section 103 of the Imaginary Act" },
      lookup,
    );
    expect(results[0]).toMatchObject({
      verified: false,
      reason: "act_not_resolved",
    });
  });

  it("distinguishes an unavailable index from a hallucinated section", async () => {
    const unavailableLookup: SectionLookup = {
      async getSection() {
        throw new Error("simulated S3 outage");
      },
      async getSectionList() {
        return null;
      },
    };

    const { results, summary } = await verifyCitations(
      { text: "Section 103 of the BNS" },
      unavailableLookup,
    );

    expect(results[0]).toMatchObject({
      verified: false,
      reason: "lookup_error",
    });
    expect(summary.sectionLookupErrors).toBe(1);
    expect(summary.verifiableSectionTotal).toBe(0);
    expect(summary.precision).toBeNull();
    expect(summary.hallucinationRate).toBeNull();
  });

  it("verifies a direct section even when the section index is unavailable", async () => {
    const partialLookup: SectionLookup = {
      async getSection(actKey, section) {
        return actKey === "bharatiya-nyaya-sanhita" && section === "103"
          ? fakeSections["bharatiya-nyaya-sanhita"]["103"]
          : null;
      },
      async getSectionList() {
        return null;
      },
    };

    const { results } = await verifyCitations(
      { text: "Section 103 of the BNS" },
      partialLookup,
    );
    expect(results[0]).toMatchObject({
      verified: true,
      reason: "verified",
    });
  });

  it("returns a null precision when there are no section citations", async () => {
    const { results, summary } = await verifyCitations(
      { text: "No citations" },
      lookup,
    );
    expect(results).toEqual([]);
    expect(summary.precision).toBeNull();
    expect(summary.hallucinationRate).toBeNull();
  });

  it("computes precision across verified and unverified citations", async () => {
    const { summary } = await verifyCitations(
      { text: "Section 103 of the BNS and Section 999 of the BNS" },
      lookup,
    );
    expect(summary.sectionTotal).toBe(2);
    expect(summary.sectionVerified).toBe(1);
    expect(summary.precision).toBe(0.5);
    expect(summary.hallucinationRate).toBe(0.5);
  });
});
