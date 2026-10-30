import { readFile } from "fs/promises";
import { join } from "path";
import { lookupSectionExact, searchLegalChunksText } from "./legal-kb-db";

/**
 * Legal Knowledge Base Access Layer
 *
 * Provides high-speed retrieval of Indian statutes, sections, and references.
 * Resolves seamlessly from PostgreSQL (via legal_chunks / pgvector) with
 * local filesystem and in-memory cache fallbacks.
 */

const KB_ROOT = join(process.cwd(), "knowledge-base");

export const S3_BUCKET = process.env.S3_BUCKET_NAME || "lawbite-app-storage";
export const s3Client: { send: (command: unknown) => Promise<unknown> } | null = null;

// In-memory LRU cache
const CACHE_MAX = 500;
const cache = new Map<string, { data: unknown; ts: number }>();
const CACHE_TTL = 15 * 60 * 1000; // 15 minutes

function cacheGet<T>(key: string): T | null {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.ts > CACHE_TTL) {
    cache.delete(key);
    return null;
  }
  return entry.data as T;
}

function cacheSet(key: string, data: unknown): void {
  if (cache.size >= CACHE_MAX) {
    const oldest = cache.keys().next().value;
    if (oldest) cache.delete(oldest);
  }
  cache.set(key, { data, ts: Date.now() });
}

async function readKbFile(relativePath: string): Promise<string | null> {
  try {
    const fullPath = join(KB_ROOT, relativePath);
    return await readFile(fullPath, "utf8");
  } catch {
    return null;
  }
}

async function getJson<T>(key: string): Promise<T | null> {
  const cached = cacheGet<T>(key);
  if (cached !== null) return cached;

  const content = await readKbFile(key);
  if (!content) return null;

  try {
    const parsed = JSON.parse(content) as T;
    cacheSet(key, parsed);
    return parsed;
  } catch {
    return null;
  }
}

async function getText(key: string): Promise<string | null> {
  const cached = cacheGet<string>(key);
  if (cached !== null) return cached;

  const content = await readKbFile(key);
  if (content !== null) {
    cacheSet(key, content);
  }
  return content;
}

export const s3kb = {
  getAct(actName: string) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return getJson<Record<string, any>>(`bare-acts/${actName}/index.json`);
  },
  async getSection(actName: string, section: string) {
    const cacheKey = `sec:${actName}:${section}`;
    const cached = cacheGet<{ section: string; title: string; text: string }>(cacheKey);
    if (cached) return cached;

    // 1. Query PostgreSQL legal_chunks
    try {
      const dbChunk = await lookupSectionExact(actName, section);
      if (dbChunk) {
        const item = {
          section: section,
          title: dbChunk.title,
          text: dbChunk.content,
        };
        cacheSet(cacheKey, item);
        return item;
      }
    } catch {
      /* Fallback to local files if database lookup fails */
    }

    // 2. Query local files
    const direct = await getJson<{
      section: string;
      title: string;
      text: string;
    } | null>(`bare-acts/${actName}/sections/${section}.json`);
    if (direct) {
      cacheSet(cacheKey, direct);
      return direct;
    }
    return null;
  },
  getFullTextIndex() {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return getJson<any[]>("bare-acts/_index.json");
  },
  getSectionList(actName: string) {
    return getJson<Array<{ section: string; title: string }>>(
      `bare-acts/${actName}/_sections.json`,
    );
  },
  async searchActs(
    query: string,
  ): Promise<
    Array<{ act: string; section: string; title: string; text: string }>
  > {
    // 1. Query PostgreSQL legal_chunks
    try {
      const dbResults = await searchLegalChunksText(query, 10);
      if (dbResults.length > 0) {
        return dbResults.map((r) => ({
          act: r.act_id,
          section: r.provision.replace(/^Section\s+/i, ""),
          title: r.title,
          text: r.content,
        }));
      }
    } catch {
      /* Fallback to local index if DB fails */
    }

    // 2. Fallback to local files
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const raw = await getJson<any[]>("bare-acts/_index.json");
    if (!raw) return [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const acts: string[] = raw.map((e: any) =>
      typeof e === "string" ? e : e.id,
    );

    const lower = query.toLowerCase();
    const results: Array<{
      act: string;
      section: string;
      title: string;
      text: string;
    }> = [];

    for (const actId of acts) {
      const sections = await getJson<
        Array<{ section: string; title: string }>
      >(`bare-acts/${actId}/_sections.json`);
      if (!sections) continue;
      for (const s of sections) {
        if (s.title && s.title.toLowerCase().includes(lower)) {
          results.push({
            act: actId,
            section: s.section,
            title: s.title,
            text: "",
          });
        }
      }
    }
    return results;
  },
  getReference<T>(key: string) {
    return getJson<T>(`reference/${key}.json`);
  },
  getFullText(actName: string) {
    return getText(`bare-acts/${actName}/full.txt`);
  },
};
