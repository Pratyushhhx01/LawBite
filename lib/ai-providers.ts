/**
 * AI provider registry.
 *
 * LawBite talks to more than one OpenAI-compatible chat-completions endpoint.
 * This module is the single source of truth for which providers exist, which
 * models they serve, and how a request must be shaped for each one.
 *
 * Design goals:
 *  - Default provider is Inception Labs (Mercury 2.5), a diffusion LLM that
 *    generates tokens in parallel and is markedly faster than autoregressive
 *    models.
 *  - NVIDIA stays available as the automatic fallback whenever Inception is
 *    unavailable (missing key, rate limit, timeout, or an SSE error frame).
 *  - The user never picks a model: the chat route always starts at the default
 *    and walks this catalogue for the failover order, so the two can never
 *    drift apart.
 *
 * Every provider exposes an OpenAI-compatible `/v1/chat/completions` endpoint,
 * but they do not accept the same sampling parameters. `buildProviderPayload`
 * strips parameters a provider would reject, so the route can build one logical
 * payload and let this module adapt it per provider.
 */

export type ProviderId = "inception" | "nvidia";

/**
 * How much the model deliberates before answering. `instant` exists only on
 * Inception (Mercury 2.5/2); other providers fall back to the closest level
 * they support. Lower effort means a much lower time-to-first-token, which is
 * the single biggest lever on perceived latency for a diffusion model.
 */
export type ReasoningEffort = "instant" | "low" | "medium" | "high";

/** Cheapest/fastest first — used to pick the nearest supported level. */
const EFFORT_RANK: Record<ReasoningEffort, number> = {
  instant: 0,
  low: 1,
  medium: 2,
  high: 3,
};

export type ProviderCapabilities = {
  /** Accepts `top_p`. Inception's mercury-2.x accepts only temperature + stop. */
  topP: boolean;
  /** Accepts `reasoning_effort`. */
  reasoningEffort: boolean;
  /** Accepts `stop`. */
  stop: boolean;
  /** Accepts the deprecated `max_tokens`. */
  maxTokens: boolean;
  /** Accepts `max_completion_tokens` (preferred over `max_tokens`). */
  maxCompletionTokens: boolean;
  /** Accepts `realtime` for a lower TTFT/TTFAT. */
  realtime: boolean;
};

export type ProviderInfo = {
  id: ProviderId;
  name: string;
  /** Full chat-completions endpoint. */
  baseUrl: string;
  /** Environment variable holding the bearer token. */
  apiKeyEnv: string;
  docsUrl: string;
  description: string;
  capabilities: ProviderCapabilities;
  /** Reasoning levels this provider actually accepts, cheapest first. */
  supportedReasoningEfforts: ReasoningEffort[];
};

export const PROVIDERS: Record<ProviderId, ProviderInfo> = {
  inception: {
    id: "inception",
    name: "Inception Labs",
    baseUrl: "https://api.inceptionlabs.ai/v1/chat/completions",
    apiKeyEnv: "INCEPTION_API_KEY",
    docsUrl: "https://docs.inceptionlabs.ai",
    description:
      "Diffusion LLM (dLLM) — generates tokens in parallel for low-latency replies.",
    capabilities: {
      topP: false,
      reasoningEffort: true,
      stop: true,
      maxTokens: true,
      maxCompletionTokens: true,
      realtime: true,
    },
    supportedReasoningEfforts: ["instant", "low", "medium", "high"],
  },
  nvidia: {
    id: "nvidia",
    name: "NVIDIA",
    baseUrl: "https://integrate.api.nvidia.com/v1/chat/completions",
    apiKeyEnv: "NVIDIA_API_KEY",
    docsUrl: "https://build.nvidia.com",
    description: "NVIDIA NIM models — reasoning and vision fallback.",
    capabilities: {
      topP: true,
      reasoningEffort: true,
      stop: false,
      maxTokens: true,
      maxCompletionTokens: false,
      realtime: false,
    },
    supportedReasoningEfforts: ["low", "medium", "high"],
  },
};

export type ModelInfo = {
  /** Stable UI id: `"<provider>:<apiModel>"`, e.g. `inception:mercury-2.5`. */
  id: string;
  provider: ProviderId;
  /** Model id sent to the provider API. */
  apiModel: string;
  /** Full display name. */
  label: string;
  /** Compact display name for chips/toolbars. */
  shortLabel: string;
  description: string;
  contextLength: number;
  maxOutput: number;
  /** Can accept image input. */
  vision: boolean;
  /** Emits hidden reasoning tokens (counts against `max_tokens`). */
  reasoning: boolean;
  /** Preferred model for general chat when nothing is selected. */
  isDefault?: boolean;
  /** Preferred fallback when the default provider is unavailable. */
  isFallback?: boolean;
};

