/**
 * Advanced Contract Risk Analyzer for Indian Legal Context
 *
 * Implements clause segmentation, risk categorization (Critical, High, Medium, Low),
 * unfair/ambiguous clause detection grounded in the Indian Contract Act, 1872,
 * Specific Relief Act, 1963, and Arbitration & Conciliation Act, 1996.
 */

export type RiskSeverity = "Critical" | "High" | "Medium" | "Low";
export type IssueType =
  | "risky_clause"
  | "missing_clause"
  | "ambiguous_clause"
  | "unfair_clause";

export type ContractType =
  | "Employment"
  | "Non-Disclosure (NDA)"
  | "Commercial / Vendor"
  | "Service Agreement"
  | "Lease / Tenancy"
  | "Shareholder / Investment"
  | "General Contract";

export interface IndianLawRef {
  statute: string;
  section: string;
  principle: string;
  citationUrl: string;
}

export interface ClauseRiskItem {
  id: string;
  clauseTitle: string;
  clauseText: string;
  issueType: IssueType;
  severity: RiskSeverity;
  riskExplanation: string;
  suggestedWording: string;
  indianLawGrounding?: IndianLawRef;
}

export interface MissingClauseItem {
  clauseName: string;
  importance: "Essential" | "Recommended";
  explanation: string;
  standardSampleClause: string;
}

export type ContractRiskReport = ContractAnalysisReport;

export interface ContractAnalysisReport {
  contractTitle: string;
  contractType: ContractType;
  overallRiskScore: number; // 0 to 100
  riskSummary: {
    criticalCount: number;
    highCount: number;
    mediumCount: number;
    lowCount: number;
    totalIssues: number;
  };
  executiveSummary: string;
  identifiedRisks: ClauseRiskItem[];
  missingClauses: MissingClauseItem[];
  recommendedActions: string[];
  legalDisclaimer: string;
  analyzedAt: string;
}

export const LEGAL_DISCLAIMER =
  "This contract risk analysis is generated for informational, diligence, and risk-identification purposes only. It does not constitute guaranteed legal advice or create an advocate-client relationship. You should seek independent legal counsel from a licensed Indian advocate before executing, amending, or litigating upon any agreement.";

interface KnownRiskPattern {
  id: string;
  pattern: RegExp;
  clauseTitle: string;
  issueType: IssueType;
  severity: RiskSeverity;
  riskExplanation: string;
  suggestedWording: string;
  indianLaw: IndianLawRef;
}

