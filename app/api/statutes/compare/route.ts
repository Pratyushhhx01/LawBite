import { NextRequest, NextResponse } from "next/server";
import { compareIpcToBns, COMMENCEMENT_DETAILS } from "@/lib/ipc-bns-compare";

/**
 * IPC to BNS Comparison API Route
 *
 * GET /api/statutes/compare?section=302
 * GET /api/statutes/compare?term=sedition
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const term = searchParams.get("section") || searchParams.get("term") || searchParams.get("q");

    if (!term) {
      return NextResponse.json({
        commencement: COMMENCEMENT_DETAILS,
        message: "Provide a section number (e.g. ?section=302 or ?section=124a) to see granular comparison.",
      });
    }

    const comparison = compareIpcToBns(term);
    if (!comparison) {
      return NextResponse.json(
        {
          error: "No statutory comparison found for term",
          term,
          commencement: COMMENCEMENT_DETAILS,
        },
        { status: 404 },
      );
    }

    return NextResponse.json({
      comparison,
      commencement: COMMENCEMENT_DETAILS,
    });
  } catch (error) {
    console.error("[API] /api/statutes/compare error:", error);
    return NextResponse.json(
      { error: "Failed to compare statutes", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    );
  }
}
