import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { compareLegalDocuments } from "@/lib/doc-comparison";
import { MatterService } from "@/lib/matter-service";

async function getSessionUser(request: NextRequest) {
  const session = await auth.api.getSession({ headers: request.headers });
  return session?.user ?? null;
}

export async function POST(request: NextRequest) {
  try {
    const user = await getSessionUser(request);
    const body = await request.json().catch(() => null);

    const versionAText = body?.versionAText || body?.textA || body?.docA;
    const versionBText = body?.versionBText || body?.textB || body?.docB;

    if (!versionAText || typeof versionAText !== "string" || !versionAText.trim()) {
      return NextResponse.json(
        { error: "Version A text is required for comparison" },
        { status: 400 },
      );
    }

    if (!versionBText || typeof versionBText !== "string" || !versionBText.trim()) {
      return NextResponse.json(
        { error: "Version B text is required for comparison" },
        { status: 400 },
      );
    }

    const report = compareLegalDocuments(versionAText, versionBText, {
      versionATitle: body?.versionATitle || "Original Version (A)",
      versionBTitle: body?.versionBTitle || "Revised Version (B)",
    });

    // If matterId is provided and user is authenticated, save to matter workspace
    let savedReport = null;
    if (user && body?.matterId) {
      try {
        savedReport = await MatterService.saveMatterReport(
          user.id,
          body.matterId,
          "document_comparison",
          `Document Comparison: ${report.versionATitle} vs ${report.versionBTitle}`,
          report.executiveSummary,
          report,
        );
      } catch (saveErr) {
        console.error("[API] Failed to auto-save comparison report to matter:", saveErr);
      }
    }

    return NextResponse.json({
      report,
      savedToMatter: savedReport ? { id: savedReport.id, matterId: body.matterId } : null,
    });
  } catch (error) {
    console.error("[API] /api/contract/compare error:", error);
    return NextResponse.json(
      {
        error: "Failed to compare documents",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
