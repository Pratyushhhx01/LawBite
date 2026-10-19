import { describe, it, expect, vi, afterEach } from "vitest";
import type { NextRequest } from "next/server";

// The route reads this at module load, so it must be set before the import
// below: it keeps the first-content watchdog tests from waiting 20 real seconds.
// The Inception key is deleted so these cases exercise the NVIDIA path (whose
// reasoning_effort behaviour they assert).
vi.hoisted(() => {
  process.env.CHAT_FIRST_CONTENT_TIMEOUT_MS = "200";
  delete process.env.INCEPTION_API_KEY;
});

vi.mock("@/lib/auth", () => ({
  auth: {
    api: {
      getSession: vi.fn(async () => ({ user: { id: "reasoning-tester" } })),
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

type Frame = Record<string, unknown>;
type RecordedRequest = { url: string; body: Record<string, unknown> };

const delta = (content: string): Frame => ({
  choices: [{ delta: { content } }],
});
const reasoning = (text: string): Frame => ({
  choices: [{ delta: { reasoning_content: text } }],
});
const finish: Frame = { choices: [{ delta: {}, finish_reason: "stop" }] };

function framesToText(frames: Frame[]): string {
  return (
    frames.map((f) => `data: ${JSON.stringify(f)}\n\n`).join("") +
    "data: [DONE]\n\n"
  );
}

function sseResponse(text: string, chunkSize = 7): Response {
  const encoder = new TextEncoder();
  const pieces: string[] = [];
  for (let i = 0; i < text.length; i += chunkSize) {
    pieces.push(text.slice(i, i + chunkSize));
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

function bodyOf(init: RequestInit): Record<string, unknown> {
  return JSON.parse(String(init.body)) as Record<string, unknown>;
}

/**
 * Stubs the NVIDIA call, recording every outgoing request body. Responses are
 * handed out in order; the last one repeats so single-response tests are terse.
 */
function stubNvidia(...texts: string[]) {
  const requests: RecordedRequest[] = [];
  const fetchMock = vi.fn(async (url: string, init: RequestInit) => {
    requests.push({ url, body: bodyOf(init) });
    const index = Math.min(requests.length - 1, texts.length - 1);
    return sseResponse(texts[index]);
  });
  vi.stubGlobal("fetch", fetchMock);
  return { fetchMock, requests };
}

function makeRequest(conversationType: string, query: string): NextRequest {
  return new Request("http://localhost:3000/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      conversationType,
      messages: [{ role: "user", content: query }],
    }),
  }) as unknown as NextRequest;
}

async function readRaw(res: Response): Promise<string> {
  const reader = res.body!.getReader();
  const decoder = new TextDecoder();
  let out = "";
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    out += decoder.decode(value, { stream: true });
  }
  return out;
}

async function readSse(
  res: Response,
): Promise<{ content: string; raw: string }> {
  const raw = await readRaw(res);
  const content = raw
    .split("\n")
    .filter((line) => line.startsWith("data: "))
    .map((line) => line.slice(6).trim())
    .filter((data) => data && data !== "[DONE]")
    .map((data) => {
      const frame = JSON.parse(data) as {
        content?: unknown;
        choices?: { delta?: { content?: unknown } }[];
      };
      if (typeof frame.content === "string") return frame.content;
      const nested = frame.choices?.[0]?.delta?.content;
      return typeof nested === "string" ? nested : "";
    })
    .join("");
  return { content, raw };
}

const QUERY = "Tell me about IPC 143.";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("chat reasoning budget", () => {
  it("asks for the fastest reasoning tier in conversational modes", async () => {
    const { requests } = stubNvidia(
      framesToText([delta("IPC 143 is now BNS 2023. "), finish]),
    );

    await readSse(await POST(makeRequest("talk-to-ai", QUERY)));

    expect(requests).toHaveLength(1);
    expect(requests[0].url).toContain("integrate.api.nvidia.com");
    // The route asks for `instant`; NVIDIA has no instant tier, so the nearest
    // supported level (low) is sent rather than dropping the hint entirely.
    expect(requests[0].body.reasoning_effort).toBe("low");
    expect(requests[0].body.stream).toBe(true);
  });

  it("gives analysis one step more reasoning than a chat reply", async () => {
    const { requests } = stubNvidia(
      framesToText([
        delta("Unlawful assembly needs five or more persons."),
        finish,
      ]),
    );

    await readSse(await POST(makeRequest("analysis", QUERY)));

    expect(requests[0].body.reasoning_effort).toBe("low");
  });

  it("keeps medium reasoning for document drafting", async () => {
    const { requests } = stubNvidia(
      framesToText([delta("LEGAL NOTICE\n\nDate: 18 October 2026"), finish]),
    );

    await readSse(
      await POST(
        makeRequest(
          "draft",
          "Please draft a Legal Notice with the following details: unpaid salary",
        ),
      ),
    );

    expect(requests[0].body.reasoning_effort).toBe("medium");
  });

  it("omits reasoning_effort for the vision review model", async () => {
    const { requests } = stubNvidia(
      framesToText([
        delta("[HIGH RISK] Clause 4 removes your right to notice."),
        finish,
      ]),
    );

    await readSse(
      await POST(makeRequest("review", "Review this rental agreement clause.")),
    );

    expect(requests[0].body.model).toBe("meta/llama-3.2-11b-vision-instruct");
    expect(requests[0].body.reasoning_effort).toBeUndefined();
    expect(requests[0].body.chat_template_kwargs).toBeUndefined();
  });
});

describe("chat stream keepalive", () => {
  it("writes a keepalive comment immediately so the stream is never silent", async () => {
    stubNvidia(
      framesToText([delta("A contract needs lawful consideration."), finish]),
    );

    const { content, raw } = await readSse(
      await POST(makeRequest("talk-to-ai", QUERY)),
    );

    expect(raw.startsWith(": keepalive\n\n")).toBe(true);
    expect(raw).toContain("data: [DONE]");
    // Heartbeats must never leak into the rendered answer.
    expect(content).not.toContain("keepalive");
    expect(content).toBe("A contract needs lawful consideration.");
  });

  it("keeps a buffered analysis stream alive with comments too", async () => {
    stubNvidia(
      framesToText([
        delta("**Overview**\n\nUnlawful assembly is defined in the statute."),
        finish,
      ]),
    );

    const { content, raw } = await readSse(
      await POST(makeRequest("analysis", QUERY)),
    );

    expect(raw.startsWith(": keepalive\n\n")).toBe(true);
    expect(content).toContain("Unlawful assembly");
  });
});

describe("chat first-content watchdog", () => {
  it("fails over when a streaming model only reasons and never emits text", async () => {
    const { fetchMock, requests } = stubNvidia(
      framesToText([
        reasoning(
          "The user asked about IPC 143. Let me think about unlawful assembly.",
        ),
        finish,
      ]),
      framesToText([
        delta("IPC 143 punishes membership of an unlawful assembly."),
        finish,
      ]),
    );

    const { content } = await readSse(
      await POST(makeRequest("talk-to-ai", QUERY)),
    );

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(requests[0].body.model).toBe(
      "nvidia/nemotron-3-super-120b-a12b",
    );
    expect(requests[1].body.model).not.toBe(
      "nvidia/nemotron-3-super-120b-a12b",
    );
    expect(content).toContain("unlawful assembly");
  });

  it("fails over when a model sends no bytes at all", async () => {
    // A stream that never emits and never closes. The watchdog must go by the
    // clock, not by arriving data, or failover waits for the provider to give
    // up — observed as a 107s stall in production logs.
    const silent = new Response(
      new ReadableStream({
        start() {
          /* never enqueues, never closes */
        },
      }),
      { status: 200, headers: { "Content-Type": "text/event-stream" } },
    );
    const requests: RecordedRequest[] = [];
    const fetchMock = vi.fn(async (url: string, init: RequestInit) => {
      requests.push({ url, body: bodyOf(init) });
      return requests.length === 1
        ? silent
        : sseResponse(
            framesToText([
              delta("Theft is defined in IPC Section 378."),
              finish,
            ]),
          );
    });
    vi.stubGlobal("fetch", fetchMock);

    const started = Date.now();
    const { content } = await readSse(
      await POST(makeRequest("talk-to-ai", QUERY)),
    );
    const elapsed = Date.now() - started;

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(elapsed).toBeLessThan(5_000);
    expect(content).toContain("Section 378");
  });

  it("still recovers an analysis reply from a reasoning-only model", async () => {
    const { fetchMock } = stubNvidia(
      framesToText([
        reasoning(
          "Unlawful assembly requires five or more persons with a common unlawful object.",
        ),
        finish,
      ]),
    );

    const { content } = await readSse(
      await POST(makeRequest("analysis", QUERY)),
    );

    // Buffered modes keep the reasoning-recovery behaviour: no needless failover.
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(content).toContain("Unlawful assembly");
  });
});
