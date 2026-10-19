import { describe, it, expect, vi, afterEach } from "vitest";
import type { NextRequest } from "next/server";

// Pinned to the NVIDIA fallback path (see tests/chat-providers.test.ts for the
// Inception-first path). Unsetting the Inception key makes the default chain
// resolve to the NVIDIA models this file asserts on.
vi.hoisted(() => {
  delete process.env.INCEPTION_API_KEY;
});

vi.mock("@/lib/auth", () => ({
  auth: {
    api: {
      getSession: vi.fn(async () => ({ user: { id: "mode-tester" } })),
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

const { searchMock } = vi.hoisted(() => ({
  searchMock: vi.fn(
    async (): Promise<{
      answer: string;
      results: { title: string; content: string; url: string }[];
    }> => ({ answer: "", results: [] }),
  ),
}));
vi.mock("@tavily/core", () => ({
  tavily: () => ({ search: searchMock }),
}));

import { POST } from "@/app/api/chat/route";

type Frame = Record<string, unknown>;

const delta = (content: string): Frame => ({
  choices: [{ delta: { content } }],
});
const finish: Frame = { choices: [{ delta: {}, finish_reason: "stop" }] };
const errorFrame = (message: string): Frame => ({
  error: { message, type: "service_unavailable", code: 503 },
});

const DRAFT_DISCLAIMER =
  "[DISCLAIMER: This document is an AI-generated draft for reference purposes only. It does not constitute legal advice or a substitute for a professionally drafted document. Consult a practicing lawyer before signing, filing, or acting upon this document.]";

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
  citations: unknown[];
  doneCount: number;
}> {
  const reader = res.body!.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  const raw: unknown[] = [];
  const citations: unknown[] = [];
  let doneCount = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";
    for (const line of lines) {
      if (!line.startsWith("data: ")) continue;
      const data = line.slice(6).trim();
      if (data === "[DONE]") {
        doneCount++;
        continue;
      }
      if (!data) continue;
      const parsed = JSON.parse(data);
      raw.push(parsed);
      if (Array.isArray(parsed.citations)) citations.push(parsed.citations);
    }
  }
  let content = "";
  for (const f of raw) {
    const frame = f as {
      content?: unknown;
      replace?: unknown;
      choices?: { delta?: { content?: unknown } }[];
    };
    if (frame.replace === true && typeof frame.content === "string") {
      content = frame.content;
      continue;
    }
    if (typeof frame.content === "string") {
      content += frame.content;
      continue;
    }
    const nested = frame.choices?.[0]?.delta?.content;
    if (typeof nested === "string") content += nested;
  }
  return { content, raw, citations, doneCount };
}

const NO_FALLBACK =
  /apologize|technical difficulties|couldn't generate|encountered an error/i;

afterEach(() => {
  vi.unstubAllGlobals();
  searchMock.mockReset();
  searchMock.mockResolvedValue({ answer: "", results: [] });
});

describe("Talk to AI mode", () => {
  it("uses the concise talk-to-ai system prompt and streams content", async () => {
    const text = framesToText([
      delta("You can file a consumer complaint within two years of the issue."),
      finish,
    ]);
    const fetchMock = vi.fn<
      (url: string, init?: RequestInit) => Promise<Response>
    >(async () => sseResponse(text, 9));
    vi.stubGlobal("fetch", fetchMock);

    const res = await POST(
      makeRequest("talk-to-ai", "How do I file a consumer complaint?"),
    );
    const { content } = await readSse(res);

    expect(content).toBe(
      "You can file a consumer complaint within two years of the issue.",
    );
    expect(content).not.toMatch(NO_FALLBACK);
    const body = JSON.parse(
      String((fetchMock.mock.calls[0][1] as RequestInit).body),
    );
    expect(body.messages[0].content).toContain(
      "concise Indian legal assistant",
    );
    expect(body.max_tokens).toBe(4096);
  });

  it("expands a bare legal acronym so the model does not refuse it", async () => {
    const text = framesToText([
      delta(
        "IPC is the Indian Penal Code, 1860, replaced by the BNS in 2024.",
      ),
      finish,
    ]);
    const fetchMock = vi.fn<
      (url: string, init?: RequestInit) => Promise<Response>
    >(async () => sseResponse(text));
    vi.stubGlobal("fetch", fetchMock);

    const res = await POST(makeRequest("talk-to-ai", "what is ipc"));
    const { content } = await readSse(res);

    expect(content).toBe(
      "IPC is the Indian Penal Code, 1860, replaced by the BNS in 2024.",
    );
    const body = JSON.parse(
      String((fetchMock.mock.calls[0][1] as RequestInit).body),
    );
    expect(body.messages[0].content).toContain(
      "IPC = Indian Penal Code, 1860",
    );
  });

  it("maps the legacy chat type onto talk-to-ai", async () => {
    const text = framesToText([
      delta("Bail is the release of an accused pending trial."),
      finish,
    ]);
    const fetchMock = vi.fn<
      (url: string, init?: RequestInit) => Promise<Response>
    >(async () => sseResponse(text));
    vi.stubGlobal("fetch", fetchMock);

    const res = await POST(makeRequest("chat", "What is bail?"));
    const { content } = await readSse(res);

    expect(content).toBe("Bail is the release of an accused pending trial.");
    const body = JSON.parse(
      String((fetchMock.mock.calls[0][1] as RequestInit).body),
    );
    expect(body.messages[0].content).toContain(
      "concise Indian legal assistant",
    );
  });

  it("emits web citations when a search-backed question is asked", async () => {
    searchMock.mockResolvedValue({
      answer: "Bail law is governed by BNSS Chapter 35.",
      results: [
        {
          title: "BNSS Bail Provisions",
          content: "Sections 482 onwards govern bail.",
          url: "https://example.gov.in/bail",
        },
      ],
    });
    const text = framesToText([
      delta("Under the current BNSS, bail is governed by sections 482+."),
      finish,
    ]);
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => sseResponse(text, 7)),
    );

    const res = await POST(
      makeRequest("talk-to-ai", "What is the current bail law in India?"),
    );
    const { content, citations } = await readSse(res);

    expect(content).toBe(
      "Under the current BNSS, bail is governed by sections 482+.",
    );
    expect(content).not.toMatch(NO_FALLBACK);
    expect(citations.length).toBe(1);
    expect(citations[0]).toEqual([
      {
        type: "web",
        label: "BNSS Bail Provisions",
        snippet: "Sections 482 onwards govern bail.",
        url: "https://example.gov.in/bail",
      },
    ]);
  });

  it("streams a multi-section table reply, repairs blank cells, and replaces it once", async () => {
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
    let callCount = 0;
    const fetchMock = vi.fn(async () => {
      callCount++;
      return sseResponse(
        framesToText([delta(callCount === 1 ? badTable : goodTable), finish]),
        16,
      );
    });
    vi.stubGlobal("fetch", fetchMock);

    const res = await POST(
      makeRequest(
        "talk-to-ai",
        "Compare punishment under section 302 and section 376 of BNS",
      ),
    );
    const { content, doneCount } = await readSse(res);

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(content).toBe(goodTable);
    expect(content).not.toContain("N/A");
    expect(content).not.toMatch(NO_FALLBACK);
    expect(doneCount).toBeGreaterThanOrEqual(1);
  });
});

describe("Deep Analysis mode", () => {
  it("buffers the analysis and emits it exactly once", async () => {
    const analysis =
      "The doctrine of natural justice requires a fair hearing and the rule against bias. Courts apply these principles to administrative action.";
    const text = framesToText([delta(analysis), finish]);
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => sseResponse(text, 11)),
    );

    const res = await POST(
      makeRequest("analysis", "Explain natural justice in administrative law."),
    );
    const { content, doneCount } = await readSse(res);

    expect(content).toBe(analysis);
    expect(content).not.toMatch(NO_FALLBACK);
    expect(doneCount).toBe(1);
  });

  it("injects the legal-acronym glossary so 'what is ipc' is not refused", async () => {
    const answer =
      "IPC stands for the Indian Penal Code, 1860, replaced by the BNS in 2024.";
    const text = framesToText([delta(answer), finish]);
    const fetchMock = vi.fn<
      (url: string, init?: RequestInit) => Promise<Response>
    >(async () => sseResponse(text));
    vi.stubGlobal("fetch", fetchMock);

    const res = await POST(makeRequest("analysis", "what is ipc"));
    const { content } = await readSse(res);

    expect(content).toBe(answer);
    const body = JSON.parse(
      String((fetchMock.mock.calls[0][1] as RequestInit).body),
    );
    expect(body.messages[0].content).toContain(
      "IPC = Indian Penal Code, 1860",
    );
  });

  it("detects a table missing a requested section and repairs it via retry", async () => {
    const badTable = [
      "| Section | Offence | Punishment |",
      "| --- | --- | --- |",
      "| 302 | murder | death or life imprisonment |",
    ].join("\n");
    const goodTable = [
      "| Section | Offence | Punishment |",
      "| --- | --- | --- |",
      "| 302 | murder | death or life imprisonment |",
      "| 376 | rape | ten years |",
    ].join("\n");
    const fetchMock = vi.fn(async (_url: string, init?: RequestInit) => {
      const body = JSON.parse(String(init?.body));
      const isRetry = JSON.stringify(body.messages).includes(
        "omitted these requested section",
      );
      return sseResponse(
        framesToText([delta(isRetry ? goodTable : badTable), finish]),
        24,
      );
    });
    vi.stubGlobal("fetch", fetchMock);

    const res = await POST(
      makeRequest(
        "analysis",
        "Compare punishment under section 302 and section 376 of BNS",
      ),
    );
    const { content, doneCount } = await readSse(res);

    expect(fetchMock.mock.calls.length).toBeGreaterThanOrEqual(2);
    expect(content).toBe(goodTable);
    expect(content).toContain("376");
    expect(content).not.toMatch(NO_FALLBACK);
    expect(doneCount).toBe(1);
  });
});

