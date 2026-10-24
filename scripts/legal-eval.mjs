#!/usr/bin/env node
// LawBite legal accuracy benchmark.
//
// Runs the seeded legal QA set against the real /api/chat endpoint, then asks
// /api/citations/verify to check every section citation against the S3 bare
// acts. The report separates:
//   - section recall: did the answer cite the expected provision?
//   - citation precision: were the cited provisions real?
//   - hallucination rate: 1 - citation precision
//   - refusal accuracy: did boundary questions get refused?
//   - latency: end-to-end chat response time
//
// Usage:
//   npm run eval:legal
//   npm run eval:legal -- --limit 10
//   npm run eval:legal -- --reviewed-only
//   npm run eval:legal -- --base https://law-bite.vercel.app
//   npm run eval:legal -- --fail-under 80
//
// The dataset is a seed set and is not advocate-reviewed yet. Do not publish
// the score as a legal-accuracy claim until `review_status` is `reviewed`.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
dotenv.config({ path: path.join(ROOT, ".env.local") });

function parseArgs(argv) {
  const args = {};
  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (!token.startsWith("--")) continue;
    const [key, inline] = token.slice(2).split("=", 2);
    if (inline !== undefined) {
      args[key] = inline;
      continue;
    }
    const next = argv[index + 1];
    if (next && !next.startsWith("--")) {
      args[key] = next;
      index += 1;
    } else {
      args[key] = true;
    }
  }
  return args;
}

const args = parseArgs(process.argv.slice(2));
const BASE = String(
  args.base || process.env.LB_BASE || "http://localhost:3000",
).replace(/\/$/, "");
const DATASET_PATH = path.resolve(
  ROOT,
  String(args.dataset || "benchmarks/legal-qa.jsonl"),
);
const OUT_DIR = path.resolve(ROOT, String(args.out || "test-results"));
const LIMIT = args.limit === undefined ? Infinity : Number(args.limit);
const REVIEWED_ONLY = Boolean(
  args["reviewed-only"] || process.env.LB_REVIEWED_ONLY === "1",
);
const FAIL_UNDER =
  args["fail-under"] === undefined ? null : Number(args["fail-under"]);
const MODE_OVERRIDE = typeof args.mode === "string" ? args.mode : null;
const ID_FILTER = args.id
  ? String(args.id)
      .split(",")
      .map((id) => id.trim())
      .filter(Boolean)
  : null;
const DELAY_MS = args.delay === undefined ? 350 : Number(args.delay);
const REQUEST_TIMEOUT_MS = 120_000;

const EMPTY_SUMMARY = {
  total: 0,
  sectionTotal: 0,
  sectionVerified: 0,
  sectionUnverified: 0,
  sectionLookupErrors: 0,
  verifiableSectionTotal: 0,
  precision: null,
  hallucinationRate: null,
  referenceTotal: 0,
  webTotal: 0,
  webTrusted: 0,
};

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function pct(value) {
  return value === null || value === undefined
    ? "n/a"
    : `${(value * 100).toFixed(1)}%`;
}

