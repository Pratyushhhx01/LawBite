import { describe, expect, it } from "vitest";
import nextConfig from "@/next.config";

describe("security headers", () => {
  it("applies baseline browser hardening headers to every route", async () => {
    expect(nextConfig.headers).toBeTypeOf("function");

    const groups = await nextConfig.headers!();
    const allRoutes = groups.find((group) => group.source === "/:path*");

    expect(allRoutes).toBeDefined();
    const headers = new Map(
      allRoutes!.headers.map((header) => [header.key, header.value]),
    );

    expect(headers.get("X-Content-Type-Options")).toBe("nosniff");
    expect(headers.get("X-Frame-Options")).toBe("DENY");
    expect(headers.get("Referrer-Policy")).toBe(
      "strict-origin-when-cross-origin",
    );
    expect(headers.get("Permissions-Policy")).toBe(
      "camera=(), microphone=(), geolocation=()",
    );
    expect(headers.get("Strict-Transport-Security")).toContain(
      "max-age=63072000",
    );
    expect(headers.get("Cross-Origin-Opener-Policy")).toBe("same-origin");
  });
});
