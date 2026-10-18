import { describe, it, expect, afterEach, vi } from "vitest";
import {
  buildCandidateChain,
  buildProviderPayload,
  coerceReasoningEffort,
  defaultReasoningEffort,
  ensureReasoningBudget,
  getDefaultModel,
  getFallbackModel,
  getModel,
  getProviderApiKey,
  getVisionModel,
  isProviderConfigured,
  isRetryableProviderStatus,
  listModels,
  MIN_REASONING_MAX_TOKENS,
  MODELS,
  PROVIDERS,
  resolveReasoningEffort,
  VISION_MODEL_ID,
  type ChatRequestParams,
} from "@/lib/ai-providers";

afterEach(() => {
  vi.unstubAllEnvs();
});

const configureBoth = () => {
  vi.stubEnv("INCEPTION_API_KEY", "test-inception");
  vi.stubEnv("NVIDIA_API_KEY", "test-nvidia");
};

describe("model registry", () => {
  it("defaults to Inception Mercury 2.5 and falls back to an NVIDIA model", () => {
    expect(getDefaultModel().id).toBe("inception:mercury-2.5");
    expect(getDefaultModel().provider).toBe("inception");
    expect(getFallbackModel().provider).toBe("nvidia");
  });

  it("exposes the vision model separately from the text chain", () => {
    const vision = getVisionModel();
    expect(vision.id).toBe(VISION_MODEL_ID);
    expect(vision.vision).toBe(true);
    expect(vision.provider).toBe("nvidia");
  });

  it("resolves models by id, api id, label, and short label (case-insensitive)", () => {
    expect(getModel("inception:mercury-2.5")?.id).toBe("inception:mercury-2.5");
    expect(getModel("mercury-2.5")?.id).toBe("inception:mercury-2.5");
    expect(getModel("Mercury 2.5")?.id).toBe("inception:mercury-2.5");
    expect(getModel("mercury 2.5")?.id).toBe("inception:mercury-2.5");
    expect(getModel("meta/muse-glimmer-30b")?.provider).toBe("nvidia");
    expect(getModel("does-not-exist")).toBeNull();
    expect(getModel("")).toBeNull();
    expect(getModel(undefined)).toBeNull();
  });

  it("every model id is unique and namespaced by its provider", () => {
    const ids = MODELS.map((m) => m.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const m of MODELS) {
      expect(m.id.startsWith(`${m.provider}:`)).toBe(true);
    }
  });

  it("lists vision models only when asked", () => {
    expect(listModels().length).toBe(MODELS.length);
    const vision = listModels({ visionOnly: true });
    expect(vision.length).toBeGreaterThan(0);
    expect(vision.every((m) => m.vision)).toBe(true);
  });
});

describe("provider configuration", () => {
  it("reports a provider as configured only when its key is non-empty", () => {
    configureBoth();
    expect(isProviderConfigured("inception")).toBe(true);
    expect(isProviderConfigured("nvidia")).toBe(true);
    expect(getProviderApiKey("inception")).toBe("test-inception");

    vi.stubEnv("INCEPTION_API_KEY", "");
    expect(isProviderConfigured("inception")).toBe(false);
  });

  it("points each provider at its own OpenAI-compatible endpoint", () => {
    expect(PROVIDERS.inception.baseUrl).toContain("api.inceptionlabs.ai");
    expect(PROVIDERS.inception.baseUrl).toContain("/v1/chat/completions");
    expect(PROVIDERS.inception.apiKeyEnv).toBe("INCEPTION_API_KEY");
    expect(PROVIDERS.nvidia.baseUrl).toContain("integrate.api.nvidia.com");
    expect(PROVIDERS.nvidia.apiKeyEnv).toBe("NVIDIA_API_KEY");
  });
});

describe("buildProviderPayload", () => {
  const base: ChatRequestParams = {
    messages: [{ role: "user", content: "hi" }],
    maxTokens: 4096,
    temperature: 1.0,
    topP: 0.95,
    stream: true,
    reasoningEffort: "low",
    stop: ["###"],
  };

  it("sends reasoning_effort and max_completion_tokens for Inception", () => {
    const model = getDefaultModel();
    const payload = buildProviderPayload(model, base);
    expect(payload.model).toBe("mercury-2.5");
    // `max_completion_tokens` takes precedence over the deprecated `max_tokens`.
    expect(payload.max_completion_tokens).toBe(4096);
    expect(payload).not.toHaveProperty("max_tokens");
    expect(payload.temperature).toBe(1.0);
    expect(payload.stream).toBe(true);
    // Omitting reasoning_effort silently costs seconds of hidden reasoning:
    // the API defaults it to `medium`.
    expect(payload.reasoning_effort).toBe("low");
    expect(payload).not.toHaveProperty("top_p");
    expect(payload.stop).toEqual(["###"]);
  });

  it("forwards instant effort verbatim to Inception", () => {
    const payload = buildProviderPayload(getDefaultModel(), {
      ...base,
      reasoningEffort: "instant",
    });
    expect(payload.reasoning_effort).toBe("instant");
  });

  it("downgrades instant to low for NVIDIA, which has no instant level", () => {
    const model = getModel("nvidia:meta/muse-glimmer-30b")!;
    const payload = buildProviderPayload(model, {
      ...base,
      reasoningEffort: "instant",
    });
    expect(payload.reasoning_effort).toBe("low");
  });

  it("adds realtime only for providers that support it", () => {
    const inception = buildProviderPayload(getDefaultModel(), {
      ...base,
      realtime: true,
    });
    expect(inception.realtime).toBe(true);
    const nvidia = buildProviderPayload(
      getModel("nvidia:meta/muse-glimmer-30b")!,
      { ...base, realtime: true },
    );
    expect(nvidia).not.toHaveProperty("realtime");
  });

  it("passes top_p and reasoning_effort through for NVIDIA", () => {
    const model = getModel("nvidia:meta/muse-glimmer-30b")!;
    const payload = buildProviderPayload(model, base);
    expect(payload.model).toBe("meta/muse-glimmer-30b");
    expect(payload.top_p).toBe(0.95);
    expect(payload.reasoning_effort).toBe("low");
    expect(payload.max_tokens).toBe(4096);
    expect(payload).not.toHaveProperty("stop");
  });

  it("never emits reasoning_effort when it was not requested", () => {
    const model = getModel("nvidia:nvidia/nemotron-3-super-120b-a12b")!;
    const payload = buildProviderPayload(model, {
      ...base,
      reasoningEffort: undefined,
    });
    expect(payload).not.toHaveProperty("reasoning_effort");
  });
});

