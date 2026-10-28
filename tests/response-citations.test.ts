import { describe, expect, it, vi } from "vitest";
import {
  annotateCitations,
  verifyResponseCitations,
  type CitationVerifier,
} from "@/lib/response-citations";
import type { CitationVerificationSummary } from "@/lib/citation-verifier";
import type { Citation } from "@/lib/citations";

const summary: CitationVerificationSummary = {
  total: 3,
  sectionTotal: 2,
  sectionVerified: 1,
  sectionUnverified: 1,
  sectionLookupErrors: 0,
  verifiableSectionTotal: 2,
  precision: 0.5,
  hallucinationRate: 0.5,
  referenceTotal: 0,
  webTotal: 1,
  webTrusted: 1,
};

const citations: Citation[] = [
  {
    type: "act",
    label: "Bharatiya Nyaya Sanhita, Section 103",
    snippet: "Punishment for murder.",
  },
  {
    type: "act",
    label: "Indian Penal Code, Section 999",
    snippet: "Not a real provision.",
  },
  {
    type: "web",
    label: "Supreme Court of India",
    snippet: "Judgment summary.",
    url: "https://main.sci.gov.in/",
  },
];

describe("annotateCitations", () => {
  it("marks verified, not_found and unavailable act citations", () => {
    const result = annotateCitations(citations, [
      {
        type: "act",
        label: citations[0].label,
        verified: true,
        reason: "verified",
        source: "structured",
      },
      {
        type: "act",
        label: citations[1].label,
        verified: false,
        reason: "section_not_found",
        source: "structured",
      },
      {
        type: "act",
        label: "Contract Act, Section 10",
        verified: false,
        reason: "lookup_error",
        source: "structured",
      },
    ]);

    expect(result[0].verification).toBe("verified");
    expect(result[1].verification).toBe("not_found");
    // Web citations are never presented as bare-act verified.
    expect(result[2].verification).toBeUndefined();
  });

  it("does not mark a lookup error as a hallucination", () => {
    const lookupErrorCitations: Citation[] = [
      { type: "act", label: "Contract Act, Section 10", snippet: "" },
    ];

    const [result] = annotateCitations(lookupErrorCitations, [
      {
        type: "act",
        label: "Contract Act, Section 10",
        verified: false,
        reason: "lookup_error",
        source: "structured",
      },
    ]);

    expect(result.verification).toBe("unavailable");
  });

  it("leaves act references without a parsed section unmarked", () => {
    const reference: Citation[] = [
      { type: "act", label: "Indian Contract Act", snippet: "" },
    ];

    const [result] = annotateCitations(reference, [
      {
        type: "act",
        label: "Indian Contract Act",
        verified: false,
        reason: "reference_not_section",
        source: "structured",
      },
    ]);

    expect(result.verification).toBeUndefined();
  });
});

describe("verifyResponseCitations", () => {
  it("returns annotated citations and the verification summary", async () => {
    const verify: CitationVerifier = vi.fn(async () => ({
      results: [
        {
          type: "act" as const,
          label: citations[0].label,
          verified: true,
          reason: "verified",
          source: "structured" as const,
        },
      ],
      summary,
    }));

    const payload = await verifyResponseCitations(citations, { verify });

    expect(verify).toHaveBeenCalledOnce();
    expect(payload.citations[0].verification).toBe("verified");
    expect(payload.summary).toEqual(summary);
  });

  it("skips verification when there are no act citations", async () => {
    const verify = vi.fn();

    const payload = await verifyResponseCitations([citations[2]], { verify });

    expect(verify).not.toHaveBeenCalled();
    expect(payload.summary).toBeNull();
  });

  it("degrades gracefully when verification times out", async () => {
    const onError = vi.fn();
    const verify: CitationVerifier = () =>
      new Promise(() => {
        /* never resolves */
      });

    const payload = await verifyResponseCitations(citations, {
      verify,
      timeoutMs: 10,
      onError,
    });

    expect(payload.citations).toEqual(citations);
    expect(payload.summary).toBeNull();
    expect(onError).toHaveBeenCalledOnce();
  });

  it("degrades gracefully when the verifier throws", async () => {
    const onError = vi.fn();
    const verify: CitationVerifier = async () => {
      throw new Error("S3 unavailable");
    };

    const payload = await verifyResponseCitations(citations, {
      verify,
      onError,
    });

    expect(payload.citations).toEqual(citations);
    expect(payload.summary).toBeNull();
    expect(onError).toHaveBeenCalledOnce();
  });
});