const KNOWN_RISK_PATTERNS: KnownRiskPattern[] = [
  // 1. Post-Termination Non-Compete (Void under Section 27 Indian Contract Act)
  {
    id: "restraint-of-trade",
    pattern: /(?:post[- ]termination|after termination|following cessation|for (?:a )?period of|during the term and for|non-compete|restraint of trade)[\s\S]*?(?:shall not|will not|prohibited from|agree not to)[\s\S]*?(?:compete|engage with|consult for|provide similar|work for|employed by|competitor)/i,
    clauseTitle: "Post-Termination Non-Compete",
    issueType: "unfair_clause",
    severity: "Critical",
    riskExplanation:
      "Under Indian law, post-employment restrictive covenants restraining an employee from engaging in lawful trade, occupation, or employment are void ab initio. The Supreme Court in Percept D'Mark (India) v. Zaheer Khan (2006) affirmed that Section 27 leaves no room for 'reasonableness' in post-termination restraints.",
    suggestedWording:
      "During the term of employment, the Employee shall devote their whole time and attention to the business of the Employer and shall not engage in any competing commercial activity. Following termination, the Employee shall strictly protect confidential information and trade secrets, without prejudice to their right to engage in lawful employment.",
    indianLaw: {
      statute: "Indian Contract Act, 1872",
      section: "Section 27",
      principle: "Every agreement by which any one is restrained from exercising a lawful profession, trade or business of any kind, is to that extent void.",
      citationUrl: "https://www.indiacode.nic.in/handle/123456789/2187?view_type=browse&sam_handle=123456789/1362",
    },
  },

  // 2. Unilateral / Vague Termination for Convenience Without Notice or Cause
  {
    id: "unilateral-termination-immediate",
    pattern: /(?:terminate|cancel)\s+this\s+agreement\s+immediately\s+(?:without\s+cause|at\s+any\s+time|in\s+its\s+sole\s+discretion)\s+without\s+(?:notice|compensation|prior\s+written)/i,
    clauseTitle: "Unilateral Termination Without Notice",
    issueType: "risky_clause",
    severity: "High",
    riskExplanation:
      "Allows one party to exit abruptly without cause and without giving reasonable notice or cure periods. Under Indian law (Central Bank of India v. Hartford Fire Insurance), unilateral cancellation without fair opportunity exposes the non-terminating party to unmitigated sunk costs and operational disruption.",
    suggestedWording:
      "Either party may terminate this Agreement without cause upon providing at least thirty (30) days prior written notice to the other party, provided that all accrued payments and completed deliverables up to the effective termination date shall be settled in full.",
    indianLaw: {
      statute: "Specific Relief Act, 1963",
      section: "Section 14 & 20",
      principle: "Contracts terminable at will cannot be specifically enforced; innocent party is entitled to damages and reasonable transition notice.",
      citationUrl: "https://www.indiacode.nic.in/handle/123456789/1583",
    },
  },

  // 3. Complete Exclusion of Liability / Uncapped Indemnity
  {
    id: "uncapped-indemnity",
    pattern: /(?:indemnify|hold harmless|defend)\s+.*?(?:against\s+any\s+and\s+all|all\s+claims|all\s+losses|unlimited)\s+.*?(?:without\s+limitation|without\s+any\s+cap|regardless\s+of\s+cause)/i,
    clauseTitle: "Uncapped & Disproportionate Indemnity",
    issueType: "risky_clause",
    severity: "Critical",
    riskExplanation:
      "Uncapped indemnities expose the indemnifying party to catastrophic, unbounded liability, including indirect, consequential, and punitive losses. Under Section 73 of the Indian Contract Act, damages are restricted to direct losses naturally arising in the usual course of things.",
    suggestedWording:
      "Each party's aggregate indemnification liability arising out of or in connection with this Agreement shall be limited to direct damages and shall not exceed the total fees paid or payable under this Agreement in the twelve (12) months preceding the claim. Neither party shall be liable for indirect, special, or consequential damages.",
    indianLaw: {
      statute: "Indian Contract Act, 1872",
      section: "Section 73",
      principle: "Compensation is recoverable only for loss or damage naturally arising from breach, and not for remote or indirect loss.",
      citationUrl: "https://www.indiacode.nic.in/handle/123456789/2187",
    },
  },

  // 4. Absolute Restraint on Legal Proceedings / Ouster of Court Jurisdiction
  {
    id: "restraint-on-legal-proceedings",
    pattern: /(?:neither\s+party\s+shall|waives?\s+any\s+right\s+to|bar on legal proceedings)[\s\S]*?(?:approach\s+any\s+(?:civil\s+)?court|initiate\s+legal\s+proceedings|file\s+any\s+suit|seek\s+judicial\s+remedy|arbitral forum)/i,
    clauseTitle: "Absolute Bar on Legal Recourse",
    issueType: "unfair_clause",
    severity: "Critical",
    riskExplanation:
      "Any clause completely restricting a party from enforcing their statutory rights in court or arbitration is void under Section 28 of the Indian Contract Act. Agreements extinguishing rights or releasing liability upon failure to claim within shorter periods than the Limitation Act are also void.",
    suggestedWording:
      "Any dispute arising out of or in connection with this Agreement shall first be resolved amicably through mutual discussions within thirty (30) days. Failing amicable resolution, the dispute shall be referred to arbitration in accordance with the Arbitration and Conciliation Act, 1996.",
    indianLaw: {
      statute: "Indian Contract Act, 1872",
      section: "Section 28",
      principle: "Agreements in restraint of legal proceedings are void, saving contracts to refer disputes to arbitration.",
      citationUrl: "https://www.indiacode.nic.in/handle/123456789/2187",
    },
  },

  // 5. Punitive Liquidated Damages Unrelated to Genuine Pre-Estimate
  {
    id: "excessive-penalty",
    pattern: /(?:liquidated\s+damages|unreasonable\s+penalties|penalty\s+of)[\s\S]*?(?:irrespective of|forfeit all pending fees|100%|entire\s+contract\s+value|punitive|exorbitant|fixed sum)/i,
    clauseTitle: "Punitive Damages Clause",
    issueType: "risky_clause",
    severity: "High",
    riskExplanation:
      "Under Indian law (Kailash Nath Associates v. DDA, 2015), stipulated sums that operate in terrorem as a penalty rather than a genuine pre-estimate of loss cannot be recovered. Section 74 allows only reasonable compensation not exceeding the penalty amount.",
    suggestedWording:
      "In the event of delay, the defaulting party shall pay as liquidated damages a sum representing a genuine pre-estimate of administrative loss equal to 0.5% of the delayed milestone value per week of delay, subject to an overall ceiling of 5% of the total contract value.",
    indianLaw: {
      statute: "Indian Contract Act, 1872",
      section: "Section 74",
      principle: "Where a penalty is stipulated, the party complaining of the breach is entitled to reasonable compensation not exceeding the penalty.",
      citationUrl: "https://www.indiacode.nic.in/handle/123456789/2187",
    },
  },

  // 6. Ambiguous Automatic Renewal Without Prior Notice
  {
    id: "perpetual-auto-renewal",
    pattern: /(?:automatically\s+renew|renew\s+in\s+perpetuity|renew\s+indefinitely)\s+.*?(?:without\s+notice|unless\s+objected\s+to\s+in\s+writing)/i,
    clauseTitle: "Unchecked Automatic Renewal",
    issueType: "ambiguous_clause",
    severity: "Medium",
    riskExplanation:
      "Automatic renewal without mandatory advance notice creates accidental lock-in and unexpected commercial liabilities if key reminder dates are missed.",
    suggestedWording:
      "This Agreement shall renew for successive one-year terms only if both parties execute a mutual written renewal at least thirty (30) days prior to the expiration of the current term.",
    indianLaw: {
      statute: "Indian Contract Act, 1872",
      section: "Section 10",
      principle: "Agreements are contracts if made by the free consent of parties competent to contract.",
      citationUrl: "https://www.indiacode.nic.in/handle/123456789/2187",
    },
  },

  // 7. Unilateral Modification of Terms
  {
    id: "unilateral-modification",
    pattern: /(?:reserves?\s+the\s+right\s+to\s+modify|may\s+alter|amend\s+at\s+any\s+time)\s+.*?(?:without\s+(?:prior\s+)?consent|in\s+its\s+sole\s+discretion|without\s+written\s+agreement)/i,
    clauseTitle: "Unilateral Modification of Terms",
    issueType: "unfair_clause",
    severity: "High",
    riskExplanation:
      "Allowing one party to unilaterally alter contract terms, pricing, or scope destroys mutuality of obligation and risks being declared an unconscionable or unfair term.",
    suggestedWording:
      "No amendment, change, or modification of this Agreement shall be valid unless in writing and signed by authorized representatives of both parties.",
    indianLaw: {
      statute: "Indian Contract Act, 1872",
      section: "Section 62",
      principle: "If the parties to a contract agree to substitute a new contract for it, or to rescind or alter it, the original contract need not be performed.",
      citationUrl: "https://www.indiacode.nic.in/handle/123456789/2187",
    },
  },

  // 8. Delayed Payment Without Statutory Compliance (MSMED Act)
  {
    id: "unreasonably-delayed-payment",
    pattern: /(?:(?:paid|payable|payment)[\s\S]*?within[\s\S]*?(?:\((?:45|60|90|120|180)\)|\b(?:45|60|90|120|180)\b)\s+days|payment\s+terms?[\s\S]*?(?:\((?:45|60|90|120|180)\)|\b(?:45|60|90|120|180)\b)\s+days)/i,
    clauseTitle: "Unreasonably Extended Payment Terms",
    issueType: "risky_clause",
    severity: "Medium",
    riskExplanation:
      "Under Section 15 of the Micro, Small and Medium Enterprises Development (MSMED) Act, 2006, payment periods to an MSME cannot exceed 45 days, even by express agreement. Excess periods trigger mandatory compound interest at three times the RBI bank rate under Section 16.",
    suggestedWording:
      "Invoices shall be payable within thirty (30) days of receipt of a valid and undisputed invoice. If the Supplier is an enterprise registered under the MSMED Act, payment shall be made in compliance with Section 15 thereof.",
    indianLaw: {
      statute: "MSME Development Act, 2006",
      section: "Section 15 & 16",
      principle: "Payment period to MSME suppliers cannot exceed 45 days; delayed payments attract statutory compound interest.",
      citationUrl: "https://www.indiacode.nic.in/handle/123456789/2013",
    },
  },
];

