import { describe, it, expect } from "vitest";
import { isDocumentDraftingQuery } from "@/lib/chat-filters";

describe("isDocumentDraftingQuery", () => {
  describe("document-drafting questions — ALLOWED", () => {
    const allowed = [
      "Please draft a legal notice for cheque dishonour.",
      "Draft an affidavit for filing a petition.",
      "What is the format of an RTI application?",
      "Which documents are required for a rent agreement?",
      "What clauses should I include in an employment contract?",
      "How do I draft a will?",
      "What is the stamp duty for a sale deed?",
      "Is notarisation required for an affidavit?",
      "Please add a confidentiality clause.",
      "Do I need stamp paper?",
      "What details do you need?",
      "Which documents should I attach?",
      "How do I format a letter to my landlord?",
      "What is a legal notice?",
      "What is a rent agreement?",
      "What is an RTI application?",
      "What is a sale deed?",
      "What is a power of attorney?",
      "What is an NDA?",
      "What is a promissory note?",
      "What is a written statement?",
      "What is a plaint?",
      "What is a memorandum of appeal?",
      "What is a bail application?",
      "What is a writ petition?",
      "What is a consumer complaint?",
      "What is an FIR?",
    ];

    allowed.forEach((query) => {
      it(`allows: "${query}"`, () => {
        expect(isDocumentDraftingQuery(query)).toBe(true);
      });
    });
  });

  describe("general legal questions — REFUSED", () => {
    const refused = [
      "What is Article 370?",
      "What is Section 144?",
      "Who is the Chief Justice of India?",
      "What is bail?",
      "What is the punishment for murder?",
      "What are my fundamental rights?",
      "Explain the Indian Contract Act.",
      "What is the Indian Contract Act?",
      "What is the law of contract?",
      "What is the punishment for breach of contract?",
      "What is the difference between BNS and IPC?",
      "What is the format of Article 370?",
      "What is the weather today?",
      "What is cricket?",
    ];

    refused.forEach((query) => {
      it(`refuses: "${query}"`, () => {
        expect(isDocumentDraftingQuery(query)).toBe(false);
      });
    });
  });

  describe("ongoing draft context", () => {
    it("allows short factual answers", () => {
      const options = { hasDraftContext: true };
      expect(isDocumentDraftingQuery("No", options)).toBe(true);
      expect(isDocumentDraftingQuery("Rs 50,000", options)).toBe(true);
      expect(isDocumentDraftingQuery("My name is Rahul Sharma", options)).toBe(
        true,
      );
      expect(isDocumentDraftingQuery("Delhi", options)).toBe(true);
    });

    it("allows edit instructions", () => {
      const options = { hasDraftContext: true };
      expect(isDocumentDraftingQuery("Make it more formal", options)).toBe(true);
      expect(
        isDocumentDraftingQuery("Change the notice period to 30 days", options),
      ).toBe(true);
    });

    it("still refuses general legal questions", () => {
      const options = { hasDraftContext: true };
      expect(isDocumentDraftingQuery("What is Article 370?", options)).toBe(
        false,
      );
      expect(isDocumentDraftingQuery("What is Section 144?", options)).toBe(
        false,
      );
      expect(
        isDocumentDraftingQuery("I want to know about Article 370", options),
      ).toBe(false);
      expect(
        isDocumentDraftingQuery(
          "What is the punishment for breach of contract?",
          options,
        ),
      ).toBe(false);
    });

    it("allows a bare section answer only while the drafter is waiting", () => {
      expect(
        isDocumentDraftingQuery("Section 138", {
          hasDraftContext: true,
          awaitingDraftAnswer: true,
        }),
      ).toBe(true);
      expect(
        isDocumentDraftingQuery("Section 138", { hasDraftContext: true }),
      ).toBe(false);
    });
  });
});
