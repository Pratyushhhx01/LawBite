import { describe, it, expect } from "vitest";
import {
  isRetryableChatFailure,
  takeSseLines,
} from "@/app/chat/_components/chatTransport";

function failureWithStatus(status: number): Error {
  return Object.assign(new Error(`HTTP ${status}`), { status });
}

describe("chat transport recovery", () => {
  it("retries network failures and transient HTTP statuses", () => {
    // A dropped stream / failed fetch has no status and is always worth one
    // silent retry.
    expect(isRetryableChatFailure(new TypeError("Failed to fetch"))).toBe(true);
    expect(isRetryableChatFailure(new Error("Empty response"))).toBe(true);

    for (const status of [408, 425, 429, 500, 502, 503, 504]) {
      expect(isRetryableChatFailure(failureWithStatus(status))).toBe(true);
    }
  });

  it("does not retry auth or validation failures", () => {
    for (const status of [400, 401, 403, 404, 422]) {
      expect(isRetryableChatFailure(failureWithStatus(status))).toBe(false);
    }
  });

  it("keeps a final SSE frame that arrived without a trailing newline", () => {
    const split = takeSseLines('data: {"content":"hello"}\n\ndata: [DONE]');
    expect(split.lines).toEqual(['data: {"content":"hello"}', ""]);
    // The caller flushes `rest` after the stream closes; without that the
    // final frame used to be dropped and the reply rendered as an error.
    expect(split.rest).toBe("data: [DONE]");
  });
});
