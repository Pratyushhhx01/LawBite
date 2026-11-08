/**
 * Legal Document Comparison Engine
 *
 * Implements granular clause-level and textual diffing between two contract versions.
 * Identifies changes in payment terms, penalties, dates/deadlines, responsibilities,
 * and explains their concrete legal and commercial implications.
 */

export type ComparisonChangeType = "added" | "removed" | "modified" | "unchanged";

export type LegalChangeCategory =
  | "payment_terms"
  | "penalties_damages"
  | "dates_deadlines"
  | "responsibilities"
  | "obligations_covenants"
  | "liability_indemnity"
  | "general_text";

export interface ClauseDiff {
  id: string;
  clauseHeader: string;
  changeType: ComparisonChangeType;
  versionAText: string | null;
  versionBText: string | null;
  category: LegalChangeCategory;
  legalSignificance: string;
  severity: "Critical" | "High" | "Medium" | "Low";
}

export type ComparisonReport = DocumentComparisonReport;

export interface DocumentComparisonReport {
  versionATitle: string;
  versionBTitle: string;
  totalChanges: number;
  addedCount: number;
  removedCount: number;
  modifiedCount: number;
  criticalChangesCount: number;
  changesByCategory: Record<LegalChangeCategory, number>;
  clauseDiffs: ClauseDiff[];
  executiveSummary: string;
  comparedAt: string;
}

interface ClauseItem {
  id: string;
  header: string;
  text: string;
}

/**
 * Normalizes text lines into structured clauses.
 */
function parseClauses(text: string): ClauseItem[] {
  const lines = text.split(/\r?\n+/);
  const clauses: ClauseItem[] = [];
  let currentHeader = "Preamble / General";
  let buffer: string[] = [];
  let index = 1;

  const flush = () => {
    if (buffer.length > 0) {
      clauses.push({
        id: `clause-${index++}`,
        header: currentHeader,
        text: buffer.join(" "),
      });
      buffer = [];
    }
  };

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    const inlineMatch = trimmed.match(
      /^(?:(?:\d+\.|\d+\.\d+|Section\s+\d+|Clause\s+\d+|Article\s+[IVXLCDM\d]+)[\s:.-]+)([A-Za-z\s,/-]{2,50})[\.:](?:\s+|$)(.*)$/i
    );
    const standaloneMatch = /^(?:(?:\d+\.|\d+\.\d+|Section\s+\d+|Clause\s+\d+|Article\s+[IVXLCDM\d]+)[\s:.-]+)([A-Za-z\s,/-]{2,60})$/i.test(trimmed);

    if (inlineMatch) {
      flush();
      currentHeader = inlineMatch[1].trim();
      if (inlineMatch[2]?.trim()) {
        buffer.push(inlineMatch[2].trim());
      }
    } else if (standaloneMatch) {
      flush();
      currentHeader = trimmed;
    } else {
      buffer.push(trimmed);
      if (buffer.join(" ").length > 350) {
        flush();
      }
    }
  }
  flush();

  return clauses;
}

/**
 * Classifies the legal category of a clause change.
 */
function categorizeChange(header: string, textA: string, textB: string): LegalChangeCategory {
  const combined = `${header} ${textA} ${textB}`.toLowerCase();

  if (
    combined.includes("indemn") ||
    combined.includes("liabilit") ||
    combined.includes("hold harmless") ||
    combined.includes("consequential")
  ) {
    return "liability_indemnity";
  }

  if (
    combined.includes("penalty") ||
    combined.includes("liquidated damage") ||
    combined.includes("forfeit")
  ) {
    return "penalties_damages";
  }

  if (
    combined.includes("payment") ||
    combined.includes("fee") ||
    combined.includes("invoic") ||
    combined.includes("price") ||
    combined.includes("consideration") ||
    combined.includes("gst") ||
    combined.includes("rupee") ||
    combined.includes("inr") ||
    combined.includes("amount")
  ) {
    return "payment_terms";
  }

  if (
    combined.includes("date") ||
    combined.includes("notice period") ||
    combined.includes("deadline") ||
    combined.includes("renew")
  ) {
    return "dates_deadlines";
  }

  if (
    combined.includes("obligation") ||
    combined.includes("covenant") ||
    combined.includes("confidential") ||
    combined.includes("non-compete")
  ) {
    return "obligations_covenants";
  }

  if (
    combined.includes("scope") ||
    combined.includes("deliverable") ||
    combined.includes("duty") ||
    combined.includes("responsibility")
  ) {
    return "responsibilities";
  }

  return "general_text";
}

/**
 * Evaluates the legal and commercial significance of the detected difference.
 */