/**
 * Standard essential clauses by contract type.
 */
const ESSENTIAL_CLAUSES_BY_TYPE: Record<
  ContractType,
  Array<{ name: string; pattern: RegExp; importance: "Essential" | "Recommended"; explanation: string; sample: string }>
> = {
  Employment: [
    {
      name: "Probation & Confirmation",
      pattern: /probation/i,
      importance: "Essential",
      explanation: "Defines the evaluation period, appraisal terms, and notice period during probation.",
      sample: "The Employee shall be on probation for a period of three (3) months from the Date of Joining, extendable at the discretion of the Employer.",
    },
    {
      name: "Confidentiality & Trade Secrets",
      pattern: /confidential/i,
      importance: "Essential",
      explanation: "Protects proprietary business data, client lists, and technical assets during and after employment.",
      sample: "The Employee shall not disclose, divulge, or use any Confidential Information of the Employer for any purpose outside their authorized duties.",
    },
    {
      name: "Intellectual Property Assignment",
      pattern: /(?:intellectual property|inventions|work for hire|copyright assignment)/i,
      importance: "Essential",
      explanation: "Ensures all inventions, codes, and works created during employment belong to the employer.",
      sample: "All intellectual property rights in any work, invention, or creation made by the Employee in the course of employment shall vest exclusively with the Employer.",
    },
    {
      name: "Dispute Resolution & Jurisdiction",
      pattern: /(?:governing law|jurisdiction|dispute resolution)/i,
      importance: "Recommended",
      explanation: "Specifies governing laws and exclusive court jurisdiction.",
      sample: "This Agreement shall be governed by the laws of India and subject to the exclusive jurisdiction of the courts at New Delhi.",
    },
  ],

  "Non-Disclosure (NDA)": [
    {
      name: "Definition of Confidential Information",
      pattern: /definition of confidential/i,
      importance: "Essential",
      explanation: "Explicitly delineates what information constitutes protected confidential data.",
      sample: "'Confidential Information' means any non-public proprietary information disclosed by either party, whether orally or in writing, marked as confidential.",
    },
    {
      name: "Standard Carve-Outs / Exceptions",
      pattern: /(?:publicly known|independently developed|already known|required by law)/i,
      importance: "Essential",
      explanation: "Permits disclosure of information already public, independently developed, or mandated by court order.",
      sample: "Confidential Information shall not include information that is publicly known, was already in recipient's possession, or is required by court order.",
    },
    {
      name: "Term and Duration of Obligations",
      pattern: /(?:survival|duration of confidentiality|period of \d+ years)/i,
      importance: "Essential",
      explanation: "Defines how long confidentiality duties survive after termination.",
      sample: "The confidentiality obligations under this Agreement shall survive termination and remain in effect for three (3) years from disclosure.",
    },
  ],

  "Commercial / Vendor": [
    {
      name: "Dispute Resolution & Governing Law",
      pattern: /(?:governing law|jurisdiction|dispute resolution)/i,
      importance: "Essential",
      explanation: "Designates the substantive governing law and dispute adjudication forum.",
      sample: "This Agreement shall be governed by Indian law and courts at New Delhi shall have exclusive jurisdiction.",
    },
    {
      name: "Limitation of Liability",
      pattern: /limitation of liability/i,
      importance: "Essential",
      explanation: "Caps total financial exposure to a predictable amount (e.g. 12 months fees).",
      sample: "Except for breaches of confidentiality or gross negligence, neither party's total liability shall exceed the fees paid under this Agreement in the preceding 12 months.",
    },
    {
      name: "Force Majeure",
      pattern: /force majeure/i,
      importance: "Essential",
      explanation: "Excuses performance obligations during unforeseeable acts of God, pandemics, or civil unrest.",
      sample: "Neither party shall be liable for failure or delay in performance caused by events beyond reasonable control, including acts of God, war, pandemic, or government restrictions.",
    },
    {
      name: "Arbitration Clause",
      pattern: /arbitration/i,
      importance: "Recommended",
      explanation: "Facilitates private, expedited commercial dispute resolution under the Arbitration Act, 1996.",
      sample: "Any dispute shall be referred to arbitration by a sole arbitrator appointed mutually by the parties under the Arbitration and Conciliation Act, 1996.",
    },
  ],

  "Service Agreement": [
    {
      name: "Service Level Agreement (SLA) & Scope",
      pattern: /(?:service level|scope of work|deliverables)/i,
      importance: "Essential",
      explanation: "Defines milestones, delivery schedules, and performance standards.",
      sample: "The Service Provider shall deliver the services in strict accordance with the Scope of Work set forth in Schedule A.",
    },
    {
      name: "Payment Milestones & Invoicing",
      pattern: /(?:payment terms|invoicing|milestones)/i,
      importance: "Essential",
      explanation: "Specifies payment triggers, verification criteria, and statutory tax obligations (GST).",
      sample: "Payments shall be released against verified milestone deliverables within thirty (30) days of receipt of invoice.",
    },
  ],

  "Lease / Tenancy": [
    {
      name: "Security Deposit & Refund Terms",
      pattern: /security deposit/i,
      importance: "Essential",
      explanation: "Specifies interest-free deposit amount, allowable deductions, and refund timeline upon handover.",
      sample: "The Lessor shall refund the interest-free security deposit within seven (7) days of peaceful handover of possession, subject to deduction of valid unpaid utility dues.",
    },
    {
      name: "Lock-in Period & Early Exit",
      pattern: /(?:lock-in|lock in)/i,
      importance: "Essential",
      explanation: "Defines minimum tenancy period and penalties if tenant vacates prematurely.",
      sample: "Both parties agree to a lock-in period of eleven (11) months during which neither party may terminate except for material breach.",
    },
  ],

  "Shareholder / Investment": [
    {
      name: "Representations and Warranties",
      pattern: /representations and warranties/i,
      importance: "Essential",
      explanation: "Assures accuracy of company financials, cap table, and regulatory compliance.",
      sample: "The Founders and Company jointly represent and warrant that the Company is duly incorporated and possesses clear title to its assets.",
    },
  ],

  "General Contract": [
    {
      name: "Severability Clause",
      pattern: /severability/i,
      importance: "Essential",
      explanation: "Ensures the remainder of the contract remains valid even if one clause is struck down.",
      sample: "If any provision of this Agreement is held invalid or unenforceable, such provision shall be severed and the remaining provisions shall continue in full force.",
    },
    {
      name: "Entire Agreement Clause",
      pattern: /(?:entire agreement|supersedes all prior)/i,
      importance: "Essential",
      explanation: "Prevents reliance on prior oral negotiations or pre-contractual representations.",
      sample: "This Agreement constitutes the entire agreement between the parties and supersedes all prior negotiations, understandings, and representations.",
    },
  ],
};

