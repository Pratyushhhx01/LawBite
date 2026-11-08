import { CASE_LAW_DATABASE } from "./case-law-data";
import type {
  CaseSearchFilter,
  CaseSearchResponse,
  CaseSearchResultItem,
  Judgment,
  ParagraphChunk,
} from "./case-law-types";
import { searchLegalChunksText } from "./legal-kb-db";

/**
 * Case-Law Research Engine Service
 *
 * Implements advanced multi-parameter filtering, ranked keyword search,
 * paragraph retrieval with preserved numbering, and structured case analysis.
 */

export class CaseLawService {
  /**
   * Search judgments using advanced filters:
   * - keywords / query
   * - court (Supreme Court, Delhi High Court, etc.)
   * - judge / bench
   * - yearFrom / yearTo
   * - caseType (Writ Petition, Criminal Appeal, etc.)
   * - act (Constitution, IPC, etc.)
   * - section (302, 377, 498A, 21, etc.)
   * - precedentStatus (Good Law, Overruled, etc.)
   */
  public static async searchCases(filter: CaseSearchFilter): Promise<CaseSearchResponse> {
    const query = filter.query?.toLowerCase().trim() || "";
    const courtFilter = filter.court?.toLowerCase().trim();
    const judgeFilter = filter.judge?.toLowerCase().trim();
    const caseTypeFilter = filter.caseType?.toLowerCase().trim();
    const actFilter = filter.act?.toLowerCase().trim();
    const sectionFilter = filter.section?.toLowerCase().trim();
    const statusFilter = filter.precedentStatus;
    const yearFrom = filter.yearFrom;
    const yearTo = filter.yearTo;

    const limit = Math.min(Math.max(filter.limit || 10, 1), 50);
    const offset = Math.max(filter.offset || 0, 0);

    // 1. Filter and score judgments from authoritative in-memory corpus
    const scoredItems: Array<{ judgment: Judgment; score: number; matchedParagraphs: ParagraphChunk[] }> = [];

    for (const j of CASE_LAW_DATABASE) {
      // Court filter
      if (courtFilter && !j.court.toLowerCase().includes(courtFilter)) {
        continue;
      }

      // Judge / bench filter
      if (judgeFilter && !j.bench.toLowerCase().includes(judgeFilter)) {
        continue;
      }

      // Year range filter
      if (yearFrom !== undefined && j.year < yearFrom) {
        continue;
      }
      if (yearTo !== undefined && j.year > yearTo) {
        continue;
      }

      // Case type filter
      if (caseTypeFilter && !j.caseType.toLowerCase().includes(caseTypeFilter)) {
        continue;
      }

      // Act filter
      if (actFilter) {
        const hasAct = j.actsInvolved.some((a) => a.toLowerCase().includes(actFilter));
        if (!hasAct) continue;
      }

      // Section filter
      if (sectionFilter) {
        const normSec = sectionFilter.replace(/^section\s+/i, "").toLowerCase();
        const hasSec = j.sectionsInvolved.some((s) => {
          const cleanS = s.toLowerCase().replace(/[^a-z0-9]/g, "");
          return cleanS.includes(normSec) || s.toLowerCase().includes(normSec);
        });
        if (!hasSec) continue;
      }

      // Precedent status filter
      if (statusFilter && j.precedentStatus !== statusFilter) {
        continue;
      }

      // Scoring
      let score = 1.0;
      const matchedParas: ParagraphChunk[] = [];

      if (query) {
        const queryTerms = query.split(/\s+/).filter((t) => t.length > 2);
        let matchCount = 0;

        const titleLower = j.title.toLowerCase();
        const summaryLower = j.summary.toLowerCase();
        const citationsLower = j.citations.join(" ").toLowerCase();

        for (const term of queryTerms) {
          if (titleLower.includes(term)) matchCount += 10;
          if (citationsLower.includes(term)) matchCount += 8;
          if (summaryLower.includes(term)) matchCount += 4;
        }

        // Search through paragraphs
        for (const p of j.paragraphs) {
          const pLower = p.text.toLowerCase();
          let pMatches = 0;
          for (const term of queryTerms) {
            if (pLower.includes(term)) pMatches++;
          }
          if (pMatches > 0) {
            matchCount += pMatches * 2;
            matchedParas.push(p);
          }
        }

        // Also check analysis reasoning
        const reasoningLower = j.analysis.courtReasoning.toLowerCase();
        for (const term of queryTerms) {
          if (reasoningLower.includes(term)) matchCount += 2;
        }

        if (matchCount === 0) {
          // No match on query
          continue;
        }
        score += matchCount;
      } else {
        // Default to returning key paragraphs
        matchedParas.push(...j.paragraphs.slice(0, 2));
      }

      scoredItems.push({
        judgment: j,
        score,
        matchedParagraphs: matchedParas,
      });
    }

    // Sort by descending score
    scoredItems.sort((a, b) => b.score - a.score);

    const total = scoredItems.length;
    const paginated = scoredItems.slice(offset, offset + limit);

    const results: CaseSearchResultItem[] = paginated.map(({ judgment: j, score, matchedParagraphs }) => ({
      id: j.id,
      title: j.title,
      court: j.court,
      caseNumber: j.caseNumber,
      date: j.date,
      year: j.year,
      bench: j.bench,
      citations: j.citations,
      sourceUrl: j.sourceUrl,
      caseType: j.caseType,
      actsInvolved: j.actsInvolved,
      sectionsInvolved: j.sectionsInvolved,
      summary: j.summary,
      precedentStatus: j.precedentStatus,
      relevantParagraphs: matchedParagraphs.slice(0, 3),
      matchScore: Math.round(score * 10) / 10,
    }));

    return {
      total,
      results,
      page: Math.floor(offset / limit) + 1,
      limit,
    };
  }

