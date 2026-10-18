const ACT_NAMES =
  "Bharatiya Nyaya Sanhita|Bharatiya Nagarik Suraksha Sanhita|Bharatiya Sakshya Adhiniyam|BNS|BNSS|BSA|CrPC|IPC|Indian Penal Code|Code of Criminal Procedure|Evidence Act|Indian Evidence Act";

/**
 * Corrects LLM hallucinations that misuse "Article" for statutes that use
 * "Section". The Bharatiya Nyaya Sanhita (BNS), Bharatiya Nagarik Suraksha
 * Sanhita (BNSS), Bharatiya Sakshya Adhiniyam (BSA), CrPC, IPC and Evidence
 * Act all use SECTIONS. "Article" is reserved for the Constitution.
 *
 * Handles:
 * - "Article 144 of the Bharatiya Nyaya Sanhita (BNS) 2023" -> Section 144 of the Bharatiya Nyaya Sanhita (BNS) 2023
 * - "Article 106 of BNSS" -> Section 106 of BNSS
 * - "Article 144 of the CrPC" -> Section 144 of the CrPC
 * - "Bharatiya Nyaya Sanhita Article 103" -> Bharatiya Nyaya Sanhita Section 103
 *
 * Constitution articles ("Article 14 of the Constitution") are left untouched.
 */
export function fixArticleSectionTerminology(content: string): string {
  return content
    .replace(
      new RegExp(
        `\\bArticle\\s+(\\d+[A-Za-z]?)\\s+(?:of|in)\\s+(the\\s+)?(${ACT_NAMES})\\b`,
        "gi",
      ),
      "Section $1 of $2$3",
    )
    .replace(
      new RegExp(`\\b(${ACT_NAMES})\\s+Article\\s+(\\d+[A-Za-z]?)\\b`, "gi"),
      "$1 Section $2",
    );
}

export function extractRefNumbers(query: string): {
  sections: string[];
  articles: string[];
} {
  const sections: string[] = [];
  const articles: string[] = [];
  const num = "\\d+[A-Za-z]?";
  const sep = "(?:\\s*(?:,|&|and|or)\\s*|\\s+)";
  const secRe = new RegExp(
    `(?:sections|section|sec\\.?|s\\.)\\s+(${num}(?:${sep}${num})*)`,
    "gi",
  );
  const artRe = new RegExp(
    `(?:articles|article|art\\.?)\\s+(${num}(?:${sep}${num})*)`,
    "gi",
  );
  let m: RegExpExecArray | null;
  while ((m = secRe.exec(query))) {
    const nums = m[1].match(/\d+[A-Za-z]?/g);
    if (nums) sections.push(...nums);
  }
  while ((m = artRe.exec(query))) {
    const nums = m[1].match(/\d+[A-Za-z]?/g);
    if (nums) articles.push(...nums);
  }
  return { sections, articles };
}
