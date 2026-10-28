import { sql } from "kysely";
import { db } from "@/lib/db";

/**
 * Liveness/readiness probe for uptime monitors and deploy checks.
 *
 * It answers one question: can this instance serve a chat request right now?
 * Critical dependencies (database, auth config, at least one AI provider) turn
 * the response into a 503 so a monitor can page on it. Optional integrations
 * (S3 knowledge base, Tavily) degrade the status but do not fail the probe,
 * because the app has a defined fallback for both.
 *
 * No secret values are returned — only presence booleans and a latency number.
 */

export const dynamic = "force-dynamic";

const startedAt = Date.now();
const DB_TIMEOUT_MS = 2_500;

function configured(key: string): boolean {
  return Boolean(process.env[key]);
}

async function checkDatabase(): Promise<{
  ok: boolean;
  latencyMs: number | null;
}> {
  const start = Date.now();
  let timer: ReturnType<typeof setTimeout> | undefined;

  try {
    await Promise.race([
      sql`select 1`.execute(db),
      new Promise<never>((_, reject) => {
        timer = setTimeout(
          () => reject(new Error("database timeout")),
          DB_TIMEOUT_MS,
        );
      }),
    ]);
    return { ok: true, latencyMs: Date.now() - start };
  } catch {
    return { ok: false, latencyMs: null };
  } finally {
    if (timer) clearTimeout(timer);
  }
}

export async function GET() {
  const database = await checkDatabase();

  const checks = {
    database: database.ok,
    auth: configured("BETTER_AUTH_SECRET") && configured("BETTER_AUTH_URL"),
    aiProvider: configured("INCEPTION_API_KEY") || configured("NVIDIA_API_KEY"),
    knowledgeBase: configured("S3_BUCKET_NAME") && configured("AWS_REGION"),
    webSearch: configured("TAVILY_API_KEY"),
  };

  const critical = checks.database && checks.auth && checks.aiProvider;

  return Response.json(
    {
      status: critical ? "ok" : "degraded",
      checks,
      uptimeSeconds: Math.floor((Date.now() - startedAt) / 1000),
      version: process.env.VERCEL_GIT_COMMIT_SHA ?? null,
      timestamp: new Date().toISOString(),
    },
    {
      status: critical ? 200 : 503,
      headers: { "Cache-Control": "no-store" },
    },
  );
}
