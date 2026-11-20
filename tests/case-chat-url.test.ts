import { describe, expect, it } from "vitest";
import {
  buildCaseChatUrl,
  CASE_MODE_LABELS,
} from "@/app/chat/_components/ChatApp";

describe("case-scoped chat deep links", () => {
  it("builds a full case + conversation + origin URL", () => {
    expect(buildCaseChatUrl("case-1", "conv-9", "matters")).toBe(
      "/chat?caseId=case-1&conversation=conv-9&from=matters",
    );
  });

  it("omits empty conversation and non-matters origin", () => {
    expect(buildCaseChatUrl("case-1", null, null)).toBe("/chat?caseId=case-1");
    expect(buildCaseChatUrl("case-1", "conv-9", null)).toBe(
      "/chat?caseId=case-1&conversation=conv-9",
    );
  });

  it("returns null outside case scope", () => {
    expect(buildCaseChatUrl(null, "conv-9", "matters")).toBeNull();
  });

  it("labels every conversation type for the case panel", () => {
    for (const type of [
      "chat",
      "talk-to-ai",
      "analysis",
      "grill",
      "draft",
      "review",
    ]) {
      expect(CASE_MODE_LABELS[type]).toBeTruthy();
    }
  });
});
