import { describe, it, expect } from "vitest";
import {
  isGrillAdvice,
  isSectionHeading,
  parseContent,
  parseGrillIntake,
  sectionVariant,
  splitTextSegments,
} from "@/app/chat/_components/messageParser";

/**
 * Regression coverage for the "What is Article 370?" Deep Analysis render.
 *
 * The old parser treated every bold heading as a definition term, so
 * "**Short answer:**" absorbed the following bullets into a "Term" card and
 * left raw asterisks on screen. These tests lock in the corrected behaviour.
 */
describe("parseContent — deep analysis headings", () => {
  const article370 = [
    "**Short answer:**",
    "- Article 370 gave Jammu and Kashmir a temporary, asymmetric status.",
    "- It was abrogated in 2019 and the Supreme Court upheld the move.",
    "",
    "**The law:**",
    "- Article 370 sat in Part XXI of the Constitution.",
    "- Article 35A flowed from it and was also neutralised.",
    "",
    "**How it applies:**",
    "- The State was reorganised into two Union Territories.",
    "",
    "**Practical takeaway:**",
    "- The provision no longer operates, but challenges to the 2019 actions continue.",
  ].join("\n");

  it("never produces definition cards for section headings", () => {
    const blocks = parseContent(article370);
    expect(blocks.some((b) => b.type === "definition")).toBe(false);
  });

  it("keeps the heading and its bullets in a text block", () => {
    const blocks = parseContent(article370);
    const text = blocks
      .filter((b): b is { type: "text"; content: string } => b.type === "text")
      .map((b) => b.content)
      .join("\n");
    expect(text).toContain("**Short answer:**");
    expect(text).toContain("Article 370 gave Jammu and Kashmir");
    expect(text).toContain("**Practical takeaway:**");
  });

  it("does not leak a lone asterisk into a term", () => {
    const blocks = parseContent(article370);
    for (const block of blocks) {
      if (block.type === "definition") {
        expect(block.term).not.toBe("*");
        expect(block.content).not.toBe("*");
      }
    }
  });
});

describe("parseContent — real definitions", () => {
  it("creates a card for a non-bulleted term with same-line meaning", () => {
    const blocks = parseContent(
      "**Article 370:** A temporary provision that gave Jammu and Kashmir special status.",
    );
    expect(blocks).toEqual([
      {
        type: "definition",
        term: "Article 370",
        content:
          "A temporary provision that gave Jammu and Kashmir special status.",
      },
    ]);
  });

  it("creates a card for the '**Term: meaning**' comparison form", () => {
    const blocks = parseContent(
      "**Culpable Homicide: death caused with the intention of causing death**",
    );
    expect(blocks).toHaveLength(1);
    expect(blocks[0]).toMatchObject({
      type: "definition",
      term: "Culpable Homicide",
    });
    expect((blocks[0] as { content: string }).content).not.toContain("**");
  });

  it("keeps hyphenated terms intact", () => {
    const blocks = parseContent(
      "**Non-bailable offence: An offence for which bail is discretionary.**",
    );
    expect(blocks[0]).toMatchObject({
      type: "definition",
      term: "Non-bailable offence",
    });
    expect((blocks[0] as { content: string }).content).toBe(
      "An offence for which bail is discretionary.",
    );
  });

  it("supports an en-dash separator with spaces", () => {
    const blocks = parseContent(
      "**Bail \u2013 a discretionary court relief.**",
    );
    expect(blocks[0]).toMatchObject({
      type: "definition",
      term: "Bail",
      content: "a discretionary court relief.",
    });
  });

  it("does not turn '**Bottom line:** text' into a definition card", () => {
    const blocks = parseContent(
      "**Bottom line:** Bailable offences allow bail as of right.",
    );
    expect(blocks.some((b) => b.type === "definition")).toBe(false);
  });

  it("does not turn a bulleted bold lead-in into a card", () => {
    const blocks = parseContent(
      "- **Source:** Constitution of India, Article 370",
    );
    expect(blocks.every((b) => b.type !== "definition")).toBe(true);
    expect((blocks[0] as { content: string }).content).toContain("**Source:**");
  });

  it("treats a bare bold heading as text, not a definition", () => {
    const blocks = parseContent("**Definitions**\n- State: a federal unit.");
    expect(blocks.every((b) => b.type !== "definition")).toBe(true);
  });

  it("does not turn an empty bold heading into a card", () => {
    const blocks = parseContent("**The law:**");
    expect(blocks.every((b) => b.type !== "definition")).toBe(true);
  });
});

