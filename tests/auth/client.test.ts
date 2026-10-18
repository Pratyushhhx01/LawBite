import { describe, it, expect } from "vitest";

describe("Auth Client", () => {
  it("should export signIn, signOut, and useSession from auth-client", async () => {
    const mod = await import("@/lib/auth-client");
    expect(mod.signIn).toBeDefined();
    expect(mod.signOut).toBeDefined();
    expect(mod.useSession).toBeDefined();
  });

  it("should have social signIn method", async () => {
    const mod = await import("@/lib/auth-client");
    expect(typeof mod.signIn.social).toBe("function");
  });
});