describe("AI Lawyer (grill) mode", () => {
  it("streams the interrogation with delimiters and advice marker intact", async () => {
    const grillReply =
      "Your landlord cannot evict you without due process under the Rent Control Act.\n\n---\n\nHow long have you been staying at the property?\n\n[ADVICE_COMPLETE]";
    const text = framesToText([delta(grillReply), finish]);
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => sseResponse(text, 13)),
    );

    const res = await POST(
      makeRequest("grill", "My landlord is trying to evict me."),
    );
    const { content } = await readSse(res);

    expect(content).toBe(grillReply);
    expect(content).toContain("---");
    expect(content).toContain("[ADVICE_COMPLETE]");
    expect(content).not.toMatch(NO_FALLBACK);
  });

  it("sends an adaptive, non-repeating intake prompt instead of a fixed checklist", async () => {
    const fetchMock = vi.fn<
      (url: string, init?: RequestInit) => Promise<Response>
    >(async () =>
      sseResponse(
        framesToText([
          delta(
            "Understood.\n\n---\n\nIs there a written rent agreement?",
          ),
          finish,
        ]),
      ),
    );
    vi.stubGlobal("fetch", fetchMock);

    const res = await POST(
      makeRequest("grill", "My landlord is trying to evict me."),
    );
    await readSse(res);

    const body = JSON.parse(
      String((fetchMock.mock.calls[0][1] as RequestInit).body),
    );
    const systemPrompt = String(body.messages[0].content);

    // Relevance, one-at-a-time, and no-repeat rules are present.
    expect(systemPrompt).toMatch(/exactly ONE question per message/i);
    expect(systemPrompt).toMatch(/NEVER repeat a question/i);
    expect(systemPrompt).toMatch(/question bank/i);
    expect(systemPrompt).toMatch(/usually after 2-3 answers/i);

    // The old fixed 8-step checklist is gone.
    expect(systemPrompt).not.toMatch(/Interrogation Sequence/i);
    expect(systemPrompt).not.toMatch(/at least 5 answers/i);
  });

  it("forces the final advice after three user answers", async () => {
    const fetchMock = vi.fn<
      (url: string, init?: RequestInit) => Promise<Response>
    >(async () =>
      sseResponse(
        framesToText([delta("Final advice. [ADVICE_COMPLETE]"), finish]),
      ),
    );
    vi.stubGlobal("fetch", fetchMock);

    const request = new Request("http://localhost:3000/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        conversationType: "grill",
        messages: [
          {
            role: "user",
            content: "A cheque of Rs 2 lakh given to me has bounced.",
          },
          {
            role: "assistant",
            content: "Understood.\n\n---\n\nHave you sent a demand notice?",
          },
          { role: "user", content: "Yes, 20 days ago." },
          {
            role: "assistant",
            content: "Thank you.\n\n---\n\nIs the amount still unpaid?",
          },
          { role: "user", content: "It is still unpaid." },
        ],
      }),
    }) as unknown as NextRequest;

    const res = await POST(request);
    await readSse(res);

    const body = JSON.parse(
      String((fetchMock.mock.calls[0][1] as RequestInit).body),
    );
    const lastUser = [...body.messages]
      .reverse()
      .find((m: { role: string }) => m.role === "user");
    expect(lastUser.content).toContain("Do NOT ask any question");
    expect(lastUser.content).toContain("[ADVICE_COMPLETE]");
  });
});

