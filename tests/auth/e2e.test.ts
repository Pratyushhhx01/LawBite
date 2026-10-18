import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { Pool } from "pg";

describe("Auth E2E — Integration", () => {
  let pool: Pool;

  beforeAll(async () => {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false },
    });
  });

  afterAll(async () => {
    await pool.end();
  });

  describe("Route handler invocation", () => {
    it("GET /api/auth/get-session should return a response", async () => {
      const mod = await import("@/app/api/auth/[...all]/route");
      const url = new URL("/api/auth/get-session", "http://localhost:3000");
      const req = new Request(url, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });
      const res = await mod.GET(req);
      expect(res.status).toBe(200);
    });

    it("GET /api/auth/get-session should return null when unauthenticated", async () => {
      const mod = await import("@/app/api/auth/[...all]/route");
      const url = new URL("/api/auth/get-session", "http://localhost:3000");
      const req = new Request(url, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });
      const res = await mod.GET(req);
      const body = await res.json();
      expect(body).toBeNull();
    });

    it("POST /api/auth/sign-in/social with invalid provider should error", async () => {
      const mod = await import("@/app/api/auth/[...all]/route");
      const url = new URL("/api/auth/sign-in/social", "http://localhost:3000");
      const req = new Request(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider: "invalid-provider" }),
      });
      const res = await mod.POST(req);
      expect(res.status).toBeGreaterThanOrEqual(400);
    });

    it("POST /api/auth/sign-in/social with google should return a response", async () => {
      const mod = await import("@/app/api/auth/[...all]/route");
      const url = new URL("/api/auth/sign-in/social", "http://localhost:3000");
      const req = new Request(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider: "google", callbackURL: "/chat" }),
      });
      const res = await mod.POST(req);
      expect(res.status).toBeGreaterThanOrEqual(200);
    });
  });

  describe("Auth config consistency", () => {
    it("should have matching trusted origins and BETTER_AUTH_URL", async () => {
      const { auth } = await import("@/lib/auth");
      expect(auth.options.trustedOrigins).toContain(
        process.env.BETTER_AUTH_URL || "http://localhost:3000",
      );
    });

    it("all env vars required for auth should be present", () => {
      const required = [
        "BETTER_AUTH_SECRET",
        "BETTER_AUTH_URL",
        "GOOGLE_CLIENT_ID",
        "GOOGLE_CLIENT_SECRET",
        "GITHUB_CLIENT_ID",
        "GITHUB_CLIENT_SECRET",
        "DATABASE_URL",
      ];
      for (const key of required) {
        expect(process.env[key], `${key} must be set`).toBeTruthy();
      }
    });
  });

  describe("Database integration", () => {
    it("should be connected to Neon", async () => {
      const res = await pool.query("SELECT current_database() as db");
      expect(res.rows[0].db).toBe("neondb");
    });

    it("user table should accept insert (then rollback)", async () => {
      await pool.query("BEGIN");
      try {
        const res = await pool.query(
          `INSERT INTO "user" (id, email, name) VALUES ($1, $2, $3) RETURNING id`,
          ["test-e2e-id", "test-e2e@example.com", "Test User"],
        );
        expect(res.rows[0].id).toBe("test-e2e-id");
      } finally {
        await pool.query("ROLLBACK");
      }
    });

    it("session table FK constraint should enforce user existence", async () => {
      await expect(
        pool.query(
          `INSERT INTO "session" (id, expiresAt, token, userId) VALUES ($1, NOW() + INTERVAL '1 day', $2, $3)`,
          ["fake-session-id", "fake-token", "nonexistent-user"],
        ),
      ).rejects.toThrow();
    });

    it("should query user table successfully", async () => {
      const res = await pool.query('SELECT COUNT(*)::int as count FROM "user"');
      expect(typeof res.rows[0].count).toBe("number");
    });
  });

  describe("Auth API handler chain", () => {
    it("handler function should resolve without throwing", async () => {
      const mod = await import("@/app/api/auth/[...all]/route");
      const url = new URL("/api/auth/get-session", "http://localhost:3000");
      const req = new Request(url, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });
      await expect(mod.GET(req)).resolves.toBeInstanceOf(Response);
    });

    it("handler should return JSON content type", async () => {
      const mod = await import("@/app/api/auth/[...all]/route");
      const url = new URL("/api/auth/get-session", "http://localhost:3000");
      const req = new Request(url, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });
      const res = await mod.GET(req);
      const ct = res.headers.get("content-type");
      expect(ct).toBeTruthy();
      expect(ct!.includes("json")).toBe(true);
    });
  });

  describe("Environment validation", () => {
    it("BETTER_AUTH_SECRET should be a non-empty string", () => {
      expect(process.env.BETTER_AUTH_SECRET!.length).toBeGreaterThan(16);
    });
  });
});
