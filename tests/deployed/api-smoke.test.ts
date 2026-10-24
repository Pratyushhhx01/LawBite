import { describe, it, expect, beforeAll } from "vitest";

/**
 * End-to-end smoke test for a RUNNING deployment.
 *
 * It is skipped unless DEPLOYED_BASE_URL points at a live app, so `npm run test`
 * stays hermetic. To exercise production:
 *
 *   $env:DEPLOYED_BASE_URL = "https://law-bite.vercel.app"
 *   npx vitest run tests/deployed
 *
 * It signs up a throwaway email/password account (email/password auth is
 * enabled in lib/auth.ts) to obtain a real session cookie, then drives the
 * public /api/chat endpoint exactly like the browser does.
 */

const BASE = (process.env.DEPLOYED_BASE_URL || "").replace(/\/+$/, "");
const suite = describe.skipIf(!BASE);

const GREETING = "Hello! How can I assist you with Indian legal matters today?";

/** The whole reply must start within this long, or the UI is effectively broken. */
const FIRST_CONTENT_BUDGET_MS = 20_000;
/** Hard ceiling for a single non-streaming request in the test. */
const REQUEST_TIMEOUT_MS = 120_000;

/** Vitest's global 30s budget is too tight for real model latency. */
const TEST_TIMEOUT_MS = 120_000;

/** `it` with a budget that accommodates live model inference. */
const chatIt = (name: string, fn: () => Promise<void>): void =>
  it(name, fn, TEST_TIMEOUT_MS);

let cookie = "";

type StreamRead = {
  content: string;
  raw: string;
  status: number;
  contentType: string;
  firstContentMs: number | null;
  sawDone: boolean;
};

function collectCookies(res: Response): string {
  const getSetCookie = (
    res.headers as unknown as { getSetCookie?: () => string[] }
  ).getSetCookie;
  const parts =
    typeof getSetCookie === "function"
      ? getSetCookie.call(res.headers)
      : (res.headers.get("set-cookie") || "").split(/,(?=[^;,]+=)/);
  return parts
    .map((part) => part.split(";")[0]?.trim())
    .filter(Boolean)
    .join("; ");
}

async function signUp(): Promise<string> {
  const res = await fetch(`${BASE}/api/auth/sign-up/email`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Origin: BASE },
    body: JSON.stringify({
      email: `lawbite-smoke-${Date.now()}@lawbite-smoke.test`,
      password: "SmokeTest123!",
      name: "Deployed Smoke Test",
    }),
    redirect: "manual",
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });
  if (!res.ok) {
    throw new Error(
      `Sign-up failed (${res.status}): ${(await res.text()).slice(0, 300)}`,
    );
  }
  const jar = collectCookies(res);
  if (!jar.includes("session_token")) {
    throw new Error(`No session cookie returned. Got: ${jar || "<none>"}`);
  }
  return jar;
}

async function postChat(body: unknown, authenticated = true): Promise<Response> {
  return fetch(`${BASE}/api/chat`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Origin: BASE,
      ...(authenticated ? { cookie } : {}),
    },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });
}

/** Drains an SSE reply, recording when the first visible token arrived. */
async function readStream(res: Response): Promise<StreamRead> {
  const started = Date.now();
  const reader = res.body?.getReader();
  const out: StreamRead = {
    content: "",
    raw: "",
    status: res.status,
    contentType: res.headers.get("content-type") || "",
    firstContentMs: null,
    sawDone: false,
  };
  if (!reader) return out;

  const decoder = new TextDecoder();
  let pending = "";

  const consume = (line: string) => {
    if (!line.startsWith("data: ")) return;
    const data = line.slice(6).trim();
    if (!data) return;
    if (data === "[DONE]") {
      out.sawDone = true;
      return;
    }
    let frame: {
      content?: unknown;
      choices?: { delta?: { content?: unknown } }[];
    };
    try {
      frame = JSON.parse(data);
    } catch {
      return;
    }
    const delta = frame.choices?.[0]?.delta?.content;
    const text =
      typeof delta === "string"
        ? delta
        : typeof frame.content === "string"
          ? frame.content
          : "";
    if (text) {
      if (out.firstContentMs === null) out.firstContentMs = Date.now() - started;
      out.content += text;
    }
  };

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    const chunk = decoder.decode(value, { stream: true });
    out.raw += chunk;
    pending += chunk;
    const lines = pending.split("\n");
    pending = lines.pop() ?? "";
    for (const line of lines) consume(line);
  }
  if (pending) consume(pending);
  return out;
}