describe("Document Drafter mode", () => {
  it("rejects a refusal, retries with an override, and emits the document once", async () => {
    const refusal =
      "I cannot draft this legal notice as it may be unlawful and against my guidelines.";
    const document = [
      "LEGAL NOTICE UNDER SECTION 138 OF THE NEGOTIABLE INSTRUMENTS ACT",
      "",
      "From: [complainant name], [address]",
      "To: [opponent name], [address]",
      "",
      "Notice: You are hereby called upon to repay the cheque amount of Rs. [amount] dated [date] within 15 days of receipt of this notice, failing which criminal proceedings under Section 138 of the Negotiable Instruments Act shall be initiated against you without further reference.",
      "",
      "Place: [city]",
      "Date: [date]",
      "",
      "Advocate for the Complainant",
    ].join("\n");
    const fetchMock = vi.fn(async (_url: string, init?: RequestInit) => {
      const body = JSON.parse(String(init?.body));
      const isOverride = JSON.stringify(body.messages).includes(
        "Refusal is forbidden",
      );
      return sseResponse(
        framesToText([delta(isOverride ? document : refusal), finish]),
      );
    });
    vi.stubGlobal("fetch", fetchMock);

    const res = await POST(
      makeRequest("draft", "Please draft a legal notice for cheque dishonour."),
    );
    const { content, doneCount } = await readSse(res);

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(content).toBe(`${document}\n\n${DRAFT_DISCLAIMER}`);
    expect(content).not.toMatch(/cannot draft|refusal/i);
    expect(content).not.toMatch(NO_FALLBACK);
    expect(doneCount).toBeGreaterThanOrEqual(1);
  });

  it("retries a cheque notice that omits Section 138", async () => {
    const incomplete =
      "LEGAL NOTICE\n\nSubject: Dishonour of Cheque\n\nI call upon you to pay Rs 50,000 within 15 days of receipt of this notice under the Negotiable Instruments Act, 1881.\n\nYours faithfully,\n[sender name]";
    const complete =
      "LEGAL NOTICE\n\nSubject: Legal Notice under Section 138 of the Negotiable Instruments Act, 1881\n\nI call upon you to pay Rs 50,000 within 15 days of receipt of this notice under Section 138 of the Negotiable Instruments Act, 1881.\n\nYours faithfully,\n[sender name]";
    const fetchMock = vi.fn(async (_url: string, init?: RequestInit) => {
      const body = JSON.parse(String(init?.body));
      // The system prompt also mentions Section 138, so key the retry on the
      // override instruction itself, not on the section number.
      const isRetry = JSON.stringify(body.messages).includes(
        "Do not omit the statutory section.",
      );
      return sseResponse(
        framesToText([delta(isRetry ? complete : incomplete), finish]),
      );
    });
    vi.stubGlobal("fetch", fetchMock);

    const res = await POST(
      makeRequest(
        "draft",
        "Please draft a legal notice for cheque dishonour: cheque of Rs 50,000 returned unpaid for insufficient funds.",
      ),
    );
    const { content } = await readSse(res);

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(content).toContain("Section 138");
    expect(content).toBe(`${complete}\n\n${DRAFT_DISCLAIMER}`);
  });

  it("emits a complete document on the happy path without retries", async () => {
    const document =
      "AFFIDAVIT\n\nI, [deponent name], son of [father name], resident of [address], do hereby solemnly affirm and state as follows:\n\n1. That the contents of the attached petition are true and correct to my knowledge and belief.\n\n2. That I have not filed any similar petition before any court in India.\n\nVerified at [place] on [date].";
    const fetchMock = vi.fn(async () =>
      sseResponse(framesToText([delta(document), finish])),
    );
    vi.stubGlobal("fetch", fetchMock);

    const res = await POST(
      makeRequest("draft", "Please draft an affidavit for filing a petition."),
    );
    const { content, doneCount } = await readSse(res);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(content).toBe(`${document}\n\n${DRAFT_DISCLAIMER}`);
    expect(content).not.toMatch(NO_FALLBACK);
    expect(doneCount).toBeGreaterThanOrEqual(1);
  });
});

