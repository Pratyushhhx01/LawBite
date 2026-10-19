import { describe, it, expect, vi, afterEach } from "vitest";
import type { NextRequest } from "next/server";

// Deterministic provider keys: the default chain is Inception → NVIDIA.
vi.hoisted(() => {
  process.env.INCEPTION_API_KEY = "test-inception-key";
  process.env.NVIDIA_API_KEY = "test-nvidia-key";
  // Keep 429 retry assertions fast: same policy, zero wait.
  process.env.CHAT_RATE_LIMIT_RETRIES = "3";
  process.env.CHAT_RATE_LIMIT_BACKOFF_MS = "0,0,0";
});

vi.mock("@/lib/auth", () => ({
  auth: {
    api: {
      getSession: vi.fn(async () => ({ user: { id: "provider-tester" } })),
    },
  },
}));

vi.mock("@/lib/s3", () => ({
  s3kb: {
    getAct: vi.fn(async () => null),
    getSection: vi.fn(async () => null),
    getFullTextIndex: vi.fn(async () => []),
    getSectionList: vi.fn(async () => []),
    searchActs: vi.fn(async () => []),
    getFullText: vi.fn(async () => null),
    getReference: vi.fn(async () => null),
  },
}));

vi.mock("@tavily/core", () => ({
  tavily: () => ({
    search: vi.fn(async () => ({ answer: "", results: [] })),
  }),
}));

import { POST } from "@/app/api/chat/route";
import { VISION_MODEL_ID } from "@/lib/ai-providers";

type Frame = Record<string, unknown>;
type Call = { url: string; body: Record<string, unknown> };

const delta = (content: string): Frame => ({
  choices: [{ delta: { content } }],
});
const finish: Frame = { choices: [{ delta: {}, finish_reason: "stop" }] };
const errorFrame = (message: string): Frame => ({
  error: { message, type: "service_unavailable", code: 503 },
});

function framesToText(frames: Frame[]): string {
  return (
    frames.map((f) => `data: ${JSON.stringify(f)}\n\n`).join("") +
    "data: [DONE]\n\n"
  );
}

function sseResponse(text: string, splitAt = 11): Response {
  const encoder = new TextEncoder();
  const pieces: string[] = [];
  for (let i = 0; i < text.length; i += splitAt) {
    pieces.push(text.slice(i, i + splitAt));
  }
  return new Response(
    new ReadableStream({
      start(controller) {
        for (const piece of pieces) controller.enqueue(encoder.encode(piece));
        controller.close();
      },
    }),
    { status: 200, headers: { "Content-Type": "text/event-stream" } },
  );
}

/** Records every outgoing provider request. */
function stubProvider(
  handler: (url: string, callIndex: number) => Response | Promise<Response>,
) {
  const calls: Call[] = [];
  const fetchMock = vi.fn(async (url: string, init: RequestInit) => {
    const body = JSON.parse(String(init.body)) as Record<string, unknown>;
    calls.push({ url: String(url), body });
    return handler(String(url), calls.length - 1);
  });
  vi.stubGlobal("fetch", fetchMock);
  return { fetchMock, calls };
}

const ANSWER =
  "Natural justice requires a fair hearing and a rule against bias.";

function makeRequest(
  conversationType: string,
  query: string,
  extra?: Record<string, unknown>,
): NextRequest {
  return new Request("http://localhost:3000/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      conversationType,
      messages: [{ role: "user", content: query }],
      ...extra,
    }),
  }) as unknown as NextRequest;
}

async function readSse(res: Response): Promise<string> {
  const reader = res.body!.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let content = "";
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";
    for (const line of lines) {
      if (!line.startsWith("data: ")) continue;
      const data = line.slice(6).trim();
      if (!data || data === "[DONE]") continue;
      try {
        const frame = JSON.parse(data);
        if (frame.replace === true && typeof frame.content === "string") {
          content = frame.content;
        } else if (typeof frame.content === "string") {
          content += frame.content;
        }
      } catch {
        /* skip */
      }
    }
  }
  return content;
}

/** Like readSse, but keeps every decoded frame for inspection. */
async function readSseFrames(
  res: Response,
): Promise<{ content: string; frames: Frame[] }> {
  const reader = res.body!.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let content = "";
  const frames: Frame[] = [];
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";
    for (const line of lines) {
      if (!line.startsWith("data: ")) continue;
      const data = line.slice(6).trim();
      if (!data || data === "[DONE]") continue;
      try {
        const frame = JSON.parse(data);
        frames.push(frame);
        if (frame.replace === true && typeof frame.content === "string") {
          content = frame.content;
        } else if (typeof frame.content === "string") {
          content += frame.content;
        }
      } catch {
        /* skip */
      }
    }
  }
  return { content, frames };
}

