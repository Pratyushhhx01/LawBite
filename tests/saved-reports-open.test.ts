import { describe, expect, it } from "vitest";
import { getSavedReportTarget } from "@/app/matters/_components/MattersApp";

describe("saved reports open routing", () => {
  it("routes contract_risk reports to the risk tab", () => {
    expect(
      getSavedReportTarget({
        reportType: "contract_risk",
        reportData: { overallRiskScore: 80 },
      }),
    ).toBe("contract_risk");
  });

  it("routes document_comparison reports to the compare tab", () => {
    expect(
      getSavedReportTarget({
        reportType: "document_comparison",
        reportData: { addedCount: 1 },
      }),
    ).toBe("doc_compare");
  });

  it("routes courtroom_prep reports to the prep tab", () => {
    expect(
      getSavedReportTarget({
        reportType: "courtroom_prep",
        reportData: { legalIssues: [] },
      }),
    ).toBe("courtroom_prep");
  });

  it("returns null when reportData is missing so the UI shows a notice", () => {
    expect(
      getSavedReportTarget({
        reportType: "contract_risk",
        reportData: null,
      }),
    ).toBeNull();
  });
});