  /**
   * Get a single judgment by ID with full analysis, preserved paragraphs,
   * and verified subsequent treatments.
   */
  public static getJudgmentById(id: string): Judgment | null {
    const found = CASE_LAW_DATABASE.find((j) => j.id.toLowerCase() === id.toLowerCase());
    return found || null;
  }

  /**
   * Hybrid search: queries in-memory corpus first, then falls back/enriches
   * with PostgreSQL `legal_chunks` table for full-text search.
   */
  public static async hybridSearch(query: string, limit = 5): Promise<CaseSearchResultItem[]> {
    const searchRes = await this.searchCases({ query, limit });
    if (searchRes.results.length >= limit) {
      return searchRes.results;
    }

    // If fewer than limit, search PostgreSQL legal_chunks
    try {
      const dbChunks = await searchLegalChunksText(query, limit);
      const caseChunks = dbChunks.filter(
        (c) => c.category === "case_law" || c.act_id === "supreme-court",
      );

      for (const chunk of caseChunks) {
        if (searchRes.results.some((r) => r.id === chunk.id || r.title.includes(chunk.title))) {
          continue;
        }
        searchRes.results.push({
          id: chunk.id,
          title: chunk.title,
          court: chunk.court || "Supreme Court of India",
          caseNumber: "Reported Judgment",
          date: `${chunk.year || 2020}-01-01`,
          year: chunk.year || 2020,
          bench: "Supreme Court Bench",
          citations: [chunk.provision],
          sourceUrl: "https://digiscr.sci.gov.in/",
          caseType: "Constitutional / Appellate",
          actsInvolved: [chunk.act_title],
          sectionsInvolved: [chunk.provision],
          summary: chunk.content.slice(0, 200) + "...",
          precedentStatus: "Good Law",
          relevantParagraphs: [{ paraNumber: 1, text: chunk.content.slice(0, 400) }],
          matchScore: 5.0,
        });
        if (searchRes.results.length >= limit) break;
      }
    } catch (err) {
      console.error("[CaseLawService] hybridSearch db fallback error:", err);
    }

    return searchRes.results.slice(0, limit);
  }
}
