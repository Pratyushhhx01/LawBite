/**
 * Distinguishes an actual drafted legal document from a conversational answer
 * produced in Document Drafter mode. The drafter must be able to answer a
 * question about a document without wrapping the reply in the mandatory
 * document disclaimer or rendering it as a monospace legal instrument.
 */
export function isDraftDocument(content: string): boolean {
  const text = content.replace(/\[ADVICE_COMPLETE\]/g, "").trim();
  if (!text) return false;

  const documentHeading =
    /^\s*(?:\*\*)?\s*(LEGAL NOTICE|NOTICE|FIRST INFORMATION REPORT|FIR DRAFT|CONSUMER COMPLAINT|RTI APPLICATION|WILL|AFFIDAVIT|PETITION|PLAINT|WRITTEN STATEMENT|CONTRACT|AGREEMENT|POWER OF ATTORNEY|SALE DEED|RENT AGREEMENT|RENTAL AGREEMENT|NDA|NON-DISCLOSURE AGREEMENT)\b/im;
  if (documentHeading.test(text)) return true;

  // Some drafts open with a court/authority address rather than a heading.
  // Require both a formal closing and document-style labels so an ordinary
  // prose answer is never mistaken for a document.
  return (
    /\b(?:Yours faithfully|Yours sincerely|Thanking you)\b/i.test(text) &&
    /\b(?:Subject|From|To|Date)\s*:/i.test(text)
  );
}
