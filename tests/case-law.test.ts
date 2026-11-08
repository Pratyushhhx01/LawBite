import { describe, expect, it } from "vitest";
import { CASE_LAW_DATABASE } from "@/lib/case-law-data";
import { CaseLawService } from "@/lib/case-law-service";
import { checkPrecedentStatus } from "@/lib/good-law";
import {
  compareIpcToBns,
  COMMENCEMENT_DETAILS,
} from "@/lib/ipc-bns-compare";
import {
  searchCasesTool,
  verifyGoodLawTool,
  compareIpcBnsTool,
} from "@/lib/legal-tools";
import { GET as searchCasesGet, POST as searchCasesPost } from "@/app/api/case-law/search/route";
import { GET as getCaseById } from "@/app/api/case-law/[id]/route";
import { GET as getGoodLawStatus, POST as postGoodLawStatus } from "@/app/api/case-law/good-law/route";
import { GET as compareStatutesGet } from "@/app/api/statutes/compare/route";
import { NextRequest } from "next/server";

describe("FEATURE 1: Case-Law Database & Source Attribution", () => {
  it("contains authoritative Supreme Court and High Court judgments", () => {
    expect(CASE_LAW_DATABASE.length).toBeGreaterThanOrEqual(15);
    const courts = new Set(CASE_LAW_DATABASE.map((j) => j.court));
    expect(courts.has("Supreme Court of India")).toBe(true);
    expect(courts.has("High Court of Delhi")).toBe(true);
  });

  it("ensures every judgment contains authentic metadata without fabrications", () => {
    for (const j of CASE_LAW_DATABASE) {
      expect(j.id).toBeTruthy();
      expect(j.title).toBeTruthy();
      expect(j.court).toBeTruthy();
      expect(j.caseNumber).toBeTruthy();
      expect(j.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(j.year).toBeGreaterThanOrEqual(1950);
      expect(j.bench).toBeTruthy();
      expect(j.benchSize).toBeGreaterThan(0);
      expect(j.citations.length).toBeGreaterThan(0);
      expect(j.sourceUrl).toMatch(/^https?:\/\//);
      expect(j.summary).toBeTruthy();
    }
  });

  it("preserves authentic numbered paragraphs in every judgment", () => {
    for (const j of CASE_LAW_DATABASE) {
      expect(j.paragraphs.length).toBeGreaterThan(0);
      for (const p of j.paragraphs) {
        expect(p.paraNumber).toBeGreaterThan(0);
        expect(p.text.length).toBeGreaterThan(15);
      }
    }

    // Verify Kesavananda Bharati contains landmark paragraphs
    const kb = CASE_LAW_DATABASE.find((j) => j.id === "sc-1973-kesavananda-bharati");
    expect(kb).toBeDefined();
    const para316 = kb!.paragraphs.find((p) => p.paraNumber === 316);
    expect(para316?.text).toContain("Article 368 does not enable Parliament to alter the basic structure");

    const para1461 = kb!.paragraphs.find((p) => p.paraNumber === 1461);
    expect(para1461?.text).toContain("Golak Nath");
    expect(para1461?.text).toContain("overruled");
  });

  it("provides structured analysis fields for legal research", () => {
    for (const j of CASE_LAW_DATABASE) {
      const a = j.analysis;
      expect(a.facts).toBeTruthy();
      expect(a.legalIssues.length).toBeGreaterThan(0);
      expect(a.relevantProvisions.length).toBeGreaterThan(0);
      expect(a.courtReasoning).toBeTruthy();
      expect(a.finalDecision).toBeTruthy();
      expect(a.importantParagraphs.length).toBeGreaterThan(0);
    }
  });
});

describe("FEATURE 2: Advanced Search with Multi-Filter Queries", () => {
  it("searches judgments by keywords and ranks relevance", async () => {
    const res = await CaseLawService.searchCases({ query: "basic structure" });
    expect(res.total).toBeGreaterThan(0);
    expect(res.results[0].title).toContain("Kesavananda Bharati");
  });

  it("filters judgments by Court", async () => {
    const scRes = await CaseLawService.searchCases({ court: "Supreme Court" });
    expect(scRes.results.every((r) => r.court.includes("Supreme Court"))).toBe(true);

    const delRes = await CaseLawService.searchCases({ court: "High Court of Delhi" });
    expect(delRes.total).toBeGreaterThanOrEqual(1);
    expect(delRes.results[0].title).toContain("Naz Foundation");
  });

  it("filters judgments by Judge / Bench member", async () => {
    const res = await CaseLawService.searchCases({ judge: "Khanna" });
    expect(res.total).toBeGreaterThanOrEqual(2);
    const titles = res.results.map((r) => r.title);
    expect(titles.some((t) => t.includes("Kesavananda Bharati"))).toBe(true);
    expect(titles.some((t) => t.includes("Shivkant Shukla") || t.includes("ADM Jabalpur"))).toBe(true);
  });

  it("filters judgments by Year range", async () => {
    const res = await CaseLawService.searchCases({ yearFrom: 2017, yearTo: 2018 });
    expect(res.total).toBeGreaterThanOrEqual(2);
    expect(res.results.every((r) => r.year >= 2017 && r.year <= 2018)).toBe(true);
    const titles = res.results.map((r) => r.title);
    expect(titles.some((t) => t.includes("Puttaswamy"))).toBe(true);
    expect(titles.some((t) => t.includes("Navtej Singh Johar"))).toBe(true);
  });

  it("filters judgments by Case Type", async () => {
    const res = await CaseLawService.searchCases({ caseType: "Criminal Appeal" });
    expect(res.total).toBeGreaterThanOrEqual(2);
    expect(res.results.every((r) => r.caseType.includes("Criminal Appeal"))).toBe(true);
  });

  it("filters judgments by Act", async () => {
    const res = await CaseLawService.searchCases({ act: "Information Technology Act" });
    expect(res.total).toBeGreaterThanOrEqual(1);
    expect(res.results[0].title).toContain("Shreya Singhal");
  });

  it("filters judgments by Statutory Section", async () => {
    const res = await CaseLawService.searchCases({ section: "377" });
    expect(res.total).toBeGreaterThanOrEqual(3);
    const titles = res.results.map((r) => r.title);
    expect(titles.some((t) => t.includes("Navtej Singh Johar"))).toBe(true);
    expect(titles.some((t) => t.includes("Suresh Kumar Koushal"))).toBe(true);
    expect(titles.some((t) => t.includes("Naz Foundation"))).toBe(true);
  });

  it("filters judgments by Precedent Status", async () => {
    const overruled = await CaseLawService.searchCases({ precedentStatus: "Overruled" });
    expect(overruled.total).toBeGreaterThanOrEqual(3);
    expect(overruled.results.every((r) => r.precedentStatus === "Overruled")).toBe(true);
    const titles = overruled.results.map((r) => r.title);
    expect(titles.some((t) => t.includes("ADM Jabalpur") || t.includes("Shivkant Shukla"))).toBe(true);
    expect(titles.some((t) => t.includes("Suresh Kumar Koushal"))).toBe(true);
    expect(titles.some((t) => t.includes("Golak Nath"))).toBe(true);
  });

  it("handles pagination cleanly", async () => {
    const page1 = await CaseLawService.searchCases({ limit: 3, offset: 0 });
    expect(page1.results.length).toBe(3);
    expect(page1.page).toBe(1);

    const page2 = await CaseLawService.searchCases({ limit: 3, offset: 3 });
    expect(page2.results.length).toBe(3);
    expect(page2.page).toBe(2);
    expect(page1.results[0].id).not.toBe(page2.results[0].id);
  });
});

describe("FEATURE 3: Judgment Analysis & Key Paragraphs", () => {
  it("fetches single judgment with full analysis and numbered paragraphs", () => {
    const puttaswamy = CaseLawService.getJudgmentById("sc-2017-puttaswamy");
    expect(puttaswamy).toBeDefined();
    expect(puttaswamy?.title).toContain("Puttaswamy");
    expect(puttaswamy?.precedentStatus).toBe("Good Law");
    expect(puttaswamy?.analysis.legalIssues).toContain(
      "Whether privacy is a fundamental right guaranteed under Part III.",
    );
    expect(puttaswamy?.subsequentTreatments.length).toBeGreaterThan(0);
    const navtejCiting = puttaswamy?.subsequentTreatments.find((t) =>
      t.citingCaseTitle.includes("Navtej"),
    );
    expect(navtejCiting?.treatment).toBe("Followed");
  });
});

describe("FEATURE 4: Good-Law Checker & Deterministic Precedent Status", () => {
  it("correctly identifies OVERRULED cases with exact subsequent overruling citations", () => {
    // 1. ADM Jabalpur overruled by Puttaswamy
    const adm = checkPrecedentStatus("ADM Jabalpur");
    expect(adm.status).toBe("Overruled");
    expect(adm.isGoodLaw).toBe(false);
    expect(adm.confidence).toBe("Authoritative");
    expect(adm.overrulingDetails?.overruledByTitle).toContain("Puttaswamy");
    expect(adm.overrulingDetails?.paraRef).toBe("Para 119");

    // 2. Suresh Koushal overruled by Navtej Johar
    const koushal = checkPrecedentStatus("Suresh Kumar Koushal");
    expect(koushal.status).toBe("Overruled");
    expect(koushal.isGoodLaw).toBe(false);
    expect(koushal.overrulingDetails?.overruledByTitle).toContain("Navtej Singh Johar");
    expect(koushal.overrulingDetails?.paraRef).toContain("168");

    // 3. Golak Nath overruled by Kesavananda Bharati
    const golak = checkPrecedentStatus("Golak Nath");
    expect(golak.status).toBe("Overruled");
    expect(golak.isGoodLaw).toBe(false);
    expect(golak.overrulingDetails?.overruledByTitle).toContain("Kesavananda Bharati");
    expect(golak.overrulingDetails?.paraRef).toBe("Para 1461");

    // 4. A.K. Gopalan overruled by Maneka Gandhi
    const gopalan = checkPrecedentStatus("A.K. Gopalan");
    expect(gopalan.status).toBe("Overruled");
    expect(gopalan.isGoodLaw).toBe(false);
    expect(gopalan.overrulingDetails?.overruledByTitle).toContain("Maneka Gandhi");
  });

  it("correctly identifies binding GOOD LAW cases with affirmation history", () => {
    const kb = checkPrecedentStatus("Kesavananda Bharati");
    expect(kb.status).toBe("Good Law");
    expect(kb.isGoodLaw).toBe(true);
    expect(kb.confidence).toBe("Authoritative");
    expect(kb.verifiedTreatments.some((t) => t.treatment === "Followed")).toBe(true);

    const arnesh = checkPrecedentStatus("Arnesh Kumar v. State of Bihar");
    expect(arnesh.status).toBe("Good Law");
    expect(arnesh.isGoodLaw).toBe(true);

    const vishaka = checkPrecedentStatus("Vishaka");
    expect(vishaka.status).toBe("Good Law");
    expect(vishaka.isGoodLaw).toBe(true);

    const lalita = checkPrecedentStatus("Lalita Kumari");
    expect(lalita.status).toBe("Good Law");
    expect(lalita.isGoodLaw).toBe(true);
  });

  it("NEVER guesses precedent status for unknown cases; marks UNVERIFIED", () => {
    const unverified = checkPrecedentStatus("Random Unknown Citizen v. State of Narnia (2025)");
    expect(unverified.status).toBe("Unverified");
    expect(unverified.isGoodLaw).toBeNull();
    expect(unverified.confidence).toBe("Unverified");
    expect(unverified.warning).toContain("UNVERIFIED PRECEDENT");
    expect(unverified.warning).toContain("precedent status is not estimated using LLM generation");
  });
});

describe("FEATURE 5: Citations & Paragraph Attribution", () => {
  it("ensures every search result provides original source link and citations", async () => {
    const res = await CaseLawService.searchCases({ query: "privacy" });
    for (const r of res.results) {
      expect(r.sourceUrl).toMatch(/^https?:\/\//);
      expect(r.citations.length).toBeGreaterThan(0);
      expect(r.court).toBeTruthy();
      expect(r.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    }
  });
});

describe("FEATURE 6: IPC to BNS Statutory Transition Comparison", () => {
  it("provides reliable comparison for direct offences (Murder IPC 302 ↔ BNS 103(1))", () => {
    const comp = compareIpcToBns("302");
    expect(comp).not.toBeNull();
    expect(comp?.oldSection).toBe("302");
    expect(comp?.newSection).toBe("103(1)");
    expect(comp?.hasDirectEquivalent).toBe(true);
    expect(comp?.effectiveDate).toBe("2024-07-01");
    expect(comp?.wordingDifferences.length).toBeGreaterThan(0);
    expect(comp?.temporalRule).toContain("Article 20(1)");
  });

  it("provides reliable comparison for modified provisions (IPC 304A ↔ BNS 106)", () => {
    const comp = compareIpcToBns("304A");
    expect(comp).not.toBeNull();
    expect(comp?.newSection).toBe("106");
    expect(comp?.wordingDifferences.some((d) => d.includes("5 years"))).toBe(true);
    expect(comp?.wordingDifferences.some((d) => d.includes("hit-and-run"))).toBe(true);
  });

  it("properly handles repealed offences without direct equivalents (Sedition IPC 124A)", () => {
    const comp = compareIpcToBns("124a");
    expect(comp).not.toBeNull();
    expect(comp?.oldTitle).toBe("Sedition");
    expect(comp?.hasDirectEquivalent).toBe(false);
    expect(comp?.newSection).toBe("152");
    expect(comp?.newTitle).toContain("sovereignty");
    expect(comp?.wordingDifferences.some((d) => d.includes("Sedition") || d.includes("disaffection"))).toBe(true);
  });

  it("properly handles newly introduced offences in BNS (Snatching, Mob Lynching, Organized Crime)", () => {
    const snatching = compareIpcToBns("snatching");
    expect(snatching).not.toBeNull();
    expect(snatching?.newSection).toBe("304");
    expect(snatching?.hasDirectEquivalent).toBe(false);

    const mobLynching = compareIpcToBns("mob-lynching");
    expect(mobLynching).not.toBeNull();
    expect(mobLynching?.newSection).toBe("103(2)");
    expect(mobLynching?.hasDirectEquivalent).toBe(false);

    const organizedCrime = compareIpcToBns("organized-crime");
    expect(organizedCrime).not.toBeNull();
    expect(organizedCrime?.newSection).toBe("111");
    expect(organizedCrime?.hasDirectEquivalent).toBe(false);
  });

  it("accurately provides Gazette commencement information", () => {
    expect(COMMENCEMENT_DETAILS.effectiveDate).toBe("2024-07-01");
    expect(COMMENCEMENT_DETAILS.notification).toContain("S.O. 848(E)");
    expect(COMMENCEMENT_DETAILS.repealAndSavings).toContain("Section 358 BNS");
  });
});

describe("INTEGRATION: Legal Tools and API Endpoints", () => {
  it("searchCasesTool returns structured case law results", async () => {
    const toolRes = await searchCasesTool("privacy", 2);
    expect(toolRes.success).toBe(true);
    expect(toolRes.source).toBe("case_law_engine");
    expect(toolRes.data.length).toBeGreaterThan(0);
    expect(toolRes.data[0].title).toBeTruthy();
  });

  it("verifyGoodLawTool returns authoritative precedent check", () => {
    const toolRes = verifyGoodLawTool("ADM Jabalpur");
    expect(toolRes.success).toBe(true);
    expect(toolRes.data.status).toBe("Overruled");
    expect(toolRes.data.isGoodLaw).toBe(false);
  });

  it("compareIpcBnsTool returns transition comparison", () => {
    const toolRes = compareIpcBnsTool("420");
    expect(toolRes.success).toBe(true);
    expect(toolRes.data?.newSection).toBe("318(4)");
  });

  it("API /api/case-law/search handles GET and POST requests", async () => {
    // GET
    const getReq = new NextRequest("http://localhost:3000/api/case-law/search?query=privacy&limit=2");
    const getRes = await searchCasesGet(getReq);
    expect(getRes.status).toBe(200);
    const getJson = await getRes.json();
    expect(getJson.results.length).toBeGreaterThan(0);

    // POST
    const postReq = new NextRequest("http://localhost:3000/api/case-law/search", {
      method: "POST",
      body: JSON.stringify({ query: "habeas corpus", limit: 2 }),
      headers: { "Content-Type": "application/json" },
    });
    const postRes = await searchCasesPost(postReq);
    expect(postRes.status).toBe(200);
    const postJson = await postRes.json();
    expect(postJson.results.length).toBeGreaterThan(0);
  });

  it("API /api/case-law/[id] handles valid and invalid IDs", async () => {
    const req = new NextRequest("http://localhost:3000/api/case-law/sc-1973-kesavananda-bharati");
    const res = await getCaseById(req, { params: Promise.resolve({ id: "sc-1973-kesavananda-bharati" }) });
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.judgment.title).toContain("Kesavananda Bharati");
    expect(json.goodLawCheck.status).toBe("Good Law");

    const notFoundRes = await getCaseById(req, { params: Promise.resolve({ id: "non-existent-case-id" }) });
    expect(notFoundRes.status).toBe(404);
  });


  it("API POST /api/case-law/good-law returns verified precedent status via POST body", async () => {
    const req = new NextRequest("http://localhost:3000/api/case-law/good-law", {
      method: "POST",
      body: JSON.stringify({ citation: "(1976) 2 SCC 521" }),
      headers: { "Content-Type": "application/json" },
    });
    const res = await postGoodLawStatus(req);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.status).toBe("Overruled");
    expect(json.isGoodLaw).toBe(false);
  });

  it("API /api/case-law/good-law returns verified precedent status", async () => {
    const req = new NextRequest("http://localhost:3000/api/case-law/good-law?query=Suresh+Koushal");
    const res = await getGoodLawStatus(req);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.status).toBe("Overruled");
    expect(json.isGoodLaw).toBe(false);
  });

  it("API /api/statutes/compare returns statutory transition comparison", async () => {
    const req = new NextRequest("http://localhost:3000/api/statutes/compare?section=302");
    const res = await compareStatutesGet(req);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.comparison.newSection).toBe("103(1)");
    expect(json.commencement.effectiveDate).toBe("2024-07-01");
  });
});