async function ask(
  query: string,
  conversationType = "talk-to-ai",
): Promise<StreamRead> {
  const res = await postChat({
    conversationType,
    messages: [{ role: "user", content: query }],
  });
  return readStream(res);
}

suite("deployed app — /api/chat", () => {
  beforeAll(async () => {
    cookie = await signUp();
  });

  chatIt("rejects unauthenticated chat requests", async () => {
    const res = await postChat(
      { conversationType: "talk-to-ai", messages: [{ role: "user", content: "hi" }] },
      false,
    );
    expect(res.status).toBe(401);
  });

  chatIt("rejects an empty message list", async () => {
    const res = await postChat({ conversationType: "talk-to-ai", messages: [] });
    expect(res.status).toBe(400);
  });

  chatIt("answers a plain greeting instantly from the fast path", async () => {
    const started = Date.now();
    const reply = await ask("hi");

    expect(reply.status).toBe(200);
    expect(reply.contentType).toContain("text/event-stream");
    expect(reply.content).toBe(GREETING);
    // No model call on this path, so it must not dawdle.
    expect(Date.now() - started).toBeLessThan(10_000);
  });

  chatIt("refuses a model-identity question without leaking the model", async () => {
    const started = Date.now();
    const reply = await ask("which model are you using");

    expect(reply.status).toBe(200);
    expect(reply.contentType).toContain("text/event-stream");
    expect(reply.content).toBe(
      "I can only provide information related to Indian law. Please ask a legal question concerning India.",
    );
    expect(reply.content).not.toMatch(/mercury|inception|deposit|sue|advocate/i);
    expect(reply.sawDone).toBe(true);
    expect(reply.firstContentMs).not.toBeNull();
    expect(reply.firstContentMs as number).toBeLessThan(10_000);
    expect(Date.now() - started).toBeLessThan(10_000);
  });

  chatIt("streams a real Indian-law answer without leaving the user waiting", async () => {
    const reply = await ask("Tell me about IPC 143.");

    expect(reply.status).toBe(200);
    expect(reply.contentType).toContain("text/event-stream");

    // Regression guard: reasoning models used to emit nothing visible for
    // 20-60s, which made the stream look dead and surface as a generic error.
    expect(reply.firstContentMs).not.toBeNull();
    expect(reply.firstContentMs as number).toBeLessThan(FIRST_CONTENT_BUDGET_MS);

    expect(reply.content.trim().length).toBeGreaterThan(20);
    expect(reply.sawDone).toBe(true);

    // The reply must be about the question and free of model scaffolding.
    expect(reply.content).toMatch(/unlawful|assembly|143|189|BNS|penal/i);
    expect(reply.content).not.toContain("reasoning_content");
    expect(reply.content).not.toContain("<think");
    expect(reply.content).not.toContain("keepalive");
  });

  chatIt("keeps the SSE connection warm while the model thinks", async () => {
    const reply = await ask("Explain the punishment for theft under IPC 378.");

    expect(reply.status).toBe(200);
    // The very first bytes are a comment heartbeat, so no proxy sees an idle
    // connection before the first token lands.
    expect(reply.raw.startsWith(": keepalive")).toBe(true);
    expect(reply.content.trim().length).toBeGreaterThan(20);
  });

  chatIt("delivers a full buffered deep-analysis reply", async () => {
    const reply = await ask(
      "Explain in detail the offence of cheating under IPC Section 420.",
      "analysis",
    );

    expect(reply.status).toBe(200);
    // Buffered modes assemble the whole reply before emitting anything, so the
    // keepalive comments are what stop the connection being dropped meanwhile.
    expect(reply.raw.startsWith(": keepalive")).toBe(true);
    expect(reply.sawDone).toBe(true);
    expect(reply.content.trim().length).toBeGreaterThan(200);
    expect(reply.content).not.toContain("reasoning_content");
  });

  chatIt("answers a follow-up question in the same session", async () => {
    const reply = await ask("What is the punishment for cheating under Section 420?");
    expect(reply.status).toBe(200);
    expect(reply.content.trim().length).toBeGreaterThan(20);
    expect(reply.content).not.toContain("reasoning_content");
  });
});