describe("Document Reviewer mode", () => {
  it("streams a text-only document review using the text model", async () => {
    const review =
      "Clause 1: Payment terms are 30 days — low risk. Clause 2: Unlimited liability — high risk, negotiate a cap.";
    const fetchMock = vi.fn<
      (url: string, init?: RequestInit) => Promise<Response>
    >(async () => sseResponse(framesToText([delta(review), finish]), 8));
    vi.stubGlobal("fetch", fetchMock);

    const res = await POST(
      makeRequest(
        "review",
        "Review this agreement for risky clauses: [attached document]",
      ),
    );
    const { content } = await readSse(res);

    expect(content).toBe(review);
    expect(content).not.toMatch(NO_FALLBACK);
    const body = JSON.parse(
      String((fetchMock.mock.calls[0][1] as RequestInit).body),
    );
    expect(body.model).toBe("nvidia/nemotron-3-super-120b-a12b");
    expect(body.max_tokens).toBe(4096);
  });
});

describe("total failure fallback", () => {
  it("returns exactly one friendly message when every model errors", async () => {
    const failing = () =>
      sseResponse(framesToText([errorFrame("Service temporarily overloaded")]));
    const fetchMock = vi.fn(async () => failing());
    vi.stubGlobal("fetch", fetchMock);

    const res = await POST(makeRequest("grill", "What are my rights?"));
    const { content, doneCount } = await readSse(res);

    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(content).toBe(
      "I apologize, but I'm experiencing temporary technical difficulties. Please try again in a moment, or rephrase your question about Indian law and I'll do my best to help.",
    );
    expect(doneCount).toBe(1);
  });
});
