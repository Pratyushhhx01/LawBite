import { describe, it, expect, vi, afterEach } from "vitest";
import type { NextRequest } from "next/server";

vi.mock("@/lib/auth", () => ({
  auth: {
    api: {
      getSession: vi.fn(async () => ({ user: { id: "stream-tester" } })),
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

const delta = (content: string): Frame => ({
  choices: [{ delta: { content } }],
});
const reasoning = (text: string): Frame => ({
  choices: [{ delta: { reasoning_content: text } }],
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

function sseResponse(text: string, splitAt = text.length): Response {
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

async function readSse(res: Response): Promise<{
  content: string;
  raw: unknown[];
}> {
  const reader = res.body!.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  const raw: unknown[] = [];
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
      raw.push(JSON.parse(data));
    }
  }
  const content = raw
    .map((f) => {
      const frame = f as {
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

const QUERY = "Explain the doctrine of natural justice in administrative law.";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("POST /api/chat streaming", () => {
  it("streams visible content and flushes the held tail", async () => {
    const text = framesToText([
      delta("The doctrine of natural justice requires "),
      delta("a fair hearing and no bias before any "),
      delta("administrative action is taken."),
      finish,
    ]);
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => sseResponse(text, 11)),
    );

    const res = await POST(makeRequest("talk-to-ai", QUERY));
    expect(res.status).toBe(200);
    const { content } = await readSse(res);
    expect(content).toBe(
      "The doctrine of natural justice requires a fair hearing and no bias before any administrative action is taken.",
    );
  });

  it("fails over to the next model when the first returns an SSE error frame", async () => {
    const goodText = framesToText([
      delta("Natural justice demands fairness in administrative decisions."),
      finish,
    ]);
    const responses = [
      sseResponse(framesToText([errorFrame("Service temporarily overloaded")])),
      sseResponse(goodText, 13),
    ];
    const fetchMock = vi.fn(async () => responses.shift()!);
    vi.stubGlobal("fetch", fetchMock);

    const res = await POST(makeRequest("talk-to-ai", QUERY));
    const { content } = await readSse(res);

    expect(fetchMock).toHaveBeenCalledTimes(2);
    const firstBody = JSON.parse(
      String((fetchMock.mock.calls[0][1] as RequestInit).body),
    );
    const secondBody = JSON.parse(
      String((fetchMock.mock.calls[1][1] as RequestInit).body),
    );
    expect(firstBody.model).toBe("meta/muse-glimmer-30b");
    expect(secondBody.model).toBe("nvidia/nemotron-3.5-lightning-30b-a3b");
    expect(content).toContain("Natural justice demands fairness");
  });

  it("never forwards reasoning-only output as an empty message", async () => {
    const open = "<" + "think>";
    const close = "</" + "think>";
    const text = framesToText([
      delta(open),
      delta("internal monologue that never produces an answer"),
      delta(close),
      finish,
    ]);
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => sseResponse(text, 7)),
    );

    const res = await POST(makeRequest("talk-to-ai", QUERY));
    const { content } = await readSse(res);

    expect(content.trim().length).toBeGreaterThan(0);
    expect(content).not.toContain("internal monologue");
    expect(content).not.toContain("think>");
    expect(content).toMatch(/apologize|couldn/i);
  });

  it("strips channel control tokens split across chunk boundaries", async () => {
    const text = framesToText([
      delta("<|cha"),
      delta("nnel|>analysis some reasoning"),
      delta("<|/chan"),
      delta("nel|>"),
      delta("The answer is that fairness must be observed."),
      finish,
    ]);
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => sseResponse(text, 5)),
    );

    const res = await POST(makeRequest("talk-to-ai", QUERY));
    const { content } = await readSse(res);

    expect(content).toBe("The answer is that fairness must be observed.");
    expect(content).not.toContain("channel");
    expect(content).not.toContain("|>");
  });

  it("does not leak reasoning_content into the visible reply", async () => {
    const text = framesToText([
      reasoning("Internal chain of thought that must stay hidden."),
      delta("Natural justice includes the rule against bias."),
      reasoning("More internal notes."),
      finish,
    ]);
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => sseResponse(text, 9)),
    );

    const res = await POST(makeRequest("talk-to-ai", QUERY));
    const { content } = await readSse(res);

    expect(content).toBe("Natural justice includes the rule against bias.");
    expect(content).not.toContain("chain of thought");
  });

  it("parses a single-chunk response instead of raw-passthrough", async () => {
    const text = framesToText([
      delta("A contract is an agreement enforceable by law."),
      finish,
    ]);
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => sseResponse(text)),
    );

    const res = await POST(makeRequest("talk-to-ai", QUERY));
    const { content, raw } = await readSse(res);

    expect(content).toBe("A contract is an agreement enforceable by law.");
    expect(content).not.toMatch(/apologize|couldn/i);
    expect(
      raw.every(
        (f) => typeof (f as { content?: unknown }).content === "string",
      ),
    ).toBe(true);
  });

  it("recovers an analysis reply when the model only produced reasoning", async () => {
    const text = framesToText([
      reasoning(
        "The rule against bias and the right to a hearing are the two pillars of natural justice in administrative law.",
      ),
      finish,
    ]);
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => sseResponse(text, 12)),
    );

    const res = await POST(makeRequest("analysis", QUERY));
    const { content } = await readSse(res);

    expect(content.trim().length).toBeGreaterThan(0);
    expect(content).toContain("rule against bias");
  });
});
