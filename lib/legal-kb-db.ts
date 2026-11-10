import { pool } from "@/lib/db";

/**
 * PostgreSQL Knowledge Base & pgvector Client
 *
 * Provides hybrid retrieval (exact provision lookup + full-text search + vector similarity)
 * against the `legal_chunks` table in PostgreSQL. Reuses the application's central connection pool.
 */

export type LegalChunk = {
  id: string;
  category: "bare_act" | "case_law" | "reference";
  act_id: string;
  act_title: string;
  provision: string;
  title: string;
  year?: number;
  court?: string;
  content: string;
  distance?: number;
};

/**
 * Normalizes user-facing and code act keys to the database act_id values in `legal_chunks`.
 */
export function getCanonicalActIds(actId: string): string[] {
  const norm = actId.toLowerCase().trim().replace(/_/g, "-");
  const aliases: Record<string, string[]> = {
    ipc: ["indian-penal-code", "ipc"],
    "indian-penal-code": ["indian-penal-code", "ipc"],
    bns: ["bharatiya-nyaya-sanhita", "bns"],
    "bharatiya-nyaya-sanhita": ["bharatiya-nyaya-sanhita", "bns"],
    crpc: [
      "code-of-criminal-procedure",
      "crpc",
      "bharatiya-nagarik-suraksha-sanhita",
      "bharatiya-nagrik-suraksha-sanhita",
    ],
    "code-of-criminal-procedure": ["code-of-criminal-procedure", "crpc"],
    bnss: [
      "bharatiya-nagarik-suraksha-sanhita",
      "bharatiya-nagrik-suraksha-sanhita",
      "bnss",
    ],
    "bharatiya-nagrik-suraksha-sanhita": [
      "bharatiya-nagarik-suraksha-sanhita",
      "bharatiya-nagrik-suraksha-sanhita",
      "bnss",
    ],
    "bharatiya-nagarik-suraksha-sanhita": [
      "bharatiya-nagarik-suraksha-sanhita",
      "bharatiya-nagrik-suraksha-sanhita",
      "bnss",
    ],
    bsa: ["bharatiya-sakshya-adhiniyam", "bsa"],
    "bharatiya-sakshya-adhiniyam": ["bharatiya-sakshya-adhiniyam", "bsa"],
    "evidence-act": [
      "evidence-act",
      "indian-evidence-act",
      "bharatiya-sakshya-adhiniyam",
    ],
    "indian-evidence-act": [
      "evidence-act",
      "indian-evidence-act",
      "bharatiya-sakshya-adhiniyam",
    ],
    "indian-contract-act": ["indian-contract-act", "contract-act"],
    "contract-act": ["indian-contract-act", "contract-act"],
    constitution: ["constitution"],
  };
  return aliases[norm] || [norm];
}

export async function lookupSectionExact(
  actId: string,
  sectionNum: string,
): Promise<LegalChunk | null> {
  const candidateActIds = getCanonicalActIds(actId);
  const normProvision = sectionNum.startsWith("Section ")
    ? sectionNum
    : `Section ${sectionNum}`;
  const pureNum = sectionNum.replace(/^Section\s+/i, "").trim();

  const query = `
    SELECT id, category, act_id, act_title, provision, title, year, court, content
    FROM legal_chunks
    WHERE act_id = ANY($1::text[]) 
      AND (provision ILIKE $2 OR provision ILIKE $3 OR provision ILIKE $4)
    LIMIT 1;
  `;
  try {
    const res = await pool.query(query, [
      candidateActIds,
      normProvision,
      sectionNum,
      `Section ${pureNum}`,
    ]);
    if (res.rows.length === 0) return null;
    return res.rows[0] as LegalChunk;
  } catch (error) {
    console.error("[pgvector] Error in lookupSectionExact:", error);
    return null;
  }
}

export async function getSectionListFromDb(
  actId: string,
): Promise<Array<{ section: string; title: string }> | null> {
  const candidateActIds = getCanonicalActIds(actId);
  const query = `
    SELECT provision, title
    FROM legal_chunks
    WHERE act_id = ANY($1::text[])
    ORDER BY id ASC;
  `;
  try {
    const res = await pool.query(query, [candidateActIds]);
    if (res.rows.length === 0) return null;
    return res.rows.map((row) => ({
      section: row.provision.replace(/^Section\s+/i, "").trim(),
      title: row.title,
    }));
  } catch (error) {
    console.error("[pgvector] Error in getSectionListFromDb:", error);
    return null;
  }
}

export async function getDistinctActsFromDb(): Promise<
  Array<{ id: string; title: string; count: number }> | null
> {
  const query = `
    SELECT act_id as id, act_title as title, count(*)::int as count
    FROM legal_chunks
    GROUP BY act_id, act_title
    ORDER BY act_id ASC;
  `;
  try {
    const res = await pool.query(query);
    if (res.rows.length === 0) return null;
    return res.rows;
  } catch (error) {
    console.error("[pgvector] Error in getDistinctActsFromDb:", error);
    return null;
  }
}

export async function getFullTextFromDb(actId: string): Promise<string | null> {
  const candidateActIds = getCanonicalActIds(actId);
  const query = `
    SELECT provision, title, content
    FROM legal_chunks
    WHERE act_id = ANY($1::text[])
    ORDER BY id ASC;
  `;
  try {
    const res = await pool.query(query, [candidateActIds]);
    if (res.rows.length === 0) return null;
    return res.rows
      .map((row) => `${row.provision}: ${row.title}\n\n${row.content}`)
      .join("\n\n---\n\n");
  } catch (error) {
    console.error("[pgvector] Error in getFullTextFromDb:", error);
    return null;
  }
}

export async function searchLegalChunksText(
  queryText: string,
  limit = 5,
  actId?: string,
): Promise<LegalChunk[]> {
  const candidateActIds = actId ? getCanonicalActIds(actId) : null;
  const query = `
    SELECT id, category, act_id, act_title, provision, title, year, court, content,
           ts_rank(tsv_content, plainto_tsquery('english', $1)) as rank
    FROM legal_chunks
    WHERE ($3::text[] IS NULL OR act_id = ANY($3::text[]))
      AND (tsv_content @@ plainto_tsquery('english', $1)
       OR title ILIKE '%' || $1 || '%'
       OR content ILIKE '%' || $1 || '%')
    ORDER BY rank DESC NULLS LAST
    LIMIT $2;
  `;
  try {
    const res = await pool.query(query, [queryText, limit, candidateActIds]);
    return res.rows as LegalChunk[];
  } catch (error) {
    console.error("[pgvector] Error in searchLegalChunksText:", error);
    return [];
  }
}

export async function searchLegalChunksVector(
  embeddingVector: number[],
  limit = 5,
): Promise<LegalChunk[]> {
  const vectorStr = `[${embeddingVector.join(",")}]`;
  const query = `
    SELECT id, category, act_id, act_title, provision, title, year, court, content,
           (embedding <=> $1::vector) as distance
    FROM legal_chunks
    WHERE embedding IS NOT NULL
    ORDER BY embedding <=> $1::vector ASC
    LIMIT $2;
  `;
  try {
    const res = await pool.query(query, [vectorStr, limit]);
    return res.rows as LegalChunk[];
  } catch (error) {
    console.error("[pgvector] Error in searchLegalChunksVector:", error);
    return [];
  }
}
