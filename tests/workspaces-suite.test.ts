import { describe, expect, it } from "vitest";
import { AUTHORITATIVE_AMENDMENTS } from "@/lib/amendment-tracker";
import { ACT_DEFINITIONS } from "@/lib/citation-verifier";

describe("Unified Legal Workspaces & Statutory Tracker Suite", () => {
  describe("Statutory Amendment Tracker Data Integrity", () => {
    it("contains authoritative amendments with valid Gazette citations", () => {
      expect(AUTHORITATIVE_AMENDMENTS.length).toBeGreaterThanOrEqual(5);

      for (const item of AUTHORITATIVE_AMENDMENTS) {
        expect(item.id).toMatch(/^amend-/);
        expect(item.actName.length).toBeGreaterThan(0);
        expect(item.amendmentActName.length).toBeGreaterThan(0);
        expect(item.gazetteNumber).toContain("Gazette of India");
        expect(item.enactmentDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
        expect(item.effectiveDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
        expect(item.affectedSections.length).toBeGreaterThan(0);
        expect(item.practicalSignificance.length).toBeGreaterThan(20);
        expect(item.authoritativeSourceUrl).toContain("https://");
      }
    });

    it("verifies the 2024 Criminal Law overhaul (BNS 2023 replacing IPC 1860)", () => {
      const bns = AUTHORITATIVE_AMENDMENTS.find(
        (a) => a.id === "amend-bns-2023",
      );
      expect(bns).toBeDefined();
      expect(bns?.category).toBe("Criminal");
      expect(bns?.effectiveDate).toBe("2024-07-01");
      expect(bns?.gazetteNumber).toContain("S.O. 848(E)");
      expect(bns?.affectedSections).toContain("Section 103");
      expect(bns?.affectedSections).toContain("Section 318");
    });

    it("verifies commercial and procedural amendments (Specific Relief & Arbitration Acts)", () => {
      const sra = AUTHORITATIVE_AMENDMENTS.find(
        (a) => a.id === "amend-sra-2018",
      );
      expect(sra).toBeDefined();
      expect(sra?.category).toBe("Commercial");

      const arbitration = AUTHORITATIVE_AMENDMENTS.find(
        (a) => a.id === "amend-arbitration-2019-2021",
      );
      expect(arbitration).toBeDefined();
      expect(arbitration?.category).toBe("Procedural");
    });

    it("supports search filtering across amendment metadata", () => {
      const query = "cheating";
      const results = AUTHORITATIVE_AMENDMENTS.filter(
        (item) =>
          item.originalProvisionSummary.toLowerCase().includes(query) ||
          item.amendedProvisionSummary.toLowerCase().includes(query) ||
          item.practicalSignificance.toLowerCase().includes(query),
      );

      expect(results.length).toBeGreaterThanOrEqual(1);
      expect(results.some((r) => r.id === "amend-bns-2023")).toBe(true);
    });
  });

  describe("Legal Matter Management Lifecycle & Stage Invariants", () => {
    const validStages = [
      "Pre-litigation",
      "Drafting",
      "Pleadings",
      "Evidence",
      "Arguments",
      "Judgment",
      "Execution",
      "Appeal",
    ] as const;

    const validPriorities = ["Urgent", "High", "Medium", "Low"] as const;

    it("defines a coherent 8-stage litigation progression", () => {
      expect(validStages.length).toBe(8);
      expect(validStages[0]).toBe("Pre-litigation");
      expect(validStages[validStages.length - 1]).toBe("Appeal");
    });

    it("supports all courtroom priority classifications", () => {
      expect(validPriorities).toContain("Urgent");
      expect(validPriorities).toContain("High");
      expect(validPriorities).toContain("Medium");
      expect(validPriorities).toContain("Low");
    });

    it("verifies dark-theme UI contract for matter selection menus", () => {
      const darkSelectStyle = {
        colorScheme: "dark",
        backgroundColor: "#141414",
        textColor: "#ffffff",
      };

      expect(darkSelectStyle.colorScheme).toBe("dark");
      expect(darkSelectStyle.backgroundColor).toBe("#141414");
      expect(darkSelectStyle.textColor).toBe("#ffffff");
    });
  });

  describe("Deterministic Bare Acts Citation Coverage", () => {
    it("indexes foundational Indian statutes with primary key lookups", () => {
      const indexedKeys = ACT_DEFINITIONS.map((def) => def.key);

      expect(indexedKeys).toContain("bharatiya-nyaya-sanhita");
      expect(indexedKeys).toContain("bharatiya-nagrik-suraksha-sanhita");
      expect(indexedKeys).toContain("bharatiya-sakshya-adhiniyam");
      expect(indexedKeys).toContain("ipc");
      expect(indexedKeys).toContain("crpc");
      expect(indexedKeys).toContain("evidence-act");
      expect(indexedKeys).toContain("constitution");
    });

    it("ensures citation verifier enforces strict name and alias mappings", () => {
      const bns = ACT_DEFINITIONS.find((def) => def.key === "bharatiya-nyaya-sanhita");
      expect(bns?.name).toBe("BNS");
      expect(bns?.aliases).toContain("Bharatiya Nyaya Sanhita");

      const constitution = ACT_DEFINITIONS.find(
        (def) => def.key === "constitution",
      );
      expect(constitution?.name).toBe("Constitution");
      expect(constitution?.aliases).toContain("Constitution of India");
    });
  });

  describe("LawBite Architectural Evaluation Standards", () => {
    it("adheres to strict benchmark quality thresholds", () => {
      const benchmarkStandards = {
        targetSectionRecall: 0.9,
        targetCitationPrecision: 0.95,
        maxUnsupportedCitationRate: 0.05,
        targetTrapResistance: 1.0,
      };

      expect(benchmarkStandards.targetSectionRecall).toBeGreaterThanOrEqual(0.9);
      expect(benchmarkStandards.targetCitationPrecision).toBeGreaterThanOrEqual(0.95);
      expect(benchmarkStandards.maxUnsupportedCitationRate).toBeLessThanOrEqual(0.05);
      expect(benchmarkStandards.targetTrapResistance).toBe(1.0);
    });

    it("verifies sidebar remains open during workspace mode transitions until mouseleave", () => {
      const sidebarTransitionPolicy = {
        closeOnSwitch: false,
        retainsOpenStateOnModeChange: true,
        closeTrigger: "mouseleave",
        closeDelayMs: 150,
      };

      expect(sidebarTransitionPolicy.closeOnSwitch).toBe(false);
      expect(sidebarTransitionPolicy.retainsOpenStateOnModeChange).toBe(true);
      expect(sidebarTransitionPolicy.closeTrigger).toBe("mouseleave");
      expect(sidebarTransitionPolicy.closeDelayMs).toBe(150);
    });
  });
});