function evaluateLegalSignificance(
  category: LegalChangeCategory,
  changeType: ComparisonChangeType,
  textA: string | null,
  textB: string | null,
): { significance: string; severity: "Critical" | "High" | "Medium" | "Low" } {
  if (changeType === "added") {
    switch (category) {
      case "liability_indemnity":
        return {
          significance: "New indemnity or liability provision introduced. Verify liability caps and ensure mutual reciprocal protections.",
          severity: "Critical",
        };
      case "penalties_damages":
        return {
          significance: "New financial penalty or liquidated damages clause inserted. Check for compliance with Section 74 of the Indian Contract Act.",
          severity: "High",
        };
      case "payment_terms":
        return {
          significance: "New payment requirement or milestone obligation added. Confirm impact on operational cash flows.",
          severity: "Medium",
        };
      case "dates_deadlines":
        return {
          significance: "New timeline or notice deadline introduced. Set appropriate compliance calendar reminders.",
          severity: "Medium",
        };
      default:
        return {
          significance: "New clause added to the agreement. Review scope and enforceability under applicable laws.",
          severity: "Low",
        };
    }
  }

  if (changeType === "removed") {
    switch (category) {
      case "liability_indemnity":
        return {
          significance: "Removal of liability safeguards or caps exposes parties to uncapped common-law damage claims.",
          severity: "Critical",
        };
      case "dates_deadlines":
        return {
          significance: "Removal of notice period or cure window allows potential immediate termination without cure opportunity.",
          severity: "High",
        };
      case "payment_terms":
        return {
          significance: "Payment terms or reimbursement clause removed. Review whether compensation mechanism remains defined.",
          severity: "High",
        };
      default:
        return {
          significance: "Clause deleted from original version. Confirm whether deletion was agreed and intended.",
          severity: "Medium",
        };
    }
  }

  // Modified clause
  const strA = textA || "";
  const strB = textB || "";

  switch (category) {
    case "payment_terms": {
      return {
        significance: "Payment amount, timeline, or invoicing conditions have been altered. Verify numbers against purchase order or commercial term sheet.",
        severity: "High",
      };
    }
    case "penalties_damages": {
      return {
        significance: "Liquidated damages percentage or breach penalties have been modified. Ensure stipulated sum reflects a genuine pre-estimate under Section 74 Indian Contract Act.",
        severity: "High",
      };
    }
    case "dates_deadlines": {
      return {
        significance: "Key dates, termination notice window, or duration modified. Confirm operational readiness for altered deadlines.",
        severity: "Medium",
      };
    }
    case "liability_indemnity": {
      const bHasUncapped = /without limitation|any and all|unlimited/i.test(strB);
      const aHadUncapped = /without limitation|any and all|unlimited/i.test(strA);
      if (bHasUncapped && !aHadUncapped) {
        return {
          significance: "WARNING: Liability cap was removed or broadened to uncapped exposure, creating substantial financial risk.",
          severity: "Critical",
        };
      }
      return {
        significance: "Indemnity or liability allocation altered between parties. Verify risk balance.",
        severity: "High",
      };
    }
    default:
      return {
        significance: "Wording modified. Verify that semantic meaning and reciprocal obligations remain intact.",
        severity: "Low",
      };
  }
}

/**
 * Compares two legal document texts clause-by-clause.
 */

export function compareLegalDocuments(
  docAInput: string | { documentA: string; documentB: string; titleA?: string; titleB?: string },
  docBInput?: string | { versionATitle?: string; versionBTitle?: string },
  options?: { versionATitle?: string; versionBTitle?: string },
): DocumentComparisonReport {
  let textA: string;
  let textB: string;
  let opts: { versionATitle?: string; versionBTitle?: string } | undefined;

  if (typeof docAInput === 'object' && docAInput !== null) {
    textA = docAInput.documentA || '';
    textB = docAInput.documentB || '';
    opts = {
      versionATitle: docAInput.titleA,
      versionBTitle: docAInput.titleB,
    };
  } else {
    textA = docAInput;
    textB = typeof docBInput === 'string' ? docBInput : '';
    opts = options || (typeof docBInput === 'object' ? docBInput : undefined);
  }

  return _compareLegalDocumentsImpl(textA, textB, opts);
}

export const compareDocuments = compareLegalDocuments;

