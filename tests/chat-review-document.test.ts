import { describe, it, expect, vi, afterEach } from "vitest";
import type { NextRequest } from "next/server";

vi.mock("@/lib/auth", () => ({
  auth: {
    api: {
      getSession: vi.fn(async () => ({ user: { id: "review-doc-tester" } })),
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

type ChatMessage = {
  role: "user" | "assistant";
  content:
    | string
    | Array<{ type: string; text?: string; image_url?: { url: string } }>;
};

function reviewRequest(messages: ChatMessage[]): NextRequest {
  return new Request("http://localhost:3000/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ conversationType: "review", messages }),
  }) as unknown as NextRequest;
}

function sseResponse(text: string): Response {
  return new Response(
    new ReadableStream({
      start(controller) {
        controller.enqueue(
          new TextEncoder().encode(
            `data: ${JSON.stringify({ choices: [{ delta: { content: text } }] })}\n\ndata: [DONE]\n\n`,
          ),
        );
        controller.close();
      },
    }),
    { status: 200, headers: { "Content-Type": "text/event-stream" } },
  );
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("Document Reviewer scope", () => {
  it("rejects a review turn with no attached document", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    const res = await POST(
      reviewRequest([{ role: "user", content: "Is this contract fair?" }]),
    );

    expect(res.status).toBe(400);
    const body = (await res.json()) as { error?: string };
    expect(body.error).toMatch(/Attach a PDF or image/i);
    // The model must never be asked to review something that is not there.
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("allows a review turn that carries document text", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        sseResponse("Clause 1 is safe under Indian law."),
      ),
    );

    const res = await POST(
      reviewRequest([
        {
          role: "user",
          content:
            "[Document: rent.pdf]\n\nClause 1: Rent is due monthly.\n\nWhat does clause 1 mean?",
        },
      ]),
    );

    expect(res.status).not.toBe(400);
    // Drain the stream so the route finishes cleanly.
    await res.text();
  });

  it("allows a review follow-up when the document sits earlier in history", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => sseResponse("The notice period is 30 days.")),
    );

    const res = await POST(
      reviewRequest([
        {
          role: "user",
          content:
            "[Document: rent.pdf]\n\nClause 4: Either party may terminate with 30 days notice.\n\nReview this document.",
        },
        { role: "assistant", content: "Clause 4 is [SAFE]." },
        { role: "user", content: "What is the notice period?" },
      ]),
    );

    expect(res.status).not.toBe(400);
    await res.text();
  });
});