describe("isSectionHeading", () => {
  it.each([
    "Short answer",
    "The law",
    "How it applies",
    "Practical takeaway",
    "Key Takeaways",
    "Definitions",
    "Current status",
    "Summary",
  ])("recognises %s", (term) => {
    expect(isSectionHeading(term)).toBe(true);
  });

  it.each(["Article 370", "Culpable Homicide", "Bail", "Anticipatory Bail"])(
    "does not treat %s as a heading",
    (term) => {
      expect(isSectionHeading(term)).toBe(false);
    },
  );
});

describe("parseContent — step framing", () => {
  it("parses '**Step N:** action' as steps, not definition cards", () => {
    const blocks = parseContent(
      [
        "**Step 1:** Register a written complaint at the nearest police station.",
        "**Step 2:** State the date, time and details of the stolen items.",
        "**Step 3:** Collect a free copy of the FIR.",
      ].join("\n"),
    );
    expect(blocks).toHaveLength(1);
    expect(blocks[0].type).toBe("steps");
    expect(blocks.some((b) => b.type === "definition")).toBe(false);
    const steps = (
      blocks[0] as {
        type: "steps";
        steps: { title: string; content: string }[];
      }
    ).steps;
    expect(steps.map((s) => s.title)).toEqual(["1", "2", "3"]);
    expect(steps[0].content).toBe(
      "Register a written complaint at the nearest police station.",
    );
    expect(steps[2].content).toBe("Collect a free copy of the FIR.");
  });

  it("still supports the '**Step 1: title** rest' form", () => {
    const blocks = parseContent(
      "**Step 1: Prepare the complaint** then sign it before the officer.",
    );
    expect(blocks[0].type).toBe("steps");
    const steps = (
      blocks[0] as {
        type: "steps";
        steps: { title: string; content: string }[];
      }
    ).steps;
    expect(steps[0].content).toBe(
      "Prepare the complaint then sign it before the officer.",
    );
  });
});

describe("parseContent — label lines are not definitions", () => {
  it.each([
    "**Who it applies to:** Any person apprehending arrest.",
    "**Where to file:** The police station with jurisdiction.",
    "**Timing:** Apply before the arrest occurs.",
    "**Conditions:** The court may impose conditions.",
    "**Punishment:** Up to seven years.",
  ])("does not box %s", (line) => {
    const blocks = parseContent(line);
    expect(blocks.some((b) => b.type === "definition")).toBe(false);
  });
});

describe("parseContent — tables still work", () => {
  it("parses a markdown comparison table", () => {
    const blocks = parseContent(
      [
        "| Aspect | IPC | BNS |",
        "| --- | --- | --- |",
        "| Murder | 302 | 103 |",
      ].join("\n"),
    );
    expect(blocks).toHaveLength(1);
    expect(blocks[0]).toMatchObject({
      type: "table",
      headers: ["Aspect", "IPC", "BNS"],
    });
  });
});

