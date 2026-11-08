import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { analyzeContract } from "@/lib/contract-analyzer";
import { MatterService } from "@/lib/matter-service";

async function getSessionUser(request: NextRequest) {
  const session = await auth.api.getSession({ headers: request.headers });
  return session?.user ?? null;
}

export async function POST(request: NextRequest) {
  try {
    const user = await getSessionUser(request);
    const body = await request.json().catch(() => null);

    const contractText = body?.text || body?.contractText || body?.content;
    if (!contractText || typeof contractText !== "string" || !contractText.trim()) {
      return NextResponse.json(
        { error: "Contract text is required for analysis" },
        { status: 400 },
      );
    }

    const report = analyzeContract(contractText, {
      contractTitle: body?.contractTitle || body?.title,
      contractType: body?.contractType,
    });

    // If user is authenticated and matterId is provided, automatically link report to matter
    let savedReport = null;
    if (user && body?.matterId) {
      try {
        savedReport = await MatterService.saveMatterReport(
          user.id,
          body.matterId,
          "contract_risk",
          `Contract Risk Analysis: ${report.contractTitle}`,
          report.executiveSummary,
          report,
        );
      } catch (saveErr) {
        console.error("[API] Failed to auto-save report to matter:", saveErr);
      }
    }

    return NextResponse.json({
      report,
      savedToMatter: savedReport ? { id: savedReport.id, matterId: body.matterId } : null,
    });
  } catch (error) {
    console.error("[API] /api/contract/analyze error:", error);
    return NextResponse.json(
      {
        error: "Failed to analyze contract",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
