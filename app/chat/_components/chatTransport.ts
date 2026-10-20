/**
 * Small, dependency-free helpers for the chat transport. Keeping them here
 * (instead of inline in the component) lets us regression-test the two cases
 * that used to turn a good answer into "Sorry, I encountered an error":
 * a transient failure worth retrying, and a final SSE line with no newline.
 */

/**
 * True when sending the same chat request again can plausibly succeed.
 * Network/stream failures carry no status; timeouts and rate limits are worth
 * one retry; auth and validation failures are not.
 */
export function isRetryableChatFailure(error: unknown): boolean {
  const status =
    typeof error === "object" && error !== null
      ? (error as { status?: unknown }).status
      : undefined;
  if (typeof status !== "number") return true;
  return status === 408 || status === 425 || status === 429 || status >= 500;
}

/**
 * Split an SSE buffer into complete lines and the trailing partial line.
 * Callers keep `rest` for the next chunk; when the stream ends, the caller
 * flushes `rest` itself so a final frame without "\n" is not dropped.
 */
export function takeSseLines(buffer: string): {
  lines: string[];
  rest: string;
} {
  const parts = buffer.split("\n");
  const rest = parts.pop() ?? "";
  return { lines: parts, rest };
}
