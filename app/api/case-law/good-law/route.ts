import { NextRequest, NextResponse } from "next/server";
import { checkPrecedentStatus } from "@/lib/good-law";

/**
 * Good-Law Precedent Status Checker API Route
 *
 * GET /api/case-law/good-law?query=...
 * POST /api/case-law/good-law { query: "..." }
 *
 * Identifies subsequent treatments: Followed, Distinguished, Overruled, Reversed, Affirmed, Referred to.
 * Enforces strict rule: Never uses LLM guesses. Requires verified subsequent citations.
 * Returns "Unverified" when authoritative citation evidence is not in ledger.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("query") || searchParams.get("citation") || searchParams.get("q");

    if (!query) {
      return NextResponse.json(
        { error: "Query or citation is required (e.g. ?query=ADM+Jabalpur)" },
        { status: 400 },
      );
    }

    const result = checkPrecedentStatus(query);
    return NextResponse.json(result);
  } catch (error) {
    console.error("[API] /api/case-law/good-law error:", error);
    return NextResponse.json(
      { error: "Failed to check precedent status", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const query = body.query || body.citation || body.caseTitle;

    if (!query) {
      return NextResponse.json(
        { error: "Query or citation is required in request body" },
        { status: 400 },
      );
    }

    const result = checkPrecedentStatus(query);
    return NextResponse.json(result);
  } catch (error) {
    console.error("[API] POST /api/case-law/good-law error:", error);
    return NextResponse.json(
      { error: "Failed to check precedent status", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    );
  }
}