function average(values) {
  if (values.length === 0) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function percentile(values, percentileValue) {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.min(
    sorted.length - 1,
    Math.ceil((percentileValue / 100) * sorted.length) - 1,
  );
  return sorted[Math.max(0, index)];
}

function normaliseText(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function includesPhrase(haystack, needle) {
  return normaliseText(haystack).includes(normaliseText(needle));
}

function isRefusal(text) {
  const patterns = [
    /only provide information related to indian law/i,
    /only (?:answer|help with|provide).{0,60}(?:indian law|questions about india)/i,
    /outside (?:the scope|my scope) of indian law/i,
    /not a legal (?:question|matter|issue)/i,
  ];
  return patterns.some((pattern) => pattern.test(text));
}

function sectionEquivalent(left, right) {
  if (!left || !right) return false;
  const normalise = (value) => String(value).replace(/\s+/g, "").toLowerCase();
  const a = normalise(left);
  const b = normalise(right);
  if (a === b) return true;
  return a.replace(/\(.*$/, "") === b.replace(/\(.*$/, "");
}

function expectedCitations(question) {
  if (Array.isArray(question.expected_citations)) {
    return question.expected_citations;
  }
  if (question.expected_act_key && Array.isArray(question.expected_sections)) {
    return question.expected_sections.map((section) => ({
      actKey: question.expected_act_key,
      section,
    }));
  }
  return [];
}

function citationMatches(result, expected) {
  if (result.kind !== "section") return false;
  if (result.actKey !== expected.actKey) return false;
  return sectionEquivalent(
    result.matchedSection ?? result.section,
    expected.section,
  );
}

function citationLabel(result) {
  const act = result.actName || result.actKey || "Unknown act";
  const section = result.matchedSection || result.section || "?";
  return `${act} ${section}`;
}

function loadDataset() {
  if (!fs.existsSync(DATASET_PATH)) {
    throw new Error(`Dataset not found: ${DATASET_PATH}`);
  }

  const rows = fs
    .readFileSync(DATASET_PATH, "utf8")
    .split(/\r?\n/)
    .map((line, index) => {
      if (!line.trim()) return null;
      try {
        return JSON.parse(line);
      } catch (error) {
        throw new Error(
          `Invalid JSON on line ${index + 1}: ${error instanceof Error ? error.message : String(error)}`,
        );
      }
    })
    .filter(Boolean);

  const seen = new Set();
  for (const row of rows) {
    if (!row.id || typeof row.id !== "string") {
      throw new Error("Every benchmark row needs a string id");
    }
    if (seen.has(row.id)) {
      throw new Error(`Duplicate benchmark id: ${row.id}`);
    }
    seen.add(row.id);
    if (!row.question || typeof row.question !== "string") {
      throw new Error(`Benchmark ${row.id} has no question text`);
    }
  }

  let selected = REVIEWED_ONLY
    ? rows.filter((row) => row.review_status === "reviewed")
    : rows;

  if (ID_FILTER) {
    selected = selected.filter((row) => ID_FILTER.includes(row.id));
  }

  if (Number.isFinite(LIMIT) && LIMIT > 0) {
    selected = selected.slice(0, LIMIT);
  }

  if (selected.length === 0) {
    throw new Error(
      REVIEWED_ONLY
        ? "No reviewed questions found. Remove --reviewed-only or review the dataset first."
        : "No benchmark questions selected.",
    );
  }

  return selected;
}

async function createSession() {
  const email = `lawbite-legal-eval-${Date.now()}@lawbite-smoke.test`;
  const password = "EvalPass123!";

  const response = await fetch(`${BASE}/api/auth/sign-up/email`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Origin: BASE,
    },
    body: JSON.stringify({ email, password, name: "Legal Eval" }),
    signal: AbortSignal.timeout(30_000),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(
      `Sign-up failed (${response.status}): ${body.slice(0, 400)}`,
    );
  }

  const setCookies =
    typeof response.headers.getSetCookie === "function"
      ? response.headers.getSetCookie()
      : [];
  let cookie = setCookies
    .map((value) => value.split(";")[0])
    .find((value) => /better-auth\.session_token=/.test(value));

  if (!cookie) {
    const raw = response.headers.get("set-cookie") || "";
    const match = raw.match(/[^,;\s]*better-auth\.session_token=[^;]+/);
    cookie = match?.[0];
  }

  if (!cookie) {
    throw new Error(
      "Sign-up succeeded but no Better Auth session cookie was returned",
    );
  }

  return { cookie, email };
}

function retryAfterMs(response) {
  const seconds = Number(response.headers.get("retry-after"));
  return Number.isFinite(seconds) && seconds > 0 ? seconds * 1000 : 10_000;
}

function processSseLine(line, state) {
  if (!line.startsWith("data: ")) return;
  const data = line.slice(6).trim();
  if (!data || data === "[DONE]") return;

  let parsed;
  try {
    parsed = JSON.parse(data);
  } catch {
    return;
  }

  if (typeof parsed.content === "string") {
    if (parsed.replace) {
      state.content = parsed.content;
    } else {
      state.content += parsed.content;
    }
  }

  if (Array.isArray(parsed.citations)) {
    state.citations = parsed.citations;
  }

  if (parsed.error) {
    state.error = String(parsed.error);
  }
}

async function readSse(response) {
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  const state = { content: "", citations: [], error: null };
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split(/\r?\n/);
    buffer = lines.pop() ?? "";
    for (const line of lines) processSseLine(line, state);
  }

  buffer += decoder.decode();
  if (buffer.trim()) processSseLine(buffer.trim(), state);
  return state;
}

async function ask(cookie, question) {
  const startedAt = Date.now();
  const body = JSON.stringify({
    conversationType: MODE_OVERRIDE || question.mode || "analysis",
    messages: [{ role: "user", content: question.question }],
  });

  for (let attempt = 0; attempt < 3; attempt += 1) {
    const response = await fetch(`${BASE}/api/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Origin: BASE,
        Cookie: cookie,
      },
      body,
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });

    if (response.status === 429) {
      if (attempt === 2) {
        return {
          ok: false,
          status: 429,
          error: "Rate limited after three attempts",
          content: "",
          citations: [],
          latencyMs: Date.now() - startedAt,
        };
      }
      await sleep(retryAfterMs(response));
      continue;
    }

    if (!response.ok) {
      const error = await response.text();
      return {
        ok: false,
        status: response.status,
        error: error.slice(0, 1_000),
        content: "",
        citations: [],
        latencyMs: Date.now() - startedAt,
      };
    }

    const parsed = await readSse(response);
    return {
      ok: !parsed.error,
      status: response.status,
      error: parsed.error,
      content: parsed.content,
      citations: parsed.citations,
      latencyMs: Date.now() - startedAt,
    };
  }

  return {
    ok: false,
    status: 0,
    error: "Chat request failed",
    content: "",
    citations: [],
    latencyMs: Date.now() - startedAt,
  };
}

function sanitiseCitations(citations) {
  if (!Array.isArray(citations)) return [];
  return citations
    .filter(
      (citation) =>
        citation &&
        (citation.type === "act" || citation.type === "web") &&
        typeof citation.label === "string",
    )
    .slice(0, 50)
    .map((citation) => ({
      type: citation.type,
      label: citation.label.slice(0, 500),
      snippet:
        typeof citation.snippet === "string"
          ? citation.snippet.slice(0, 5_000)
          : undefined,
      url:
        typeof citation.url === "string"
          ? citation.url.slice(0, 2_000)
          : undefined,
    }));
}

async function verifyAnswer(cookie, answer) {
  const text = String(answer.content || "").slice(0, 20_000);
  const citations = sanitiseCitations(answer.citations);

  if (!text && citations.length === 0) {
    return { ok: true, results: [], summary: { ...EMPTY_SUMMARY } };
  }

  for (let attempt = 0; attempt < 3; attempt += 1) {
    const response = await fetch(`${BASE}/api/citations/verify`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Origin: BASE,
        Cookie: cookie,
      },
      body: JSON.stringify({ text, citations }),
      signal: AbortSignal.timeout(30_000),
    });

    if (response.status === 429) {
      if (attempt === 2) {
        return {
          ok: false,
          error: "Rate limited after three attempts",
          results: [],
          summary: { ...EMPTY_SUMMARY },
        };
      }
      await sleep(retryAfterMs(response));
      continue;
    }

    if (!response.ok) {
      const error = await response.text();
      return {
        ok: false,
        error: `${response.status}: ${error.slice(0, 500)}`,
        results: [],
        summary: { ...EMPTY_SUMMARY },
      };
    }

    return { ok: true, ...(await response.json()) };
  }

  return {
    ok: false,
    error: "Citation verification failed",
    results: [],
    summary: { ...EMPTY_SUMMARY },
  };
}

function failureResult(question, error) {
  const expected = expectedCitations(question);
  return {
    id: question.id,
    category: question.category || "uncategorised",
    question: question.question,
    mode: MODE_OVERRIDE || question.mode || "analysis",
    must_refuse: Boolean(question.must_refuse),
    review_status: question.review_status || "draft",
    expected,
    found: [],
    recall: 0,
    precision: null,
    hallucinationRate: null,
    verificationUnavailable: true,
    contentChecks: (question.must_include || []).map((term) => ({
      term,
      pass: false,
    })),
    forbiddenChecks: (question.must_not_include || []).map((term) => ({
      term,
      pass: true,
    })),
    contentPass: false,
    refusal: false,
    refusalPass: false,
    score: 0,
    pass: false,
    latencyMs: 0,
    answer: "",
    citations: [],
    verification: {
      ok: false,
      error: error instanceof Error ? error.message : String(error),
      results: [],
      summary: { ...EMPTY_SUMMARY },
    },
    issues: [error instanceof Error ? error.message : String(error)],
  };
}

async function evaluate(cookie, question) {
  const answer = await ask(cookie, question);
  if (!answer.ok) {
    return failureResult(
      question,
      answer.error || `Chat failed with ${answer.status}`,
    );
  }

  const verification = await verifyAnswer(cookie, answer);
  const expected = expectedCitations(question);
  const results = Array.isArray(verification.results)
    ? verification.results
    : [];
  const found = expected.filter((citation) =>
    results.some((result) => citationMatches(result, citation)),
  );
  const sectionResults = results.filter((result) => result.kind === "section");
  const lookupErrors = sectionResults.filter(
    (result) => result.reason === "lookup_error",
  );
  const verifiableSections = sectionResults.filter(
    (result) => result.reason !== "lookup_error",
  );
  const verifiedSections = verifiableSections.filter(
    (result) => result.verified,
  );

  const recall = expected.length > 0 ? found.length / expected.length : 1;
  const precision = verifiableSections.length
    ? verifiedSections.length / verifiableSections.length
    : expected.length > 0
      ? null
      : 1;
  const hallucinationRate =
    precision === null ? null : verifiableSections.length ? 1 - precision : 0;
  const verificationUnavailable =
    !verification.ok ||
    (sectionResults.length > 0 && verifiableSections.length === 0);

  const contentChecks = (question.must_include || []).map((term) => ({
    term,
    pass: includesPhrase(answer.content, term),
  }));
  const forbiddenChecks = (question.must_not_include || []).map((term) => ({
    term,
    pass: !includesPhrase(answer.content, term),
  }));
  const contentPass =
    contentChecks.every((check) => check.pass) &&
    forbiddenChecks.every((check) => check.pass);

  const refusal = isRefusal(answer.content);
  const refusalPass = question.must_refuse ? refusal : !refusal;
  const score = question.must_refuse
    ? refusalPass
      ? 100
      : 0
    : Math.round(
        40 * recall +
          25 * (precision ?? 0) +
          20 * (contentPass ? 1 : 0) +
          15 * (refusalPass ? 1 : 0),
      );
  const pass = question.must_refuse
    ? refusalPass
    : score >= 80 &&
      recall === 1 &&
      !verificationUnavailable &&
      (hallucinationRate ?? 0) === 0;

  const issues = [];
  if (!verification.ok) {
    issues.push(`Citation verification error: ${verification.error}`);
  }

  const missing = expected.filter(
    (citation) => !results.some((result) => citationMatches(result, citation)),
  );
  if (missing.length > 0) {
    issues.push(
      `Missing expected citation(s): ${missing
        .map((citation) => `${citation.actKey} ${citation.section}`)
        .join(", ")}`,
    );
  }

  if (verificationUnavailable) {
    issues.push(
      `Citation verification unavailable${lookupErrors.length > 0 ? ` for: ${lookupErrors.map((result) => citationLabel(result)).join(", ")}` : ""}.`,
    );
  }

  const unverified = verifiableSections.filter((result) => !result.verified);
  if (unverified.length > 0) {
    issues.push(
      `Unverified citation(s): ${unverified
        .map((result) => `${citationLabel(result)} (${result.reason})`)
        .join(", ")}`,
    );
  }

  const missingTerms = contentChecks
    .filter((check) => !check.pass)
    .map((check) => check.term);
  if (missingTerms.length > 0) {
    issues.push(`Missing required term(s): ${missingTerms.join(", ")}`);
  }

  const forbiddenTerms = forbiddenChecks
    .filter((check) => !check.pass)
    .map((check) => check.term);
  if (forbiddenTerms.length > 0) {
    issues.push(`Forbidden phrase(s) present: ${forbiddenTerms.join(", ")}`);
  }

  if (question.must_refuse && !refusal) {
    issues.push("Expected a refusal but the answer was substantive.");
  }
  if (!question.must_refuse && refusal) {
    issues.push("Unexpected refusal for an in-scope legal question.");
  }

  return {
    id: question.id,
    category: question.category || "uncategorised",
    question: question.question,
    mode: MODE_OVERRIDE || question.mode || "analysis",
    must_refuse: Boolean(question.must_refuse),
    review_status: question.review_status || "draft",
    expected,
    found,
    recall,
    precision,
    hallucinationRate,
    verificationUnavailable,
    contentChecks,
    forbiddenChecks,
    contentPass,
    refusal,
    refusalPass,
    score,
    pass,
    latencyMs: answer.latencyMs,
    answer: answer.content,
    citations: answer.citations,
    verification: {
      ok: verification.ok,
      error: verification.error,
      results,
      summary: verification.summary || { ...EMPTY_SUMMARY },
    },
    issues,
  };
}

function aggregate(results) {
  const total = results.length;
  const passed = results.filter((result) => result.pass).length;
  const expectedTotal = results.reduce(
    (sum, result) => sum + result.expected.length,
    0,
  );
  const expectedFound = results.reduce(
    (sum, result) => sum + result.found.length,
    0,
  );
  const sectionResults = results.flatMap((result) =>
    result.verification.results.filter((item) => item.kind === "section"),
  );
  const verifiableSections = sectionResults.filter(
    (item) => item.reason !== "lookup_error",
  );
  const sectionVerified = verifiableSections.filter(
    (item) => item.verified,
  ).length;
  const verificationUnavailableQuestions = results.filter(
    (result) => result.verificationUnavailable,
  ).length;
  const refusalQuestions = results.filter((result) => result.must_refuse);
  const refusalCorrect = refusalQuestions.filter(
    (result) => result.refusalPass,
  ).length;
  const contentQuestions = results.filter((result) => !result.must_refuse);
  const contentCorrect = contentQuestions.filter(
    (result) => result.contentPass,
  ).length;

  return {
    total,
    passed,
    passRate: total ? passed / total : 0,
    averageScore: average(results.map((result) => result.score)),
    sectionRecall: expectedTotal ? expectedFound / expectedTotal : null,
    citationPrecision: verifiableSections.length
      ? sectionVerified / verifiableSections.length
      : null,
    hallucinationRate: verifiableSections.length
      ? 1 - sectionVerified / verifiableSections.length
      : null,
    verificationUnavailableQuestions,
    refusalAccuracy: refusalQuestions.length
      ? refusalCorrect / refusalQuestions.length
      : null,
    contentAccuracy: contentQuestions.length
      ? contentCorrect / contentQuestions.length
      : null,
    p95LatencyMs: percentile(
      results.map((result) => result.latencyMs),
      95,
    ),
  };
}

function groupByCategory(results) {
  const groups = new Map();
  for (const result of results) {
    const list = groups.get(result.category) ?? [];
    list.push(result);
    groups.set(result.category, list);
  }
  return [...groups.entries()]
    .map(([category, items]) => ({
      category,
      ...aggregate(items),
    }))
    .sort((a, b) => a.category.localeCompare(b.category));
}

function escapeTable(value) {
  return String(value ?? "")
    .replace(/\|/g, "\\|")
    .replace(/\r?\n/g, " ")
    .slice(0, 500);
}

function renderMarkdown(meta, summary, categories, results) {
  const reviewed = results.filter(
    (result) => result.review_status === "reviewed",
  ).length;
  const draft = results.length - reviewed;

  const lines = [];
  lines.push("# LawBite Legal Accuracy Benchmark");
  lines.push("");
  lines.push(`- Date: ${meta.generatedAt}`);
  lines.push(`- Endpoint: ${meta.base}`);
  lines.push(`- Dataset: \`${meta.dataset}\``);
  lines.push(`- Questions: ${results.length}`);
  lines.push(`- Review status: ${reviewed} reviewed, ${draft} draft`);
  lines.push("");
  if (draft > 0) {
    lines.push(
      "> This run includes draft questions that have not been advocate-reviewed. Use it as an engineering regression signal, not as a public legal-accuracy claim.",
    );
    lines.push("");
  }
  lines.push("## Overall");
  lines.push("");
  lines.push("| Metric | Value |");
  lines.push("| --- | ---: |");
  lines.push(
    `| Passed | ${summary.passed}/${summary.total} (${pct(summary.passRate)}) |`,
  );
  lines.push(`| Average score | ${summary.averageScore.toFixed(1)}/100 |`);
  lines.push(`| Section recall | ${pct(summary.sectionRecall)} |`);
  lines.push(`| Citation precision | ${pct(summary.citationPrecision)} |`);
  lines.push(`| Hallucination rate | ${pct(summary.hallucinationRate)} |`);
  lines.push(
    `| Verification unavailable | ${summary.verificationUnavailableQuestions}/${summary.total} |`,
  );
  lines.push(`| Refusal accuracy | ${pct(summary.refusalAccuracy)} |`);
  lines.push(`| Content accuracy | ${pct(summary.contentAccuracy)} |`);
  lines.push(`| p95 latency | ${(summary.p95LatencyMs / 1000).toFixed(1)}s |`);
  lines.push("");
  lines.push("## By category");
  lines.push("");
  lines.push(
    "| Category | Questions | Passed | Avg score | Recall | Precision | Hallucination | p95 latency |",
  );
  lines.push("| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |");
  for (const category of categories) {
    lines.push(
      `| ${escapeTable(category.category)} | ${category.total} | ${category.passed} | ${category.averageScore.toFixed(1)} | ${pct(category.sectionRecall)} | ${pct(category.citationPrecision)} | ${pct(category.hallucinationRate)} | ${(category.p95LatencyMs / 1000).toFixed(1)}s |`,
    );
  }
  lines.push("");
  lines.push("## Question results");
  lines.push("");
  lines.push(
    "| ID | Category | Score | Recall | Precision | Hallucination | Refusal | Latency | Result |",
  );
  lines.push("| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | --- |");
  for (const result of results) {
    lines.push(
      `| \`${escapeTable(result.id)}\` | ${escapeTable(result.category)} | ${result.score} | ${pct(result.recall)} | ${pct(result.precision)} | ${pct(result.hallucinationRate)} | ${result.refusalPass ? "ok" : "fail"} | ${(result.latencyMs / 1000).toFixed(1)}s | ${result.pass ? "PASS" : "FAIL"} |`,
    );
  }
  lines.push("");
  lines.push("## Details");
  lines.push("");
  for (const result of results) {
    lines.push(`### \`${result.id}\` — ${result.question}`);
    lines.push("");
    lines.push(`- Category: ${result.category}`);
    lines.push(`- Mode: ${result.mode}`);
    lines.push(`- Review status: ${result.review_status}`);
    lines.push(
      `- Score: ${result.score}/100 (${result.pass ? "PASS" : "FAIL"})`,
    );
    lines.push(
      `- Expected: ${result.expected.length > 0 ? result.expected.map((item) => `${item.actKey} ${item.section}`).join(", ") : "none (refusal question)"}`,
    );
    lines.push(
      `- Found: ${result.found.length > 0 ? result.found.map((item) => `${item.actKey} ${item.section}`).join(", ") : "none"}`,
    );
    lines.push(
      `- Verification unavailable: ${result.verificationUnavailable ? "yes" : "no"}`,
    );
    lines.push(
      `- Content checks: ${result.contentChecks.map((check) => `${check.term}=${check.pass ? "ok" : "missing"}`).join(", ") || "none"}`,
    );
    lines.push(
      `- Refusal expected: ${result.must_refuse ? "yes" : "no"}; detected: ${result.refusal ? "yes" : "no"}`,
    );
    lines.push(
      `- Issues: ${result.issues.length > 0 ? result.issues.join("; ") : "none"}`,
    );
    lines.push("");
    lines.push("<details>");
    lines.push("<summary>Answer</summary>");
    lines.push("");
    lines.push("```text");
    lines.push(result.answer.slice(0, 4_000) || "(empty)");
    lines.push("```");
    lines.push("");
    lines.push("</details>");
    lines.push("");
    lines.push("<details>");
    lines.push("<summary>Citation verification</summary>");
    lines.push("");
    if (result.verification.results.length === 0) {
      lines.push("No citations detected.");
    } else {
      lines.push("| Citation | Kind | Act key | Section | Verified | Reason |");
      lines.push("| --- | --- | --- | --- | --- | --- |");
      for (const item of result.verification.results) {
        lines.push(
          `| ${escapeTable(item.label)} | ${item.kind} | ${escapeTable(item.actKey ?? "")} | ${escapeTable(item.matchedSection ?? item.section ?? "")} | ${item.verified ? "yes" : "no"} | ${escapeTable(item.reason)} |`,
        );
      }
    }
    lines.push("");
    lines.push("</details>");
    lines.push("");
  }

  return lines.join("\n");
}

async function main() {
  const questions = loadDataset();
  console.log(
    `LawBite legal benchmark: ${questions.length} questions against ${BASE}`,
  );
  if (REVIEWED_ONLY) console.log("Running reviewed questions only.");

  const session = await createSession();
  console.log(`Authenticated as ${session.email}`);

  const results = [];
  for (let index = 0; index < questions.length; index += 1) {
    const question = questions[index];
    process.stdout.write(
      `[${index + 1}/${questions.length}] ${question.id} ... `,
    );
    let result;
    try {
      result = await evaluate(session.cookie, question);
    } catch (error) {
      result = failureResult(question, error);
    }
    results.push(result);
    console.log(
      `${result.pass ? "PASS" : "FAIL"} score=${result.score} recall=${pct(result.recall)} precision=${pct(result.precision)} ${(result.latencyMs / 1000).toFixed(1)}s`,
    );
    if (DELAY_MS > 0 && index < questions.length - 1) {
      await sleep(DELAY_MS);
    }
  }

  const summary = aggregate(results);
  const categories = groupByCategory(results);
  const meta = {
    generatedAt: new Date().toISOString(),
    base: BASE,
    dataset: path.relative(ROOT, DATASET_PATH).replace(/\\/g, "/"),
    reviewedOnly: REVIEWED_ONLY,
    modeOverride: MODE_OVERRIDE,
  };

  fs.mkdirSync(OUT_DIR, { recursive: true });
  const markdownPath = path.join(OUT_DIR, "legal-eval-report.md");
  const jsonPath = path.join(OUT_DIR, "legal-eval-report.json");
  fs.writeFileSync(
    markdownPath,
    renderMarkdown(meta, summary, categories, results),
    "utf8",
  );
  fs.writeFileSync(
    jsonPath,
    JSON.stringify({ meta, summary, categories, results }, null, 2),
    "utf8",
  );

  console.log("");
  console.log(
    `Passed ${summary.passed}/${summary.total} (${pct(summary.passRate)})`,
  );
  console.log(`Average score: ${summary.averageScore.toFixed(1)}/100`);
  console.log(`Section recall: ${pct(summary.sectionRecall)}`);
  console.log(`Citation precision: ${pct(summary.citationPrecision)}`);
  console.log(`Hallucination rate: ${pct(summary.hallucinationRate)}`);
  console.log(
    `Verification unavailable: ${summary.verificationUnavailableQuestions}/${summary.total}`,
  );
  console.log(`Refusal accuracy: ${pct(summary.refusalAccuracy)}`);
  console.log(`p95 latency: ${(summary.p95LatencyMs / 1000).toFixed(1)}s`);
  console.log(`Report: ${markdownPath}`);
  console.log(`JSON: ${jsonPath}`);

  if (FAIL_UNDER !== null && summary.averageScore < FAIL_UNDER) {
    console.error(
      `Average score ${summary.averageScore.toFixed(1)} is below --fail-under ${FAIL_UNDER}`,
    );
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
