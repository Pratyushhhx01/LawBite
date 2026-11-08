import { NextRequest, NextResponse } from "next/server";
import { searchAmendments, type AmendmentCategory } from "@/lib/amendment-tracker";

/**
 * Indian Legal Amendment Tracker API
 *
 * GET /api/amendments?act=...&section=...&category=...&query=...&yearFrom=...&yearTo=...
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const filter = {
      act: searchParams.get("act") || undefined,
      section: searchParams.get("section") || undefined,
      category: (searchParams.get("category") as AmendmentCategory | "all") || undefined,
      query: searchParams.get("query") || searchParams.get("q") || undefined,
      yearFrom: searchParams.get("yearFrom") ? parseInt(searchParams.get("yearFrom")!, 10) : undefined,
      yearTo: searchParams.get("yearTo") ? parseInt(searchParams.get("yearTo")!, 10) : undefined,
    };

    const response = searchAmendments(filter);
    return NextResponse.json(response);
  } catch (error) {
    console.error("[API] /api/amendments error:", error);
    return NextResponse.json(
      {
        error: "Failed to search legal amendments",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
