import { NextRequest } from "next/server";
import { tavily } from "@tavily/core";
import { s3kb } from "@/lib/s3";
import { auth } from "@/lib/auth";
import { stripThinkingTokens, checkRateLimit } from "@/lib/utils";
import {
  extractRefNumbers,
  fixArticleSectionTerminology,
} from "@/lib/legal-terminology";
import { SECTION_MAPPINGS, mappingPromptBlock } from "@/lib/section-mapping";
import { ACT_MAP } from "@/lib/act-map";
import {
  DRAFT_DISCLAIMER,
  DRAFT_SCOPE_REFUSAL,
  getSystemPrompt,
  SCOPE_RULES,
  SOURCE_QUALITY_RULES,
} from "@/lib/chat-prompts";
import {
  classifyQuery,
  hasIndianContext,
  isAssistantMetaQuery,
  isDocumentDraftingQuery,
  isNonLegalQuery,
  legalAcronymContext,
  mentionsForeignJurisdiction,
} from "@/lib/chat-filters";
import {
  isTrustedLegalSource,
  TAVILY_EXCLUDED_DOMAINS,
} from "@/lib/legal-sources";
import {
  buildCandidateChain,
  buildProviderPayload,
  ensureReasoningBudget,
  getModel,
  getProviderApiKey,
  isProviderConfigured,
  PROVIDERS,
  resolveReasoningEffort,
  type ChatRequestParams,
  type ModelInfo,
  type ReasoningEffort,
} from "@/lib/ai-providers";

const SCOPE_REFUSAL =
  "I can only provide information related to Indian law. Please ask a legal question concerning India.";

/**
 * Refusals are emitted as the same SSE frame shape the client already parses,
 * so the UI shows a normal assistant message and never calls the provider.
 */
function refusalStreamResponse(message = SCOPE_REFUSAL): Response {
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    start(controller) {
      controller.enqueue(
        encoder.encode(`data: ${JSON.stringify({ content: message })}\n\n`),
      );
      controller.enqueue(encoder.encode("data: [DONE]\n\n"));
      controller.close();
    },
  });
  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}

/**
 * Hard ceiling for the provider to return response headers. A streaming
 * provider sends headers as soon as it accepts the request, so a long wait
 * here means the provider is unreachable — not that it is still thinking.
 * The old 180s ceiling let one dead candidate hang the whole chat.
 */
const PROVIDER_CONNECT_TIMEOUT_MS = (() => {
  const override = Number(process.env.CHAT_PROVIDER_CONNECT_TIMEOUT_MS);
  return Number.isFinite(override) && override > 0 ? override : 20_000;
})();

/**
 * Short modes must either answer immediately or fail over immediately. A
 * provider that cannot even send headers within this window is treated as
 * unavailable, so the next candidate gets a turn while the user is still
 * waiting rather than after several minutes.
 */
const SHORT_MODE_CONNECT_TIMEOUT_MS = (() => {
  const override = Number(process.env.CHAT_SHORT_CONNECT_TIMEOUT_MS);
  return Number.isFinite(override) && override > 0 ? override : 8_000;
})();

/**
 * Total wall-clock budget for the short-mode candidate walk. Normal Inception
 * replies start in under 3s; if the whole chain cannot produce a first token
 * in this window, stop retrying and let the client retry cleanly instead of
 * keeping the user on a spinner for a minute.
 */
const SHORT_MODE_BUDGET_MS = (() => {
  const override = Number(process.env.CHAT_SHORT_MODE_BUDGET_MS);
  return Number.isFinite(override) && override > 0 ? override : 25_000;
})();

/**
 * Vercel caps Hobby-plan functions at 300s. Declaring it explicitly means long
 * analyses stream to completion instead of inheriting a smaller default.
 */
export const maxDuration = 300;

/**
 * Reasoning models emit `reasoning_content` for many seconds before the first
 * user-visible token, and the app strips reasoning. Without a watchdog a model
 * that never gets past its reasoning phase leaves the browser on a silent,
 * empty stream until the function is killed. Streaming modes abandon such a
 * model after this window and fail over to the next one. The override lets
 * tests exercise the failover without waiting 20 real seconds.
 */
const FIRST_CONTENT_TIMEOUT_MS = (() => {
  const override = Number(process.env.CHAT_FIRST_CONTENT_TIMEOUT_MS);
  return Number.isFinite(override) && override > 0 ? override : 20_000;
})();

/**
 * SSE comment cadence. Reasoning phases produce no client-visible bytes, so an
 * occasional comment keeps proxies from dropping the idle connection.
 */
const KEEPALIVE_INTERVAL_MS = 5_000;

/**
 * Fetch a provider endpoint with a hard connect timeout. Shared by every
 * provider (Inception, NVIDIA) so the timeout message stays consistent.
 */
async function fetchProvider(
  url: string,
  init: RequestInit,
  timeoutMs: number = PROVIDER_CONNECT_TIMEOUT_MS,
): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } catch (error) {
    if (controller.signal.aborted) {
      throw new Error(
        "Timed out connecting to the AI service. Please try again.",
      );
    }
    throw error;
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Send one chat-completions request to the provider that owns `candidate`.
 * The API key is resolved from the provider's own env var, so Inception and
 * NVIDIA can be swapped without touching call sites.
 */
async function callProvider(
  candidate: ModelInfo,
  body: Record<string, unknown>,
  timeoutMs?: number,
): Promise<Response> {
  const provider = PROVIDERS[candidate.provider];
  const key = getProviderApiKey(candidate.provider);
  if (!key) {
    throw new Error(`${provider.id}: ${provider.apiKeyEnv} is not configured`);
  }
  return fetchProvider(
    provider.baseUrl,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
        Accept: "text/event-stream",
      },
      body: JSON.stringify(body),
    },
    timeoutMs,
  );
}

/** Retry helpers re-issue a request against whichever model produced output. */
function retryParams(
  candidate: ModelInfo,
  overrides: Partial<ChatRequestParams> & {
    messages: unknown[];
    maxTokens: number;
  },
): Record<string, unknown> {
  return buildProviderPayload(candidate, {
    topP: 0.95,
    stream: true,
    ...overrides,
  });
}

/**
 * Retry budget for HTTP 429 on the preferred (fast) model. The Inception free
 * tier is capacity-limited and returns 429s often, so retrying the same fast
 * model briefly beats silently degrading to the slower fallback provider —
 * which is what made replies feel unpredictably slow. Tunable in tests.
 */
const RATE_LIMIT_RETRIES = (() => {
  const override = Number(process.env.CHAT_RATE_LIMIT_RETRIES);
  return Number.isFinite(override) && override >= 0 ? override : 3;
})();

const RATE_LIMIT_BACKOFF_MS = (() => {
  const raw = process.env.CHAT_RATE_LIMIT_BACKOFF_MS;
  if (raw) {
    const parsed = raw
      .split(",")
      .map((n) => Number(n.trim()))
      .filter((n) => Number.isFinite(n) && n >= 0);
    if (parsed.length > 0) return parsed;
  }
  return [300, 800, 1600];
})();

/**
 * POST to a provider, retrying on HTTP 429 before giving up. The preferred
 * model gets the full budget; fallback candidates get a single retry, since by
 * then any answer is better than another round trip.
 */
async function callProviderWithRetry(
  candidate: ModelInfo,
  body: Record<string, unknown>,
  retries: number,
  timeoutMs?: number,
): Promise<Response> {
  let res = await callProvider(candidate, body, timeoutMs);
  for (let attempt = 0; res.status === 429 && attempt < retries; attempt++) {
    const wait =
      RATE_LIMIT_BACKOFF_MS[
        Math.min(attempt, RATE_LIMIT_BACKOFF_MS.length - 1)
      ] ?? 1000;
    console.warn(
      `Model ${candidate.id} rate-limited (HTTP 429), retry ${attempt + 1}/${retries} in ${wait}ms...`,
    );
    if (wait > 0) await new Promise((resolve) => setTimeout(resolve, wait));
    res = await callProvider(candidate, body, timeoutMs);
  }
  return res;
}

const tvly = process.env.TAVILY_API_KEY
  ? tavily({ apiKey: process.env.TAVILY_API_KEY })
  : null;

/** True once the buffer contains at least one newline-terminated `data:` line. */
function hasCompleteDataLine(text: string): boolean {
  const idx = text.lastIndexOf("\n");
  if (idx === -1) return false;
  return text
    .slice(0, idx)
    .split("\n")
    .some((l) => l.startsWith("data: "));
}

/**
 * NVIDIA returns HTTP 200 with an SSE `{"error": ...}` frame when a model is
 * overloaded. Detect it in the buffered prefix so we can fail over to the next
 * model instead of piping an empty stream to the client.
 */
function extractSseError(text: string): string | null {
  const idx = text.lastIndexOf("\n");
  if (idx === -1) return null;
  for (const line of text.slice(0, idx).split("\n")) {
    if (!line.startsWith("data: ")) continue;
    const data = line.slice(6).trim();
    if (!data || data === "[DONE]") continue;
    try {
      const parsed = JSON.parse(data);
      if (parsed.error) {
        return typeof parsed.error === "string"
          ? parsed.error
          : JSON.stringify(parsed.error);
      }
    } catch {
      /* incomplete frame, ignore */
    }
  }
  return null;
}

/**
 * True once the buffered SSE prefix carries a user-visible `content` delta.
 * `reasoning_content` frames deliberately do NOT count: they are stripped
 * before the reply reaches the browser, so they must not satisfy the watchdog.
 */
function hasVisibleContentDelta(text: string): boolean {
  const idx = text.lastIndexOf("\n");
  if (idx === -1) return false;
  for (const line of text.slice(0, idx).split("\n")) {
    if (!line.startsWith("data: ")) continue;
    const data = line.slice(6).trim();
    if (!data || data === "[DONE]") continue;
    try {
      const parsed = JSON.parse(data);
      const content = parsed.choices?.[0]?.delta?.content;
      if (typeof content === "string" && content.length > 0) return true;
    } catch {
      /* incomplete frame, ignore */
    }
  }
  return false;
}

const VALID_CONVERSATION_TYPES = new Set([
  "chat",
  "analysis",
  "talk-to-ai",
  "grill",
  "draft",
  "review",
]);
const MAX_MESSAGES = 100;
const MAX_MESSAGE_LENGTH = 10000;

type Citation = {
  type: "act" | "web";
  label: string;
  snippet: string;
  url?: string;
};

async function webSearch(
  query: string,
): Promise<{ context: string; citations: Citation[] }> {
  if (!tvly) {
    console.warn("Tavily API key not configured, skipping web search");
    return { context: "", citations: [] };
  }
  try {
    const response = await tvly.search(query, {
      searchDepth: "basic",
      maxResults: 8,
      // The answer is generated from all candidates, including ones we may
      // reject below. Keep it off and build the context only from verified
      // source snippets so a social-media result cannot leak into the reply.
      includeAnswer: false,
      excludeDomains: TAVILY_EXCLUDED_DOMAINS,
    });

    const trustedResults = (response.results ?? []).filter(
      (result: { url?: string }) => isTrustedLegalSource(result.url),
    );

    if (trustedResults.length === 0) {
      return { context: "", citations: [] };
    }

    const results = trustedResults
      .map(
        (result: { title: string; content: string }) =>
          `${result.title}: ${result.content}`,
      )
      .join("\n");

    const citations: Citation[] = trustedResults
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .map((r: any): Citation => ({
        type: "web",
        label: r.title || new URL(r.url).hostname.replace(/^www\./, ""),
        snippet: (r.content || "").slice(0, 200),
        url: r.url,
      }))
      .slice(0, 4);

    return {
      context: `VERIFIED INDIAN LEGAL WEB SOURCES. Use only these sources; do not cite any other website:\n${results}`,
      citations,
    };
  } catch (error) {
    console.error("Tavily search error:", error);
    return { context: "", citations: [] };
  }
}