describe("sectionVariant — selective callouts", () => {
  it("boxes the lead answer only", () => {
    expect(sectionVariant("Short answer")).toBe("lead");
    expect(sectionVariant("Short answer:")).toBe("lead");
    expect(sectionVariant("Answer")).toBe("lead");
  });

  it("boxes the conclusion / takeaway", () => {
    expect(sectionVariant("Practical takeaway")).toBe("takeaway");
    expect(sectionVariant("Bottom line")).toBe("takeaway");
    expect(sectionVariant("Key Takeaways")).toBe("takeaway");
    expect(sectionVariant("Summary")).toBe("takeaway");
  });

  it("boxes warnings", () => {
    expect(sectionVariant("Warning")).toBe("warning");
    expect(sectionVariant("Important")).toBe("warning");
    expect(sectionVariant("Note")).toBe("warning");
  });

  it("leaves body sections plain so the answer is not all boxes", () => {
    expect(sectionVariant("The law")).toBe("plain");
    expect(sectionVariant("How it applies")).toBe("plain");
    expect(sectionVariant("Constitutional Mechanism")).toBe("plain");
    expect(sectionVariant("Key elements")).toBe("plain");
    expect(sectionVariant("Example")).toBe("plain");
    expect(sectionVariant("Why it matters")).toBe("plain");
  });
});

describe("splitTextSegments", () => {
  it("splits sections at bold headings", () => {
    const segments = splitTextSegments([
      "**Short answer:**",
      "- one",
      "",
      "**The law:**",
      "- two",
      "**Practical takeaway:**",
      "- three",
    ]);
    expect(segments.map((s) => s.heading)).toEqual([
      "Short answer",
      "The law",
      "Practical takeaway",
    ]);
    expect(segments[0].lines).toEqual(["- one", ""]);
    expect(segments[1].lines).toEqual(["- two"]);
    expect(segments[2].lines).toEqual(["- three"]);
  });

  it("keeps a plain preamble before the first heading", () => {
    const segments = splitTextSegments([
      "Article 370 was a temporary provision.",
      "**The law:**",
      "- Part XXI",
    ]);
    expect(segments).toHaveLength(2);
    expect(segments[0].heading).toBeNull();
    expect(segments[0].lines).toEqual([
      "Article 370 was a temporary provision.",
    ]);
    expect(segments[1].heading).toBe("The law");
  });

  it("does not create empty segments for blank lines", () => {
    expect(splitTextSegments(["", "  ", ""])).toEqual([]);
  });
});

describe("AI Lawyer intake and advice detection", () => {
  const advice = [
    "**Bottom line**",
    "You are entitled to remain until a valid notice is served.",
    "",
    "**The law**",
    "The Transfer of Property Act, 1882 requires proper notice.",
    "",
    "**What to do now**",
    "**Step 1: Reply in writing** State that you have not received a notice.",
    "",
    "**Timeline and cost**",
    "A contested matter may take 3 to 6 months.",
    "",
    "| Option | What it is | Best when | Key risk |",
    "| :--- | :--- | :--- | :--- |",
    "| Negotiation | Agree on exit terms | Both sides want speed | No legal protection |",
    "| Civil suit | Ask the court for an injunction | The threat continues | Court delays |",
  ].join("\n");

  it("recognises a completed advice turn from its marker", () => {
    expect(isGrillAdvice(`${advice}\n\n[ADVICE_COMPLETE]`)).toBe(true);
  });

  it("recognises a legacy advice turn without the marker", () => {
    expect(isGrillAdvice(advice)).toBe(true);
  });

  it("does not treat an intake acknowledgement as advice", () => {
    expect(isGrillAdvice("I understand — no written notice was served.")).toBe(
      false,
    );
  });

  it("splits the acknowledgement from the next question", () => {
    expect(
      parseGrillIntake(
        "I understand — no written notice was served.\n\n---\n\nHow long have you been in possession?",
      ),
    ).toEqual({
      acknowledgement: "I understand — no written notice was served.",
      question: "How long have you been in possession?",
    });
  });

  it("does not split a comparison table on its --- separator row", () => {
    expect(parseGrillIntake(advice)).toBeNull();
  });

  it("falls back to a final question paragraph when the divider is missing", () => {
    expect(
      parseGrillIntake(
        "Thank you — no written notice has been served.\n\nHow long have you been in possession?",
      ),
    ).toEqual({
      acknowledgement: "Thank you — no written notice has been served.",
      question: "How long have you been in possession?",
    });
  });

  it("renders a question-only reply in the question card", () => {
    expect(parseGrillIntake("What is the date of the notice?")).toEqual({
      acknowledgement: "",
      question: "What is the date of the notice?",
    });
  });
});
