import { afterEach, describe, expect, it, vi } from "vitest";
import {
  cleanGeneratedTitle,
  fallbackConversationTitle,
  isMeaningfulTitleMessage,
  isPlaceholderConversationTitle,
  normalizeGeneratedTitle,
} from "@/lib/conversation-title";
import { generateConversationTitle } from "@/lib/conversation-title-server";

describe("conversation title helpers", () => {
  it("treats untouched titles as placeholders", () => {
    expect(isPlaceholderConversationTitle("New conversation")).toBe(true);
    expect(isPlaceholderConversationTitle("New chat")).toBe(true);
    expect(isPlaceholderConversationTitle("New analysis")).toBe(true);
    expect(isPlaceholderConversationTitle("New case")).toBe(true);
    expect(isPlaceholderConversationTitle("New draft")).toBe(true);
    expect(isPlaceholderConversationTitle("New review")).toBe(true);
    expect(isPlaceholderConversationTitle("Untitled Conversation")).toBe(true);
    expect(isPlaceholderConversationTitle("")).toBe(true);
    expect(isPlaceholderConversationTitle(null)).toBe(true);

    expect(isPlaceholderConversationTitle("Landlord Deposit Refund Rights")).toBe(
      false,
    );
    expect(isPlaceholderConversationTitle("Legal Notice")).toBe(false);
  });

  it("skips greetings and names the first real question", () => {
    expect(isMeaningfulTitleMessage("hi")).toBe(false);
    expect(isMeaningfulTitleMessage("Hello!")).toBe(false);
    expect(isMeaningfulTitleMessage("thanks")).toBe(false);
    expect(isMeaningfulTitleMessage("ok")).toBe(false);

    expect(isMeaningfulTitleMessage("What is bail?")).toBe(true);
    expect(
      isMeaningfulTitleMessage("", "rental-agreement.pdf"),
    ).toBe(true);
  });

  it("builds a deterministic fallback title", () => {
    expect(fallbackConversationTitle("Explain Section 420 IPC")).toBe(
      "Section 420 IPC",
    );
    expect(
      fallbackConversationTitle("Draft a legal notice for unpaid salary"),
    ).toBe("Legal Notice for Unpaid Salary");
    expect(fallbackConversationTitle("Review this rental agreement")).toBe(
      "Rental Agreement Review",
    );
    expect(
      fallbackConversationTitle("", {
        conversationType: "review",
        attachmentName: "rental-agreement.pdf",
      }),
    ).toBe("Rental Agreement Review");
    expect(
      fallbackConversationTitle("Please review this document", {
        conversationType: "review",
        attachmentName: "employment_contract.pdf",
      }),
    ).toBe("Employment Contract Review");
  });

  it("cleans model output and rejects generic titles", () => {
    expect(cleanGeneratedTitle('"Landlord Deposit Refund Rights."')).toBe(
      "Landlord Deposit Refund Rights",
    );
    expect(cleanGeneratedTitle("Title: Termination Without Notice")).toBe(
      "Termination Without Notice",
    );
    expect(cleanGeneratedTitle("**Understanding Section 420 IPC**")).toBe(
      "Understanding Section 420 IPC",
    );
    expect(cleanGeneratedTitle("Here is a title: Rental Agreement Review")).toBe(
      "Rental Agreement Review",
    );
    expect(cleanGeneratedTitle("New Chat")).toBeNull();
    expect(cleanGeneratedTitle("Legal Query")).toBeNull();
    expect(cleanGeneratedTitle("")).toBeNull();

    const long =
      "Understanding the Complete Legal Procedure for Filing a Consumer Complaint in India";
    expect(cleanGeneratedTitle(long)?.split(" ").length).toBeLessThanOrEqual(7);
  });

  it("normalizes with the fallback when the model gives nothing usable", () => {
    expect(normalizeGeneratedTitle("New Chat", "Bail Rights")).toBe("Bail Rights");
    expect(normalizeGeneratedTitle(null, "Bail Rights")).toBe("Bail Rights");
    expect(normalizeGeneratedTitle("Bail Rights", "Fallback")).toBe(
      "Bail Rights",
    );
  });
});

describe("generateConversationTitle", () => {
  const originalInceptionKey = process.env.INCEPTION_API_KEY;
  const originalNvidiaKey = process.env.NVIDIA_API_KEY;

  afterEach(() => {
    vi.unstubAllGlobals();
    if (originalInceptionKey === undefined) delete process.env.INCEPTION_API_KEY;
    else process.env.INCEPTION_API_KEY = originalInceptionKey;
    if (originalNvidiaKey === undefined) delete process.env.NVIDIA_API_KEY;
    else process.env.NVIDIA_API_KEY = originalNvidiaKey;
  });

  it("returns a cleaned title from the provider", async () => {
    process.env.INCEPTION_API_KEY = "test-key";
    delete process.env.NVIDIA_API_KEY;

    const fetchMock = vi.fn<
      (url: string, init?: RequestInit) => Promise<Response>
    >(async () =>
      new Response(
        JSON.stringify({
          choices: [{ message: { content: '"Termination Without Notice"' } }],
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      ),
    );
    vi.stubGlobal("fetch", fetchMock);

    const title = await generateConversationTitle({
      message: "Can my employer terminate me without notice?",
    });

    expect(title).toBe("Termination Without Notice");
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const body = JSON.parse(
      String(fetchMock.mock.calls[0][1]?.body),
    );
    expect(body.stream).toBe(false);
    expect(body.messages[0].content).toContain("conversation titles");
  });

  it("returns null so the caller keeps the fallback when the provider fails", async () => {
    process.env.INCEPTION_API_KEY = "test-key";
    delete process.env.NVIDIA_API_KEY;

    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response("nope", { status: 500 })),
    );

    await expect(
      generateConversationTitle({ message: "What is bail?" }),
    ).resolves.toBeNull();
  });

  it("returns null when no provider key is configured", async () => {
    delete process.env.INCEPTION_API_KEY;
    delete process.env.NVIDIA_API_KEY;

    await expect(
      generateConversationTitle({ message: "What is bail?" }),
    ).resolves.toBeNull();
  });
});