const fullTextActs = new Set([
  "constitution",
  "bharatiya-nyaya-sanhita",
  "bharatiya-nagrik-suraksha-sanhita",
  "bharatiya-sakshya-adhiniyam",
  "transfer-of-property-act",
  "indian-contract-act",
  "specific-relief-act",
  "family-law",
  "indian-succession-act",
  "hindu-succession-act",
  "domestic-violence-act",
  "consumer-protection-act",
  "information-technology-act",
  "data-protection",
  "hacking-laws",
  "identity-theft",
  "online-frauds",
  "cyber-crime-detection",
  "digital-evidence",
  "constitutional-law-jurisprudence",
  "legal-terminology",
  "tort-law",
  "civil-appeals",
  "judicial-review",
  "writ-jurisprudence",
  "public-interest-litigation",
  "police-act-1861",
  "fir-procedures",
  "arrest-guidelines",
  "search-and-seizure",
  "nia-act",
  "charge-sheets",
  "preventive-detention",
  "indian-polity",
  "local-government",
  "delegated-legislation",
  "protection-of-human-rights-act",
  "women-rights",
  "child-rights",
  "minority-rights",
  "posh-act",
  "maternity-benefit-act",
  "mental-healthcare-act",
  "national-food-security-act",
  "rpwd-act",
  "child-labour-act",
  "hindu-marriage-act",
  "special-marriage-act",
  "hindu-adoption-maintenance-act",
  "hindu-minority-guardianship-act",
  "rera",
  "larr-act",
  "lokpal-act",
  "corporate-business-laws",
  "employment-law",
  "minimum-wages-act",
  "payment-of-wages-act",
  "industrial-disputes-act",
  "social-security-act",
  "trade-unions-act",
  "income-tax-act",
  "cgst-act",
  "customs-act",
  "central-excise-act",
  "taxation-law",
  "legal-drafting",
  "arms-act",
  "dowry-prohibition-act",
  "uapa-act",
  "pmla-act",
  "explosive-substances-act",
  "prevention-of-corruption-amended-act",
  "armed-forces-special-powers-act",
  "competition-act",
  "sebi-act",
  "fema-act",
  "fema-non-pci-act",
  "msme-act",
  "benami-transactions-act",
  "black-money-act",
  "arbitration-act",
  "companies-act",
  "copyright-act",
  "limitation-act",
  "negotiable-instruments-act",
  "sale-of-goods-act",
  "registration-act",
  "indian-partnership-act",
  "indian-stamp-act",
  "juvenile-justice-act",
  "motor-vehicles-act",
  "ndps-act",
  "pocso-act",
  "sarfaesi-act",
  "sc-st-act",
  "trade-marks-act",
  "banking-regulation-act",
  "prevention-of-corruption-act",
  "muslim-personal-law-act",
  "dissolution-of-muslim-marriages-act",
  "indian-divorce-act",
  "parsi-marriage-divorce-act",
  "indian-christian-marriage-act",
  "prohibition-child-marriage-act",
  "guardian-wards-act",
  "maintenance-parents-senior-citizens-act",
  "wildlife-protection-act",
  "forest-conservation-act",
  "water-act",
  "air-act",
  "national-green-tribunal-act",
  "biological-diversity-act",
  "factories-act",
  "essential-commodities-act",
  "food-safety-standards-act",
  "drugs-cosmetics-act",
  "dpdp-act",
  "aadhaar-act",
  "right-to-information-act",
  "consumer-protection-act-amended",
  "fundamental-rights",
  "dpsp-fundamental-duties",
  "constitutional-schedules",
  "constitutional-parts",
  "constitutional-amendments",
  "environment-protection-act",
  "court-hierarchy-procedure",
  "indian-legal-system",
  "patents-act",
  "geographical-indications-act",
  "rbi-act",
  "irdai-act",
  "contempt-of-courts-act",
  "official-secrets-act",
  "passport-act",
  "indian-telegraph-act",
  "census-act",
  "epidemic-diseases-act",
]);

function displayActName(act: string): string {
  const overrides: Record<string, string> = {
    "bharatiya-nyaya-sanhita": "BNS",
    "bharatiya-nagrik-suraksha-sanhita": "BNSS",
    "bharatiya-sakshya-adhiniyam": "BSA",
    "bharatiya-sakshya-adhiniyam-2023": "BSA",
    "code-of-civil-procedure": "CPC",
    "code-of-criminal-procedure": "CrPC",
    "indian-penal-code": "IPC",
    constitution: "Constitution",
    "transfer-of-property-act": "Transfer of Property Act",
    "consumer-protection-act-amended": "Consumer Protection Act",
    "prevention-of-corruption-amended-act": "Prevention of Corruption Act",
    "code-on-wages": "Code on Wages",
    "information-technology-amended-act": "IT Act",
  };
  if (overrides[act]) return overrides[act];
  return act
    .split("-")
    .map((w) => w.replace(/^\d/, ""))
    .filter(Boolean)
    .join(" ");
}

async function getLegalKnowledge(
  query: string,
): Promise<{ context: string; citations: Citation[] }> {
  const citations: Citation[] = [];
  try {
    const parts: string[] = [];
    const lower = query.toLowerCase();

    const { sections: sectionMatches, articles: articleMatches } =
      extractRefNumbers(query);

    // Cross-act section mapping: if a cited section matches a known old→new
    // law mapping (IPC→BNS, CrPC→BNSS, Evidence Act→BSA), fetch BOTH the old
    // and the new equivalent so the answer is grounded in actual statute text.
    const mappingParts: string[] = [];
    if (sectionMatches.length > 0) {
      const oldActKeys = new Set(SECTION_MAPPINGS.map((m) => m.actKey));
      const mappingPromises: Promise<void>[] = [];
      for (const secNum of sectionMatches) {
        for (const key of oldActKeys) {
          mappingPromises.push(
            s3kb.getSection(key, secNum).then((sec) => {
              if (sec) {
                mappingParts.push(
                  `[${key.toUpperCase()} Section ${sec.section}] ${sec.title}: ${sec.text}`,
                );
              }
            }),
          );
        }
        for (const m of SECTION_MAPPINGS) {
          if (m.oldSection === secNum) {
            mappingPromises.push(
              s3kb.getSection(m.newActKey, m.newSection).then((newSec) => {
                if (newSec) {
                  mappingParts.push(
                    `[${m.newActKey.toUpperCase()} Section ${newSec.section} — ${m.offence}] ${newSec.title}: ${newSec.text}`,
                  );
                }
              }),
            );
          }
        }
      }
      await Promise.all(mappingPromises);
    }

    let targetAct = "";
    for (const [key, val] of Object.entries(ACT_MAP)) {
      if (lower.includes(key)) {
        targetAct = val;
        break;
      }
    }

    if (targetAct && sectionMatches.length > 0) {
      const sectionPromises = sectionMatches.map((secNum) =>
        s3kb.getSection(targetAct, secNum).then((sec) => {
          if (sec) {
            parts.push(
              `[${targetAct.toUpperCase()} Section ${sec.section}] ${sec.title}: ${sec.text}`,
            );
            citations.push({
              type: "act",
              label: `${displayActName(targetAct)} § ${sec.section}`,
              snippet: `${sec.title}: ${sec.text}`,
            });
          }
        }),
      );
      await Promise.all(sectionPromises);
    }

    if (!targetAct && sectionMatches.length > 0) {
      const raw = await s3kb.getFullTextIndex();
      if (raw) {
        const ids: string[] = [];
        for (const entry of raw) {
          const id = typeof entry === "string" ? entry : entry.id;
          if (id !== "constitution") ids.push(id);
        }
        for (const secNum of sectionMatches) {
          for (const id of ids) {
            const sec = await s3kb.getSection(id, secNum);
            if (sec) {
              parts.push(
                `[${id.toUpperCase()} Section ${sec.section}] ${sec.title}: ${sec.text}`,
              );
              citations.push({
                type: "act",
                label: `${displayActName(id)} § ${sec.section}`,
                snippet: `${sec.title}: ${sec.text}`,
              });
              break;
            }
          }
        }
      }
    }

    if (articleMatches.length > 0) {
      const articlePromises = articleMatches.map((artNum) =>
        s3kb.getSection("constitution", artNum).then((sec) => {
          if (sec) {
            parts.push(
              `[Constitution Article ${sec.section}] ${sec.title}: ${sec.text}`,
            );
            citations.push({
              type: "act",
              label: `Constitution Art. ${sec.section}`,
              snippet: `${sec.title}: ${sec.text}`,
            });
          }
        }),
      );
      await Promise.all(articlePromises);
    }

    if (targetAct && parts.length === 0) {
      // Try the cheaper section-list approach first (1 S3 call for list + 1 for section)
      const secList = await s3kb.getSectionList(targetAct);
      if (secList) {
        const words = lower
          .replace(/[^a-z\s]/g, " ")
          .split(/\s+/)
          .filter(
            (w) =>
              w.length > 3 &&
              ![
                "what",
                "the",
                "for",
                "and",
                "that",
                "this",
                "with",
                "under",
                "from",
                "about",
              ].includes(w),
          );
        let bestMatch = null;
        let bestScore = 0;
        for (const s of secList) {
          const titleLower = s.title.toLowerCase();
          let score = 0;
          for (const w of words) {
            if (titleLower.includes(w)) score++;
          }
          if (score > bestScore) {
            bestScore = score;
            bestMatch = s;
          }
        }
        if (bestMatch && bestScore > 0) {
          const sec = await s3kb.getSection(targetAct, bestMatch.section);
          if (sec) {
            parts.push(
              `[${targetAct.toUpperCase()} Section ${sec.section}] ${sec.title}: ${sec.text}`,
            );
            citations.push({
              type: "act",
              label: `${displayActName(targetAct)} § ${sec.section}`,
              snippet: `${sec.title}: ${sec.text}`,
            });
          }
        }
      }
      // Only fetch full text as a last resort (expensive — entire act from S3)
      if (parts.length === 0 && fullTextActs.has(targetAct)) {
        const full = await s3kb.getFullText(targetAct);
        if (full) {
          parts.push(
            `[${targetAct.toUpperCase()} Full Text]\n${full.substring(0, 3000)}...`,
          );
          citations.push({
            type: "act",
            label: displayActName(targetAct),
            snippet: full.substring(0, 3000),
          });
        }
      }
    }

    if (parts.length === 0) {
      const keywords = lower
        .replace(/[^a-z\s]/g, " ")
        .split(/\s+/)
        .filter(
          (w) =>
            w.length > 2 &&
            ![
              "the",
              "for",
              "and",
              "what",
              "can",
              "with",
              "are",
              "not",
              "under",
              "from",
              "about",
              "explain",
              "tell",
              "does",
              "say",
              "section",
              "article",
            ].includes(w),
        );
      const searchQuery = keywords.join(" ");

      const searchResults = await s3kb.searchActs(searchQuery);
      if (searchResults.length > 0) {
        const sectionFetches = searchResults.slice(0, 5).map(async (r) => {
          const sec = await s3kb.getSection(r.act, r.section);
          const text = sec ? sec.text : "";
          if (text) {
            return {
              part: `[${r.act.toUpperCase()} ${r.section}] ${r.title}: ${text}`,
              citation: {
                type: "act" as const,
                label: `${displayActName(r.act)} § ${r.section}`,
                snippet: `${r.title}: ${text}`,
              },
            };
          }
          return null;
        });
        const fetched = await Promise.all(sectionFetches);
        for (const item of fetched) {
          if (item) {
            parts.push(item.part);
            citations.push(item.citation);
          }
        }
      }
    }

    const refChecks: Array<{ keywords: string[]; key: string; label: string }> =
      [
        {
          keywords: ["bail", "bailable", "non-bailable"],
          key: "bailable-offenses",
          label: "Bailable/Non-Bailable Offenses",
        },
        {
          keywords: ["limitation", "time limit", "file a case", "file suit"],
          key: "limitation-periods",
          label: "Limitation Periods",
        },
        {
          keywords: [
            "writ",
            "habeas",
            "mandamus",
            "certiorari",
            "quo warranto",
          ],
          key: "writ-types",
          label: "Types of Writs",
        },
        {
          keywords: [
            "court",
            "jurisdiction",
            "supreme court",
            "high court",
            "district court",
          ],
          key: "court-hierarchy",
          label: "Court Hierarchy",
        },
      ];

    // Parallelize reference data checks
    const matchedRefs = refChecks.filter((ref) =>
      ref.keywords.some((k) => lower.includes(k)),
    );
    const refResults = await Promise.all(
      matchedRefs.map(async (ref) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const data = await s3kb.getReference<any>(ref.key);
        return data ? { label: ref.label, data } : null;
      }),
    );
    for (const result of refResults) {
      if (result) {
        parts.push(
          `\n[${result.label}]:\n${JSON.stringify(result.data, null, 2)}`,
        );
        citations.push({
          type: "act",
          label: result.label,
          snippet: JSON.stringify(result.data, null, 2),
        });
      }
    }

    const allParts = [...mappingParts, ...parts];
    return {
      context:
        allParts.length > 0
          ? `Legal Knowledge Base:\n${allParts.join("\n\n")}`
          : "",
      citations,
    };
  } catch (error) {
    console.error("S3 knowledge error:", error);
    return { context: "", citations };
  }
}

