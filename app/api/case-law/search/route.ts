import { NextRequest, NextResponse } from "next/server";
import { CaseLawService } from "@/lib/case-law-service";
import type { CaseSearchFilter, PrecedentStatusType } from "@/lib/case-law-types";

/**
 * Advanced Case-Law Search API Route
 *
 * GET /api/case-law/search?query=...&court=...&judge=...&yearFrom=...&yearTo=...&caseType=...&act=...&section=...&status=...
 * POST /api/case-law/search { query, court, judge, ... }
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const filter: CaseSearchFilter = {
      query: searchParams.get("query") || searchParams.get("q") || undefined,
      court: searchParams.get("court") || undefined,
      judge: searchParams.get("judge") || searchParams.get("bench") || undefined,
      caseType: searchParams.get("caseType") || undefined,
      act: searchParams.get("act") || undefined,
      section: searchParams.get("section") || undefined,
      precedentStatus: (searchParams.get("status") as PrecedentStatusType) || undefined,
      limit: searchParams.get("limit") ? parseInt(searchParams.get("limit")!, 10) : 10,
      offset: searchParams.get("offset") ? parseInt(searchParams.get("offset")!, 10) : 0,
    };

    if (searchParams.get("yearFrom")) {
      filter.yearFrom = parseInt(searchParams.get("yearFrom")!, 10);
    }
    if (searchParams.get("yearTo")) {
      filter.yearTo = parseInt(searchParams.get("yearTo")!, 10);
    }

    const response = await CaseLawService.searchCases(filter);
    return NextResponse.json(response);
  } catch (error) {
    console.error("[API] /api/case-law/search error:", error);
    return NextResponse.json(
      { error: "Failed to search case law", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const filter: CaseSearchFilter = {
      query: body.query || body.q,
      court: body.court,
      judge: body.judge || body.bench,
      yearFrom: body.yearFrom ? Number(body.yearFrom) : undefined,
      yearTo: body.yearTo ? Number(body.yearTo) : undefined,
      caseType: body.caseType,
      act: body.act,
      section: body.section,
      precedentStatus: body.precedentStatus || body.status,
      limit: body.limit ? Number(body.limit) : 10,
      offset: body.offset ? Number(body.offset) : 0,
    };

    const response = await CaseLawService.searchCases(filter);
    return NextResponse.json(response);
  } catch (error) {
    console.error("[API] POST /api/case-law/search error:", error);
    return NextResponse.json(
      { error: "Failed to search case law", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    );
  }
}