/**
 * Detects contract type from text heuristics.
 */
export function detectContractType(text: string): ContractType {
  const lower = text.toLowerCase();
  if (lower.includes("employment") || lower.includes("probation") || lower.includes("employer and employee")) {
    return "Employment";
  }
  if (lower.includes("non-disclosure") || lower.includes("confidentiality agreement") || lower.includes("nda")) {
    return "Non-Disclosure (NDA)";
  }
  if (lower.includes("lease agreement") || lower.includes("tenancy") || lower.includes("rent agreement") || lower.includes("lessor and lessee")) {
    return "Lease / Tenancy";
  }
  if (lower.includes("service agreement") || lower.includes("consulting agreement") || lower.includes("master services")) {
    return "Service Agreement";
  }
  if (lower.includes("shareholder") || lower.includes("investment agreement") || lower.includes("subscription agreement")) {
    return "Shareholder / Investment";
  }
  if (lower.includes("vendor") || lower.includes("supplier") || lower.includes("purchase agreement")) {
    return "Commercial / Vendor";
  }
  return "General Contract";
}

/**
 * Segment contract text into readable paragraphs or clauses.
 */
function segmentClauses(text: string): Array<{ title: string; text: string }> {
  const lines = text.split(/\r?\n+/);
  const segments: Array<{ title: string; text: string }> = [];
  let currentTitle = "General Clause";
  let currentBuffer: string[] = [];

  const flush = () => {
    if (currentBuffer.length > 0) {
      segments.push({ title: currentTitle, text: currentBuffer.join(" ") });
      currentBuffer = [];
    }
  };

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    const inlineMatch = trimmed.match(
      /^(?:(?:\d+\.|\([a-z0-9]+\)|Section\s+\d+|Clause\s+\d+|Article\s+[IVXLCDM\d]+)[\s:.-]+)([A-Za-z0-9\s,&/-]{2,60})[\.:](?:\s+|$)(.*)$/i
    );
    const standaloneMatch = trimmed.match(
      /^(?:(?:\d+\.|\([a-z0-9]+\)|Section\s+\d+|Clause\s+\d+|Article\s+[IVXLCDM\d]+)[\s:.-]+)([A-Za-z0-9\s,&/-]{2,60})$/i
    );

    if (inlineMatch) {
      flush();
      currentTitle = inlineMatch[1].trim();
      if (inlineMatch[2]?.trim()) {
        currentBuffer.push(inlineMatch[2].trim());
      }
    } else if (standaloneMatch) {
      flush();
      currentTitle = standaloneMatch[1].trim();
    } else {
      currentBuffer.push(trimmed);
      if (currentBuffer.join(" ").length > 350) {
        flush();
      }
    }
  }
  flush();

  return segments;
}

