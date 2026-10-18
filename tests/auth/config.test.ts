import { describe, it, expect } from "vitest";
import { auth } from "@/lib/auth";

describe("Auth Configuration", () => {
  it("should export an auth instance", () => {
    expect(auth).toBeDefined();
    expect(auth.options).toBeDefined();
  });

  it("should have Google OAuth configured with env vars", () => {
    expect(process.env.GOOGLE_CLIENT_ID).toBeTruthy();
    expect(process.env.GOOGLE_CLIENT_SECRET).toBeTruthy();
  });

  it("should have GitHub OAuth configured with env vars", () => {
    expect(process.env.GITHUB_CLIENT_ID).toBeTruthy();
    expect(process.env.GITHUB_CLIENT_SECRET).toBeTruthy();
  });

  it("should have social providers configured", () => {
    expect(auth.options.socialProviders).toBeDefined();
    expect(auth.options.socialProviders?.google).toBeDefined();
    expect(auth.options.socialProviders?.github).toBeDefined();
  });

  it("should have account linking enabled", () => {
    expect(auth.options.account?.accountLinking?.enabled).toBe(true);
  });

  it("should have google in trusted providers for linking", () => {
    expect(auth.options.account?.accountLinking?.trustedProviders).toContain(
      "google",
    );
  });

  it("should have github in trusted providers for linking", () => {
    expect(auth.options.account?.accountLinking?.trustedProviders).toContain(
      "github",
    );
  });

  it("should have session expiry set to 7 days", () => {
    expect(auth.options.session?.expiresIn).toBe(604800);
  });

  it("should have session update age set to 1 day", () => {
    expect(auth.options.session?.updateAge).toBe(86400);
  });

  it("should have nextCookies plugin", () => {
    expect(auth.options.plugins).toBeDefined();
    expect(Array.isArray(auth.options.plugins)).toBe(true);
    expect(auth.options.plugins!.length).toBeGreaterThan(0);
  });

  it("should include localhost as trusted origin", () => {
    expect(auth.options.trustedOrigins).toContain("http://localhost:3000");
  });

  it("should have database adapter configured", () => {
    expect(auth.options.database).toBeDefined();
  });
});
