import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { MatterService } from "@/lib/matter-service";
import { analyzeContract } from "@/lib/contract-analyzer";
import { compareDocuments } from "@/lib/doc-comparison";
import { prepareCourtroom } from "@/lib/courtroom-prep";
import {
  AmendmentTrackerService,
  AUTHORITATIVE_AMENDMENTS,
  type LegalAmendment,
} from "@/lib/amendment-tracker";
import { db } from "@/lib/db";

const describeDb =
  process.env.CI_SKIP_DB_TESTS === "1" ? describe.skip : describe;

describeDb("FEATURE 1: Legal Matter Management Service", () => {
  let testUserId = "jwTZtuR4rFVuNuh6hf1IOUHD1ivqkXBf";
  let createdMatterId = "";

  beforeAll(async () => {
    const user = await db
      .selectFrom("user")
      .select("id")
      .limit(1)
      .executeTakeFirst();
    testUserId = user?.id || "jwTZtuR4rFVuNuh6hf1IOUHD1ivqkXBf";
  });

  afterAll(async () => {
    if (createdMatterId && testUserId) {
      await MatterService.deleteMatter(testUserId, createdMatterId);
    }
  });

  it("creates a legal matter with full metadata (stage, priority, type, parties, court)", async () => {
    const matter = await MatterService.createMatter(testUserId, {
      name: "InfraCorp Ltd v. State Power Distribution Co",
      description: "Arbitration dispute regarding delay damages and escalation claims under EPC contract.",
      matterType: "Commercial Arbitration",
      stage: "Pleadings",
      priority: "High",
      status: "active",
      parties: "Claimant: InfraCorp Ltd | Respondent: State Power Co",
      court: "Arbitral Tribunal, New Delhi",
      nextHearing: "2026-12-15T10:30:00Z",
      notes: "Arbitrator Justice (Retd.) Sharma appointed. Statement of Claim due next month.",
    });

    expect(matter).toBeDefined();
    expect(matter.id).toBeDefined();
    createdMatterId = matter.id;
    expect(matter.name).toBe("InfraCorp Ltd v. State Power Distribution Co");
    expect(matter.stage).toBe("Pleadings");
    expect(matter.priority).toBe("High");
    expect(matter.parties).toContain("InfraCorp Ltd");
    expect(matter.court).toContain("Arbitral Tribunal");
  });

  it("retrieves a complete matter workspace including activities and counts", async () => {
    const ws = await MatterService.getMatterWorkspace(testUserId, createdMatterId);

    expect(ws).not.toBeNull();
    expect(ws!.matter.id).toBe(createdMatterId);
    expect(ws!.activities.length).toBeGreaterThanOrEqual(1);
    expect(ws!.activities[0].activityType).toBe("created");
    expect(ws!.documents).toEqual([]);
    expect(ws!.reports).toEqual([]);
  });

  it("updates matter details and records an activity audit entry", async () => {
    const updated = await MatterService.updateMatter(testUserId, createdMatterId, {
      stage: "Evidence",
      priority: "Urgent",
      notes: "Affidavit of evidence filed by Claimant.",
    });

    expect(updated).toBe(true);

    const ws = await MatterService.getMatterWorkspace(testUserId, createdMatterId);
    expect(ws!.matter.stage).toBe("Evidence");
    expect(ws!.matter.priority).toBe("Urgent");
    expect(ws!.matter.notes).toContain("Affidavit of evidence");
    expect(ws!.activities.some((a) => a.activityType === "details_updated")).toBe(true);
  });

  it("adds versioned documents to the matter and records upload activity", async () => {
    const doc = await MatterService.addDocumentVersion(testUserId, {
      caseId: createdMatterId,
      fileName: "Statement_of_Claim_v1.pdf",
      fileType: "application/pdf",
      fileUrl: "https://s3.ap-south-1.amazonaws.com/test-bucket/claim_v1.pdf",
      version: 1,
      docType: "Pleadings",
      fileSize: 450200,
    });

    expect(doc).toBeDefined();
    expect(doc.version).toBe(1);
    expect(doc.docType).toBe("Pleadings");

    const ws = await MatterService.getMatterWorkspace(testUserId, createdMatterId);
    expect(ws!.documents.length).toBe(1);
    expect(ws!.documents[0].fileName).toBe("Statement_of_Claim_v1.pdf");
    expect(ws!.activities.some((a) => a.activityType === "document_uploaded")).toBe(true);
  });

  it("filters matters by stage, priority, status, and search query", async () => {
    const results = await MatterService.listMatters(testUserId, {
      stage: "Evidence",
      priority: "Urgent",
      query: "InfraCorp",
    });

    expect(results.length).toBe(1);
    expect(results[0].id).toBe(createdMatterId);

    const noResults = await MatterService.listMatters(testUserId, {
      stage: "Appeal",
    });
    expect(noResults.length).toBe(0);
  });

  it("archives and restores matter properly", async () => {
    const archived = await MatterService.setArchiveStatus(testUserId, createdMatterId, true);
    expect(archived).toBe(true);

    let ws = await MatterService.getMatterWorkspace(testUserId, createdMatterId);
    expect(ws!.matter.status).toBe("archived");

    const restored = await MatterService.setArchiveStatus(testUserId, createdMatterId, false);
    expect(restored).toBe(true);

    ws = await MatterService.getMatterWorkspace(testUserId, createdMatterId);
    expect(ws!.matter.status).toBe("active");
  });

  it("saves AI-generated reports to the matter workspace", async () => {
    const report = await MatterService.saveMatterReport(testUserId, {
      matterId: createdMatterId,
      reportType: "contract_risk",
      title: "EPC Contract Clause Risk Audit",
      summary: "Found 2 critical risks in liquidated damages clause and non-compete covenants.",
      reportData: { overallScore: 78, criticalCount: 2 },
    });

    expect(report).toBeDefined();
    expect(report.reportType).toBe("contract_risk");

    const ws = await MatterService.getMatterWorkspace(testUserId, createdMatterId);
    expect(ws!.reports.length).toBe(1);
    expect(ws!.reports[0].title).toBe("EPC Contract Clause Risk Audit");
    expect(ws!.activities.some((a) => a.activityType === "contract_analyzed")).toBe(true);
  });
});

