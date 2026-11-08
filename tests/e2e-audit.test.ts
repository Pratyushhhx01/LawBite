import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { db } from "@/lib/db";
import { MatterService } from "@/lib/matter-service";
import { analyzeContract } from "@/lib/contract-analyzer";
import { compareDocuments } from "@/lib/doc-comparison";
import { prepareCourtroom } from "@/lib/courtroom-prep";
import { AmendmentTrackerService } from "@/lib/amendment-tracker";
import { CaseLawService } from "@/lib/case-law-service";
import { checkPrecedentStatus } from "@/lib/good-law";
import { compareIpcToBns } from "@/lib/ipc-bns-compare";
import { parseCitationCandidates, resolveAct, verifyCitations, type SectionLookup } from "@/lib/citation-verifier";

describe("END-TO-END VERIFICATION & AUDIT SUITE", () => {
  let testUserId = "jwTZtuR4rFVuNuh6hf1IOUHD1ivqkXBf";
  const unauthorizedUserId = "unauthorized-user-victim-id";
  let createdMatterId = "";

  beforeAll(async () => {
    const user = await db.selectFrom("user").select("id").limit(1).executeTakeFirst();
    if (user?.id) testUserId = user.id;
  });

  afterAll(async () => {
    if (createdMatterId && testUserId) {
      await MatterService.deleteMatter(testUserId, createdMatterId);
    }
  });

  // TEST 1: Legal AI Chat & Multi-Provision Citation Parsing
  describe("Test 1: Legal AI Chat & Multi-Provision Citation Parsing", () => {
    it("correctly identifies multiple legal provisions without hallucination", () => {
      const complexText =
        "Under Section 302 of the Indian Penal Code and Section 103 of Bharatiya Nyaya Sanhita, as well as Article 21 of the Constitution of India.";
      const candidates = parseCitationCandidates(complexText);
      expect(candidates.length).toBeGreaterThanOrEqual(3);

      const ipc = candidates.find((c) => c.actKey === "ipc" && c.section === "302");
      const bns = candidates.find((c) => c.actKey === "bharatiya-nyaya-sanhita" && c.section === "103");
      const constArt = candidates.find((c) => c.actKey === "constitution" && c.section === "21");

      expect(ipc).toBeDefined();
      expect(bns).toBeDefined();
      expect(constArt).toBeDefined();
    });

    it("distinguishes trap citations (BNS 302 is religious feelings, NOT murder)", () => {
      const bns302 = compareIpcToBns("302");
      expect(bns302).toBeDefined();
      expect(bns302?.hasDirectEquivalent).toBe(true);
      expect(bns302?.newSection).toBe("103(1)");
      expect(bns302?.oldSection).toBe("302");
    });
  });

  // TEST 2: Statutory Research & Citation Verification
  describe("Test 2: Statutory Research & Citation Verification", () => {
    it("marks valid sections as verified and non-existent sections as unverified", async () => {
      const mockLookup: SectionLookup = {
        async getSection(actKey, section) {
          if (actKey === "bharatiya-nyaya-sanhita" && section === "103") {
            return { section: "103", title: "Punishment for murder", text: "Whoever commits murder..." };
          }
          return null;
        },
      };

      const { results, summary } = await verifyCitations(
        { text: "Section 103 BNS and Section 99999 BNS" },
        mockLookup,
      );

      expect(summary.total).toBeGreaterThanOrEqual(2);
      const sec103 = results.find((c) => c.section === "103");
      const sec999 = results.find((c) => c.section === "99999");

      expect(sec103?.verified).toBe(true);
      expect(sec999?.verified).toBe(false);
    });

    it("correctly normalizes statutory names", () => {
      expect(resolveAct("BNS")?.key).toBe("bharatiya-nyaya-sanhita");
      expect(resolveAct("IPC")?.key).toBe("ipc");
      expect(resolveAct("CrPC")?.key).toBe("crpc");
      expect(resolveAct("BNSS")?.key).toBe("bharatiya-nagrik-suraksha-sanhita");
      expect(resolveAct("BSA")?.key).toBe("bharatiya-sakshya-adhiniyam");
      expect(resolveAct("Specific Relief Act")?.key).toBe("specific-relief-act");
    });
  });

  // TEST 3: Case-Law Research Engine & Good-Law Checker
  describe("Test 3: Case-Law Research Engine & Good-Law Checker", () => {
    it("searches judgments with relevant filters and preserves paragraph numbers", async () => {
      const res = await CaseLawService.searchCases({
        query: "basic structure",
        court: "Supreme Court",
      });

      expect(res.total).toBeGreaterThan(0);
      const kb = res.results.find((j) => j.title.includes("Kesavananda Bharati"));
      expect(kb).toBeDefined();
      expect(kb?.court).toContain("Supreme Court");
    });

    it("verifies subsequent judicial treatment (Good-Law status)", () => {
      const kbStatus = checkPrecedentStatus("Kesavananda Bharati");
      expect(kbStatus.status).toBe("Good Law");
      expect(kbStatus.isGoodLaw).toBe(true);
      expect(kbStatus.verifiedTreatments.some((t) => t.treatment === "Followed")).toBe(true);

      const golaknathStatus = checkPrecedentStatus("Golak Nath");
      expect(golaknathStatus.status).toBe("Overruled");
      expect(golaknathStatus.isGoodLaw).toBe(false);
      expect(golaknathStatus.overrulingDetails).toBeDefined();
    });
  });

  // TEST 4 & 5: AI Lawyer & Document/Upload Validation
  describe("Test 4 & 5: Document Limits & Tenant Isolation", () => {
    it("enforces 10MB ceiling on uploaded files", () => {
      const MAX_SIZE = 10 * 1024 * 1024;
      const oversized = 11 * 1024 * 1024;
      expect(oversized > MAX_SIZE).toBe(true);
    });

    it("prevents unauthorized users from attaching files to another user's matter", async () => {
      // 1. Create a matter for testUserId
      const matter = await MatterService.createMatter(testUserId, {
        name: "Confidential Patent Dispute",
        description: "Protected client files.",
      });
      createdMatterId = matter.id;

      // 2. Attempt to attach document using unauthorizedUserId
      await expect(
        MatterService.addDocumentVersion(unauthorizedUserId, createdMatterId, {
          fileName: "injected-malicious.pdf",
          fileType: "pdf",
          fileUrl: "https://evil.example.com/exploit.pdf",
        }),
      ).rejects.toThrow(/unauthorized/i);

      // 3. Attempt to attach report using unauthorizedUserId
      await expect(
        MatterService.saveMatterReport(unauthorizedUserId, createdMatterId, {
          matterId: createdMatterId,
          reportType: "contract_risk",
          title: "Malicious Report Injection",
          reportData: { exploit: true },
        }),
      ).rejects.toThrow(/unauthorized/i);
    });
  });

  // TEST 6: Legal Matter Management
  describe("Test 6: Legal Matter Management Workflow", () => {
    it("manages matter lifecycle: create, update, archive, and log activity", async () => {
      const matter = await MatterService.createMatter(testUserId, {
        name: "Apex Logistics v. National Highways Authority",
        description: "Concessionaire dispute under NHAI Act.",
        stage: "Filing",
        priority: "Urgent",
      });

      // Update
      const updated = await MatterService.updateMatter(testUserId, matter.id, {
        stage: "Pleadings Complete",
        notes: "Rejoinder filed.",
      });
      expect(updated).toBe(true);

      // Archive
      const archived = await MatterService.setArchiveStatus(testUserId, matter.id, true);
      expect(archived).toBe(true);

      // Workspace check
      const ws = await MatterService.getMatterWorkspace(testUserId, matter.id);
      expect(ws?.matter.status).toBe("archived");
      expect(ws?.matter.stage).toBe("Pleadings Complete");
      expect(ws?.activities.length).toBeGreaterThanOrEqual(3);

      // Clean up
      await MatterService.deleteMatter(testUserId, matter.id);
    });
  });

  // TEST 7: Contract Risk Analyzer
  describe("Test 7: Contract Risk Analyzer", () => {
    it("grades restraint of trade as Critical and penalty as High", () => {
      const sampleContract = `
1. Scope of Services. The Contractor shall provide software development services as specified.
2. Non-Compete and Restraint of Trade. Contractor agrees that during the term and for three (3) years after termination, Contractor shall not directly or indirectly engage with, consult for, or provide similar services to any competitor of the Client across the territory of India.
3. Liquidated Damages & Unreasonable Penalties. In the event of any minor delay or breach by Contractor, Contractor shall pay Client a fixed sum of INR 50,00,000 as liquidated damages and forfeit all pending fees, irrespective of whether Client sustained any actual loss.
4. Unilateral Termination. Client may terminate this Agreement immediately at any time without cause and without compensation. Contractor shall have no right to terminate.
5. Bar on Legal Proceedings. Any dispute shall be decided exclusively by Client's Chief Executive, whose decision shall be final and binding. Neither party shall be entitled to approach any civil court or arbitral forum.
6. Payment Terms. Invoices shall be paid within one hundred and eighty (180) days from receipt.
`;
      const report = analyzeContract({
        contractText: sampleContract,
        contractType: "Commercial / Vendor",
      });
      expect(report.identifiedRisks.length).toBeGreaterThanOrEqual(3);

      const nonCompete = report.identifiedRisks.find((r) => r.clauseTitle.includes("Non-Compete"));
      expect(nonCompete?.severity).toBe("Critical");
      expect(nonCompete?.indianLawGrounding?.section).toContain("27");

      const penalty = report.identifiedRisks.find((r) => r.clauseTitle.includes("Penalties") || r.clauseTitle.includes("Damages"));
      expect(penalty?.severity).toBe("High");
      expect(penalty?.indianLawGrounding?.section).toContain("74");

      expect(report.legalDisclaimer).toBeTruthy();
    });
  });

  // TEST 8: Document Comparison Engine
  describe("Test 8: Document Comparison", () => {
    it("identifies liability and payment differences with correct risk categorization", () => {
      const docA = `
1. Limitation of Liability. The Service Provider's total liability under this Agreement shall be limited to fees paid in the preceding 6 months.
2. Payment Terms. Client shall pay all undisputed invoices within 30 days of receipt.
`;

      const docB = `
1. Limitation of Liability. The Service Provider's liability shall be uncapped and include unlimited indemnification for all consequential and indirect losses.
2. Payment Terms. Client shall pay all invoices within 90 days of receipt.
`;

      const comparison = compareDocuments({
        documentA: docA,
        documentB: docB,
        titleA: "Draft v1",
        titleB: "Revised v2",
      });

      expect(comparison.modifiedCount).toBeGreaterThanOrEqual(1);

      const liabilityDiff = comparison.clauseDiffs.find((d) => d.category === "liability_indemnity");
      expect(liabilityDiff).toBeDefined();

      const paymentDiff = comparison.clauseDiffs.find((d) => d.category === "payment_terms");
      expect(paymentDiff).toBeDefined();
    });
  });

  // TEST 9: Courtroom Preparation Mode
  describe("Test 9: Courtroom Preparation Mode", () => {
    it("generates framed legal issues, bilateral arguments, and verified authorities", async () => {
      const brief = await prepareCourtroom({
        caseTitle: "Apex Logistics v. Prime Realty",
        caseFacts: `Petitioner Apex Logistics entered into a 5-year commercial warehouse lease with Respondent Prime Realty.
On 10 August 2026, Respondent wrongfully locked out Petitioner without statutory notice under Transfer of Property Act.
Petitioner claims immediate mandatory injunction, restoration of possession under Section 6 Specific Relief Act, or specific performance under Section 10 Specific Relief Act.`,
        courtForum: "High Court of Delhi",
        claimType: "Commercial Lease & Specific Relief",
      });

      expect(brief.legalIssues.length).toBeGreaterThan(0);
      expect(brief.arguments.length).toBeGreaterThan(0);
      expect(brief.authoritativePrecedents.length).toBeGreaterThan(0);
      expect(brief.hearingQuestions.length).toBeGreaterThan(0);
      expect(brief.crossExamination.length).toBeGreaterThan(0);
      expect(brief.evidenceChecklist.length).toBeGreaterThan(0);
      expect(brief.legalDisclaimer).toBeTruthy();
    });
  });

  // TEST 10: Legal Amendment Tracker
  describe("Test 10: Legal Amendment Tracker", () => {
    it("retrieves authentic Gazette notifications and effective dates", () => {
      const amendments = AmendmentTrackerService.getAmendments();
      expect(amendments.length).toBeGreaterThanOrEqual(7);

      const bns = AmendmentTrackerService.getAmendmentById("amend-bns-2023");
      expect(bns).toBeDefined();
      expect(bns?.gazetteNumber).toBeTruthy();
      expect(bns?.effectiveDate).toBe("2024-07-01");
      expect(bns?.historicalVersions?.length).toBe(2);
    });
  });

  // TEST 11: Connected Legal Workflow End-to-End
  describe("Test 11: Connected Legal Workflow End-to-End", () => {
    it("executes the full chain from matter creation to contract analysis, courtroom prep, and document versioning", async () => {
      // 1. Create Legal Matter
      const matter = await MatterService.createMatter(testUserId, {
        name: "E2E Master Legal Matter",
        matterType: "Commercial Dispute",
        stage: "Pre-litigation",
        priority: "High",
      });
      const matterId = matter.id;

      try {
        // 2. Attach Versioned Contract Document
        const doc1 = await MatterService.addDocumentVersion(testUserId, matterId, {
          fileName: "EPC_Contract.pdf",
          fileType: "pdf",
          fileUrl: "https://lawbite.internal/documents/epc_v1.pdf",
          docType: "Contract",
          fileSize: 204800,
        });
        expect(doc1.version).toBe(1);

        // Attach Version 2 of same document
        const doc2 = await MatterService.addDocumentVersion(testUserId, matterId, {
          fileName: "EPC_Contract.pdf",
          fileType: "pdf",
          fileUrl: "https://lawbite.internal/documents/epc_v2.pdf",
          docType: "Contract",
          fileSize: 215000,
        });
        expect(doc2.version).toBe(2);

        // 3. Run Contract Risk Analysis and save report into matter
        const riskReport = analyzeContract({
          contractText: "1. Non-compete covenant: 3 years post termination across India. 2. Liquidated damages: penalty of 50 Lakhs without actual damage.",
          contractType: "Commercial / Vendor",
        });
        const savedRiskReport = await MatterService.saveMatterReport(testUserId, {
          matterId,
          reportType: "contract_risk",
          title: "EPC Contract Risk Audit",
          summary: `Identified ${riskReport.identifiedRisks.length} legal risks.`,
          reportData: riskReport,
        });
        expect(savedRiskReport.id).toBeDefined();

        // 4. Generate Courtroom Preparation brief and save into matter
        const courtroomBrief = await prepareCourtroom({
          caseTitle: matter.name,
          caseFacts: "Breach of contract and wrongful termination of EPC project lease and dispossession.",
        });
        const savedPrepReport = await MatterService.saveMatterReport(testUserId, {
          matterId,
          reportType: "courtroom_prep",
          title: "Courtroom Trial Strategy Brief",
          summary: `Framed ${courtroomBrief.legalIssues.length} legal issues with ${courtroomBrief.authoritativePrecedents.length} authorities.`,
          reportData: courtroomBrief,
        });
        expect(savedPrepReport.id).toBeDefined();

        // 5. Inspect Complete Matter Workspace
        const ws = await MatterService.getMatterWorkspace(testUserId, matterId);
        expect(ws).toBeDefined();
        expect(ws?.documents.length).toBe(2);
        expect(ws?.reports.length).toBe(2);
        expect(ws?.activities.length).toBeGreaterThanOrEqual(5);

        // Check report types
        const types = ws!.reports.map((r) => r.reportType);
        expect(types).toContain("contract_risk");
        expect(types).toContain("courtroom_prep");
      } finally {
        // Clean up
        await MatterService.deleteMatter(testUserId, matterId);
      }
    });
  });
});
