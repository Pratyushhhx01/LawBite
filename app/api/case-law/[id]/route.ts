import { NextRequest, NextResponse } from "next/server";
import { CaseLawService } from "@/lib/case-law-service";
import { checkPrecedentStatus } from "@/lib/good-law";

/**
 * Case-Law Details & Judgment Analysis API Route
 *
 * GET /api/case-law/[id]
 * Returns full judgment data, analysis, preserved numbered paragraphs,
 * and verified good-law precedent status.
 */
export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;
    if (!id) {
      return NextResponse.json({ error: "Judgment ID is required" }, { status: 400 });
    }

    const judgment = CaseLawService.getJudgmentById(id);
    if (!judgment) {
      return NextResponse.json({ error: "Judgment not found" }, { status: 404 });
    }

    // Include real-time good-law status check
    const goodLawCheck = checkPrecedentStatus(judgment.title);

    return NextResponse.json({
      judgment,
      goodLawCheck,
    });
  } catch (error) {
    console.error("[API] /api/case-law/[id] error:", error);
    return NextResponse.json(
      { error: "Failed to retrieve judgment", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    );
  }
}
