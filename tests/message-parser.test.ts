import { describe, it, expect } from "vitest";
import {
  isSectionHeading,
  parseContent,
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
        content: "A temporary provision that gave Jammu and Kashmir special status.",
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

  it("does not turn a bulleted bold lead-in into a card", () => {
    const blocks = parseContent("- **Source:** Constitution of India, Article 370");
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