const QUERY = "Explain the doctrine of natural justice in administrative law.";
const happy = () => sseResponse(framesToText([delta(ANSWER), finish]));

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe("default provider selection", () => {
  it("routes a default chat request to Inception Mercury 2.5", async () => {
    const { calls } = stubProvider(() => happy());

    const content = await readSse(await POST(makeRequest("talk-to-ai", QUERY)));

    expect(content).toBe(ANSWER);
    expect(calls).toHaveLength(1);
    expect(calls[0].url).toContain("api.inceptionlabs.ai");
    expect(calls[0].body.model).toBe("mercury-2.5");
  });

  it("sends reasoning_effort=instant so Mercury answers without deliberating", async () => {
    const { calls } = stubProvider(() => happy());

    await readSse(await POST(makeRequest("talk-to-ai", QUERY)));

    const body = calls[0].body;
    expect(body.temperature).toBeDefined();
    expect(body.stream).toBe(true);
    // The API defaults reasoning_effort to `medium`, which costs seconds of
    // hidden reasoning. Short modes must pin it to the fastest level.
    expect(body.reasoning_effort).toBe("instant");
    expect(body).not.toHaveProperty("top_p");
    expect(body).not.toHaveProperty("chat_template_kwargs");
  });

  it("accepts the bare API model id as an alias", async () => {
    const { calls } = stubProvider(() => happy());

    await readSse(
      await POST(makeRequest("talk-to-ai", QUERY, { model: "mercury-2" })),
    );

    expect(calls[0].url).toContain("api.inceptionlabs.ai");
    expect(calls[0].body.model).toBe("mercury-2");
  });

  it("falls back to the default when the requested model is unknown", async () => {
    const { calls } = stubProvider(() => happy());

    const content = await readSse(
      await POST(makeRequest("talk-to-ai", QUERY, { model: "gpt-9000" })),
    );

    expect(content).toBe(ANSWER);
    expect(calls[0].body.model).toBe("mercury-2.5");
  });
});

describe("explicit model selection", () => {
  it("honours an NVIDIA selection and restores reasoning_effort", async () => {
    const { calls } = stubProvider(() => happy());

    await readSse(
      await POST(
        makeRequest("talk-to-ai", QUERY, {
          model: "nvidia:meta/muse-glimmer-30b",
        }),
      ),
    );

    expect(calls[0].url).toContain("integrate.api.nvidia.com");
    expect(calls[0].body.model).toBe("meta/muse-glimmer-30b");
    expect(calls[0].body.reasoning_effort).toBe("low");
    expect(calls[0].body.top_p).toBe(0.95);
  });
});

