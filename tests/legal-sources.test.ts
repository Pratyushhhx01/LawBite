import { describe, expect, it } from "vitest";
import { isTrustedLegalSource } from "@/lib/legal-sources";

describe("isTrustedLegalSource", () => {
  it("accepts government, court and legal-database sources", () => {
    expect(isTrustedLegalSource("https://www.indiacode.nic.in/handle/123")).toBe(
      true,
    );
    expect(isTrustedLegalSource("https://legislative.gov.in/acts")).toBe(true);
    expect(isTrustedLegalSource("https://main.sci.gov.in/judgments")).toBe(true);
    expect(isTrustedLegalSource("https://example.gov.in/bail")).toBe(true);
    expect(isTrustedLegalSource("https://indiankanoon.org/doc/123")).toBe(true);
    expect(isTrustedLegalSource("https://livelaw.in/top-stories/x")).toBe(true);
    expect(
      isTrustedLegalSource("https://www.barandbench.com/news/x"),
    ).toBe(true);
  });

  it("rejects social media, user-generated content and content farms", () => {
    expect(isTrustedLegalSource("https://www.instagram.com/p/abc")).toBe(false);
    expect(isTrustedLegalSource("https://instagram.com/reel/abc")).toBe(false);
    expect(isTrustedLegalSource("https://facebook.com/legalpage")).toBe(false);
    expect(isTrustedLegalSource("https://x.com/advocate/status/1")).toBe(false);
    expect(isTrustedLegalSource("https://www.youtube.com/watch?v=1")).toBe(false);
    expect(isTrustedLegalSource("https://www.reddit.com/r/legaladvice")).toBe(
      false,
    );
    expect(isTrustedLegalSource("https://en.wikipedia.org/wiki/BNS")).toBe(
      false,
    );
    expect(isTrustedLegalSource("https://randomlawblog.blogspot.com/x")).toBe(
      false,
    );
  });

  it("rejects unknown domains, invalid URLs and empty values", () => {
    expect(isTrustedLegalSource("https://example.com/legal-news")).toBe(false);
    expect(isTrustedLegalSource("not a url")).toBe(false);
    expect(isTrustedLegalSource("")).toBe(false);
    expect(isTrustedLegalSource(null)).toBe(false);
    expect(isTrustedLegalSource(undefined)).toBe(false);
  });

  it("does not accept lookalike domains", () => {
    expect(isTrustedLegalSource("https://notgov.in/x")).toBe(false);
    expect(isTrustedLegalSource("https://fake-indiankanoon.org/x")).toBe(false);
    expect(isTrustedLegalSource("https://instagram.com.evil.test/x")).toBe(
      false,
    );
  });
});
