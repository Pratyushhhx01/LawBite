import { describe, it, expect } from "vitest";
import { isDraftDocument } from "@/lib/draft-document";

describe("isDraftDocument", () => {
  describe("actual documents", () => {
    const documents = [
      "LEGAL NOTICE UNDER SECTION 138 OF THE NEGOTIABLE INSTRUMENTS ACT\n\nFrom: [complainant name]\nTo: [opponent name]\n\nYou are called upon to pay Rs. [amount] within 15 days.",
      "**AFFIDAVIT**\n\nI, [deponent name], do hereby solemnly affirm and state as follows:\n\n1. That the contents are true.",
      "FIRST INFORMATION REPORT\n\nDistrict: [district]\nPolice Station: [station]\n\nComplainant: [name]",
      "CONSUMER COMPLAINT\n\nBefore the District Consumer Disputes Redressal Commission\n\nComplainant: [name]\nOpposite Party: [name]",
      "RTI APPLICATION\n\nTo: The Public Information Officer\n\nSubject: Request for information under the Right to Information Act, 2005",
      "WILL\n\nI, [testator name], resident of [address], hereby revoke all previous wills and declare this to be my last will.",
      "RENT AGREEMENT\n\nThis Rent Agreement is made on [date] between [landlord] and [tenant].",
      "POWER OF ATTORNEY\n\nI, [principal name], appoint [agent name] as my attorney.",
      "SALE DEED\n\nThis Sale Deed is executed on [date] between [vendor] and [purchaser].",
      "NON-DISCLOSURE AGREEMENT\n\nThis Agreement is made between [disclosing party] and [receiving party].",
      "Dear Sir,\n\nSubject: Demand for payment\n\nThis notice is issued under the applicable law.\n\nYours faithfully,\n[sender name]",
    ];

    it.each(documents)("recognizes a drafted instrument: %s", (document) => {
      expect(isDraftDocument(document)).toBe(true);
    });

    it("ignores the completion marker", () => {
      expect(isDraftDocument("AFFIDAVIT\n\nI affirm.\n\n[ADVICE_COMPLETE]")).toBe(
        true,
      );
    });
  });

  describe("conversational answers", () => {
    const answers = [
      "A legal notice is a formal communication sent before litigation. It states the grievance and demands a remedy within a fixed period.",
      "To draft an affidavit, you need the deponent's name, address, and a statement of facts. The affidavit must be sworn before a notary.",
      "Stamp duty for a rent agreement varies by state. In Delhi it is usually 2% of the average annual rent.",
      "Yes, a legal notice is mandatory before filing a Section 138 complaint. It gives the drawer 15 days to pay.",
      "You should include a confidentiality clause, a termination clause, and a dispute resolution clause.",
    ];

    it.each(answers)("does not treat prose as a document: %s", (answer) => {
      expect(isDraftDocument(answer)).toBe(false);
    });

    it("returns false for empty or whitespace content", () => {
      expect(isDraftDocument("")).toBe(false);
      expect(isDraftDocument("   \n\n  ")).toBe(false);
      expect(isDraftDocument("[ADVICE_COMPLETE]")).toBe(false);
    });
  });
});
