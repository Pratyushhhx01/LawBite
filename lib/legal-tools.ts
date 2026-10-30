import {
  lookupSectionExact,
  searchLegalChunksText,
  type LegalChunk,
} from "./legal-kb-db";
import { isTrustedLegalSource, TAVILY_EXCLUDED_DOMAINS } from "./legal-sources";
import { SECTION_MAPPINGS } from "./section-mapping";
import { tavily } from "@tavily/core";

const tvly = process.env.TAVILY_API_KEY
  ? tavily({ apiKey: process.env.TAVILY_API_KEY })
  : null;

export type ToolResult<T> = {
  success: boolean;
  data: T;
  source: "postgres_kb" | "tavily_web" | "section_mappings";
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

    // Otherwise perform full-text search across legal_chunks
    const results = await searchLegalChunksText(query, limit);
    return {
      success: true,
      data: actId ? results.filter((r) => r.act_id === actId) : results,
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
 * Queries Supreme Court jurisprudence, constitutional holdings, and doctrines.
 */
export async function searchCasesTool(
  query: string,
  limit = 5,
): Promise<ToolResult<LegalChunk[]>> {
  if (!query || typeof query !== "string") {
    return { success: false, data: [], source: "postgres_kb", error: "Query is required" };
  }

  try {
    const results = await searchLegalChunksText(query, limit);
    const caseLaw = results.filter(
      (r) => r.category === "case_law" || r.act_id === "supreme-court",
    );
    return { success: true, data: caseLaw, source: "postgres_kb" };
  } catch (error) {
    console.error("[LegalTools] searchCasesTool error:", error);
    return {
      success: false,
      data: [],
      source: "postgres_kb",
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

export type WebSearchResult = {
  title: string;
  url: string;
  content: string;
};

/**
 * 3. Search Live Legal Web Tool
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
 * 4. Compare Statute Transition Tool
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
