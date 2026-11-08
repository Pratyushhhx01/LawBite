import {
  lookupSectionExact,
  searchLegalChunksText,
  type LegalChunk,
} from "./legal-kb-db";
import { isTrustedLegalSource, TAVILY_EXCLUDED_DOMAINS } from "./legal-sources";
import { SECTION_MAPPINGS } from "./section-mapping";
import { tavily } from "@tavily/core";
import { CaseLawService } from "./case-law-service";
import { checkPrecedentStatus } from "./good-law";
import { compareIpcToBns, type StatutoryComparison } from "./ipc-bns-compare";
import type { CaseSearchResultItem, GoodLawCheckResult } from "./case-law-types";

const tvly = process.env.TAVILY_API_KEY
  ? tavily({ apiKey: process.env.TAVILY_API_KEY })
  : null;

export type ToolResult<T> = {
  success: boolean;
  data: T;
  source: "postgres_kb" | "tavily_web" | "section_mappings" | "case_law_engine";
  error?: string;
};

/**
 * 1. Search Legal Statutes Tool
 * Performs exact section lookup or full-text/vector search over Indian statutes.
 */
export async function searchStatutesTool(
  query: string,
  actId?: string,
  limit = 5,
): Promise<ToolResult<LegalChunk[]>> {
  if (!query || typeof query !== "string") {
    return { success: false, data: [], source: "postgres_kb", error: "Query is required" };
  }

  try {
    // If exact section pattern is provided (e.g. "Section 420" or just "420") and actId is known
    const secMatch = query.match(/(?:section\s+)?(\d+[a-z]?)/i);
    if (actId && secMatch) {
      const exact = await lookupSectionExact(actId, secMatch[1]);
      if (exact) {
        return { success: true, data: [exact], source: "postgres_kb" };
      }
    }

    // Otherwise perform full-text search across legal_chunks with pushdown act filter
    const results = await searchLegalChunksText(query, limit, actId);
    return {
      success: true,
      data: results,
      source: "postgres_kb",
    };
  } catch (error) {
    console.error("[LegalTools] searchStatutesTool error:", error);
    return {
      success: false,
      data: [],
      source: "postgres_kb",
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * 2. Search Landmark Cases Tool
 * Queries Supreme Court and High Court jurisprudence, constitutional holdings,
 * authoritative citations, and numbered paragraphs via CaseLawService.
 */
export async function searchCasesTool(
  query: string,
  limit = 5,
): Promise<ToolResult<CaseSearchResultItem[]>> {
  if (!query || typeof query !== "string") {
    return { success: false, data: [], source: "case_law_engine", error: "Query is required" };
  }

  try {
    const results = await CaseLawService.hybridSearch(query, limit);
    return { success: true, data: results, source: "case_law_engine" };
  } catch (error) {
    console.error("[LegalTools] searchCasesTool error:", error);
    return {
      success: false,
      data: [],
      source: "case_law_engine",
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * 3. Verify Good-Law Precedent Status Tool
 * Checks subsequent treatment (Followed, Distinguished, Overruled, Reversed)
 * strictly against authoritative judicial citations. Refuses to guess.
 */
export function verifyGoodLawTool(query: string): ToolResult<GoodLawCheckResult> {
  if (!query || typeof query !== "string") {
    return {
      success: false,
      data: {
        caseTitle: query || "Unknown",
        status: "Unverified",
        isGoodLaw: null,
        confidence: "Unverified",
        rulingSummary: "Query is required",
        verifiedTreatments: [],
      },
      source: "case_law_engine",
      error: "Case name or citation is required",
    };
  }

  const result = checkPrecedentStatus(query);
  return {
    success: true,
    data: result,
    source: "case_law_engine",
  };
}

export type WebSearchResult = {
  title: string;
  url: string;
  content: string;
};

/**
 * 4. Search Live Legal Web Tool
 * Uses Tavily API strictly restricted to verified legal sources.
 */
export async function searchWebTool(
  query: string,
  maxResults = 5,
): Promise<ToolResult<WebSearchResult[]>> {
  if (!tvly) {
    return {
      success: false,
      data: [],
      source: "tavily_web",
      error: "Tavily API key not configured",
    };
  }

  try {
    const response = await tvly.search(query, {
      searchDepth: "basic",
      maxResults: Math.min(maxResults * 2, 10),
      includeAnswer: false,
      excludeDomains: TAVILY_EXCLUDED_DOMAINS,
    });

    const trusted = (response.results ?? []).filter((r: { url?: string }) =>
      isTrustedLegalSource(r.url),
    );

    const data: WebSearchResult[] = trusted
      .slice(0, maxResults)
      .map((r: { title?: string; url?: string; content?: string }) => ({
        title: r.title || "Legal Source",
        url: r.url || "",
        content: r.content || "",
      }));

    return { success: true, data, source: "tavily_web" };
  } catch (error) {
    console.error("[LegalTools] searchWebTool error:", error);
    return {
      success: false,
      data: [],
      source: "tavily_web",
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

export type TransitionResult = {
  oldCode: string;
  oldSection: string;
  newCode: string;
  newSection: string;
  title: string;
};

/**
 * 5. Compare Statute Transition Tool (Quick Mapping)
 * Finds corresponding provisions between colonial codes (IPC, CrPC) and new Sanhitas (BNS, BNSS).
 */
export function compareTransitionTool(
  term: string,
): ToolResult<TransitionResult[]> {
  if (!term || typeof term !== "string") {
    return {
      success: false,
      data: [],
      source: "section_mappings",
      error: "Search term is required",
    };
  }

  const numMatch = term.match(/(\d+[a-z]?)/i);
  const targetNum = numMatch ? numMatch[1] : term.trim();

  const matches: TransitionResult[] = [];
  for (const mapping of SECTION_MAPPINGS) {
    const offenceTitle = mapping.offence || "";
    if (
      mapping.oldSection.toLowerCase() === targetNum.toLowerCase() ||
      mapping.newSection.toLowerCase() === targetNum.toLowerCase() ||
      offenceTitle.toLowerCase().includes(term.toLowerCase())
    ) {
      matches.push({
        oldCode: mapping.code,
        oldSection: mapping.oldSection,
        newCode: mapping.newCode,
        newSection: mapping.newSection,
        title: mapping.offence,
      });
    }
  }

  return { success: true, data: matches, source: "section_mappings" };
}

/**
 * 6. Granular IPC to BNS Comparison Tool
 * Returns detailed comparison including wording differences, commencement dates,
 * non-direct equivalents (sedition, snatching, mob lynching), and temporal rules.
 */
export function compareIpcBnsTool(term: string): ToolResult<StatutoryComparison | null> {
  if (!term || typeof term !== "string") {
    return {
      success: false,
      data: null,
      source: "section_mappings",
      error: "Search term is required",
    };
  }

  const comp = compareIpcToBns(term);
  return {
    success: true,
    data: comp,
    source: "section_mappings",
  };
}