describe("reasoning effort defaults", () => {
  it("coerces to the nearest level the provider supports", () => {
    expect(coerceReasoningEffort("inception", "instant")).toBe("instant");
    expect(coerceReasoningEffort("nvidia", "instant")).toBe("low");
    expect(coerceReasoningEffort("nvidia", "high")).toBe("high");
  });

  it("runs short conversational modes at instant", () => {
    expect(defaultReasoningEffort("chat")).toBe("instant");
    expect(defaultReasoningEffort("talk-to-ai")).toBe("instant");
    expect(defaultReasoningEffort("grill")).toBe("instant");
  });

  it("gives deeper modes more room", () => {
    expect(defaultReasoningEffort("analysis")).toBe("low");
    expect(defaultReasoningEffort("draft")).toBe("medium");
  });

  it("honours the CHAT_REASONING_EFFORT override", () => {
    process.env.CHAT_REASONING_EFFORT = "high";
    try {
      expect(resolveReasoningEffort("chat")).toBe("high");
      process.env.CHAT_REASONING_EFFORT = "nonsense";
      expect(resolveReasoningEffort("chat")).toBe("instant");
    } finally {
      delete process.env.CHAT_REASONING_EFFORT;
    }
  });
});

describe("ensureReasoningBudget", () => {
  it("raises diffusion/reasoning models to the floor so reasoning cannot starve the reply", () => {
    const mercury = getDefaultModel();
    expect(mercury.reasoning).toBe(true);
    expect(ensureReasoningBudget(mercury, 512)).toBe(MIN_REASONING_MAX_TOKENS);
    expect(ensureReasoningBudget(mercury, 16384)).toBe(16384);
  });

  it("leaves non-reasoning (vision) models untouched", () => {
    const vision = getVisionModel();
    expect(vision.reasoning).toBe(false);
    expect(ensureReasoningBudget(vision, 128)).toBe(128);
  });
});

describe("buildCandidateChain", () => {
  it("starts with the requested model, then its provider, then the other provider", () => {
    configureBoth();
    const chain = buildCandidateChain({});
    expect(chain[0].id).toBe("inception:mercury-2.5");
    expect(chain.map((m) => m.provider)).toContain("inception");
    expect(chain.map((m) => m.provider)).toContain("nvidia");
    // Vision models never serve plain text chat.
    expect(chain.some((m) => m.vision)).toBe(false);
  });

  it("skips providers whose API key is missing", () => {
    vi.stubEnv("INCEPTION_API_KEY", "");
    vi.stubEnv("NVIDIA_API_KEY", "test-nvidia");
    const chain = buildCandidateChain({});
    expect(chain.every((m) => m.provider === "nvidia")).toBe(true);
    expect(chain[0].id).toBe("nvidia:meta/muse-glimmer-30b");
  });

  it("always routes review/image requests to the vision model", () => {
    configureBoth();
    const chain = buildCandidateChain({ needsVision: true });
    expect(chain).toHaveLength(1);
    expect(chain[0].id).toBe(VISION_MODEL_ID);
  });

  it("honours an explicit NVIDIA selection and still offers NVIDIA fallbacks first", () => {
    configureBoth();
    const chain = buildCandidateChain({
      requestedModelId: "nvidia:nvidia/nemotron-3.5-lightning-30b-a3b",
    });
    expect(chain[0].id).toBe("nvidia:nvidia/nemotron-3.5-lightning-30b-a3b");
    expect(chain[1].provider).toBe("nvidia");
  });

  it("falls back to the default model for an unknown selection", () => {
    configureBoth();
    const chain = buildCandidateChain({ requestedModelId: "not-a-model" });
    expect(chain[0].id).toBe("inception:mercury-2.5");
  });

  it("never returns an empty chain even with no keys configured", () => {
    vi.stubEnv("INCEPTION_API_KEY", "");
    vi.stubEnv("NVIDIA_API_KEY", "");
    const chain = buildCandidateChain({});
    expect(chain.length).toBeGreaterThan(0);
  });
});

describe("isRetryableProviderStatus", () => {
  it("treats auth, rate-limit and server errors as retryable", () => {
    expect(isRetryableProviderStatus(401)).toBe(true);
    expect(isRetryableProviderStatus(429)).toBe(true);
    expect(isRetryableProviderStatus(503)).toBe(true);
    expect(isRetryableProviderStatus(400)).toBe(false);
    expect(isRetryableProviderStatus(200)).toBe(false);
  });
});