describe("FEATURE 2: Advanced Contract Risk Analyzer", () => {
  const sampleContract = `
    1. Scope of Services. The Contractor shall provide software development services as specified.
    2. Non-Compete and Restraint of Trade. Contractor agrees that during the term and for three (3) years after termination, Contractor shall not directly or indirectly engage with, consult for, or provide similar services to any competitor of the Client across the territory of India.
    3. Liquidated Damages & Unreasonable Penalties. In the event of any minor delay or breach by Contractor, Contractor shall pay Client a fixed sum of INR 50,00,000 as liquidated damages and forfeit all pending fees, irrespective of whether Client sustained any actual loss.
    4. Unilateral Termination. Client may terminate this Agreement immediately at any time without cause and without compensation. Contractor shall have no right to terminate.
    5. Bar on Legal Proceedings. Any dispute shall be decided exclusively by Client's Chief Executive, whose decision shall be final and binding. Neither party shall be entitled to approach any civil court or arbitral forum.
    6. Payment Terms. Invoices shall be paid within one hundred and eighty (180) days from receipt.
  `;

  it("extracts clauses and categorizes risks by severity (Critical, High, Medium, Low)", async () => {
    const report = analyzeContract({
      contractText: sampleContract,
      contractType: "Commercial / Vendor",
    });

    expect(report).toBeDefined();
    expect(report.overallRiskScore).toBeGreaterThan(60);
    expect(report.identifiedRisks.length).toBeGreaterThanOrEqual(4);

    const severities = report.identifiedRisks.map((r) => r.severity);
    expect(severities).toContain("Critical");
    expect(severities).toContain("High");
  });

  it("identifies Section 27 Indian Contract Act violation (Restraint of Trade)", async () => {
    const report = analyzeContract({
      contractText: sampleContract,
      contractType: "Commercial / Vendor",
    });

    const nonCompeteRisk = report.identifiedRisks.find(
      (r) =>
        r.clauseTitle.toLowerCase().includes("non-compete") ||
        r.indianLawGrounding?.section.includes("Section 27"),
    );

    expect(nonCompeteRisk).toBeDefined();
    expect(nonCompeteRisk!.severity).toBe("Critical");
    expect(nonCompeteRisk!.indianLawGrounding?.section).toContain("Section 27");
    expect(nonCompeteRisk!.suggestedWording).toBeDefined();
    expect(nonCompeteRisk!.suggestedWording.length).toBeGreaterThan(20);
  });

  it("identifies Section 74 Indian Contract Act issues (Penalties vs Reasonable Compensation)", async () => {
    const report = analyzeContract({
      contractText: sampleContract,
      contractType: "Commercial / Vendor",
    });

    const damagesRisk = report.identifiedRisks.find((r) =>
      r.clauseTitle.toLowerCase().includes("damages"),
    );

    expect(damagesRisk).toBeDefined();
    expect(damagesRisk!.indianLawGrounding?.section).toContain("Section 74");
  });

  it("identifies Section 28 Indian Contract Act (Bar on Legal Proceedings)", async () => {
    const report = analyzeContract({
      contractText: sampleContract,
      contractType: "Commercial / Vendor",
    });

    const disputeRisk = report.identifiedRisks.find((r) =>
      r.clauseTitle.toLowerCase().includes("legal proceedings") ||
      r.clauseTitle.toLowerCase().includes("bar"),
    );

    expect(disputeRisk).toBeDefined();
    expect(disputeRisk!.severity).toBe("Critical");
    expect(disputeRisk!.indianLawGrounding?.section).toContain("Section 28");
  });

  it("identifies MSMED Act 45-day statutory payment violation", async () => {
    const report = analyzeContract({
      contractText: sampleContract,
      contractType: "Commercial / Vendor",
    });

    const paymentRisk = report.identifiedRisks.find((r) =>
      r.clauseTitle.toLowerCase().includes("payment"),
    );

    expect(paymentRisk).toBeDefined();
    expect(paymentRisk!.indianLawGrounding?.statute).toContain("MSME");
  });

  it("detects missing essential clauses (Force Majeure, Confidentiality, Dispute Resolution)", async () => {
    const report = analyzeContract({
      contractText: "Party A agrees to sell 100 bags of cement to Party B for Rs 50,000.",
      contractType: "Commercial / Vendor",
    });

    expect(report.missingClauses.length).toBeGreaterThan(0);
    const clauseNames = report.missingClauses.map((c) => c.clauseName);
    expect(clauseNames).toContain("Force Majeure");
    expect(clauseNames).toContain("Dispute Resolution & Governing Law");
  });

  it("includes mandatory legal disclaimer", async () => {
    const report = analyzeContract({
      contractText: sampleContract,
      contractType: "Commercial / Vendor",
    });

    expect(report.legalDisclaimer).toContain("does not constitute guaranteed legal advice");
  });
});

