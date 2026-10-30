import { Pool } from "pg";

/**
 * PostgreSQL Knowledge Base & pgvector Client
 *
 * Provides hybrid retrieval (exact provision lookup + full-text search + vector similarity)
 * against the `legal_chunks` table in PostgreSQL.
 */

const pool = new Pool({
  connectionString: process.env.DATABASE_URL?.replace("sslmode=verify-full", "sslmode=require"),
  ssl: { rejectUnauthorized: false },
  max: 10,
  idleTimeoutMillis: 30000,
});

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

export async function lookupSectionExact(
  actId: string,
  sectionNum: string,
): Promise<LegalChunk | null> {
  const normProvision = sectionNum.startsWith("Section ")
    ? sectionNum
    : `Section ${sectionNum}`;

  const query = `
    SELECT id, category, act_id, act_title, provision, title, year, court, content
    FROM legal_chunks
    WHERE act_id = $1 AND (provision ILIKE $2 OR provision ILIKE $3)
    LIMIT 1;
  `;
  try {
    const res = await pool.query(query, [actId, normProvision, sectionNum]);
    if (res.rows.length === 0) return null;
    return res.rows[0] as LegalChunk;
  } catch (error) {
    console.error("[pgvector] Error in lookupSectionExact:", error);
    return null;
  }
}

export async function searchLegalChunksText(
  queryText: string,
  limit = 5,
): Promise<LegalChunk[]> {
  const query = `
    SELECT id, category, act_id, act_title, provision, title, year, court, content,
           ts_rank(tsv_content, plainto_tsquery('english', $1)) as rank
    FROM legal_chunks
    WHERE tsv_content @@ plainto_tsquery('english', $1)
       OR title ILIKE '%' || $1 || '%'
       OR content ILIKE '%' || $1 || '%'
    ORDER BY rank DESC
    LIMIT $2;
  `;
  try {
    const res = await pool.query(query, [queryText, limit]);
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
