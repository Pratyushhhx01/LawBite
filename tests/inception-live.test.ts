import { describe, it, expect } from "vitest";
import {
  buildProviderPayload,
  getDefaultModel,
  PROVIDERS,
} from "@/lib/ai-providers";

/**
 * Live integration check against the real Inception Labs API.
 *
 * Opt-in only — never runs in the default suite because it needs network access
 * and a funded key (the free tier is often rate-limited).
 *
 *   LIVE_AI_TESTS=1 npm run test -- tests/inception-live.test.ts
 */
const liveEnabled = process.env.LIVE_AI_TESTS === "1";
const apiKey = process.env.INCEPTION_API_KEY;

async function post(
  body: Record<string, unknown>,
  key: string = apiKey ?? "",
  retries = 6,
): Promise<Response> {
  for (let attempt = 0; ; attempt++) {
    const res = await fetch(PROVIDERS.inception.baseUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });
    if (res.status !== 429 || attempt >= retries) return res;
    await new Promise((r) => setTimeout(r, 5_000 + attempt * 2_000));
  }
}

describe.skipIf(!liveEnabled || !apiKey)("Inception Mercury 2.5 (live)", () => {
  const model = getDefaultModel().apiModel;

  it("answers a plain completion with visible content", async () => {
    const res = await post({
      model,
      messages: [{ role: "user", content: "Say OK." }],
      max_tokens: 4096,
    });
    expect(res.status).toBe(200);
    const json = await res.json();
    const content = json.choices?.[0]?.message?.content ?? "";
    expect(typeof content).toBe("string");
    expect(content.trim().length).toBeGreaterThan(0);
  }, 120_000);

  it("streams content deltas over SSE", async () => {
    const res = await post({
      model,
      messages: [
        { role: "user", content: "In one sentence, what is Article 21?" },
      ],
      max_tokens: 4096,
      stream: true,
    });
    expect(res.status).toBe(200);
    const text = await res.text();
    const deltas = text
      .split("\n")
      .filter((l) => l.startsWith("data: "))
      .map((l) => l.slice(6).trim())
      .filter((d) => d && d !== "[DONE]")
      .map((d) => {
        try {
          return JSON.parse(d).choices?.[0]?.delta?.content ?? "";
        } catch {
          return "";
        }
      })
      .join("");
    expect(deltas.trim().length).toBeGreaterThan(0);
  }, 120_000);

  it("stays grounded on Indian criminal law", async () => {
    const res = await post({
      model,
      messages: [
        {
          role: "system",
          content:
            "You are Lawbite AI, an Indian legal assistant. Answer in 1-2 sentences using current law (BNS/BNSS/BSA).",
        },
        {
          role: "user",
          content:
            "What is the punishment for murder under the Bharatiya Nyaya Sanhita?",
        },
      ],
      max_tokens: 4096,
    });
    expect(res.status).toBe(200);
    const json = await res.json();
    const content: string = json.choices?.[0]?.message?.content ?? "";
    expect(content).toMatch(/BNS|Bharatiya Nyaya|103/i);
    expect(content).toMatch(/death|life imprisonment/i);
  }, 120_000);

  it("rejects an invalid API key with 401", async () => {
    const res = await post(
      { model, messages: [{ role: "user", content: "hi" }] },
      "sk-invalid-key-for-test",
      0,
    );
    expect(res.status).toBe(401);
  });

  it("answers at instant effort with a low time-to-first-token", async () => {
    // Regression guard for the latency fix: omitting reasoning_effort makes the
    // API default to `medium`, which measured ~8-9s to the first visible token
    // on this prompt. `instant` measures under a second.
    const body = buildProviderPayload(getDefaultModel(), {
      messages: [
        {
          role: "user",
          content:
            "Name one section of the BNS 2023 about theft. Reply with just the number.",
        },
      ],
      maxTokens: 4096,
      temperature: 1.0,
      stream: true,
      reasoningEffort: "instant",
    });
    expect(body.reasoning_effort).toBe("instant");
    expect(body.max_completion_tokens).toBe(4096);
    expect(body).not.toHaveProperty("max_tokens");

    let result: { status: number; ttftMs: number | null } | null = null;
    for (let attempt = 0; ; attempt++) {
      const started = Date.now();
      const res = await fetch(PROVIDERS.inception.baseUrl, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });
      if (res.status === 429 && attempt < 8) {
        await new Promise((r) => setTimeout(r, 5_000 + attempt * 2_000));
        continue;
      }
      if (!res.ok) {
        result = { status: res.status, ttftMs: null };
        break;
      }
      const reader = res.body!.getReader();
      const { value } = await reader.read();
      result = { status: res.status, ttftMs: Date.now() - started };
      expect(new TextDecoder().decode(value ?? new Uint8Array())).toContain(
        "data:",
      );
      await reader.cancel().catch(() => {});
      break;
    }

    expect(result?.status).toBe(200);
    expect(result?.ttftMs).not.toBeNull();
    expect(result!.ttftMs!).toBeLessThan(4_000);
  }, 180_000);
});
