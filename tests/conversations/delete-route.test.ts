import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

type DeleteCall = {
  userId?: string;
  ids?: string[];
  notType?: string;
};

const calls: DeleteCall[] = [];
let sessionUser: { id: string } | null = { id: "delete-user" };

vi.mock("@/lib/auth", () => ({
  auth: {
    api: {
      getSession: vi.fn(async () => (sessionUser ? { user: sessionUser } : null)),
    },
  },
}));

vi.mock("@/lib/db", () => {
  function deleteChain() {
    const chain = {
      userId: undefined as string | undefined,
      ids: undefined as string[] | undefined,
      notType: undefined as string | undefined,
      where(column: string, _op: string, value: unknown) {
        if (column === "userId") chain.userId = value as string;
        if (column === "id") chain.ids = value as string[];
        if (column === "type") chain.notType = value as string;
        return chain;
      },
      async execute() {
        calls.push({
          userId: chain.userId,
          ids: chain.ids,
          notType: chain.notType,
        });
        return [];
      },
    };
    return chain;
  }

  return {
    db: {
      deleteFrom: () => deleteChain(),
    },
  };
});

import { DELETE } from "@/app/api/conversations/route";

function makeRequest(body: unknown): NextRequest {
  return new NextRequest("http://localhost/api/conversations", {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("DELETE /api/conversations", () => {
  beforeEach(() => {
    calls.length = 0;
    sessionUser = { id: "delete-user" };
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("deletes every non-shared conversation for the signed-in user", async () => {
    const res = await DELETE(makeRequest({ all: true }));

    expect(res.status).toBe(200);
    expect(calls).toEqual([
      { userId: "delete-user", ids: undefined, notType: "shared" },
    ]);
  });

  it("deletes only the supplied ids for the signed-in user", async () => {
    const res = await DELETE(makeRequest({ ids: ["a", "b"] }));

    expect(res.status).toBe(200);
    expect(calls).toEqual([
      { userId: "delete-user", ids: ["a", "b"], notType: undefined },
    ]);
  });

  it("rejects an empty body", async () => {
    const res = await DELETE(makeRequest({}));

    expect(res.status).toBe(400);
    expect(calls).toHaveLength(0);
  });

  it("rejects unauthenticated requests", async () => {
    sessionUser = null;

    const res = await DELETE(makeRequest({ all: true }));

    expect(res.status).toBe(401);
    expect(calls).toHaveLength(0);
  });
});
