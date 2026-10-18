import { describe, it, expect } from "vitest";

describe("Auth API Route", () => {
  it("should export GET and POST handlers", async () => {
    const mod = await import("@/app/api/auth/[...all]/route");
    expect(mod.GET).toBeDefined();
    expect(mod.POST).toBeDefined();
    expect(typeof mod.GET).toBe("function");
    expect(typeof mod.POST).toBe("function");
  });

  it("should return a response when GET is called", async () => {
    const mod = await import("@/app/api/auth/[...all]/route");
    const url = new URL("/api/auth/session", "http://localhost:3000");

    const req = new Request(url, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });

    const res = await mod.GET(req);
    expect(res).toBeInstanceOf(Response);
  });

  it("should handle POST request", async () => {
    const mod = await import("@/app/api/auth/[...all]/route");
    const url = new URL("/api/auth/sign-in/social", "http://localhost:3000");

    const req = new Request(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ provider: "google" }),
    });

    const res = await mod.POST(req);
    expect(res).toBeInstanceOf(Response);
  });
});