/** Model catalogue, ordered by preference: default first, then fallbacks. */
export const MODELS: ModelInfo[] = [
  {
    id: "inception:mercury-2.5",
    provider: "inception",
    apiModel: "mercury-2.5",
    label: "Mercury 2.5",
    shortLabel: "Mercury 2.5",
    description:
      "Inception Labs diffusion model. Fastest replies, 260K context, strong instruction-following.",
    contextLength: 260_000,
    maxOutput: 65_536,
    vision: false,
    reasoning: true,
    isDefault: true,
  },
  {
    id: "inception:mercury-2",
    provider: "inception",
    apiModel: "mercury-2",
    label: "Mercury 2",
    shortLabel: "Mercury 2",
    description:
      "First-generation Inception diffusion model. 128K context, very low latency.",
    contextLength: 128_000,
    maxOutput: 50_000,
    vision: false,
    reasoning: true,
  },
  {
    id: "nvidia:nvidia/nemotron-3-super-120b-a12b",
    provider: "nvidia",
    apiModel: "nvidia/nemotron-3-super-120b-a12b",
    label: "Nemotron 3 Super 120B (NVIDIA)",
    shortLabel: "Nemotron Super 120B",
    description:
      "NVIDIA NIM large model. Highest-quality fallback and the fastest measured NVIDIA option.",
    contextLength: 128_000,
    maxOutput: 16_384,
    vision: false,
    reasoning: true,
    isFallback: true,
  },
  {
    id: "nvidia:nvidia/nemotron-3.5-lightning-30b-a3b",
    provider: "nvidia",
    apiModel: "nvidia/nemotron-3.5-lightning-30b-a3b",
    label: "Nemotron 3.5 Lightning 30B (NVIDIA)",
    shortLabel: "Nemotron Lightning",
    description: "NVIDIA NIM reasoning model. Second-line fallback.",
    contextLength: 128_000,
    maxOutput: 16_384,
    vision: false,
    reasoning: true,
  },
  {
    id: "nvidia:meta/muse-glimmer-30b",
    provider: "nvidia",
    apiModel: "meta/muse-glimmer-30b",
    label: "Muse Glimmer 30B (NVIDIA)",
    shortLabel: "Muse Glimmer 30B",
    description:
      "NVIDIA NIM general-purpose model. Last-resort fallback; slower to first token.",
    contextLength: 128_000,
    maxOutput: 16_384,
    vision: false,
    reasoning: true,
  },
  {
    id: "nvidia:meta/llama-3.2-90b-vision-instruct",
    provider: "nvidia",
    apiModel: "meta/llama-3.2-90b-vision-instruct",
    label: "Llama 3.2 90B Vision (NVIDIA)",
    shortLabel: "Llama 3.2 Vision",
    description:
      "NVIDIA NIM vision model used to review scanned documents and document images.",
    contextLength: 128_000,
    maxOutput: 4_096,
    vision: true,
    reasoning: false,
  },
  {
    id: "nvidia:nvidia/nemotron-3.5-super-vl-120b-a12b",
    provider: "nvidia",
    apiModel: "nvidia/nemotron-3.5-super-vl-120b-a12b",
    label: "Nemotron 3.5 VL 120B (NVIDIA)",
    shortLabel: "Nemotron VL",
    description:
      "Secondary NVIDIA vision model, used when the primary vision model is unavailable.",
    contextLength: 128_000,
    maxOutput: 4_096,
    vision: true,
    reasoning: false,
  },
];

/** The vision model always handles document review, regardless of the requested model. */
export const VISION_MODEL_ID = "nvidia:meta/llama-3.2-90b-vision-instruct";

const MODEL_BY_ID = new Map(MODELS.map((m) => [m.id, m]));

