import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

type Row = { title: string; messages: unknown };

const state = {
  rows: new Map<string, Row>(),
};

vi.mock("@/lib/auth", () => ({
  auth: {
    api: {
      getSession: vi.fn(async () => ({ user: { id: "title-user" } })),
    },
  },
}));

vi.mock("@/lib/db", () => {
  function selectChain() {
    const chain = {
      id: "",
      select: () => chain,
      where: (column: string, _op: string, value: string) => {
        if (column === "id") chain.id = value;
        return chain;
      },
      executeTakeFirst: async () => {
        const row = state.rows.get(chain.id);
        return row ? { title: row.title, messages: row.messages } : null;
      },
    };
    return chain;
  }

  function updateChain() {
    const chain = {
      id: "",
      expectedTitle: "",
      nextTitle: "",
      set: (values: { title: string }) => {
        chain.nextTitle = values.title;
        return chain;
      },
      where: (column: string, _op: string, value: string) => {
        if (column === "id") chain.id = value;
        if (column === "title") chain.expectedTitle = value;
        return chain;
      },
      execute: async () => {
        const row = state.rows.get(chain.id);
        if (row && (!chain.expectedTitle || row.title === chain.expectedTitle)) {
          row.title = chain.nextTitle;
        }
      },
    };
    return chain;
  }

  return {
    db: {
      selectFrom: () => selectChain(),
      updateTable: () => updateChain(),
    },
  };
});

import { POST } from "@/app/api/conversations/title/route";

function makeRequest(body: unknown): NextRequest {
  return new NextRequest("http://localhost/api/conversations/title", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

function titleResponse(title: string): Response {
  return new Response(
    JSON.stringify({ choices: [{ message: { content: title } }] }),
    { status: 200, headers: { "Content-Type": "application/json" } },
  );
}

const originalInceptionKey = process.env.INCEPTION_API_KEY;
const originalNvidiaKey = process.env.NVIDIA_API_KEY;

beforeEach(() => {
  state.rows.clear();
  process.env.INCEPTION_API_KEY = "test-key";
  delete process.env.NVIDIA_API_KEY;
});

afterEach(() => {
  vi.unstubAllGlobals();
  if (originalInceptionKey === undefined) delete process.env.INCEPTION_API_KEY;
  else process.env.INCEPTION_API_KEY = originalInceptionKey;
  if (originalNvidiaKey === undefined) delete process.env.NVIDIA_API_KEY;
  else process.env.NVIDIA_API_KEY = originalNvidiaKey;
});

describe("POST /api/conversations/title", () => {
  it("returns 400 when the request is incomplete", async () => {
    const res = await POST(makeRequest({ conversationId: "c1" }));
    expect(res.status).toBe(400);
  });

  it("generates and persists a title for a placeholder conversation", async () => {
    state.rows.set("c-placeholder", {
      title: "New conversation",
      messages: [{ role: "user", content: "What is bail?" }],
    });
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => titleResponse("Landlord Deposit Refund Rights")),
    );

    const res = await POST(
      makeRequest({
        conversationId: "c-placeholder",
        message: "What are my rights if my landlord refuses my deposit?",
        conversationType: "talk-to-ai",
        allowTitleReplacement: true,
      }),
    );

    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({
      title: "Landlord Deposit Refund Rights",
    });
    expect(state.rows.get("c-placeholder")?.title).toBe(
      "Landlord Deposit Refund Rights",
    );
  });

  it("never retitles a conversation that already has a real title", async () => {
    state.rows.set("c-titled", {
      title: "Legal Notice",
      messages: [{ role: "user", content: "Please draft a legal notice" }],
    });
    const fetchMock = vi.fn(async () => titleResponse("Should Not Be Used"));
    vi.stubGlobal("fetch", fetchMock);

    const res = await POST(
      makeRequest({
        conversationId: "c-titled",
        message: "Please draft a legal notice",
        conversationType: "draft",
      }),
    );

    await expect(res.json()).resolves.toEqual({ title: "Legal Notice" });
    expect(fetchMock).not.toHaveBeenCalled();
    expect(state.rows.get("c-titled")?.title).toBe("Legal Notice");
  });

  it("replaces the on-screen fallback only when the client allows it", async () => {
    state.rows.set("c-fallback", {
      title: "Section 420 IPC",
      messages: [{ role: "user", content: "Explain Section 420 IPC" }],
    });
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => titleResponse("Understanding Section 420 IPC")),
    );

    const res = await POST(
      makeRequest({
        conversationId: "c-fallback",
        message: "Explain Section 420 IPC",
        conversationType: "talk-to-ai",
        allowTitleReplacement: true,
      }),
    );

    await expect(res.json()).resolves.toEqual({
      title: "Understanding Section 420 IPC",
    });
    expect(state.rows.get("c-fallback")?.title).toBe(
      "Understanding Section 420 IPC",
    );
  });

  it("does not retitle a conversation after the first user turn", async () => {
    state.rows.set("c-many-turns", {
      title: "New conversation",
      messages: [
        { role: "user", content: "hi" },
        { role: "user", content: "What is bail?" },
      ],
    });
    const fetchMock = vi.fn(async () => titleResponse("Bail Rights"));
    vi.stubGlobal("fetch", fetchMock);

    const res = await POST(
      makeRequest({
        conversationId: "c-many-turns",
        message: "What is bail?",
        conversationType: "talk-to-ai",
      }),
    );

    await expect(res.json()).resolves.toEqual({
      title: "New conversation",
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("keeps the deterministic fallback when generation fails", async () => {
    state.rows.set("c-fail", {
      title: "New conversation",
      messages: [{ role: "user", content: "Explain Section 420 IPC" }],
    });
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response("nope", { status: 500 })),
    );

    const res = await POST(
      makeRequest({
        conversationId: "c-fail",
        message: "Explain Section 420 IPC",
        conversationType: "talk-to-ai",
      }),
    );

    await expect(res.json()).resolves.toEqual({ title: "Section 420 IPC" });
    expect(state.rows.get("c-fail")?.title).toBe("Section 420 IPC");
  });

  it("de-duplicates concurrent generation for the same conversation", async () => {
    state.rows.set("c-race", {
      title: "New conversation",
      messages: [{ role: "user", content: "Can my employer fire me?" }],
    });

    const releases: ((value: Response) => void)[] = [];
    const fetchMock = vi.fn(
      () =>
        new Promise<Response>((resolve) => {
          releases.push(resolve);
        }),
    );
    vi.stubGlobal("fetch", fetchMock);

    const request = () =>
      POST(
        makeRequest({
          conversationId: "c-race",
          message: "Can my employer terminate me without notice?",
          conversationType: "talk-to-ai",
        }),
      );

    const first = request();
    const second = request();
    for (let i = 0; i < 20 && releases.length === 0; i++) {
      await new Promise((resolve) => setTimeout(resolve, 5));
    }
    for (const release of releases) {
      release(titleResponse("Termination Without Notice"));
    }

    const [firstRes, secondRes] = await Promise.all([first, second]);
    await expect(firstRes.json()).resolves.toEqual({
      title: "Termination Without Notice",
    });
    await expect(secondRes.json()).resolves.toEqual({
      title: "Termination Without Notice",
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