function extractTextFromContent(
  content:
    | string
    | Array<{ type: string; text?: string; image_url?: { url: string } }>,
): string {
  if (typeof content === "string") return content;
  return content
    .filter((p: { type: string }) => p.type === "text")
    .map((p: { text?: string }) => p.text || "")
    .join(" ");
}

/**
 * Short-lived session cache.
 *
 * `auth.api.getSession` is a Postgres round trip on every single chat message —
 * measured at ~0.5s warm and ~1.9s when the Neon pool is cold. That is pure
 * overhead sitting in front of a model that answers in about a second, so a
 * multi-turn conversation pays it on every turn. Resolved sessions are cached
 * per session cookie for a short window; a miss is never cached, so signing in
 * still takes effect immediately. Bounded and TTL'd like the S3 cache.
 */
type Session = Awaited<ReturnType<typeof auth.api.getSession>>;
const SESSION_CACHE_TTL_MS = 60_000;
const SESSION_CACHE_MAX = 500;
const sessionCache = new Map<string, { session: unknown; ts: number }>();

/** Returns `undefined` on a miss so a cached `null` stays distinguishable. */
function getCachedSession(cookie: string): Session | undefined {
  if (!cookie) return undefined;
  const entry = sessionCache.get(cookie);
  if (!entry) return undefined;
  if (Date.now() - entry.ts > SESSION_CACHE_TTL_MS) {
    sessionCache.delete(cookie);
    return undefined;
  }
  return entry.session as Session;
}

function setCachedSession(cookie: string, session: Session): void {
  if (!cookie) return;
  if (sessionCache.size >= SESSION_CACHE_MAX) {
    const oldest = sessionCache.keys().next().value;
    if (oldest) sessionCache.delete(oldest);
  }
  sessionCache.set(cookie, { session, ts: Date.now() });
}