describe("FEATURE 3: Document Comparison Tool", () => {
  const versionA = `
    1. Scope of Work. Consultant will deliver UI/UX wireframes by 15 October 2026.
    2. Compensation & Payment Terms. Client shall pay INR 5,00,000 within thirty (30) days of invoice submission.
    3. Limitation of Liability. Consultant's total aggregate liability under this agreement shall be capped at the total fees paid.
    4. Governing Law. This agreement shall be governed by the laws of India with jurisdiction in Mumbai courts.
  `;

  const versionB = `
    1. Scope of Work. Consultant will deliver UI/UX wireframes and full production frontend code by 1 November 2026.
    2. Compensation & Payment Terms. Client shall pay INR 5,00,000 within ninety (90) days of invoice submission subject to client satisfaction.
    3. Limitation of Liability. Consultant shall have unlimited liability for any direct or indirect commercial damages suffered by Client without limitation.
    4. Liquidated Damages. For every day of delay, Consultant shall pay a penalty of INR 25,000.
    5. Governing Law. This agreement shall be governed by the laws of India with exclusive jurisdiction in Singapore.
  `;

  it("detects added, removed, and modified clauses between two documents", async () => {
    const comparison = compareDocuments({
      documentA: versionA,
      documentB: versionB,
      titleA: "Draft v1",
      titleB: "Revised v2",
    });

    expect(comparison).toBeDefined();
    expect(comparison.clauseDiffs.length).toBeGreaterThan(0);
    expect(comparison.modifiedCount).toBeGreaterThanOrEqual(1);
    expect(comparison.addedCount).toBeGreaterThanOrEqual(1);
  });

  it("categorizes legal modifications (payment terms, liability, deadlines, penalties)", async () => {
    const comparison = compareDocuments({
      documentA: versionA,
      documentB: versionB,
      titleA: "Draft v1",
      titleB: "Revised v2",
    });

    const categories = comparison.clauseDiffs.map((i) => i.category);
    expect(categories).toContain("payment_terms");
    expect(categories).toContain("liability_indemnity");
  });

  it("explains the practical legal significance of critical changes", async () => {
    const comparison = compareDocuments({
      documentA: versionA,
      documentB: versionB,
      titleA: "Draft v1",
      titleB: "Revised v2",
    });

    const liabilityItem = comparison.clauseDiffs.find(
      (i) => i.category === "liability_indemnity",
    );
    expect(liabilityItem).toBeDefined();
    expect(liabilityItem!.legalSignificance.length).toBeGreaterThan(15);
  });
});

