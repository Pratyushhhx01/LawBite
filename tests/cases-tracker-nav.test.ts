import { describe, expect, it, vi, beforeEach } from "vitest";

const mockSession = {
  user: {
    id: "user-123",
    name: "Advocate Sharma",
    email: "sharma@lawbite.test",
    image: null,
  },
  session: { id: "sess-123" },
};

let currentSession: typeof mockSession | null = mockSession;

vi.mock("@/lib/auth", () => ({
  auth: {
    api: {
      getSession: vi.fn(async () => currentSession),
    },
  },
}));

vi.mock("next/headers", () => ({
  headers: vi.fn(async () => new Headers()),
}));

const mockRedirect = vi.fn();
vi.mock("next/navigation", () => ({
  redirect: (url: string) => {
    mockRedirect(url);
    throw new Error(`REDIRECT:${url}`);
  },
}));

import CasesPage from "@/app/cases/page";

describe("CasesPage Navigation & Deep Linking", () => {
  beforeEach(() => {
    currentSession = mockSession;
    mockRedirect.mockClear();
  });

  it("passes initialCaseId to CasesApp when caseId query parameter is provided", async () => {
    const jsx = await CasesPage({
      searchParams: Promise.resolve({ caseId: "case-abc-999" }),
    });

    expect(jsx.props.initialCaseId).toBe("case-abc-999");
    expect(jsx.props.user.id).toBe("user-123");
  });

  it("falls back to id query parameter if caseId is omitted", async () => {
    const jsx = await CasesPage({
      searchParams: Promise.resolve({ id: "case-legacy-777" }),
    });

    expect(jsx.props.initialCaseId).toBe("case-legacy-777");
  });

  it("sets initialCaseId to null when no search params are present", async () => {
    const jsx = await CasesPage({
      searchParams: Promise.resolve({}),
    });

    expect(jsx.props.initialCaseId).toBeNull();
  });

  it("redirects unauthenticated users to signin preserving the caseId in next param", async () => {
    currentSession = null;

    await expect(
      CasesPage({
        searchParams: Promise.resolve({ caseId: "case-secret-007" }),
      }),
    ).rejects.toThrow("REDIRECT:/signin?next=%2Fcases%3FcaseId%3Dcase-secret-007");

    expect(mockRedirect).toHaveBeenCalledWith(
      "/signin?next=%2Fcases%3FcaseId%3Dcase-secret-007",
    );
  });

  it("redirects unauthenticated users to /cases when no caseId is present", async () => {
    currentSession = null;

    await expect(
      CasesPage({
        searchParams: Promise.resolve({}),
      }),
    ).rejects.toThrow("REDIRECT:/signin?next=%2Fcases");

    expect(mockRedirect).toHaveBeenCalledWith("/signin?next=%2Fcases");
  });
});
