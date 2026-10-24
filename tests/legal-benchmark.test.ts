import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { ACT_DEFINITIONS } from "@/lib/citation-verifier";

type BenchmarkQuestion = {
  id: string;
  category: string;
  mode?: string;
  question: string;
  expected_act_key?: string;
  expected_sections?: string[];
  expected_citations?: Array<{ actKey: string; section: string }>;
  must_include?: string[];
  must_not_include?: string[];
  must_refuse?: boolean;
  difficulty?: string;
  review_status?: string;
  reviewed_by?: string | null;
  notes?: string;
};

const datasetPath = path.join(process.cwd(), "benchmarks/legal-qa.jsonl");
const rows: BenchmarkQuestion[] = readFileSync(datasetPath, "utf8")
  .split(/\r?\n/)
  .filter(Boolean)
  .map((line) => JSON.parse(line) as BenchmarkQuestion);

const knownActKeys = new Set(
  ACT_DEFINITIONS.map((definition) => definition.key),
);
const allowedModes = new Set([
  "talk-to-ai",
  "chat",
  "analysis",
  "grill",
  "draft",
  "review",
]);

function expectedCitations(question: BenchmarkQuestion) {
  if (question.expected_citations) return question.expected_citations;
  if (question.expected_act_key && question.expected_sections) {
    return question.expected_sections.map((section) => ({
      actKey: question.expected_act_key as string,
      section,
    }));
  }
  return [];
}

describe("legal QA benchmark dataset", () => {
  it("contains a meaningful seed set", () => {
    expect(rows.length).toBeGreaterThanOrEqual(50);
  });

  it("has unique, non-empty ids", () => {
    const ids = rows.map((row) => row.id);
    expect(ids.every((id) => typeof id === "string" && id.length > 0)).toBe(
      true,
    );
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("has a category, question and mode on every row", () => {
    for (const row of rows) {
      expect(row.category, row.id).toBeTruthy();
      expect(row.question.length, row.id).toBeGreaterThan(10);
      expect(allowedModes.has(row.mode ?? "analysis"), row.id).toBe(true);
    }
  });

  it("uses only known S3 act keys", () => {
    for (const row of rows) {
      for (const citation of expectedCitations(row)) {
        expect(
          knownActKeys.has(citation.actKey),
          `${row.id}: ${citation.actKey}`,
        ).toBe(true);
        expect(citation.section.length, row.id).toBeGreaterThan(0);
      }
    }
  });

  it("has expected citations for in-scope questions and none for refusals", () => {
    for (const row of rows) {
      const expected = expectedCitations(row);
      if (row.must_refuse) {
        expect(expected, row.id).toHaveLength(0);
      } else {
        expect(expected.length, row.id).toBeGreaterThan(0);
      }
    }
  });

  it("uses only supported review states", () => {
    for (const row of rows) {
      expect(["draft", "reviewed"], row.id).toContain(
        row.review_status ?? "draft",
      );
    }
  });

  it("has string arrays for content checks", () => {
    for (const row of rows) {
      expect(
        (row.must_include ?? []).every((term) => typeof term === "string"),
        row.id,
      ).toBe(true);
      expect(
        (row.must_not_include ?? []).every((term) => typeof term === "string"),
        row.id,
      ).toBe(true);
    }
  });
});