describe("FEATURE 4: Courtroom Preparation Mode", () => {
  const caseFacts = `
    Petitioner 'Apex Logistics Pvt Ltd' entered into a 5-year commercial warehouse lease with Respondent 'Prime Realty' on 1 Jan 2023.
    Petitioner paid a security deposit of Rs 50 Lakhs. On 10 August 2026, Respondent wrongfully locked out Petitioner without statutory notice under Transfer of Property Act, claiming non-payment of disputed maintenance charges.
    Petitioner claims immediate mandatory injunction, restoration of possession under Section 6 Specific Relief Act, or specific performance under Section 10 Specific Relief Act.
    Respondent contends that maintenance default amounted to breach of essential condition forfeiting the lease.
    Electronic payment receipts and whatsapp correspondence confirm timely rental tenders.
  `;

  it("frames core legal issues with Indian statutory grounding", async () => {
    const prep = await prepareCourtroom({
      caseTitle: "Apex Logistics v. Prime Realty",
      caseFacts,
      claimType: "Commercial Lease & Specific Relief",
    });

    expect(prep).toBeDefined();
    expect(prep.legalIssues.length).toBeGreaterThan(0);
    expect(prep.legalIssues[0].governingLaw).toBeDefined();
  });

  it("generates bilateral arguments for Petitioner and Respondent with counterarguments", async () => {
    const prep = await prepareCourtroom({
      caseTitle: "Apex Logistics v. Prime Realty",
      caseFacts,
      claimType: "Commercial Lease & Specific Relief",
    });

    expect(prep.arguments.length).toBeGreaterThan(0);
    const firstArg = prep.arguments[0];

    expect(firstArg.petitionerArguments.length).toBeGreaterThan(0);
    expect(firstArg.respondentArguments.length).toBeGreaterThan(0);
    expect(firstArg.petitionerArguments[0].length).toBeGreaterThan(20);
    expect(firstArg.counterargumentsPetitioner).toBeDefined();
  });

  it("suggests verified Supreme Court precedents with Good-Law verification status", async () => {
    const prep = await prepareCourtroom({
      caseTitle: "Apex Logistics v. Prime Realty",
      caseFacts,
      claimType: "Commercial Lease & Specific Relief",
    });

    expect(prep.authoritativePrecedents.length).toBeGreaterThan(0);
    const precedent = prep.authoritativePrecedents[0];
    expect(precedent.caseTitle).toBeDefined();
    expect(precedent.citation).toBeDefined();
    expect(precedent.court).toBe("Supreme Court of India");
    expect(precedent.precedentStatus).toContain("Good Law");
  });

  it("prepares judicial Bench inquiry questions and tactical witness cross-examination", async () => {
    const prep = await prepareCourtroom({
      caseTitle: "Apex Logistics v. Prime Realty",
      caseFacts,
      claimType: "Commercial Lease & Specific Relief",
    });

    expect(prep.hearingQuestions.length).toBeGreaterThan(0);
    expect(prep.hearingQuestions[0].suggestedAnswerStrategy).toBeDefined();

    expect(prep.crossExamination.length).toBeGreaterThan(0);
    expect(prep.crossExamination[0].purpose).toBeDefined();
  });

  it("includes statutory evidence checklist with Bharatiya Sakshya Adhiniyam / Evidence Act", async () => {
    const prep = await prepareCourtroom({
      caseTitle: "Apex Logistics v. Prime Realty",
      caseFacts,
      claimType: "Commercial Lease & Specific Relief",
    });

    expect(prep.evidenceChecklist.length).toBeGreaterThan(0);
    const bsaItem = prep.evidenceChecklist.find((e) =>
      e.mandatoryPrerequisite.includes("Section 63 BSA"),
    );
    expect(bsaItem).toBeDefined();
  });
});