/**
 * Advanced Contract Risk Analyzer Engine
 */

export type AnalyzeContractInput =
  | { contractText: string; contractTitle?: string; contractType?: ContractType }
  | string;

export function analyzeContract(
  contractTextInput: string | { contractText: string; contractTitle?: string; contractType?: ContractType },
  options?: { contractTitle?: string; contractType?: ContractType },
): ContractAnalysisReport {
  let text: string;
  let opts: { contractTitle?: string; contractType?: ContractType } | undefined;

  if (typeof contractTextInput === 'object' && contractTextInput !== null) {
    text = contractTextInput.contractText || '';
    opts = {
      contractTitle: contractTextInput.contractTitle,
      contractType: contractTextInput.contractType as ContractType,
    };
  } else {
    text = contractTextInput;
    opts = options;
  }

  return _analyzeContractImpl(text, opts);
}

export const analyzeContractRisks = analyzeContract;

function _analyzeContractImpl(
  contractText: string,
  options?: { contractTitle?: string; contractType?: ContractType },
): ContractAnalysisReport {
  const text = contractText.trim();
  const title = options?.contractTitle || "Legal Agreement";
  const type = options?.contractType || detectContractType(text);

  const identifiedRisks: ClauseRiskItem[] = [];
  const segments = segmentClauses(text);

  // 1. Scan clauses against known risk patterns
  for (const pattern of KNOWN_RISK_PATTERNS) {
    // Check against individual segments or full text
    let matchedText = "";
    let matchedTitle = pattern.clauseTitle;

    for (const seg of segments) {
      if (pattern.pattern.test(seg.text)) {
        matchedText = seg.text;
        matchedTitle = seg.title !== "General Clause" ? seg.title : pattern.clauseTitle;
        break;
      }
    }

    if (!matchedText && pattern.pattern.test(text)) {
      const match = text.match(pattern.pattern);
      matchedText = match ? match[0] : "";
    }

    if (matchedText) {
      identifiedRisks.push({
        id: pattern.id,
        clauseTitle: matchedTitle,
        clauseText: matchedText.length > 400 ? matchedText.slice(0, 400) + "..." : matchedText,
        issueType: pattern.issueType,
        severity: pattern.severity,
        riskExplanation: pattern.riskExplanation,
        suggestedWording: pattern.suggestedWording,
        indianLawGrounding: pattern.indianLaw,
      });
    }
  }

  // 2. Check for missing essential clauses
  const missingClauses: MissingClauseItem[] = [];
  const expectedClauses = [
    ...(ESSENTIAL_CLAUSES_BY_TYPE[type] || []),
    ...(ESSENTIAL_CLAUSES_BY_TYPE["General Contract"] || []),
  ];

  for (const exp of expectedClauses) {
    const present = exp.pattern.test(text);
    if (!present) {
      missingClauses.push({
        clauseName: exp.name,
        importance: exp.importance,
        explanation: exp.explanation,
        standardSampleClause: exp.sample,
      });
    }
  }

  // 3. Compute risk metrics
  let criticalCount = 0;
  let highCount = 0;
  let mediumCount = 0;
  let lowCount = 0;

  for (const r of identifiedRisks) {
    if (r.severity === "Critical") criticalCount++;
    else if (r.severity === "High") highCount++;
    else if (r.severity === "Medium") mediumCount++;
    else if (r.severity === "Low") lowCount++;
  }

  const riskScore = Math.min(
    100,
    criticalCount * 30 + highCount * 18 + mediumCount * 8 + lowCount * 4 + missingClauses.length * 5,
  );

  // 4. Generate executive summary
  let executiveSummary = `This ${type} contains ${identifiedRisks.length} potential risk items and ${missingClauses.length} missing standard provisions. `;
  if (criticalCount > 0) {
    executiveSummary += `CRITICAL ATTENTION REQUIRED: Found ${criticalCount} clause(s) with severe legal jeopardy or statutory invalidity under Indian law (e.g. Section 27/28 Indian Contract Act). `;
  } else if (highCount > 0) {
    executiveSummary += `High risk profile: Contains clauses with one-sided commercial exposure and termination risks. `;
  } else {
    executiveSummary += `Standard risk profile: No critical statutory prohibitions detected. Review recommended wording adjustments. `;
  }

  const recommendedActions: string[] = [];
  if (criticalCount > 0) {
    recommendedActions.push("Revise or strike out void restrictive covenants and uncapped indemnities before signature.");
  }
  if (missingClauses.length > 0) {
    recommendedActions.push(`Incorporate essential missing clauses: ${missingClauses.map((m) => m.clauseName).join(", ")}.`);
  }
  recommendedActions.push("Ensure mutual dispute resolution and reciprocal termination notice windows.");

  return {
    contractTitle: title,
    contractType: type,
    overallRiskScore: riskScore,
    riskSummary: {
      criticalCount,
      highCount,
      mediumCount,
      lowCount,
      totalIssues: identifiedRisks.length,
    },
    executiveSummary,
    identifiedRisks,
    missingClauses,
    recommendedActions,
    legalDisclaimer: LEGAL_DISCLAIMER,
    analyzedAt: new Date().toISOString(),
  };
}