export async function POST(request: NextRequest) {
  // Phase timer: latency is only fixable once you can attribute it. `reqStart`
  // → context fetch covers auth (a Neon round trip) and body parsing.
  const reqStart = Date.now();
  try {
    let session = getCachedSession(request.headers.get("cookie") ?? "");
    if (session === undefined) {
      session = null;
      for (let attempt = 0; attempt < 2; attempt++) {
        try {
          session = await auth.api.getSession({ headers: request.headers });
          break;
        } catch {
          if (attempt === 0) {
            await new Promise((r) => setTimeout(r, 200));
            continue;
          }
          session = null;
        }
      }
      // Only cache a hit: caching a miss would lock a just-signed-in user out
      // for the TTL.
      if (session) {
        setCachedSession(request.headers.get("cookie") ?? "", session);
      }
    }
    const sessionMs = Date.now() - reqStart;

    if (!session) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const rateLimitKey = `chat:${session.user.id}`;
    const { allowed, retryAfterMs } = checkRateLimit(rateLimitKey, 30, 60_000);
    if (!allowed) {
      return Response.json(
        { error: "Too many requests. Please try again later." },
        {
          status: 429,
          headers: { "Retry-After": String(Math.ceil(retryAfterMs / 1000)) },
        },
      );
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return Response.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const {
      messages,
      conversationType: rawConversationType,
      model: rawModelId,
    } = body as {
      messages?: unknown;
      conversationType?: string;
      model?: string;
    };
    let conversationType = rawConversationType;
    if (conversationType === "chat") conversationType = "talk-to-ai";

    if (!Array.isArray(messages) || messages.length === 0) {
      return Response.json(
        { error: "messages must be a non-empty array" },
        { status: 400 },
      );
    }

    if (messages.length > MAX_MESSAGES) {
      return Response.json(
        { error: `Too many messages. Maximum is ${MAX_MESSAGES}.` },
        { status: 400 },
      );
    }

    if (conversationType && !VALID_CONVERSATION_TYPES.has(conversationType)) {
      return Response.json(
        { error: "Invalid conversationType" },
        { status: 400 },
      );
    }

    for (const msg of messages) {
      if (!msg || typeof msg !== "object") {
        return Response.json(
          { error: "Each message must be an object" },
          { status: 400 },
        );
      }
      const m = msg as { role?: string; content?: unknown };
      if (m.role !== "user" && m.role !== "assistant" && m.role !== "system") {
        return Response.json(
          { error: "Each message must have role: user, assistant, or system" },
          { status: 400 },
        );
      }
      if (
        typeof m.content === "string" &&
        m.content.length > MAX_MESSAGE_LENGTH
      ) {
        return Response.json(
          {
            error: `Message content too long. Maximum is ${MAX_MESSAGE_LENGTH} characters.`,
          },
          { status: 400 },
        );
      }
      if (Array.isArray(m.content)) {
        for (const part of m.content) {
          if (!part || typeof part !== "object") {
            return Response.json(
              { error: "Invalid content part structure" },
              { status: 400 },
            );
          }
          const p = part as { type?: string };
          if (p.type !== "text" && p.type !== "image_url") {
            return Response.json(
              { error: "Content parts must be type 'text' or 'image_url'" },
              { status: 400 },
            );
          }
        }
      }
    }

    if (!isProviderConfigured("inception") && !isProviderConfigured("nvidia")) {
      return Response.json(
        {
          error:
            "No AI provider is configured. Set INCEPTION_API_KEY (default) or NVIDIA_API_KEY (fallback).",
        },
        { status: 500 },
      );
    }

    const lastUserMessage = messages
      .filter((m: { role: string }) => m.role === "user")
      .pop();

    const userQuery = lastUserMessage
      ? extractTextFromContent(lastUserMessage.content)
      : "";

    const isFollowUp = (() => {
      const q = userQuery.trim().toLowerCase();
      if (q.length > 80) return false;
      const followUpPatterns =
        /^(explain|tell me more|continue|elaborate|what do you mean|can you clarify|say more|go on|what else|how|why|when|where|who|what|which|details?|more|again|really|seriously|true|correct|right|yes|no|ok|okay|sure|thanks|thank you|help)$/i;
      if (followUpPatterns.test(q)) return true;
      const words = q.split(/\s+/).filter(Boolean);
      if (
        words.length <= 3 &&
        !/\b(section|article|act|law|legal|court|ipc|crpc|bns|bnss|bsa|constitution)\b/i.test(
          q,
        )
      ) {
        const userMessages = messages.filter(
          (m: { role: string }) => m.role === "user",
        );
        if (userMessages.length >= 2) return true;
      }
      return false;
    })();

    let contextQuery = userQuery;
    if (isFollowUp) {
      const userMessages = messages.filter(
        (m: { role: string }) => m.role === "user",
      );
      for (let i = userMessages.length - 2; i >= 0; i--) {
        const prevText = extractTextFromContent(userMessages[i].content).trim();
        if (prevText.length > 20) {
          contextQuery = prevText;
          break;
        }
      }
    }

    // Document Drafter is intentionally narrower than the general legal chat.
    // Track whether a draft is already underway so short factual answers
    // ("No", "Rs 50,000", "Delhi") are not mistaken for off-topic questions.
    const hasDraftContext =
      conversationType === "draft" &&
      messages.slice(0, -1).some((m) => {
        if (m.role === "user") {
          return isDocumentDraftingQuery(extractTextFromContent(m.content));
        }
        if (m.role === "assistant") {
          const text = extractTextFromContent(m.content);
          return (
            text.includes(DRAFT_DISCLAIMER) ||
            /\b(?:LEGAL NOTICE|FIRST INFORMATION REPORT|AFFIDAVIT|CONSUMER COMPLAINT|RTI APPLICATION|WILL|PETITION|CONTRACT|AGREEMENT)\b/i.test(
              text,
            )
          );
        }
        return false;
      });
    const lastAssistant = messages
      .filter((m) => m.role === "assistant")
      .pop();
    const awaitingDraftAnswer =
      !!lastAssistant &&
      /\?\s*$/.test(extractTextFromContent(lastAssistant.content).trim());

    // AI Lawyer (grill) intake: the questions are answered in short fragments,
    // so the final advice should be grounded in the whole case the user has
    // described, not just the last word ("Yes", "Maharashtra"). Bounded so the
    // system prompt stays small and fast.
    const grillIntakeQuery =
      conversationType === "grill"
        ? messages
            .filter((m: { role: string }) => m.role === "user")
            .map((m) => extractTextFromContent(m.content))
            .join("\n")
            .trim()
            .slice(-1500)
        : "";

    const refs = extractRefNumbers(userQuery);
    const refCount = refs.sections.length + refs.articles.length;
    const tableAppropriate =
      refs.sections.length >= 2 && refs.articles.length === 0;

    let systemPrompt = getSystemPrompt(conversationType);
    if (conversationType === "talk-to-ai" && tableAppropriate) {
      systemPrompt = `You are a concise Indian legal assistant. The user asked about ${refCount} legal sections/articles. Present the answer ONLY as a compact markdown table with EXACTLY 3 columns. Obey EVERY rule strictly:
1. Header row must be exactly: | Section | Offence | Punishment |
2. Separator row: | --- | --- | --- |
3. ONE row per requested section/article, in the same order the user mentioned them. NEVER skip any, NEVER add a row for anything else.
4. Offence cell: a short name or phrase, MAX 6 words. Never paste a definition, never list sub-clauses, never use a,b,c lists.
5. Punishment cell: MAX 8 words (e.g. "Imprisonment up to 7 years + fine").
6. Section cell: just the number (e.g. 103, 74, 245) or "Article 302" — no extra text.
7. NEVER transpose the table, never add extra columns or extra rows, never add bold headers, bullets, numbered points, or paragraphs inside cells.
8. End with exactly ONE short closing sentence (max 15 words).
No other formatting. If a cell would exceed the word limit, shorten it. NEVER output instructions, rules, or meta-commentary — only the table and closing sentence.`;
    }

    if (conversationType === "analysis" && tableAppropriate) {
      systemPrompt = `You are Lawbite AI, an Indian legal assistant. The user asked about ${refCount} legal sections/articles. This is a DEEP ANALYSIS request — the response MUST be far more detailed than a quick chat reply. Produce THREE parts:

PART 1 — QUICK REFERENCE TABLE (compact, for scanning):
- Header row: | Section | Offence | Punishment |
- Separator row: | --- | --- | --- |
- ONE row per requested section/article, in the same order the user mentioned them. NEVER skip any.
- Offence cell: short phrase, MAX 6 words. Punishment cell: MAX 8 words (e.g. "Imprisonment up to 7 years + fine").
- NEVER transpose the table, never add "Aspect" columns or a column per section, never leave any cell blank.

PART 2 — PER-SECTION ANALYSIS (the main substance; one compact block per section):
- For EACH section, start with a bold header line like **Section 103 — <Offence name>**.
- Then use these bullet lead-ins, one line each:
  - **What it covers:** one plain-English line.
  - **Key ingredients:** max 3 short bullets.
  - **Punishment:** one line.
  - **Why it matters:** one practical example or consequence.
- Keep each section block to about 6-8 lines. Do not write paragraphs.

PART 3 — KEY TAKEAWAYS:
- End with **Key Takeaways:** followed by 3-4 concise bullet points summarizing the sections together.

Never transpose tables, never leave a table cell blank, never invent section numbers or provisions. Only use facts from the legal knowledge provided.`;
    }

    const greetingPattern =
      /^(hi|hello|hey|namaste|namaskar|good\s*(morning|afternoon|evening)|yo|sup|hii|helloo|hey there|hello there)\s*[!.]*$/i;
    if (
      userQuery &&
      greetingPattern.test(userQuery.trim()) &&
      conversationType !== "grill"
    ) {
      const greeting =
        conversationType === "draft"
          ? "Hello! How can I assist you with drafting an Indian legal document today?"
          : "Hello! How can I assist you with Indian legal matters today?";
      const encoder = new TextEncoder();
      const stream = new ReadableStream({
        start(controller) {
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({ content: greeting })}\n\n`,
            ),
          );
          controller.enqueue(encoder.encode("data: [DONE]\n\n"));
          controller.close();
        },
      });
      return new Response(stream, {
        headers: {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache, no-transform",
          Connection: "keep-alive",
          "X-Accel-Buffering": "no",
        },
      });
    }

    // Identity, model, prompt-injection and product questions are out of scope
    // in every mode. Check before the mode-specific branches so draft, review
    // and grill cannot be used to extract the underlying model.
    if (userQuery && isAssistantMetaQuery(userQuery)) {
      return refusalStreamResponse();
    }

    // The Document Drafter must not become a second general legal chat. Refuse
    // free-standing legal questions (Article 370, Section 144, bail, etc.)
    // before any S3 or provider work, while still allowing follow-ups in an
    // active draft.
    if (
      conversationType === "draft" &&
      userQuery &&
      !isDocumentDraftingQuery(userQuery, {
        hasDraftContext,
        awaitingDraftAnswer,
      })
    ) {
      return refusalStreamResponse(DRAFT_SCOPE_REFUSAL);
    }

    if (
      userQuery &&
      isNonLegalQuery(userQuery) &&
      conversationType !== "grill" &&
      conversationType !== "draft" &&
      conversationType !== "review"
    ) {
      return refusalStreamResponse();
    }

    if (
      userQuery &&
      mentionsForeignJurisdiction(userQuery) &&
      !hasIndianContext(userQuery) &&
      conversationType !== "grill" &&
      conversationType !== "draft" &&
      conversationType !== "review"
    ) {
      return refusalStreamResponse();
    }

    const isTalkToAi = conversationType === "talk-to-ai";
    const isDraft = conversationType === "draft";
    const isAnalysis = conversationType === "analysis";
    // Chat, Talk to AI, and Grill are latency-sensitive short modes. Analysis,
    // drafting, and document review deliberately favour depth over speed.
    const isShortMode =
      !conversationType ||
      conversationType === "talk-to-ai" ||
      conversationType === "grill";
    const isAnalysisMultiRef =
      conversationType === "analysis" && tableAppropriate;
    const hasRefs = refCount >= 1;
    const queryMentionsIndianLegalTerm = (() => {
      if (!contextQuery) return false;
      const lower = contextQuery.toLowerCase();
      return Object.keys(ACT_MAP).some((key) => lower.includes(key));
    })();
    const grillUserCount = messages.filter(
      (m: { role: string }) => m.role === "user",
    ).length;
    const skipS3 =
      (isTalkToAi && !hasRefs && !queryMentionsIndianLegalTerm) ||
      // AI Lawyer's early intake questions are factual and do not need the
      // bare-act corpus. Fetch it on the advice turn (3+ user answers) so the
      // final solution stays grounded, while the questions stay fast.
      (conversationType === "grill" && grillUserCount < 3);

    const contextStart = Date.now();
    let needsSearch = false;
    if (contextQuery) {
      needsSearch = await classifyQuery(contextQuery);
    }

    const [webResult, legal] = await Promise.all([
      needsSearch
        ? webSearch(contextQuery)
        : Promise.resolve({ context: "", citations: [] as Citation[] }),
      skipS3
        ? { context: "", citations: [] as Citation[] }
        : getLegalKnowledge(grillIntakeQuery || contextQuery),
    ]);
    const contextMs = Date.now() - contextStart;
    let webSearchContext = webResult.context;
    let citations: Citation[] = [...webResult.citations];
    const legalContext = legal.context;
    citations = [...citations, ...legal.citations];

    if (!skipS3 && !legalContext && !webSearchContext && contextQuery) {
      const web = await webSearch(contextQuery);
      webSearchContext = web.context;
      citations = [...citations, ...web.citations];
    }

    const seen = new Set<string>();
    citations = citations.filter((c) => {
      const key = `${c.type}:${c.label}:${c.url ?? ""}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    let finalSystemPrompt = `${systemPrompt}\n\n${SOURCE_QUALITY_RULES}\n\n${SCOPE_RULES}`;
    const contextParts: string[] = [];
    const acronymContext = legalAcronymContext(`${userQuery}\n${contextQuery}`);
    if (acronymContext) contextParts.push(acronymContext);
    if (webSearchContext) contextParts.push(webSearchContext);
    if (legalContext) contextParts.push(legalContext);
    if (refs.sections.length > 0) {
      contextParts.push(
        `VERIFIED OLD→NEW SECTION MAPPINGS (effective 1 July 2024). Use these ONLY when the user cites an old SECTION number (IPC/CrPC/Evidence Act) — NEVER invent a different mapping, and NEVER apply these to Constitution ARTICLES:\n${mappingPromptBlock()}`,
      );
    }
    if (refs.articles.length > 0) {
      contextParts.push(
        `NOTE: "Article N" always refers to the Constitution of India (Articles are only in the Constitution). Never treat "Article N" as a section of CrPC/IPC/BNS/BNSS/BSA — those statutes have SECTIONS, not Articles.`,
      );
    }
    if (contextParts.length > 0) {
      finalSystemPrompt = `${finalSystemPrompt}\n\nIMPORTANT: Use the following information to answer the user's question. Incorporate this into your response:\n\n${contextParts.join("\n\n")}`;
    }

    // AI Lawyer must end with advice, not an endless interview. Once the user
    // has answered a few questions without receiving advice, force the closing
    // summary so the session always produces a solution. The directive is
    // appended to the outgoing copy of the last user turn only (never stored),
    // because models follow it more reliably there than in the system prompt.
    const forceGrillAdvice = (() => {
      if (conversationType !== "grill") return false;
      const grillAdviceGiven = messages.some(
        (m: { role: string; content?: unknown }) =>
          m.role === "assistant" &&
          typeof m.content === "string" &&
          m.content.includes("[ADVICE_COMPLETE]"),
      );
      return !grillAdviceGiven && grillUserCount >= 3;
    })();

    let messagesWithSystem: { role: string; content: unknown }[];
    if (isTalkToAi) {
      const userMessages = messages.filter(
        (m: { role: string }) => m.role === "user",
      );
      const recentMessages = userMessages.slice(-10);
      const contextMessages = messages
        .filter((m: { role: string }) => m.role !== "system")
        .slice(-20);
      messagesWithSystem = [
        { role: "system", content: finalSystemPrompt },
        ...contextMessages,
      ];
      if (contextMessages.length === 0) {
        messagesWithSystem = [
          { role: "system", content: finalSystemPrompt },
          ...recentMessages,
        ];
      }
    } else {
      // Cap conversation history to last 20 messages for all modes
      const recentMessages = messages
        .filter((m: { role: string }) => m.role !== "system")
        .slice(-20);
      messagesWithSystem = [
        { role: "system", content: finalSystemPrompt },
        ...recentMessages,
      ];
    }

    if (forceGrillAdvice) {
      for (let i = messagesWithSystem.length - 1; i >= 0; i--) {
        const message = messagesWithSystem[i];
        if (message.role === "user" && typeof message.content === "string") {
          messagesWithSystem[i] = {
            ...message,
            content: `${message.content}\n\n[Instruction: You now have enough information. Do NOT ask any question. Output ONLY the complete final legal advice, starting directly with **Bottom line** (no acknowledgement and no "---"). Follow the five-part shape: **Bottom line**, **The law**, **What to do now** with **Step 1:**, **Step 2:** lines, **Next steps if refused**, **Timeline and cost**. If you are genuinely weighing 2-3 remedies or options, add one compact comparison table as the very last block before [ADVICE_COMPLETE]; never write prose after the table. Put [ADVICE_COMPLETE] exactly once, as the very last line. Never write instruction text and never repeat the marker.]`,
          };
          break;
        }
      }
    }

    const maxTokens =
      conversationType === "analysis"
        ? 16384
        : conversationType === "talk-to-ai"
          ? 4096
          : conversationType === "grill"
            ? 4096
            : conversationType === "review"
              ? 4096
              : conversationType === "draft"
                ? 12288
                : 4096;

    const hasMultimodalContent =
      Array.isArray(lastUserMessage?.content) &&
      lastUserMessage.content.some(
        (p: { type: string }) => p.type === "image_url",
      );
    // Only actual image input needs the vision model. A text PDF (the review
    // endpoint extracts its text) is better served by the main text chain: it
    // is faster, has a larger context, and is stronger at legal analysis than
    // the 11B vision model. Image attachments still route to vision.
    const needsVision = hasMultimodalContent;

    // Resolve the request into an ordered failover chain: the requested model
    // first (the chat client sends none, so this is the default Mercury 2.5),
    // then its provider siblings, then the other provider — so an Inception
    // outage degrades to NVIDIA automatically.
    const modelsToTry = buildCandidateChain({
      requestedModelId: rawModelId,
      needsVision,
    });
    const requestedModel = modelsToTry[0];
    // The Inception free tier is frequently at capacity and answers a 429 in a
    // few hundred milliseconds. For short modes, retry the accurate Mercury 2.5
    // a couple of times before dropping to NVIDIA, whose first token is several
    // seconds slower. These repeats are for *fast* refusals only: the loop below
    // skips them as soon as one attempt stalls, so a silent provider cannot
    // burn three first-token watchdogs before the fallback is tried.
    // Mercury 2 is not retried automatically: it is fast but hallucinated old
    // IPC numbers in accuracy testing.
    const requestChain = (() => {
      if (!isShortMode || needsVision) return modelsToTry;
      const best = modelsToTry[0];
      if (best.id !== "inception:mercury-2.5") return modelsToTry;
      return [best, best, best, ...modelsToTry.slice(1)];
    })();

    // Reasoning effort is the single biggest latency lever on Mercury. The API
    // documents `medium` as the default, which costs several seconds of hidden
    // reasoning before the first visible token — so we always send an explicit
    // level. Short modes run at `instant`; deeper modes get one step more.
    // `CHAT_REASONING_EFFORT` overrides every mode. The vision model is not a
    // reasoning model, so it gets no effort hint at all.
    const reasoningEffort: ReasoningEffort | undefined = needsVision
      ? undefined
      : resolveReasoningEffort(conversationType);
    // `realtime` asks Inception for the lowest time-to-first-token. Measurements
    // on the free tier show it roughly halves TTFT and improves the chance of
    // getting through when capacity is tight, so it is on by default. Set
    // CHAT_REALTIME=0 to turn it off. NVIDIA drops the flag (unsupported).
    const wantRealtime = !needsVision && process.env.CHAT_REALTIME !== "0";

    if (rawModelId && !getModel(rawModelId)) {
      console.warn(
        `[ChatAPI] unknown model "${rawModelId}", using ${requestedModel.id}`,
      );
    }

    const encoder = new TextEncoder();
    const needsPostProcess = isDraft;
    const explicitTableRequest =
      isTalkToAi &&
      /(comparison|compare|difference|differences|in a table|as a table|\btable\b)/i.test(
        userQuery,
      );
    // Deep Analysis is quality-checked (tightened, missing refs/blank cells
    // repaired) after the stream ends, so it is buffered instead of streamed.
    // Talk-to-ai tables stream as they are generated and only send a `replace`
    // frame when the repair materially changes the answer, so users see text
    // immediately instead of waiting for the whole table.
    const bufferOutput = isAnalysis;
    let responseText = "";
    let lastError = "";
    let streamReader: ReadableStreamDefaultReader<Uint8Array> | null = null;
    let streamHead = "";
    let workingModel = "";
    let workingCandidate: ModelInfo = requestedModel;
    console.log(
      `[ChatAPI] convType=${conversationType}, model=${requestedModel.id}, effort=${reasoningEffort ?? "none"}, chain=${requestChain
        .map((m) => m.id)
        .join(
          " > ",
        )}, messages=${messagesWithSystem.length}, sysPromptLen=${finalSystemPrompt.length}, sessionMs=${sessionMs}, contextMs=${contextMs}, buffered=${bufferOutput}`,
    );

    const modelStart = Date.now();
    // Short modes rely on the repeated Mercury 2.5 pass (above) instead of the
    // same-model retry loop, so each 429 is followed immediately by another
    // attempt without the long backoff. Deep modes keep the env-tunable budget.
    const retriesFor = (candidate: ModelInfo) =>
      isShortMode
        ? 0
        : candidate.id === modelsToTry[0].id
          ? RATE_LIMIT_RETRIES
          : 1;
    // A short-mode request either starts quickly or is rate-limited quickly;
    // don't let a silent model sit for the full 20s watchdog before failover.
    const firstContentTimeoutMs =
      isShortMode && !needsVision
        ? Math.min(FIRST_CONTENT_TIMEOUT_MS, 7_000)
        : FIRST_CONTENT_TIMEOUT_MS;
    const connectTimeoutMs =
      isShortMode && !needsVision
        ? Math.min(PROVIDER_CONNECT_TIMEOUT_MS, SHORT_MODE_CONNECT_TIMEOUT_MS)
        : PROVIDER_CONNECT_TIMEOUT_MS;
    // Once a Mercury attempt stalls, retrying the same silent model is pure
    // waiting. Remember that and jump straight to the other provider. A fast
    // HTTP/SSE refusal does not set this — those are the 429s the repeats exist
    // for, and they cost only milliseconds.
    let skipRemainingMercury = false;
    for (const candidate of requestChain) {
      const label = candidate.id;
      if (skipRemainingMercury && label === "inception:mercury-2.5") {
        console.warn(
          `[ChatAPI] skipping repeated ${label} after a stalled attempt`,
        );
        continue;
      }
      const elapsedMs = Date.now() - modelStart;
      // Clamp both deadlines to the remaining budget so one slow fallback
      // cannot overrun the short-mode ceiling by another full watchdog.
      const remainingBudgetMs =
        isShortMode && !needsVision
          ? SHORT_MODE_BUDGET_MS - elapsedMs
          : Number.POSITIVE_INFINITY;
      if (remainingBudgetMs <= 0) {
        lastError = `candidate walk exceeded ${SHORT_MODE_BUDGET_MS}ms budget`;
        console.warn(`[ChatAPI] ${lastError}, stopping`);
        break;
      }
      const candidateConnectTimeoutMs = Math.min(
        connectTimeoutMs,
        remainingBudgetMs,
      );
      const candidateFirstContentTimeoutMs = Math.min(
        firstContentTimeoutMs,
        remainingBudgetMs,
      );
      const reqBody = buildProviderPayload(candidate, {
        messages: messagesWithSystem,
        maxTokens: ensureReasoningBudget(candidate, maxTokens),
        temperature:
          (isTalkToAi && tableAppropriate) || isAnalysisMultiRef ? 0.3 : 1.0,
        topP: 0.95,
        stream: true,
        reasoningEffort,
        realtime: wantRealtime,
      });
      try {
        const res = await callProviderWithRetry(
          candidate,
          reqBody,
          retriesFor(candidate),
          candidateConnectTimeoutMs,
        );
        if (!res.ok) {
          lastError = `${label}: HTTP ${res.status}`;
          console.warn(
            `Model ${label} returned HTTP ${res.status}, trying next...`,
          );
          continue;
        }

        if (!needsPostProcess) {
          const reader = res.body?.getReader();
          if (!reader) {
            lastError = `${label}: empty response body`;
            console.warn(
              `Model ${label} returned an empty body, trying next...`,
            );
            continue;
          }
          const peekDecoder = new TextDecoder();
          let head = "";
          // Streaming modes reach the browser byte-by-byte, so hold each model
          // to a first-visible-token deadline and fail over if it only reasons.
          const requireVisibleContent = !bufferOutput;
          const peekDeadline = Date.now() + candidateFirstContentTimeoutMs;
          // A model that goes completely quiet sends no bytes at all, so the
          // deadline has to race the read instead of being checked after it —
          // otherwise failover stalls until the provider finally gives up.
          let peekTimer: ReturnType<typeof setTimeout> | undefined;
          const peekExpired = new Promise<null>((resolve) => {
            peekTimer = setTimeout(
              () => resolve(null),
              candidateFirstContentTimeoutMs,
            );
          });
          try {
            while (true) {
              const satisfied = requireVisibleContent
                ? hasVisibleContentDelta(head)
                : hasCompleteDataLine(head);
              if (satisfied) break;
              const read = await Promise.race([reader.read(), peekExpired]);
              if (read === null) break;
              const { done, value } = read;
              if (done) break;
              head += peekDecoder.decode(value, { stream: true });
              if (requireVisibleContent && Date.now() > peekDeadline) break;
            }
          } finally {
            clearTimeout(peekTimer);
          }
          const headError = extractSseError(head);
          const stalled =
            requireVisibleContent &&
            !headError &&
            !hasVisibleContentDelta(head);
          if (headError || stalled || !hasCompleteDataLine(head)) {
            await reader.cancel().catch(() => {});
            lastError = headError
              ? `${label}: SSE error: ${headError}`
              : stalled
                ? `${label}: no visible content within ${candidateFirstContentTimeoutMs}ms`
                : `${label}: stream ended without content`;
            // A silent Mercury attempt means the model itself is unsafe to
            // wait on again. Move to the fallback provider now instead of
            // repeating a 7s watchdog three times.
            if (
              label === "inception:mercury-2.5" &&
              (stalled || !hasCompleteDataLine(head))
            ) {
              skipRemainingMercury = true;
            }
            console.warn(
              `Model ${label} unusable (${lastError}), trying next...`,
            );
            continue;
          }
          streamReader = reader;
          streamHead = head;
          workingModel = candidate.apiModel;
          workingCandidate = candidate;
          console.log(
            `[ChatAPI] model ${label} streaming directly to client (firstTokenMs=${Date.now() - modelStart})`,
          );
          break;
        }

        const text = await res.text();
        const lines = text.split("\n");
        let hasSSEError = false;
        let hasContent = false;
        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const data = line.slice(6).trim();
          if (data === "[DONE]" || !data) continue;
          try {
            const parsed = JSON.parse(data);
            if (parsed.error) {
              hasSSEError = true;
              lastError = `${label}: SSE error: ${JSON.stringify(parsed.error)}`;
              console.warn(`Model ${label} SSE error:`, parsed.error);
              break;
            }
            if (
              parsed.choices?.[0]?.delta?.content ||
              parsed.choices?.[0]?.delta?.reasoning_content
            ) {
              hasContent = true;
            }
          } catch {
            /* skip */
          }
        }
        if (hasSSEError) continue;
        responseText = text;
        workingModel = candidate.apiModel;
        workingCandidate = candidate;
        console.log(
          `[ChatAPI] model ${label} OK, ${text.length} bytes, hasContent=${hasContent}`,
        );
        break;
      } catch (err) {
        lastError = `${label}: ${(err as Error).message}`;
        if (
          label === "inception:mercury-2.5" &&
          /timed out connecting/i.test((err as Error).message)
        ) {
          skipRemainingMercury = true;
        }
        console.warn(`Model ${label} fetch error:`, (err as Error).message);
        continue;
      }
    }

    if (!streamReader && !responseText) {
      console.error("All models failed:", lastError);
      const fallbackMsg =
        "The legal AI is briefly busy. Please send your question once more — it usually goes through on the next try.";
      const stream = new ReadableStream({
        start(controller) {
          try {
            controller.enqueue(
              encoder.encode(
                `data: ${JSON.stringify({
                  content: fallbackMsg,
                  retryable: true,
                })}\n\n`,
              ),
            );
            controller.enqueue(encoder.encode("data: [DONE]\n\n"));
          } catch {
            /* skip */
          }
          try {
            controller.close();
          } catch {
            /* skip */
          }
        },
      });
      return new Response(stream, {
        headers: {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache, no-transform",
          Connection: "keep-alive",
          "X-Accel-Buffering": "no",
        },
      });
    }

    if (streamReader && !needsPostProcess) {
      const reader = streamReader;
      const stream = new ReadableStream({
        async start(controller) {
          // Buffered modes assemble the whole reply before emitting anything,
          // so keep the connection warm and prove liveness meanwhile. The
          // client parser ignores lines that are not `data: `.
          const keepAlive = setInterval(() => {
            try {
              controller.enqueue(encoder.encode(": keepalive\n\n"));
            } catch {
              /* controller already closed */
            }
          }, KEEPALIVE_INTERVAL_MS);
          try {
            controller.enqueue(encoder.encode(": keepalive\n\n"));
          } catch {
            /* controller already closed */
          }
          // Tell the client which model actually answered. A silent failover to
          // the slower provider is otherwise invisible and just feels slow.
          try {
            controller.enqueue(
              encoder.encode(
                `data: ${JSON.stringify({
                  model: workingModel,
                  modelId: workingCandidate.id,
                  fallback: workingCandidate.id !== requestedModel.id,
                })}\n\n`,
              ),
            );
          } catch {
            /* controller already closed */
          }
          const decoder = new TextDecoder();
          let buffer = streamHead;
          let analysisFullContent = "";
          let analysisReasoningContent = "";
          let emittedAny = false;
          let allReasoningContent = "";
          let rawContent = "";
          let emittedLen = 0;
          // Exact bytes the client has been told to display, so an end-of-stream
          // repair can decide whether a `replace` frame is actually needed.
          let emittedVisibleText = "";
          const HOLD_CHARS = 40;
          const enqueueContent = (text: string) => {
            if (!text) return;
            if (!emittedAny) {
              console.log(
                `[ChatAPI] first client frame at +${Date.now() - modelStart}ms`,
              );
            }
            emittedAny = true;
            const fixed = fixArticleSectionTerminology(text);
            emittedVisibleText += fixed;
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ content: fixed })}\n\n`),
            );
          };
          // Emit only the visible suffix of the accumulated content. Holding
          // back a short tail keeps thinking/control tokens that are split
          // across chunk boundaries from ever reaching the client.
          const emitVisibleDelta = (flush: boolean) => {
            const visible = stripThinkingTokens(rawContent);
            const limit = flush ? visible.length : visible.length - HOLD_CHARS;
            if (limit <= emittedLen) return;
            const delta = visible.slice(emittedLen, limit);
            emittedLen = limit;
            enqueueContent(delta);
          };
          try {
            while (true) {
              // Process every complete line already in the buffer first — the
              // peeked head may contain finished frames before any further
              // read happens (e.g. a single-chunk response).
              for (
                let newline = buffer.indexOf("\n");
                newline !== -1;
                newline = buffer.indexOf("\n")
              ) {
                const line = buffer.slice(0, newline);
                buffer = buffer.slice(newline + 1);
                if (!line.startsWith("data: ")) {
                  controller.enqueue(encoder.encode(line + "\n"));
                  continue;
                }
                const data = line.slice(6).trim();
                if (data === "[DONE]") {
                  if (!bufferOutput) {
                    controller.enqueue(encoder.encode("data: [DONE]\n\n"));
                  }
                  continue;
                }
                if (!data) continue;
                try {
                  const parsed = JSON.parse(data);
                  if (parsed.error) continue;
                  const delta = parsed.choices?.[0]?.delta;
                  const content = delta?.content;
                  const reasoning = delta?.reasoning_content;
                  if (reasoning) {
                    allReasoningContent += reasoning;
                    if (isAnalysis) {
                      analysisReasoningContent += reasoning;
                    }
                  }
                  if (content) {
                    if (isAnalysis) {
                      analysisFullContent += content;
                    }
                    rawContent += content;
                    if (!bufferOutput) {
                      emitVisibleDelta(false);
                    }
                  }
                } catch {
                  controller.enqueue(encoder.encode(line + "\n"));
                }
              }
              const { done, value } = await reader.read();
              if (done) break;
              buffer += decoder.decode(value, { stream: true });
            }
            if (buffer.trim()) {
              controller.enqueue(encoder.encode(buffer));
            }
            if (!bufferOutput) {
              emitVisibleDelta(true);
            }

            // Buffered modes (analysis, talk-to-ai tables) post-process the
            // full reply, then emit it exactly once — quality-checked, with
            // no thinking tokens and no duplicated content.
            if (isAnalysis) {
              const effectiveContent =
                analysisFullContent || analysisReasoningContent;
              let analysis = stripThinkingTokens(effectiveContent).trim();
              if (analysis) {
                if (isAnalysisMultiRef) {
                  analysis = tightenMultiRefTable(analysis);
                }
                const requestedRefs = [...refs.sections, ...refs.articles].map(
                  (r: string) => r.toUpperCase(),
                );
                const issues: string[] = [];
                // Ref-presence is only verifiable in multi-ref tables; for
                // prose analyses every ref would look "missing" and each check
                // would burn retry API calls that can never succeed.
                if (requestedRefs.length > 0 && isAnalysisMultiRef) {
                  const presentRefs = extractTableRowRefs(analysis);
                  const missingRefs = requestedRefs.filter(
                    (r: string) => !presentRefs.includes(r),
                  );
                  if (missingRefs.length > 0) {
                    issues.push(
                      `omitted these requested section(s)/article(s): ${missingRefs.join(", ")}`,
                    );
                  }
                }
                const blankCells = findBlankTableCells(analysis);
                if (blankCells.length > 0) {
                  issues.push(
                    `left table cells blank or as placeholders: ${blankCells.slice(0, 5).join(", ")}${blankCells.length > 5 ? ` (+${blankCells.length - 5} more)` : ""}`,
                  );
                }
                if (issues.length > 0) {
                  console.log(
                    `[ChatAPI] analysis quality issues, retrying: ${issues.join("; ")}`,
                  );
                  const check = (text: string) => {
                    const normalized = isAnalysisMultiRef
                      ? tightenMultiRefTable(text)
                      : text;
                    const blankCellsNow = findBlankTableCells(normalized);
                    if (blankCellsNow.length > 0) return false;
                    if (requestedRefs.length > 0 && isAnalysisMultiRef) {
                      const presentNow = extractTableRowRefs(normalized);
                      if (
                        requestedRefs.some(
                          (r: string) => !presentNow.includes(r),
                        )
                      )
                        return false;
                    }
                    return true;
                  };
                  const retried = await retryAnalysisContent(
                    issues.join("; "),
                    check,
                    effectiveContent,
                  );
                  if (retried) {
                    const cleaned = stripThinkingTokens(retried).trim();
                    if (cleaned) analysis = cleaned;
                  }
                }
                if (analysis) {
                  enqueueContent(safelyTrimAfterBottomLine(analysis));
                }
              }
            }

            // Talk-to-ai tables stream as they are generated. The quality
            // checks still run afterwards, but only a genuine defect (omitted
            // section or blank cell) sends a `replace` frame — so the common
            // case costs no extra wait and no visible rewrite.
            if (
              isTalkToAi &&
              (tableAppropriate ||
                explicitTableRequest ||
                hasMarkdownTable(rawContent)) &&
              rawContent
            ) {
              const strippedFull = stripThinkingTokens(rawContent);
              const cleaned = cleanTalkToAiContent(strippedFull);
              // Preserve markdown (bold definitions, headings) when the model
              // produced a structured comparison; only strip it for the plain
              // multi-section table path.
              let processed = tableAppropriate
                ? tightenMultiRefTable(cleaned)
                : hasMarkdownTable(strippedFull)
                  ? normalizeTableRows(strippedFull)
                  : cleaned;
              if (processed && hasMarkdownTable(processed)) {
                const requestedRefs = [...refs.sections, ...refs.articles].map(
                  (r: string) => r.toUpperCase(),
                );
                const presentRefs = extractTableRowRefs(processed);
                const missingRefs = requestedRefs.filter(
                  (r: string) => !presentRefs.includes(r),
                );
                const blankCells = findBlankTableCells(processed);
                if (missingRefs.length > 0 || blankCells.length > 0) {
                  console.log(
                    `[ChatAPI] talk-to-ai table issues, repairing: missing=[${missingRefs.join(", ")}] blank=${blankCells.length}`,
                  );
                  if (tableAppropriate && missingRefs.length > 0) {
                    const retried = await retryMultiRefTable(
                      missingRefs,
                      requestedRefs,
                      strippedFull,
                    );
                    if (retried) processed = retried;
                  } else {
                    const check = (t: string) =>
                      findBlankTableCells(normalizeTableRows(t)).length === 0;
                    const issue =
                      blankCells.length > 0
                        ? `left table cells blank or as placeholders: ${blankCells.slice(0, 5).join(", ")}${blankCells.length > 5 ? ` (+${blankCells.length - 5} more)` : ""}`
                        : "omitted requested item(s)";
                    const retried = await retryAnalysisContent(
                      issue,
                      check,
                      strippedFull,
                    );
                    if (retried) processed = normalizeTableRows(retried);
                  }
                  const fixed = processed
                    ? fixArticleSectionTerminology(processed)
                    : "";
                  if (fixed && fixed !== emittedVisibleText) {
                    controller.enqueue(
                      encoder.encode(
                        `data: ${JSON.stringify({ replace: true, content: fixed })}\n\n`,
                      ),
                    );
                  }
                }
              }
            }

            if (!emittedAny) {
              // This is the one server-side path that used to reach the
              // client with no content at all. Log the exact shape so a
              // recurrence is diagnosable instead of a mystery.
              console.warn(
                `[ChatAPI] empty reply after post-processing (analysis=${analysisFullContent.length}ch, reasoning=${analysisReasoningContent.length}ch, buffered=${bufferOutput}, talkToAi=${isTalkToAi})`,
              );
              const reasoningFallback =
                stripThinkingTokens(allReasoningContent).trim();
              const truncated = reasoningFallback
                ? isTalkToAi
                  ? truncateToTwoSentences(reasoningFallback)
                  : reasoningFallback
                : "";
              if (truncated) {
                enqueueContent(truncated);
              } else {
                enqueueContent(
                  "I apologize, but I couldn't generate a response. Please try again or ask a specific question about Indian law.",
                );
              }
            }

            if (citations.length > 0) {
              try {
                controller.enqueue(
                  encoder.encode(`data: ${JSON.stringify({ citations })}\n\n`),
                );
              } catch {
                /* controller may be closed */
              }
            }
          } catch (err) {
            console.warn("[ChatAPI] stream pipe error:", err);
            try {
              if (isAnalysis) {
                const partial = stripThinkingTokens(
                  analysisFullContent || analysisReasoningContent,
                ).trim();
                if (partial) enqueueContent(partial);
              } else {
                emitVisibleDelta(true);
              }
            } catch {
              /* controller may be closed */
            }
            if (!emittedAny) {
              try {
                enqueueContent(
                  "I apologize, but I encountered an error while generating the response. Please try again.",
                );
              } catch {
                /* controller closed */
              }
            }
          } finally {
            clearInterval(keepAlive);
            try {
              controller.enqueue(encoder.encode("data: [DONE]\n\n"));
              controller.close();
            } catch {
              /* already closed */
            }
          }
        },
      });
      console.log(`[ChatAPI] streaming from model ${workingModel} to client`);
      return new Response(stream, {
        headers: {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache, no-transform",
          Connection: "keep-alive",
          "X-Accel-Buffering": "no",
        },
      });
    }

    function truncateToTwoSentences(text: string): string {
      const cleaned = text
        .replace(/\*{1,2}/g, "")
        .replace(/^\s*\|.*$/gm, "")
        .replace(/\|/g, "")
        .replace(
          /^(hello|hi|hey|good\s+morning|good\s+afternoon|good\s+evening|namaste|namaskar)[\s,!.]*/i,
          "",
        )
        .replace(
          /^(step|key takeaways|summary|conclusion|to summarize|in summary|warning|note|important)\s*\d*\s*:?\s*/gim,
          "",
        )
        .replace(/^[-#>\d]+\.?\s*/gm, "")
        .replace(/^[A-Za-z\s,]+:\s*$/gm, "")
        .replace(/\n{3,}/g, "\n\n")
        .trim();
      const sentences = [...cleaned.matchAll(/[A-Z][^.!?\n]+[.!?\n]+/g)];
      if (sentences.length >= 2) {
        return sentences
          .slice(0, 2)
          .map((m) => m[0].trim())
          .join(" ")
          .trim();
      }
      if (sentences.length === 1) {
        return sentences[0][0].trim();
      }
      const firstMatch = cleaned.match(/[A-Za-z][^.!?\n]*[.!?\n]*/);
      return firstMatch ? firstMatch[0].trim() : "";
    }

    /**
     * Talk to AI stays point-to-point: keep a short lead-in plus a real
     * step/bullet list instead of flattening steps into two sentences, but cap
     * the list so the reply remains brief.
     */
    function truncateTalkToAi(text: string): string {
      const cleaned = text.trim();
      if (!cleaned) return "";
      const lines = cleaned.split("\n");
      const isListItem = (line: string) =>
        /^\s*(?:\d+[.)]|[-*•])\s+/.test(line) ||
        /^\s*\*\*step\s*\d+\b/i.test(line);
      if (!lines.some(isListItem)) return truncateToTwoSentences(cleaned);

      const out: string[] = [];
      let leadLines = 0;
      let listItems = 0;
      for (const raw of lines) {
        const line = raw.trim();
        if (!line) {
          if (out.length > 0 && out[out.length - 1] !== "") out.push("");
          continue;
        }
        if (isListItem(line)) {
          if (listItems >= 6) break;
          listItems += 1;
          out.push(line);
          continue;
        }
        if (listItems === 0 && leadLines < 2) {
          leadLines += 1;
          out.push(line);
          continue;
        }
        if (
          listItems > 0 &&
          /^\*\*(?:bottom line|takeaway|key takeaway):?\*\*/i.test(line)
        ) {
          out.push(line);
          break;
        }
      }
      const result = out
        .join("\n")
        .replace(/\n{3,}/g, "\n\n")
        .trim();
      return result || truncateToTwoSentences(cleaned);
    }

    /** Bold the closing label so the client renders it as a heading. */
    function normalizeBottomLine(text: string): string {
      return text.replace(/^(\s*)Bottom line:/gim, "$1**Bottom line:**");
    }

    /**
     * A comparison must end at "Bottom line". Models sometimes append a second
     * conclusion ("Practical takeaway" / "Key Takeaways"), which renders as a
     * duplicate callout. Drop anything after the Bottom line block.
     */
    function trimAfterBottomLine(text: string): string {
      const lines = text.split("\n");
      let bottom = -1;
      for (let i = 0; i < lines.length; i++) {
        if (
          /^\s*\*{0,2}Bottom line\*{0,2}\s*[:\u2013\u2014-]/i.test(lines[i])
        ) {
          bottom = i;
        }
      }
      if (bottom === -1) return text;
      for (let i = bottom + 1; i < lines.length; i++) {
        const l = lines[i].trim();
        if (!l) continue;
        if (/^\*\*[^*]{1,80}:?\*\*\s*$/.test(l)) {
          return lines.slice(0, i).join("\n").trimEnd();
        }
      }
      return text;
    }

    /**
     * A cosmetic trim must never be able to blank out a valid answer. If the
     * guard itself fails, fall back to the untouched analysis so the user
     * still gets the legal content instead of an empty (error-looking) stream.
     */
    function safelyTrimAfterBottomLine(text: string): string {
      try {
        return trimAfterBottomLine(text);
      } catch {
        return text;
      }
    }

    function cleanTalkToAiContent(text: string): string {
      return text
        .replace(/\*{1,2}/g, "")
        .split("\n")
        .map((line) => line.replace(/^\s*[-+>#]\s+/, "").trim())
        .join("\n")
        .replace(/\n{3,}/g, "\n\n")
        .trim();
    }

    function tightenMultiRefTable(text: string): string {
      const MAX_OFFENCE_WORDS = 8;
      const MAX_PUNISHMENT_WORDS = 10;
      const lines = text.split("\n");
      const out: string[] = [];
      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed.startsWith("|")) {
          out.push(line);
          continue;
        }
        // Reconstruct a well-formed 3-column row even when the model dropped the trailing pipe.
        const cells = trimmed.split("|").map((c) => c.trim());
        const body = trimmed.endsWith("|")
          ? cells.slice(1, -1)
          : cells.slice(1);
        if (body.length !== 3) {
          out.push(line);
          continue;
        }
        const isSeparator = /^:?-{2,}:?$/.test(body[0].trim());
        const isHeader = /^section$/i.test(body[0]);
        if (isHeader) {
          out.push("| Section | Offence | Punishment |");
          continue;
        }
        if (isSeparator) {
          out.push("| --- | --- | --- |");
          continue;
        }
        const cap = (s: string, n: number) => {
          const w = s.split(/\s+/).filter(Boolean);
          return w.length > n ? w.slice(0, n).join(" ") + "…" : s;
        };
        out.push(
          `| ${body[0]} | ${cap(body[1], MAX_OFFENCE_WORDS)} | ${cap(body[2], MAX_PUNISHMENT_WORDS)} |`,
        );
      }
      return out.join("\n");
    }

    function extractTableRowRefs(text: string): string[] {
      const refs: string[] = [];
      for (const line of text.split("\n")) {
        const t = line.trim();
        if (!t.startsWith("|") || !t.endsWith("|")) continue;
        const cells = t.split("|").map((c) => c.trim());
        const body = cells.slice(1, -1);
        if (body.length === 0) continue;
        const first = body[0];
        if (/^:?-{2,}:?$/.test(first.trim()) || /^section$/i.test(first))
          continue;
        const m = first.match(/\d+[A-Za-z]?/);
        if (m) refs.push(m[0].toUpperCase());
      }
      return refs;
    }

    function normalizeTableRows(text: string): string {
      return text
        .split("\n")
        .map((line) => {
          const t = line.trim();
          if (!t.startsWith("|")) return line;
          const cells = t.split("|").map((c) => c.trim());
          const body = t.endsWith("|") ? cells.slice(1, -1) : cells.slice(1);
          if (body.length < 2) return line;
          return `| ${body.join(" | ")} |`;
        })
        .join("\n");
    }

    function hasMarkdownTable(text: string): boolean {
      return (
        /(^|\n)\s*\|.*\|\s*(\n|$)/.test(text) &&
        /\|\s*:?-{2,}:?\s*\|/.test(text)
      );
    }

    function findBlankTableCells(text: string): string[] {
      const placeholderRe =
        /^\s*(?:[-–—]{1,4}|n\/?a\.?|nil|none|not applicable|same as (?:above|previous|the (?:above|previous))|ditto)\s*$/i;
      const problems: string[] = [];
      let header: string[] | null = null;
      let afterSeparator = false;
      for (const line of text.split("\n")) {
        const t = line.trim();
        if (!t.startsWith("|")) {
          header = null;
          afterSeparator = false;
          continue;
        }
        const cells = t.split("|").map((c) => c.trim());
        const body = t.endsWith("|") ? cells.slice(1, -1) : cells.slice(1);
        if (body.length < 2) continue;
        if (/^:?-{2,}:?$/.test(body[0].trim()) || /^===/.test(body[0])) {
          if (!header) header = body.map(() => "");
          afterSeparator = true;
          continue;
        }
        if (!header) {
          header = body;
          afterSeparator = false;
          continue;
        }
        if (!afterSeparator) continue;
        const rowLabel = body[0] || "(unnamed row)";
        for (let ci = 1; ci < body.length; ci++) {
          const cell = body[ci];
          if (!cell || placeholderRe.test(cell)) {
            const colLabel = header[ci] || `column ${ci + 1}`;
            problems.push(`"${rowLabel}" / "${colLabel}"`);
          }
        }
      }
      return problems;
    }

    function isDraftRefusal(text: string): boolean {
      const c = stripThinkingTokens(text).trim();
      if (c.length > 400) return false;
      return /(?:cannot|can't|unable to|am unable|cannot create|cannot draft|cannot provide|not able to|as an ai|unlawful purpose|illegal purpose|against (?:my|our) (?:guidelines|policy|principles)|refus)/i.test(
        c,
      );
    }

    function isBlankDraftRequest(query: string): boolean {
      return /^please draft a .+ with the following details:?\s*$/i.test(
        query.trim(),
      );
    }

    function isChequeDishonourRequest(query: string): boolean {
      return (
        /\b(?:cheque|check)\b/i.test(query) &&
        /\b(?:dishonou?r|bounce[d]?|returned unpaid|insufficient funds)\b/i.test(
          query,
        )
      );
    }

    function isFabricatedBlankDraft(text: string): boolean {
      const c = stripThinkingTokens(text).trim();
      if (c.length < 100) return false;
      const labels = new Set(
        [...c.matchAll(/\[[^\]]+\]/g)].map((m) => m[0].toLowerCase()),
      );
      labels.delete("[current date]");
      return labels.size < 2;
    }

    async function retryMultiRefTable(
      missingRefs: string[],
      allRefs: string[],
      prevContent: string,
    ): Promise<string | null> {
      const lastUserMsg = messagesWithSystem
        .filter((m: { role: string }) => m.role === "user")
        .slice(-1)[0];
      const overrideMessage = `The previous response omitted these requested section(s)/article(s): ${missingRefs.join(", ")}. This is not acceptable. Reproduce the ENTIRE compact markdown table again with EXACTLY ONE row for EACH of: ${allRefs.join(", ")} — in the order listed. NEVER skip any, never add extra rows. Header: | Section | Offence | Punishment |. Offence cell: max 6 words. Punishment cell: max 8 words. After the table add exactly ONE short closing sentence (max 15 words). Nothing else.`;
      const retryMessages: { role: string; content: unknown }[] = [
        { role: "system", content: finalSystemPrompt },
      ];
      if (lastUserMsg) retryMessages.push(lastUserMsg);
      retryMessages.push({
        role: "assistant",
        content: stripThinkingTokens(prevContent).trim(),
      });
      retryMessages.push({ role: "user", content: overrideMessage });
      try {
        const retryRes = await callProvider(
          workingCandidate,
          retryParams(workingCandidate, {
            messages: retryMessages,
            maxTokens: ensureReasoningBudget(workingCandidate, maxTokens),
            temperature: 0.3,
            reasoningEffort,
          }),
        );
        if (!retryRes.ok) return null;
        const retryText = await retryRes.text();
        let retryContent = "";
        for (const line of retryText.split("\n")) {
          if (!line.startsWith("data: ")) continue;
          const data = line.slice(6).trim();
          if (data === "[DONE]" || !data) continue;
          try {
            const parsed = JSON.parse(data);
            if (parsed.error) continue;
            const delta = parsed.choices?.[0]?.delta?.content;
            if (delta) retryContent += delta;
          } catch {
            /* skip */
          }
        }
        const cleaned = stripThinkingTokens(retryContent).trim();
        if (!cleaned) return null;
        const tightened = tightenMultiRefTable(cleanTalkToAiContent(cleaned));
        const present = extractTableRowRefs(tightened);
        if (allRefs.some((r) => !present.includes(r))) return null;
        if (findBlankTableCells(tightened).length > 0) return null;
        return tightened;
      } catch (error) {
        console.warn("Multi-ref retry failed:", (error as Error).message);
        return null;
      }
    }

    async function retryAnalysisContent(
      issueSummary: string,
      check: (text: string) => boolean,
      prevContent: string,
    ): Promise<string | null> {
      const lastUserMsg = messagesWithSystem
        .filter((m: { role: string }) => m.role === "user")
        .slice(-1)[0];
      const overrideMessage = `The previous response is not acceptable: ${issueSummary}. Reproduce the ENTIRE analysis again with the same overall structure, fixing every issue. Rules: fill EVERY table cell with specific, distinct content — never leave a cell blank and never write "same as above", "same as previous", "ditto", "N/A", "-", or "Nil" (if an item has no value, write "Not specified in [relevant Act]"). Never skip any requested section or article. Keep cells concise.`;
      const base: { role: string; content: string }[] = [
        { role: "system", content: finalSystemPrompt },
      ];
      if (lastUserMsg)
        base.push(lastUserMsg as { role: string; content: string });
      try {
        for (let attempt = 0; attempt < 2; attempt++) {
          const retryMessages = [
            ...base,
            {
              role: "assistant",
              content: stripThinkingTokens(prevContent).trim(),
            },
            { role: "user", content: overrideMessage },
          ];
          const retryRes = await callProvider(
            workingCandidate,
            retryParams(workingCandidate, {
              messages: retryMessages,
              maxTokens: ensureReasoningBudget(workingCandidate, maxTokens),
              temperature: 0.3,
              reasoningEffort,
            }),
          );
          if (!retryRes.ok) return null;
          const retryText = await retryRes.text();
          let retryContent = "";
          for (const line of retryText.split("\n")) {
            if (!line.startsWith("data: ")) continue;
            const data = line.slice(6).trim();
            if (data === "[DONE]" || !data) continue;
            try {
              const parsed = JSON.parse(data);
              if (parsed.error) continue;
              const delta = parsed.choices?.[0]?.delta?.content;
              if (delta) retryContent += delta;
            } catch {
              /* skip */
            }
          }
          const cleaned = stripThinkingTokens(retryContent).trim();
          if (!cleaned) return null;
          const normalized = normalizeTableRows(cleaned);
          if (check(normalized)) return normalized;
          prevContent = normalized;
        }
        return null;
      } catch (error) {
        console.warn("Analysis retry failed:", (error as Error).message);
        return null;
      }
    }

    const stream = new ReadableStream({
      cancel() {
        /* client disconnected, clean up */
      },
      async start(controller) {
        let fullContent = "";
        let reasoningContent = "";
        let emittedAny = false;
        // Reasoning phases emit no client-visible bytes, and buffered modes
        // hold the whole reply back, so keep the connection warm and prove
        // liveness. The client parser ignores lines that are not `data: `.
        const keepAlive = setInterval(() => {
          try {
            controller.enqueue(encoder.encode(": keepalive\n\n"));
          } catch {
            /* controller already closed */
          }
        }, KEEPALIVE_INTERVAL_MS);
        try {
          controller.enqueue(encoder.encode(": keepalive\n\n"));
        } catch {
          /* controller already closed */
        }
        // Report the model that actually answered so a failover is visible.
        try {
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({
                model: workingModel,
                modelId: workingCandidate.id,
                fallback: workingCandidate.id !== requestedModel.id,
              })}\n\n`,
            ),
          );
        } catch {
          /* controller already closed */
        }
        const emit = (content: string) => {
          // Fix LLM hallucination: Acts (BNS/BNSS/BSA) have Sections, not Articles.
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({ content: fixArticleSectionTerminology(content) })}\n\n`,
            ),
          );
          emittedAny = true;
        };

        try {
          const lines = responseText.split("\n");
          for (const line of lines) {
            if (!line.startsWith("data: ")) continue;
            const data = line.slice(6).trim();
            if (data === "[DONE]" || !data) continue;
            try {
              const parsed = JSON.parse(data);
              if (parsed.error) continue;
              const delta = parsed.choices?.[0]?.delta;
              const content = delta?.content;
              const reasoning = delta?.reasoning_content;
              if (reasoning) {
                reasoningContent += reasoning;
              }
              if (content) {
                fullContent += content;
                if (isDraft || isAnalysis) {
                  // accumulate for post-stream processing
                } else {
                  const cleaned = stripThinkingTokens(content);
                  if (cleaned) {
                    emit(cleaned);
                  }
                }
              }
            } catch {
              /* skip */
            }
          }
          console.log(
            `[ChatAPI] parsed. fullContent=${fullContent.length}chars, reasoningContent=${reasoningContent.length}chars, emittedAny=${emittedAny}`,
          );

          const effectiveContent = fullContent || reasoningContent;

          if (isTalkToAi) {
            const strippedFull = stripThinkingTokens(effectiveContent);
            const rawContent = cleanTalkToAiContent(strippedFull);
            let truncated: string | null = null;
            if (tableAppropriate) {
              truncated = tightenMultiRefTable(rawContent);
            } else if (hasMarkdownTable(strippedFull)) {
              // Keep a structured comparison (definitions + table + bottom line)
              // intact instead of truncating it to two sentences.
              truncated = normalizeTableRows(strippedFull);
            } else {
              truncated = truncateTalkToAi(strippedFull);
            }
            if (truncated && /^\s*\|/.test(truncated)) {
              const requestedRefs = [...refs.sections, ...refs.articles].map(
                (r) => r.toUpperCase(),
              );
              const presentRefs = extractTableRowRefs(truncated);
              const missingRefs = requestedRefs.filter(
                (r) => !presentRefs.includes(r),
              );
              const blankCells = findBlankTableCells(truncated);
              if (missingRefs.length > 0 || blankCells.length > 0) {
                if (tableAppropriate) {
                  const retried = await retryMultiRefTable(
                    missingRefs,
                    requestedRefs,
                    effectiveContent,
                  );
                  if (retried) truncated = retried;
                } else {
                  const check = (t: string) =>
                    findBlankTableCells(normalizeTableRows(t)).length === 0;
                  const issue =
                    blankCells.length > 0
                      ? `left table cells blank or as placeholders ("same as above", "N/A", "-", "Nil"): ${blankCells.slice(0, 5).join(", ")}${blankCells.length > 5 ? ` (+${blankCells.length - 5} more)` : ""}`
                      : "omitted requested item(s)";
                  const retried = await retryAnalysisContent(
                    issue,
                    check,
                    effectiveContent,
                  );
                  if (retried) truncated = normalizeTableRows(retried);
                }
              }
            }
            if (truncated) {
              emit(safelyTrimAfterBottomLine(normalizeBottomLine(truncated)));
            }
            console.log(
              `[ChatAPI] talk-to-ai: effectiveContent=${effectiveContent.length}chars, strippedFull=${strippedFull.length}chars, truncated=${truncated?.length ?? "null"}chars, emittedAny=${emittedAny}`,
            );
          }

          if (isAnalysis) {
            let analysis = stripThinkingTokens(effectiveContent).trim();
            if (analysis) {
              if (isAnalysisMultiRef) {
                analysis = tightenMultiRefTable(analysis);
              }
              const requestedRefs = [...refs.sections, ...refs.articles].map(
                (r) => r.toUpperCase(),
              );
              const issues: string[] = [];
              // Ref presence is only verifiable in a multi-ref table. A prose
              // analysis that merely mentions "Article 370" has no table rows,
              // so checking it here would always report every ref as missing
              // and burn two extra model calls that can never pass.
              if (requestedRefs.length > 0 && isAnalysisMultiRef) {
                const presentRefs = extractTableRowRefs(analysis);
                const missingRefs = requestedRefs.filter(
                  (r) => !presentRefs.includes(r),
                );
                if (missingRefs.length > 0) {
                  issues.push(
                    `omitted these requested section(s)/article(s): ${missingRefs.join(", ")}`,
                  );
                }
              }
              const blankCells = findBlankTableCells(analysis);
              if (blankCells.length > 0) {
                issues.push(
                  `left table cells blank or as placeholders ("same as above", "N/A", "-", "Nil"): ${blankCells.slice(0, 5).join(", ")}${blankCells.length > 5 ? ` (+${blankCells.length - 5} more)` : ""}`,
                );
              }
              if (issues.length > 0) {
                const check = (text: string) => {
                  const normalized = isAnalysisMultiRef
                    ? tightenMultiRefTable(text)
                    : text;
                  const blankCellsNow = findBlankTableCells(normalized);
                  if (blankCellsNow.length > 0) return false;
                  if (requestedRefs.length > 0 && isAnalysisMultiRef) {
                    const presentNow = extractTableRowRefs(normalized);
                    if (requestedRefs.some((r) => !presentNow.includes(r)))
                      return false;
                  }
                  return true;
                };
                const retried = await retryAnalysisContent(
                  issues.join("; "),
                  check,
                  effectiveContent,
                );
                if (retried) analysis = retried;
              }
              emit(safelyTrimAfterBottomLine(analysis));
            }
          }

          if (isDraft) {
            let draftContent = stripThinkingTokens(effectiveContent).trim();
            const blankDraftRequest = isBlankDraftRequest(userQuery);
            let attempt = 0;
            const MAX_DRAFT_RETRIES = 2;
            while (
              attempt < MAX_DRAFT_RETRIES &&
              (isDraftRefusal(draftContent) ||
                (blankDraftRequest && isFabricatedBlankDraft(draftContent)) ||
                (isChequeDishonourRequest(userQuery) &&
                  !/section\s*138/i.test(draftContent)))
            ) {
              console.warn(
                "Draft guard triggered (refusal, fabricated details, or missing statutory section), retrying with override instruction",
              );
              const overrideMessage = isDraftRefusal(draftContent)
                ? `The previous response was a refusal, which is not allowed. The user's document request is a legitimate, routine legal document (Legal Notice, FIR, Consumer Complaint, RTI, Will, Affidavit, Petition, or Contract) and MUST be drafted. Refusal is forbidden. Draft the complete document now using the exact template. Do not refuse, do not apologize, do not mention refusal.`
                : blankDraftRequest && isFabricatedBlankDraft(draftContent)
                  ? `The user submitted a BLANK draft request with no details. You MUST output the FULL blank template exactly as defined in the system prompt, with EVERY bracketed placeholder label kept intact and empty (e.g. [complainant name], [opponent name], [address], [amount]). NEVER invent, fabricate, or fill in names, addresses, amounts, dates, invoice numbers, model numbers, or any other details — the user will fill them in. Do NOT provide an example or sample document. Output ONLY the blank template structure with its empty bracketed labels.`
                  : `This is a cheque dishonour notice. You MUST expressly cite Section 138 of the Negotiable Instruments Act, 1881 in the subject line and in the body, state that the cheque was returned unpaid, and demand payment within 15 days of receipt of the notice. Do not omit the statutory section.`;
              const retryMessages = [
                { role: "system", content: finalSystemPrompt },
                ...messages.filter(
                  (m: { role: string }) => m.role !== "system",
                ),
                { role: "user", content: userQuery },
                { role: "assistant", content: draftContent },
                { role: "user", content: overrideMessage },
              ];
              const retryRes = await callProvider(
                workingCandidate,
                retryParams(workingCandidate, {
                  messages: retryMessages,
                  maxTokens: ensureReasoningBudget(workingCandidate, maxTokens),
                  temperature: 0.7,
                  reasoningEffort,
                }),
              );
              if (retryRes.ok) {
                const retryText = await retryRes.text();
                let retryContent = "";
                for (const line of retryText.split("\n")) {
                  if (!line.startsWith("data: ")) continue;
                  const data = line.slice(6).trim();
                  if (data === "[DONE]" || !data) continue;
                  try {
                    const parsed = JSON.parse(data);
                    if (parsed.error) continue;
                    const delta = parsed.choices?.[0]?.delta?.content;
                    if (delta) retryContent += delta;
                  } catch {
                    /* skip */
                  }
                }
                const cleanedRetry = stripThinkingTokens(retryContent).trim();
                if (cleanedRetry) {
                  draftContent = cleanedRetry;
                } else {
                  break;
                }
              } else {
                break;
              }
              attempt++;
            }
            if (draftContent) {
              // A generated document must always carry the mandatory
              // disclaimer, even when the model forgets it. Refusals are left
              // untouched because they are not documents.
              if (
                !isDraftRefusal(draftContent) &&
                !/AI-generated draft for reference purposes/i.test(draftContent)
              ) {
                draftContent = `${draftContent.trim()}\n\n${DRAFT_DISCLAIMER}`;
              }
              emit(draftContent);
            }
          }

          if (!emittedAny && effectiveContent.trim()) {
            const fallback = cleanTalkToAiContent(
              stripThinkingTokens(effectiveContent),
            ).trim();
            if (fallback) {
              emit(fallback);
            } else {
              console.warn(
                "[ChatAPI] All content was stripped (thinking tokens?). rawLength:",
                effectiveContent.length,
              );
              emit(
                "I apologize, but I couldn't complete that response. Please try rephrasing your question about Indian law.",
              );
            }
          } else if (!emittedAny) {
            emit(
              "I apologize, but I couldn't generate a response. Please try again or ask a specific question about Indian law.",
            );
          }

          if (citations.length > 0) {
            try {
              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify({ citations })}\n\n`),
              );
            } catch {
              /* skip */
            }
          }

          controller.enqueue(encoder.encode("data: [DONE]\n\n"));
        } catch (error) {
          console.warn("Stream interrupted:", (error as Error).message);
          // Never close an interrupted stream with zero content: the client
          // would render that as a failed reply even though the model output
          // (or most of it) is already available.
          try {
            if (!emittedAny) {
              const partial = stripThinkingTokens(
                fullContent || reasoningContent,
              ).trim();
              emit(
                partial ||
                  "I apologize, but I couldn't complete that response. Please try again or ask a specific question about Indian law.",
              );
            }
          } catch {
            /* controller may be closed */
          }
        } finally {
          clearInterval(keepAlive);
          try {
            controller.enqueue(encoder.encode("data: [DONE]\n\n"));
          } catch {
            /* skip */
          }
          try {
            controller.close();
          } catch {
            /* stream already closed */
          }
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
        "X-Accel-Buffering": "no",
      },
    });
  } catch (error) {
    console.warn("Chat API error:", (error as Error).message);
    const fallbackMsg =
      "The legal AI is briefly busy. Please send your question once more — it usually goes through on the next try.";
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      start(controller) {
        try {
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({
                content: fallbackMsg,
                retryable: true,
              })}\n\n`,
            ),
          );
          controller.enqueue(encoder.encode("data: [DONE]\n\n"));
        } catch {
          /* skip */
        }
        try {
          controller.close();
        } catch {
          /* skip */
        }
      },
    });
    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
        "X-Accel-Buffering": "no",
      },
    });
  }
}