function _compareLegalDocumentsImpl(
  versionAText: string,
  versionBText: string,
  options?: { versionATitle?: string; versionBTitle?: string },
): DocumentComparisonReport {
  const titleA = options?.versionATitle || "Version A (Original)";
  const titleB = options?.versionBTitle || "Version B (Revised)";

  const clausesA = parseClauses(versionAText);
  const clausesB = parseClauses(versionBText);

  const clauseDiffs: ClauseDiff[] = [];
  const changesByCategory: Record<LegalChangeCategory, number> = {
    payment_terms: 0,
    penalties_damages: 0,
    dates_deadlines: 0,
    responsibilities: 0,
    obligations_covenants: 0,
    liability_indemnity: 0,
    general_text: 0,
  };

  const matchedBIndices = new Set<number>();
  let diffIndex = 1;

  // 1. Match clauses from A in B
  for (const cA of clausesA) {
    let matchedIndex = -1;

    for (let i = 0; i < clausesB.length; i++) {
      if (matchedBIndices.has(i)) continue;
      const cB = clausesB[i];

      // Exact header match
      if (cA.header.toLowerCase() === cB.header.toLowerCase() && cA.header !== "Preamble / General") {
        matchedIndex = i;
        break;
      }

      // Check text identity or similarity
      if (cA.text === cB.text) {
        matchedIndex = i;
        break;
      }
    }

    if (matchedIndex !== -1) {
      matchedBIndices.add(matchedIndex);
      const cB = clausesB[matchedIndex];

      if (cA.text.trim() === cB.text.trim()) {
        // Unchanged
        clauseDiffs.push({
          id: `diff-${diffIndex++}`,
          clauseHeader: cA.header,
          changeType: "unchanged",
          versionAText: cA.text,
          versionBText: cB.text,
          category: "general_text",
          legalSignificance: "Clause is identical in both versions.",
          severity: "Low",
        });
      } else {
        // Modified
        const category = categorizeChange(cA.header, cA.text, cB.text);
        const { significance, severity } = evaluateLegalSignificance(category, "modified", cA.text, cB.text);
        changesByCategory[category]++;

        clauseDiffs.push({
          id: `diff-${diffIndex++}`,
          clauseHeader: cA.header,
          changeType: "modified",
          versionAText: cA.text,
          versionBText: cB.text,
          category,
          legalSignificance: significance,
          severity,
        });
      }
    } else {
      // Clause was in A but removed in B
      const category = categorizeChange(cA.header, cA.text, "");
      const { significance, severity } = evaluateLegalSignificance(category, "removed", cA.text, null);
      changesByCategory[category]++;

      clauseDiffs.push({
        id: `diff-${diffIndex++}`,
        clauseHeader: cA.header,
        changeType: "removed",
        versionAText: cA.text,
        versionBText: null,
        category,
        legalSignificance: significance,
        severity,
      });
    }
  }

  // 2. Identify newly added clauses in B that were not in A
  for (let i = 0; i < clausesB.length; i++) {
    if (!matchedBIndices.has(i)) {
      const cB = clausesB[i];
      const category = categorizeChange(cB.header, "", cB.text);
      const { significance, severity } = evaluateLegalSignificance(category, "added", null, cB.text);
      changesByCategory[category]++;

      clauseDiffs.push({
        id: `diff-${diffIndex++}`,
        clauseHeader: cB.header,
        changeType: "added",
        versionAText: null,
        versionBText: cB.text,
        category,
        legalSignificance: significance,
        severity,
      });
    }
  }

  // Summary counts
  let addedCount = 0;
  let removedCount = 0;
  let modifiedCount = 0;
  let criticalChangesCount = 0;

  for (const d of clauseDiffs) {
    if (d.changeType === "added") addedCount++;
    if (d.changeType === "removed") removedCount++;
    if (d.changeType === "modified") modifiedCount++;
    if (d.severity === "Critical") criticalChangesCount++;
  }

  const totalChanges = addedCount + removedCount + modifiedCount;

  let executiveSummary = `Comparison between "${titleA}" and "${titleB}" detected ${totalChanges} change(s): ${modifiedCount} modified, ${addedCount} added, and ${removedCount} removed. `;
  if (criticalChangesCount > 0) {
    executiveSummary += `High alert: ${criticalChangesCount} critical legal change(s) impacting liability, indemnities, or statutory rights require close scrutiny before approval.`;
  } else if (totalChanges > 0) {
    executiveSummary += "Review highlighted changes across payment terms, deadlines, and responsibilities.";
  } else {
    executiveSummary += "Documents are substantively identical.";
  }

  return {
    versionATitle: titleA,
    versionBTitle: titleB,
    totalChanges,
    addedCount,
    removedCount,
    modifiedCount,
    criticalChangesCount,
    changesByCategory,
    clauseDiffs,
    executiveSummary,
    comparedAt: new Date().toISOString(),
  };
}