describe("Inception → NVIDIA failover", () => {
  it("fails over to NVIDIA when Inception returns an HTTP error", async () => {
    const { calls } = stubProvider((url) =>
      url.includes("api.inceptionlabs.ai")
        ? new Response("rate limited", { status: 429 })
        : happy(),
    );

    const content = await readSse(await POST(makeRequest("talk-to-ai", QUERY)));

    expect(content).toBe(ANSWER);
    expect(calls.some((c) => c.url.includes("api.inceptionlabs.ai"))).toBe(
      true,
    );
    const last = calls[calls.length - 1];
    expect(last.url).toContain("integrate.api.nvidia.com");
    expect(last.body.model).not.toBe("mercury-2.5");
  });

  it("retries a rate-limited Inception before falling back to NVIDIA", async () => {
    // The fast model being briefly at capacity must not silently degrade the
    // reply to the slow provider: retry Inception first, then fail over.
    let inceptionCalls = 0;
    const { calls } = stubProvider((url) => {
      if (url.includes("api.inceptionlabs.ai")) {
        inceptionCalls++;
        return inceptionCalls <= 2
          ? new Response("free tier is at capacity", { status: 429 })
          : happy();
      }
      return happy();
    });

    const content = await readSse(await POST(makeRequest("talk-to-ai", QUERY)));

    expect(content).toBe(ANSWER);
    expect(inceptionCalls).toBe(3);
    expect(calls.every((c) => c.url.includes("api.inceptionlabs.ai"))).toBe(
      true,
    );
    // Mercury 2 is explicit-selection only; accuracy testing showed it
    // inventing old IPC numbers, so it must never answer a default request.
    expect(calls.every((c) => c.body.model !== "mercury-2")).toBe(true);
  });

  it("tells the client which model actually answered", async () => {
    stubProvider(() => happy());

    const { content, frames } = await readSseFrames(
      await POST(makeRequest("talk-to-ai", QUERY)),
    );

    expect(content).toBe(ANSWER);
    const modelFrame = frames.find((f) => typeof f.model === "string");
    expect(modelFrame).toBeDefined();
    expect(modelFrame!.model).toBe("mercury-2.5");
    expect(modelFrame!.modelId).toBe("inception:mercury-2.5");
    expect(modelFrame!.fallback).toBe(false);
  });

  it("flags a failover reply as coming from the fallback model", async () => {
    stubProvider((url) =>
      url.includes("api.inceptionlabs.ai")
        ? new Response("down", { status: 500 })
        : happy(),
    );

    const { frames } = await readSseFrames(
      await POST(makeRequest("talk-to-ai", QUERY)),
    );

    const modelFrame = frames.find((f) => typeof f.model === "string");
    expect(modelFrame!.fallback).toBe(true);
    expect(String(modelFrame!.modelId)).toContain("nvidia:");
  });

  it("fails over when Inception streams an SSE error frame", async () => {
    const { calls } = stubProvider((url) =>
      url.includes("api.inceptionlabs.ai")
        ? sseResponse(framesToText([errorFrame("overloaded")]))
        : happy(),
    );

    const content = await readSse(await POST(makeRequest("talk-to-ai", QUERY)));

    expect(content).toBe(ANSWER);
    expect(calls[calls.length - 1].url).toContain("integrate.api.nvidia.com");
  });

  it("keeps the working provider for post-processing retries", async () => {
    // Analysis with two sections buffers and quality-checks the reply. When the
    // blank-cell repair fires, the retry must go back to the same provider that
    // produced the reply — not hard-coded to NVIDIA.
    const badTable = [
      "| Section | Offence | Punishment |",
      "| --- | --- | --- |",
      "| 302 | murder | death |",
      "| 376 | rape | N/A |",
    ].join("\n");
    const goodTable = [
      "| Section | Offence | Punishment |",
      "| --- | --- | --- |",
      "| 302 | murder | death |",
      "| 376 | rape | ten years |",
    ].join("\n");
    const { calls } = stubProvider((_url, i) =>
      sseResponse(
        framesToText([delta(i === 0 ? badTable : goodTable), finish]),
      ),
    );

    const content = await readSse(
      await POST(
        makeRequest(
          "analysis",
          "Compare punishment under section 302 and section 376 of BNS",
        ),
      ),
    );

    expect(content).toBe(goodTable);
    expect(calls.length).toBeGreaterThanOrEqual(2);
    for (const call of calls) {
      expect(call.url).toContain("api.inceptionlabs.ai");
      expect(call.body.model).toBe("mercury-2.5");
    }
  });
});

describe("vision-required requests", () => {
  it("uses the text model for a text-only document review", async () => {
    const { calls } = stubProvider(() => happy());

    await readSse(
      await POST(
        makeRequest("review", "Review this rental agreement clause.", {
          model: "inception:mercury-2.5",
        }),
      ),
    );

    expect(calls).toHaveLength(1);
    expect(calls[0].url).toContain("api.inceptionlabs.ai");
    expect(calls[0].body.model).toBe("mercury-2.5");
  });

  it("forces the vision model when the user attaches an image", async () => {
    const { calls } = stubProvider(() => happy());

    const res = await POST(
      new Request("http://localhost:3000/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversationType: "talk-to-ai",
          model: "inception:mercury-2.5",
          messages: [
            {
              role: "user",
              content: [
                { type: "text", text: "Review this scanned page." },
                {
                  type: "image_url",
                  image_url: { url: "data:image/png;base64,AAAA" },
                },
              ],
            },
          ],
        }),
      }) as unknown as NextRequest,
    );

    await readSse(res);
    expect(calls[0].body.model).toBe("meta/llama-3.2-11b-vision-instruct");
    expect(VISION_MODEL_ID).toBe("nvidia:meta/llama-3.2-11b-vision-instruct");
  });
});

describe("provider misconfiguration", () => {
  it("returns a helpful 500 when no provider key is configured", async () => {
    vi.stubEnv("INCEPTION_API_KEY", "");
    vi.stubEnv("NVIDIA_API_KEY", "");
    stubProvider(() => happy());

    const res = await POST(makeRequest("talk-to-ai", QUERY));
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(String(body.error)).toMatch(/INCEPTION_API_KEY/);
    expect(String(body.error)).toMatch(/NVIDIA_API_KEY/);
  });
});
