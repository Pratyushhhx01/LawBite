import { describe, it, expect, vi } from "vitest";
import { POST } from "@/app/api/review/route";
import { NextRequest } from "next/server";

vi.mock("@/lib/auth", () => ({
  auth: {
    api: {
      getSession: vi.fn(async () => null),
    },
  },
}));

describe("POST /api/review unauthenticated", () => {
  it("returns 401 when session is null", async () => {
    const formData = new FormData();
    const blob = new Blob(["test image content"], { type: "image/png" });
    formData.append("file", blob, "test.png");

    const req = new NextRequest("http://localhost:3000/api/review", {
      method: "POST",
      body: formData,
    });

    const res = await POST(req);
    expect(res.status).toBe(401);
    const json = await res.json();
    expect(json.error).toBe("Unauthorized");
  });
});