describe("FEATURE 5: Legal Amendment Tracker", () => {
  it("contains verified authoritative Indian legislative amendments", () => {
    expect(AUTHORITATIVE_AMENDMENTS.length).toBeGreaterThanOrEqual(7);

    for (const a of AUTHORITATIVE_AMENDMENTS) {
      expect(a.id).toBeDefined();
      expect(a.actName).toBeDefined();
      expect(a.gazetteNumber).toContain("Gazette of India");
      expect(a.enactmentDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(a.effectiveDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(a.authoritativeSourceUrl).toContain("indiacode.nic.in");
      expect(a.affectedSections.length).toBeGreaterThan(0);
    }
  });

  it("filters amendments by category, section, and keyword", () => {
    const criminalAmendments = AmendmentTrackerService.getAmendments({
      category: "Criminal",
    });
    expect(criminalAmendments.length).toBeGreaterThanOrEqual(2);
    expect(criminalAmendments.some((a: LegalAmendment) => a.id === "amend-bns-2023")).toBe(true);

    const sraAmendments = AmendmentTrackerService.getAmendments({
      act: "Specific Relief",
    });
    expect(sraAmendments.length).toBe(1);
    expect(sraAmendments[0].amendmentActName).toContain("2018");

    const niSection = AmendmentTrackerService.getAmendments({
      section: "Section 143A",
    });
    expect(niSection.length).toBe(1);
    expect(niSection[0].id).toBe("amend-ni-2018");
  });

  it("tracks original vs amended provisions with historical eras", () => {
    const bns = AmendmentTrackerService.getAmendmentById("amend-bns-2023");
    expect(bns).toBeDefined();
    expect(bns!.historicalVersions).toBeDefined();
    expect(bns!.historicalVersions!.length).toBe(2);

    expect(bns!.historicalVersions![0].versionTitle).toBe("Indian Penal Code, 1860");
    expect(bns!.historicalVersions![1].versionTitle).toBe("Bharatiya Nyaya Sanhita, 2023");
  });
});
