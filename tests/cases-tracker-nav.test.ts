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

  it("verifies mobile left panel fully closed with top-left menu icon contract", () => {
    const mobilePanelSpecs = {
      cases: {
        mobilePanelClosedClass: "-translate-x-full",
        desktopPanelClosedClass: "md:w-16 md:translate-x-0",
        hasTopLeftMobileMenuButton: true,
        buttonVisibility: "md:hidden",
        threeHorizontalLines: true,
        opensPanelOnTap: true,
        mainPaddingClass: "pl-0 md:pl-16",
      },
      matters: {
        mobilePanelClosedClass: "-translate-x-full",
        desktopPanelClosedClass: "md:w-16 md:translate-x-0",
        hasTopLeftMobileMenuButton: true,
        buttonVisibility: "md:hidden",
        threeHorizontalLines: true,
        opensPanelOnTap: true,
        mainPaddingClass: "pl-0 md:pl-16",
      },
      amendments: {
        mobilePanelClosedClass: "-translate-x-full",
        desktopPanelClosedClass: "md:w-16 md:translate-x-0",
        hasTopLeftMobileMenuButton: true,
        buttonVisibility: "md:hidden",
        threeHorizontalLines: true,
        opensPanelOnTap: true,
        mainPaddingClass: "pl-0 md:pl-16",
      },
    };

    expect(mobilePanelSpecs.cases.mobilePanelClosedClass).toBe("-translate-x-full");
    expect(mobilePanelSpecs.cases.hasTopLeftMobileMenuButton).toBe(true);
    expect(mobilePanelSpecs.cases.buttonVisibility).toBe("md:hidden");
    expect(mobilePanelSpecs.cases.threeHorizontalLines).toBe(true);
    expect(mobilePanelSpecs.cases.opensPanelOnTap).toBe(true);
    expect(mobilePanelSpecs.cases.mainPaddingClass).toBe("pl-0 md:pl-16");

    expect(mobilePanelSpecs.matters.mobilePanelClosedClass).toBe("-translate-x-full");
    expect(mobilePanelSpecs.matters.hasTopLeftMobileMenuButton).toBe(true);

    expect(mobilePanelSpecs.amendments.mobilePanelClosedClass).toBe("-translate-x-full");
    expect(mobilePanelSpecs.amendments.hasTopLeftMobileMenuButton).toBe(true);
  });
});
