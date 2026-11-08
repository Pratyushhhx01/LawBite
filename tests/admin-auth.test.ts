import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

let mockSession: { user: { id: string; email: string } } | null = null;

vi.mock("@/lib/auth", () => ({
  auth: {
    api: {
      getSession: vi.fn(async () => mockSession),
    },
  },
}));

vi.mock("@/lib/db", () => ({
  db: {
    selectFrom: vi.fn(() => ({
      select: vi.fn(() => ({
        executeTakeFirst: vi.fn(async () => ({ count: "10", total: "5", positive: "4", negative: "1" })),
        orderBy: vi.fn(() => ({
          limit: vi.fn(() => ({
            execute: vi.fn(async () => []),
          })),
        })),
        groupBy: vi.fn(() => ({
          execute: vi.fn(async () => []),
        })),
      })),
    })),
    fn: {
      count: vi.fn(() => ({
        as: vi.fn(() => "count"),
        filterWhere: vi.fn(() => ({
          as: vi.fn(() => "filtered"),
        })),
      })),
    },
  },
}));

describe("GET /api/admin access control", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it("returns 401 when no session is present", async () => {
    mockSession = null;
    const { GET } = await import("@/app/api/admin/route");
    const req = new NextRequest("http://localhost:3000/api/admin");
    const res = await GET(req);
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toBe("Unauthorized");
  });

  it("fails closed with 403 when ADMIN_EMAILS is unset or user is not an admin", async () => {
    mockSession = { user: { id: "user-1", email: "regular_user@example.com" } };
    const { GET } = await import("@/app/api/admin/route");
    const req = new NextRequest("http://localhost:3000/api/admin");
    const res = await GET(req);
    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.error).toBe("Forbidden");
  });
});
