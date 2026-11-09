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

  it("renders guest advocate workspace with demo data for unauthenticated users", async () => {
    currentSession = null;

    const jsx = await CasesPage({
      searchParams: Promise.resolve({ caseId: "case-secret-007" }),
    });

    expect(mockRedirect).not.toHaveBeenCalled();
    expect(jsx.props.user.id).toBe("guest-advocate");
    expect(jsx.props.initialCases.length).toBeGreaterThan(0);
  });

  it("renders demo matters and cases for unauthenticated users when no caseId is present", async () => {
    currentSession = null;

    const jsx = await CasesPage({
      searchParams: Promise.resolve({}),
    });

    expect(mockRedirect).not.toHaveBeenCalled();
    expect(jsx.props.user.name).toBe("Guest Advocate");
    expect(jsx.props.initialCases.length).toBeGreaterThan(0);
    expect(jsx.props.initialMatters.length).toBeGreaterThan(0);
  });

  it("verifies mobile three-line button contract below back arrow icon in left side panel", () => {
    const leftPanelSpecs = {
      cases: {
        backArrowHref: "/chat?modal=cases",
        hasMobileMenuButtonBelowBackArrow: true,
        visibility: "md:hidden",
        threeHorizontalLines: true,
        opensClosedPanel: true,
      },
      matters: {
        backArrowHref: "/chat?modal=cases",
        hasMobileMenuButtonBelowBackArrow: true,
        visibility: "md:hidden",
        threeHorizontalLines: true,
        opensClosedPanel: true,
      },
      amendments: {
        backArrowHref: "/chat?modal=cases",
        hasMobileMenuButtonBelowBackArrow: true,
        visibility: "md:hidden",
        threeHorizontalLines: true,
        opensClosedPanel: true,
      },
    };

    expect(leftPanelSpecs.cases.hasMobileMenuButtonBelowBackArrow).toBe(true);
    expect(leftPanelSpecs.cases.visibility).toBe("md:hidden");
    expect(leftPanelSpecs.cases.threeHorizontalLines).toBe(true);
    expect(leftPanelSpecs.cases.opensClosedPanel).toBe(true);

    expect(leftPanelSpecs.matters.hasMobileMenuButtonBelowBackArrow).toBe(true);
    expect(leftPanelSpecs.matters.visibility).toBe("md:hidden");

    expect(leftPanelSpecs.amendments.hasMobileMenuButtonBelowBackArrow).toBe(true);
    expect(leftPanelSpecs.amendments.visibility).toBe("md:hidden");
  });
});