/** Look up a model by its full id, bare API id, or short label (case-insensitive). */
export function getModel(
  identifier: string | null | undefined,
): ModelInfo | null {
  if (!identifier) return null;
  const raw = identifier.trim();
  if (!raw) return null;

  const direct = MODEL_BY_ID.get(raw);
  if (direct) return direct;

  const lower = raw.toLowerCase();
  for (const m of MODELS) {
    if (
      m.id.toLowerCase() === lower ||
      m.apiModel.toLowerCase() === lower ||
      m.label.toLowerCase() === lower ||
      m.shortLabel.toLowerCase() === lower
    ) {
      return m;
    }
  }
  return null;
}

export function getDefaultModel(): ModelInfo {
  return MODELS.find((m) => m.isDefault) ?? MODELS[0];
}

export function getFallbackModel(): ModelInfo {
  return MODELS.find((m) => m.isFallback) ?? MODELS[MODELS.length - 1];
}

export function getVisionModel(): ModelInfo {
  return getModel(VISION_MODEL_ID) ?? MODELS[MODELS.length - 1];
}

export function getProvider(id: ProviderId): ProviderInfo {
  return PROVIDERS[id];
}

/** True when the provider's API key is present in the environment. */
export function isProviderConfigured(id: ProviderId): boolean {
  return Boolean(process.env[PROVIDERS[id].apiKeyEnv]);
}

export function getProviderApiKey(id: ProviderId): string | undefined {
  return process.env[PROVIDERS[id].apiKeyEnv];
}

/** Models that can serve the given conversation, most-preferred first. */
export function listModels(opts?: { visionOnly?: boolean }): ModelInfo[] {
  if (!opts?.visionOnly) return MODELS;
  return MODELS.filter((m) => m.vision);
}

/**
 * Build the ordered list of models to try for a request.
 *
 * Order:
 *  1. The requested model, when one is supplied. The chat client never sends
 *     one, so in practice this is the default: Mercury 2.5.
 *  2. Same-provider siblings, so a temporary Inception hiccup can still be
 *     served by Inception before leaving the provider.
 *  3. The other provider's chain (NVIDIA), so an Inception outage degrades
 *     gracefully instead of failing the request.
 *
 * Providers whose API key is not configured are skipped entirely, which keeps
 * local/test runs working when only one key is present.
 */
export function buildCandidateChain(opts: {
  requestedModelId?: string | null;
  /** Force the vision model (document review / image input). */
  needsVision?: boolean;
  /** Include providers whose key is missing (used by tests). */
  includeUnconfigured?: boolean;
}): ModelInfo[] {
  const { needsVision = false, includeUnconfigured = false } = opts;

  if (needsVision) {
    // Image input can only be served by a vision model. Keep the primary
    // vision model first, then any other configured vision model, so one
    // model being disabled for an account does not break image uploads.
    const visionModels = MODELS.filter(
      (m) => m.vision && (includeUnconfigured || isProviderConfigured(m.provider)),
    );
    return visionModels.length > 0 ? visionModels : [getVisionModel()];
  }

  const requested = getModel(opts.requestedModelId) ?? getDefaultModel();
  const explicitlyRequested = getModel(opts.requestedModelId);
  const include = (m: ModelInfo) =>
    !m.vision && (includeUnconfigured || isProviderConfigured(m.provider));

  const chain: ModelInfo[] = [];
  const push = (m: ModelInfo | null | undefined) => {
    if (!m || m.vision || chain.some((c) => c.id === m.id)) return;
    // Mercury 2 remains available when a client explicitly asks for it, but it
    // is never chosen automatically: accuracy testing showed it inventing old
    // IPC section numbers and misnaming the new statutes. Slow and correct is
    // better than fast and wrong for legal advice.
    if (
      m.id === "inception:mercury-2" &&
      explicitlyRequested?.id !== "inception:mercury-2"
    )
      return;
    chain.push(m);
  };

  push(requested);
  for (const m of MODELS.filter((x) => x.provider === requested.provider))
    push(m);

  // Cross-provider fallback: prefer the requested provider, then everything else.
  for (const m of MODELS.filter((x) => x.provider !== requested.provider))
    push(m);

  const filtered = chain.filter(include);
  // Never return an empty chain when a model was requested explicitly.
  return filtered.length > 0 ? filtered : [requested];
}

export type ChatRequestParams = {
  messages: unknown[];
  maxTokens: number;
  temperature?: number;
  topP?: number;
  stream?: boolean;
  reasoningEffort?: ReasoningEffort;
  /** Ask the provider for a lower TTFT/TTFAT (Inception only). */
  realtime?: boolean;
  stop?: string[];
};

