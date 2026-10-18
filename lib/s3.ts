import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { NodeHttpHandler } from "@smithy/node-http-handler";
import { readFile } from "fs/promises";
import { join } from "path";
import https from "https";

const AWS_REGION = process.env.AWS_REGION || "ap-south-1";
const AWS_ACCESS_KEY_ID = process.env.AWS_ACCESS_KEY_ID;
const AWS_SECRET_ACCESS_KEY = process.env.AWS_SECRET_ACCESS_KEY;

export const S3_BUCKET = process.env.S3_BUCKET_NAME || "lawbite-app-storage";

const httpAgent = new https.Agent({
  keepAlive: true,
  maxSockets: 20,
  keepAliveMsecs: 30000,
});

export const s3Client = new S3Client({
  region: AWS_REGION,
  ...(AWS_ACCESS_KEY_ID && AWS_SECRET_ACCESS_KEY
    ? {
        credentials: {
          accessKeyId: AWS_ACCESS_KEY_ID,
          secretAccessKey: AWS_SECRET_ACCESS_KEY,
        },
      }
    : {}),
  requestHandler: new NodeHttpHandler({
    requestTimeout: 10000,
    connectionTimeout: 5000,
    httpAgent,
  }),
});

const s3 = s3Client;
const BUCKET = S3_BUCKET;

// ─── LRU-ish cache (Map with max size, oldest entries evicted first) ───
const CACHE_MAX = 200;
const cache = new Map<string, { data: unknown; ts: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

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

function localPathForKey(key: string): string {
  const localRoot = key.startsWith("bare-acts/") ? "kb-build" : "kb-data";
  return join(process.cwd(), localRoot, key);
}

async function readLocalFile(key: string): Promise<string | null> {
  try {
    return await readFile(localPathForKey(key), "utf8");
  } catch {
    return null;
  }
}

async function getJson<T>(key: string): Promise<T | null> {
  const cached = cacheGet<T>(key);
  if (cached !== null) return cached;

  try {
    const cmd = new GetObjectCommand({ Bucket: BUCKET, Key: key });
    const res = await s3.send(cmd);
    const body = await res.Body?.transformToString();
    const parsed = body ? (JSON.parse(body) as T) : null;
    if (parsed !== null) cacheSet(key, parsed);
    return parsed;
  } catch {
    const local = await readLocalFile(key);
    if (local) {
      const parsed = JSON.parse(local) as T;
      cacheSet(key, parsed);
      return parsed;
    }
    return null;
  }
}

async function getText(key: string): Promise<string | null> {
  try {
    const cmd = new GetObjectCommand({ Bucket: BUCKET, Key: key });
    const res = await s3.send(cmd);
    return (await res.Body?.transformToString()) || null;
  } catch {
    return readLocalFile(key);
  }
}

/** Extract a specific section from an act's full.txt by section number */
async function getSectionFromFullText(
  actName: string,
  section: string,
): Promise<{ section: string; title: string; text: string } | null> {
  const full = await getText(`bare-acts/${actName}/full.txt`);
  if (!full) return null;
  const secIndex = await getJson<Array<{ section: string; title: string }>>(
    `bare-acts/${actName}/_sections.json`,
  );
  if (!secIndex) return null;
  const entry = secIndex.find((s) => s.section === section);
  if (!entry) return null;
  const lines = full.split("\n");
  const numPart = section.replace(/[A-Za-z]/g, "");

  let startIdx = -1;
  for (let i = 0; i < lines.length; i++) {
    const trimmed = lines[i].trim();
    const searchStr = `${section}.`;
    const idx = trimmed.indexOf(searchStr);
    if (idx === -1) continue;
    if (idx > 0 && /\d/.test(trimmed[idx - 1])) continue;
    const after = trimmed.substring(
      idx + searchStr.length,
      idx + searchStr.length + 1,
    );
    if (after.match(/\s|\(|\[|[A-Z]/)) {
      startIdx = i;
      break;
    }
  }
  if (startIdx === -1) return null;

  let endIdx = lines.length;
  for (let i = startIdx + 1; i < lines.length; i++) {
    const trimmed = lines[i].trim();
    const nextMatch = trimmed.match(/^(\d+[A-Za-z]?)\s*\.(?:\s|\(|[A-Z])/m);
    if (nextMatch) {
      const nextN = nextMatch[1].replace(/[A-Za-z]/g, "");
      if (
        nextN !== "" &&
        parseInt(nextN) > parseInt(numPart) &&
        nextMatch[1] !== section
      ) {
        endIdx = i;
        break;
      }
    }
  }

  const text = lines.slice(startIdx, endIdx).join("\n").trim();
  return text ? { section, title: entry.title, text } : null;
}

export const s3kb = {
  getAct(actName: string) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return getJson<Record<string, any>>(`bare-acts/${actName}/index.json`);
  },
  async getSection(actName: string, section: string) {
    const direct = await getJson<{
      section: string;
      title: string;
      text: string;
    } | null>(`bare-acts/${actName}/sections/${section}.json`);
    if (direct) return direct;
    return getSectionFromFullText(actName, section);
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
  /** Search across all acts in PARALLEL (was sequential before) */
  async searchActs(
    query: string,
  ): Promise<
    Array<{ act: string; section: string; title: string; text: string }>
  > {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const raw = await getJson<any[]>("bare-acts/_index.json");
    if (!raw) return [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const acts: string[] = raw.map((e: any) =>
      typeof e === "string" ? e : e.id,
    );

    const lower = query.toLowerCase();

    // Fetch all section lists in parallel (batched to avoid too many concurrent requests)
    const BATCH_SIZE = 20;
    const results: Array<{
      act: string;
      section: string;
      title: string;
      text: string;
    }> = [];

    for (let i = 0; i < acts.length; i += BATCH_SIZE) {
      const batch = acts.slice(i, i + BATCH_SIZE);
      const sectionLists = await Promise.all(
        batch.map((actId) =>
          getJson<Array<{ section: string; title: string }>>(
            `bare-acts/${actId}/_sections.json`,
          ),
        ),
      );

      for (let j = 0; j < batch.length; j++) {
        const sections = sectionLists[j];
        if (!sections) continue;
        for (const s of sections) {
          if (s.title && s.title.toLowerCase().includes(lower)) {
            results.push({
              act: batch[j],
              section: s.section,
              title: s.title,
              text: "",
            });
          }
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
