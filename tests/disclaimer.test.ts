import { describe, it, expect, beforeEach, afterEach } from "vitest";

function makeStorage() {
  const map = new Map<string, string>();
  return {
    getItem: (key: string) => (map.has(key) ? map.get(key)! : null),
    setItem: (key: string, value: string) => {
      map.set(key, value);
    },
    removeItem: (key: string) => {
      map.delete(key);
    },
  };
}

describe("Disclaimer acceptance", () => {
  beforeEach(() => {
    (globalThis as unknown as { window: unknown }).window = {
      localStorage: makeStorage(),
    };
  });

  afterEach(() => {
    delete (globalThis as { window?: unknown }).window;
  });

  it("is not accepted before the user acknowledges it", async () => {
    const mod = await import("@/lib/disclaimer");
    expect(mod.isDisclaimerAccepted("session-1")).toBe(false);
  });

  it("stays accepted for the same login session", async () => {
    const mod = await import("@/lib/disclaimer");
    mod.rememberDisclaimerAcceptance("session-1");
    expect(mod.isDisclaimerAccepted("session-1")).toBe(true);
  });

  it("asks again on the next login (new session id)", async () => {
    const mod = await import("@/lib/disclaimer");
    mod.rememberDisclaimerAcceptance("session-1");
    expect(mod.isDisclaimerAccepted("session-2")).toBe(false);
  });

  it("is forgotten on sign-out", async () => {
    const mod = await import("@/lib/disclaimer");
    mod.rememberDisclaimerAcceptance("session-1");
    mod.clearDisclaimerAcceptance();
    expect(mod.isDisclaimerAccepted("session-1")).toBe(false);
  });

  it("still honours the legacy plain-true value", async () => {
    const mod = await import("@/lib/disclaimer");
    (
      globalThis as unknown as { window: { localStorage: Storage } }
    ).window.localStorage.setItem(mod.DISCLAIMER_KEY, "true");
    expect(mod.isDisclaimerAccepted("session-1")).toBe(true);
  });
});