/**
 * Pick the level a provider actually accepts, closest to (but never cheaper
 * than) what was asked for. Inception has `instant`; NVIDIA does not, so an
 * `instant` request there becomes `low` rather than silently dropping the hint
 * and defaulting to the provider's slow `medium`.
 */
export function coerceReasoningEffort(
  provider: ProviderId,
  effort: ReasoningEffort,
): ReasoningEffort | null {
  const supported = [...PROVIDERS[provider].supportedReasoningEfforts].sort(
    (a, b) => EFFORT_RANK[a] - EFFORT_RANK[b],
  );
  if (supported.length === 0) return null;
  const wanted = EFFORT_RANK[effort];
  return (
    supported.find((e) => EFFORT_RANK[e] >= wanted) ??
    supported[supported.length - 1]
  );
}

/**
 * Adapt a logical chat request to a specific provider, dropping parameters the
 * provider does not accept.
 *
 * Note on latency: omitting `reasoning_effort` is NOT a neutral default — the
 * Inception API documents `medium` as the default, which costs several seconds
 * of hidden reasoning before the first visible token. Always pass an explicit
 * effort so short conversational modes can run at `instant`.
 */
export function buildProviderPayload(
  model: ModelInfo,
  params: ChatRequestParams,
): Record<string, unknown> {
  const caps = PROVIDERS[model.provider].capabilities;
  const payload: Record<string, unknown> = {
    model: model.apiModel,
    messages: params.messages,
    temperature: params.temperature ?? 1.0,
    stream: params.stream ?? true,
  };
  // `max_completion_tokens` takes precedence over the deprecated `max_tokens`.
  if (caps.maxCompletionTokens)
    payload.max_completion_tokens = params.maxTokens;
  else if (caps.maxTokens) payload.max_tokens = params.maxTokens;
  if (caps.topP && params.topP !== undefined) payload.top_p = params.topP;
  if (caps.reasoningEffort && params.reasoningEffort) {
    const effort = coerceReasoningEffort(
      model.provider,
      params.reasoningEffort,
    );
    if (effort) payload.reasoning_effort = effort;
  }
  if (caps.realtime && params.realtime) payload.realtime = true;
  if (caps.stop && params.stop?.length) payload.stop = params.stop;
  return payload;
}

/**
 * Diffusion models spend a chunk of `max_tokens` on hidden reasoning before the
 * first visible token, so a very small budget yields an empty reply with
 * `finish_reason: "length"`. Enforce a floor for reasoning models.
 */
export const MIN_REASONING_MAX_TOKENS = 4_096;

export function ensureReasoningBudget(
  model: ModelInfo,
  maxTokens: number,
): number {
  if (!model.reasoning) return maxTokens;
  return Math.max(maxTokens, MIN_REASONING_MAX_TOKENS);
}

/**
 * True when a provider error means "this model/provider is unusable right now",
 * so the route should try the next candidate. 4xx auth/validation errors and
 * 429/5xx availability errors all qualify.
 */
export function isRetryableProviderStatus(status: number): boolean {
  return status === 401 || status === 403 || status === 429 || status >= 500;
}

/**
 * Per-conversation reasoning budget.
 *
 * This is the main latency knob for Mercury: the API defaults to `medium`, so a
 * two-line chat reply would otherwise pay several seconds of hidden reasoning.
 * Short conversational modes run at `instant`; modes that must reason across
 * many sections get one step more.
 */
export function defaultReasoningEffort(
  conversationType: string | null | undefined,
): ReasoningEffort {
  switch (conversationType) {
    case "analysis":
      return "low";
    case "draft":
      return "medium";
    case "review":
      return "medium";
    default:
      // default chat, talk-to-ai, grill — short, latency-sensitive answers.
      return "instant";
  }
}

/**
 * Override for every mode, e.g. `CHAT_REASONING_EFFORT=low` to trade a little
 * speed for deeper reasoning, or `instant` to make everything maximally fast.
 */
export function reasoningEffortOverride(): ReasoningEffort | null {
  const raw = process.env.CHAT_REASONING_EFFORT?.trim().toLowerCase();
  const valid: ReasoningEffort[] = ["instant", "low", "medium", "high"];
  return valid.find((v) => v === raw) ?? null;
}

/** Resolve the effort for a request: explicit env override, else per-mode. */
export function resolveReasoningEffort(
  conversationType: string | null | undefined,
): ReasoningEffort {
  return reasoningEffortOverride() ?? defaultReasoningEffort(conversationType);
}
