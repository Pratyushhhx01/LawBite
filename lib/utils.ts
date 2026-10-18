/** Strip model thinking tokens from streaming output */
export function stripThinkingTokens(text: string): string {
  const withoutComplete = text
    .replace(/[\s\S]*?<\/think>/g, "")
    .replace(/<\|channel\|?>[\s\S]*?<\|\/?channel\|?>/g, "")
    .replace(/<channel\|?>[\s\S]*?<\/?channel\|?>/g, "")
    .replace(/\|channel\|?>[\s\S]*?<\/?channel\|?>/g, "")
    .replace(/<\|\/?channel\|?>/g, "")
    .replace(/<\/?channel\|?>/g, "")
    .replace(/<\|channel[^\n<]*/g, "")
    .replace(/<channel[^\n<]*/g, "")
    .replace(/\|channel[^\n<]*/g, "");

  // A think block the model never closed still holds only reasoning — it must
  // never reach the user, otherwise the reply renders as empty.
  const THINK_OPEN = "<" + "think>";
  const unclosed = withoutComplete.indexOf(THINK_OPEN);
  return unclosed === -1 ? withoutComplete : withoutComplete.slice(0, unclosed);
}

/** Simple in-memory rate limiter */
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

export function checkRateLimit(
  key: string,
  maxRequests: number,
  windowMs: number,
): { allowed: boolean; retryAfterMs: number } {
  const now = Date.now();
  const entry = rateLimitMap.get(key);

  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, retryAfterMs: 0 };
  }

  if (entry.count >= maxRequests) {
    return { allowed: false, retryAfterMs: entry.resetAt - now };
  }

  entry.count++;
  return { allowed: true, retryAfterMs: 0 };
}

/** Cleanup stale rate limit entries periodically */
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of rateLimitMap) {
      if (now > entry.resetAt) rateLimitMap.delete(key);
    }
  }, 60_000);
}
