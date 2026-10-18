#!/usr/bin/env node
// Lawbite Chat Understandability Test Harness
//
// Self-provisions an auth session directly in the DB (no cookies needed), signs the
// session cookie exactly as better-auth does (HMAC-SHA256 over the token), then runs a
// battery of question types across all conversation modes. Each response is scored for
// readability (Flesch), legal-jargon density, and formatting pattern, and a comparison
// grid + full report are written to test-results/.
//
// Usage:
//   npm run eval                 # full battery (17 tests, ~3-4 min)
//   npm run eval -- FROM=1 TO=5  # run tests T01..T05 only
//   LB_BASE=http://...           # override API base URL (default http://localhost:3000)

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import crypto from "node:crypto";
import pg from "pg";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const BASE = process.env.LB_BASE || "http://localhost:3000";
const FROM = parseInt(process.env.FROM || "1", 10);
const TO = parseInt(process.env.TO || String(999), 10);

// ---------------------------------------------------------------- env loading
function loadEnv() {
  const raw = fs.readFileSync(path.join(ROOT, ".env.local"), "utf8");
  const env = {};
  for (const line of raw.split(/\r?\n/)) {
    const m = line.match(/^([A-Z0-9_]+)\s*=\s*"?([^"\r\n]*?)"?\s*$/);
    if (m) env[m[1]] = m[2].trim();
  }
  return env;
}

const env = loadEnv();
const SECRET = process.env.LB_SECRET || env.BETTER_AUTH_SECRET;
const DB_URL = process.env.LB_DB_URL || env.DATABASE_URL;

if (!SECRET || !DB_URL) {
  console.error("BETTER_AUTH_SECRET / DATABASE_URL missing from .env.local");
  process.exit(1);
}

// ---------------------------------------------------------------- session provisioning
// Sign exactly like better-auth signCookieValue: base64url(HMAC-SHA256(secret, value)).
// better-auth keeps the base64 *standard* + URL-encoded inside the cookie string.
function signCookieValue(value, secret) {
  const sig = crypto
    .createHmac("sha256", secret)
    .update(value)
    .digest("base64url");
  const encoded = sig.replace(/-/g, "+").replace(/_/g, "/");
  const padded = encoded.padEnd(Math.ceil(encoded.length / 4) * 4, "=");
  return value + "." + encodeURIComponent(padded);
}

async function getDb() {
  const client = new pg.Client({ connectionString: DB_URL });
  await client.connect();
  return client;
}

async function provisionSession() {
  const client = await getDb();
  try {
    const { rows } = await client.query(
      `SELECT "userId" FROM session WHERE "expiresAt" > now() ORDER BY "createdAt" DESC LIMIT 1`,
    );
    if (rows.length === 0) {
      const { rows: users } = await client.query(
        `SELECT id FROM "user" LIMIT 1`,
      );
      if (users.length === 0) throw new Error("No user in DB to run eval as");
      return { userId: users[0].id, created: false };
    }
    return { userId: rows[0].userId, created: false };
  } finally {
    await client.end();
  }
}

async function runAs(callback) {
  // Reuse the most recent active session instead of forging a new one — the same
  // signing path is used either way, but this avoids creating/deleting DB rows.
  const { userId } = await provisionSession();
  const client = await getDb();
  try {
    const { rows } = await client.query(
      `SELECT token FROM session WHERE "userId" = $1 AND "expiresAt" > now() ORDER BY "createdAt" DESC LIMIT 1`,
      [userId],
    );
    if (rows.length === 0)
      throw new Error(`No active session for user ${userId}`);
    const token = rows[0].token;
    const cookie = `better-auth.session_token=${signCookieValue(token, SECRET)}`;
    await callback(cookie);
  } finally {
    await client.end();
  }
}

// ---------------------------------------------------------------- test battery
const TESTS = [
  {
    id: "T01",
    mode: "chat",
    q: "What is BNS section 103?",
    kind: "single-section",
    expect: "section-info",
  },
  {
    id: "T02",
    mode: "chat",
    q: "Explain BNS sections 103, 74 and 245.",
    kind: "multi-section",
    expect: "table",
    refs: ["103", "74", "245"],
  },
  {
    id: "T03",
    mode: "chat",
    q: "What is BNS section 302?",
    kind: "wrong-number-trap",
    expect: "correct-bns-302",
  },
  {
    id: "T04",
    mode: "chat",
    q: "What is the definition of murder?",
    kind: "definition",
    expect: "definition",
  },
  {
    id: "T05",
    mode: "chat",
    q: "Difference between theft and extortion?",
    kind: "comparison",
    expect: "table",
  },
  {
    id: "T06",
    mode: "analysis",
    q: "How do I file an FIR in India?",
    kind: "procedure",
    expect: "steps",
  },
  {
    id: "T07",
    mode: "chat",
    q: "What are the legal consequences of not paying income tax?",
    kind: "warning",
    expect: "warning",
  },
  { id: "T08", mode: "chat", q: "hi", kind: "greeting", expect: "greeting" },
  {
    id: "T09",
    mode: "chat",
    q: "What is the law on marijuana in the USA?",
    kind: "off-topic",
    expect: "indian-only-refusal",
  },
  {
    id: "T10",
    mode: "chat",
    q: "Who is the current Chief Justice of India?",
    kind: "current-affairs",
    expect: "web-search",
  },
  {
    id: "T11",
    mode: "analysis",
    q: "Give me a complete overview of divorce laws across all religions in India.",
    kind: "personal-law-overview",
    expect: "big-table",
  },
  {
    id: "T12",
    mode: "chat",
    q: "Tell me about dowry",
    kind: "vague",
    expect: "clear-answer",
  },
  {
    id: "T13",
    mode: "chat",
    q: "What does article 302 of the constitution say?",
    kind: "article-trap",
    expect: "no-such-article",
  },
  {
    id: "T14",
    mode: "analysis",
    q: "Analyze the legal consequences of a cheque bounce in India in detail.",
    kind: "analysis",
    expect: "numbered-analysis",
  },
  {
    id: "T15",
    mode: "grill",
    q: "I was involved in a road accident in Delhi last night. The other driver was drunk.",
    kind: "grill",
    expect: "single-question-back",
  },
  {
    id: "T16",
    mode: "draft",
    q: "Please draft a legal notice for unpaid rent with the following details:",
    kind: "draft-blank",
    expect: "blank-template",
  },
  {
    id: "T17",
    mode: "review",
    q: "Please review this rental agreement clause: 'The tenant shall pay a penalty equal to double the monthly rent for any delay beyond 3 days, and the landlord may lock the premises after 10 days of non-payment.'",
    kind: "review",
    expect: "risk-analysis",
  },
  {
    id: "T18",
    mode: "chat",
    q: "what is section 308 302 and 354",
    kind: "multi-section-space",
    expect: "table",
    refs: ["308", "302", "354"],
  },
  {
    id: "T19",
    mode: "chat",
    q: "what is section 308 302 354 and article 21",
    kind: "multi-ref-mixed",
    expect: "table",
    refs: ["308", "302", "354", "21"],
  },
  {
    id: "T20",
    mode: "chat",
    q: "what is section 302 and 354",
    kind: "multi-section",
    expect: "table",
    refs: ["302", "354"],
  },
  {
    id: "T21",
    mode: "analysis",
    q: "give a deep analysis of sections 302 304 308 and 354 of BNS",
    kind: "analysis-multi",
    expect: "table",
    refs: ["302", "304", "308", "354"],
  },
  {
    id: "T22",
    mode: "chat",
    q: "what is section 308 302 354",
    kind: "multi-section-space",
    expect: "table",
    refs: ["308", "302", "354"],
  },
];

// ---------------------------------------------------------------- API call
async function ask(cookie, mode, userContent) {
  const body = JSON.stringify({
    conversationType: mode,
    messages: [{ role: "user", content: userContent }],
  });
  const res = await fetch(`${BASE}/api/chat`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Origin: "http://localhost:3000",
      Cookie: cookie,
    },
    body,
  });
  if (!res.ok) {
    const t = await res.text();
    return { status: res.status, error: t.slice(0, 300) };
  }
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buf = "";
  let sse = "";
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buf += decoder.decode(value, { stream: true });
    const parts = buf.split("\n");
    buf = parts.pop() ?? "";
    for (const line of parts) {
      if (!line.startsWith("data: ")) continue;
      const data = line.slice(6).trim();
      if (!data || data === "[DONE]") continue;
      try {
        const parsed = JSON.parse(data);
        if (parsed.content) sse += parsed.content;
      } catch {}
    }
  }
  return { status: 200, content: sse };
}

// ---------------------------------------------------------------- readability scoring
const LEGAL_TERMS = new Set(
  `section article act court decree affidavit bail cognizable jurisdiction clause imprisonment punishment offence statute summons petition plaintiff defendant tribunal ordinance sanction repeal amendment provision liability forfeiture adjudication arbitration indemnity legal notice notice fraud fraudulent negligence tenant landlord contract settlement appeal appellate authority magistrate acquittal conviction evidence witness trial proceeding suit`.split(
    /\s+/,
  ),
);

function countSyllables(word) {
  const w = word.toLowerCase().replace(/[^a-z]/g, "");
  if (!w) return 0;
  let count = (w.match(/[aeiouy]+/g) || []).length;
  if (w.endsWith("e")) count--;
  if (count < 1) count = 1;
  return count;
}

function score(text) {
  const words = text.split(/\s+/).filter((w) => /[a-zA-Z0-9]/.test(w));
  const sentences = text.split(/[.!?]+/).filter((s) => s.trim().length > 0);
  const wordCount = words.length;
  const sentenceCount = sentences.length || 1;
  const syllables = words.reduce((a, w) => a + countSyllables(w), 0);
  const asl = wordCount / sentenceCount;
  const spw = syllables / wordCount;
  const fre = 206.835 - 1.015 * asl - 84.6 * spw;
  const fk = 0.39 * asl + 11.8 * spw - 15.59;

  let jargon = 0;
  for (const w of words) {
    const key = w.toLowerCase().replace(/[^a-z]/g, "");
    if (LEGAL_TERMS.has(key)) jargon++;
  }
  const jargonPct = wordCount ? Math.round((jargon / wordCount) * 100) : 0;
  const longSentences = sentences.filter(
    (s) => s.split(/\s+/).filter(Boolean).length > 30,
  ).length;

  const hasTable = /^\s*\|/m.test(text);
  const hasSteps = /^\s*\*\*Step\s+\d+/im.test(text);
  const hasWarning =
    /^\s*\*\*(Warning|Important|Note|Caution|Disclaimer)\b/im.test(text);
  const hasNumbered = /(^|\n)\s*\d+[.)]\s+[A-Z]/.test(text);
  const hasSummary =
    /\b(Key Takeaways|In Summary|To Summarize|Conclusion)\b/i.test(text);
  let format = "plain";
  if (hasTable) format = "table";
  else if (hasSteps) format = "steps";
  else if (hasWarning) format = "warning";
  else if (hasNumbered) format = "numbered";
  if (hasSummary && format !== "table") format += "+summary";

  const sectionsCited = (text.match(/(?:section|sec\.)\s+\d+[a-zA-Z]?/gi) || [])
    .length;

  return {
    words: wordCount,
    sentences: sentenceCount,
    asl: +asl.toFixed(1),
    fre: Math.round(fre),
    fk: +fk.toFixed(1),
    jargonPct,
    longSentences,
    format,
    hasTable,
    hasSteps,
    hasWarning,
    hasNumbered,
    hasSummary,
    sectionsCited,
  };
}

// ---------------------------------------------------------------- verdicts
function verdict(t, s, text) {
  const low = text.toLowerCase();
  const problems = [];
  const notes = [];

  if (t.expect === "table" && !s.hasTable) {
    if (t.kind === "multi-section")
      problems.push("multi-section reply is not a table");
    if (
      t.kind === "comparison" &&
      !/difference|distinct|unlike|whereas|while/.test(low)
    )
      problems.push("comparison missing clear contrast");
  }
  if (t.expect === "steps" && !s.hasSteps) {
    if (!/first|then|next|step/.test(low))
      problems.push("procedure reply has no step markers");
  }
  if (t.expect === "warning" && !s.hasWarning) {
    if (!/penalt|fine|prosecut|punish|jail|consequen/.test(low))
      problems.push("risk reply missing warning language");
  }
  if (t.expect === "greeting" && !/hello|hi|how can i assist/i.test(low))
    problems.push("expected a greeting");
  if (
    t.expect === "indian-only-refusal" &&
    !/only provide information related to indian law/i.test(low)
  ) {
    problems.push("did not refuse non-Indian query");
  }
  if (t.expect === "correct-bns-302") {
    if (/indian penal code|ipc\b/.test(text)) {
      if (!/religious|wound|feeling/i.test(text))
        problems.push("answered with IPC 302 (murder) not BNS 302");
    }
  }
  if (t.expect === "single-question-back") {
    const questionMarks = (text.match(/\?/g) || []).length;
    if (questionMarks > 1) problems.push("asked more than one question");
    if (questionMarks === 0) problems.push("did not ask a question");
  }
  if (t.expect === "blank-template") {
    if (!/\[[a-z ]+\]/i.test(text) || text.trim().length < 300)
      problems.push("not a full blank template");
  }
  if (t.expect === "big-table" && !s.hasTable)
    problems.push("personal-law overview missing table");
  if (t.kind === "current-affairs" && s.words < 8)
    problems.push("web-search reply too thin");
  if (s.words === 0) problems.push("empty response");
  if (t.refs) {
    for (const ref of t.refs) {
      if (!new RegExp(`\\b${ref}\\b`).test(text))
        problems.push(`missing requested ref ${ref}`);
    }
  }

  if (s.asl > 30) problems.push(`avg sentence ${s.asl} words (long)`);
  if (s.longSentences > 0) notes.push(`${s.longSentences} long sentence(s)`);
  if (s.jargonPct > 12) notes.push(`jargon ${s.jargonPct}%`);

  let scoreVal = 5;
  if (problems.length === 1) scoreVal = 4;
  else if (problems.length === 2) scoreVal = 3;
  else if (problems.length >= 3) scoreVal = 2;
  if (s.words === 0) scoreVal = 1;
  if (s.jargonPct > 15) scoreVal = Math.min(scoreVal, 3);
  if (s.asl > 30) scoreVal = Math.min(scoreVal, 3);

  return { score: scoreVal, problems, notes };
}

// ---------------------------------------------------------------- main
await runAs(async (cookie) => {
  const results = [];
  for (const t of TESTS) {
    if (t.id.slice(1) < FROM || t.id.slice(1) > TO) continue;
    process.stdout.write(
      `# ${t.id} ${t.mode.padEnd(8)} "${t.q.slice(0, 60)}..."\n`,
    );
    const r = await ask(cookie, t.mode, t.q);
    if (r.status !== 200) {
      results.push({ ...t, status: r.status, error: r.error, text: "" });
      continue;
    }
    const s = score(r.content);
    const v = verdict(t, s, r.content);
    results.push({ ...t, status: 200, text: r.content, s, v });
    await new Promise((res) => setTimeout(res, 500));
  }

  const out = [];
  out.push("# Lawbite Chat Understandability Test Grid");
  out.push("");
  out.push(`Base: ${BASE}  |  Date: ${new Date().toISOString()}`);
  out.push("");
  out.push(
    "Legend: w=words, ASL=avg sentence length, FRE=Flesch Reading Ease (90+=very easy, 60-70=plain, <40=hard), FK=Flesch-Kincaid grade, Jargon=% legal terms. Score 1-5 stars.",
  );
  out.push("");
  out.push(
    "| ID | Mode | Question | Size | ASL | FRE | FK | Jargon | Format | Score | Issues |",
  );
  out.push(
    "|----|------|----------|------|-----|-----|----|--------|--------|-------|--------|",
  );
  for (const r of results) {
    if (r.status !== 200) {
      out.push(
        `| ${r.id} | ${r.mode} | ${r.q.replace(/\|/g, "\\|")} | **ERR ${r.status}** | - | - | - | - | ${(r.error || "").slice(0, 40)} |`,
      );
      continue;
    }
    out.push(
      `| ${r.id} | ${r.mode} | ${r.q.replace(/\|/g, "\\|")} | ${r.s.words}w | ${r.s.asl} | ${r.s.fre} | ${r.s.fk} | ${r.s.jargonPct}% | ${r.s.format} | ${"★".repeat(r.v.score)}${"☆".repeat(5 - r.v.score)} | ${r.v.problems.join("; ")} |`,
    );
  }

  out.push("");
  out.push("## Response Details");
  out.push("");
  for (const r of results) {
    out.push(`### ${r.id} — ${r.mode} — ${r.q}`);
    out.push("");
    if (r.status !== 200) {
      out.push(`**ERROR ${r.status}**: ${r.error}`);
      out.push("");
      continue;
    }
    out.push(
      `- Words: ${r.s.words} | Sentences: ${r.s.sentences} | ASL: ${r.s.asl} | FRE: ${r.s.fre} | FK: ${r.s.fk}`,
    );
    out.push(
      `- Jargon: ${r.s.jargonPct}% | Format: ${r.s.format} | Sections cited: ${r.s.sectionsCited}`,
    );
    out.push(`- Score: ${"★".repeat(r.v.score)}${"☆".repeat(5 - r.v.score)}`);
    if (r.v.problems.length)
      out.push(`- Problems: ${r.v.problems.join(" | ")}`);
    if (r.v.notes.length) out.push(`- Notes: ${r.v.notes.join(" | ")}`);
    out.push("");
    out.push("```");
    out.push(r.text);
    out.push("```");
    out.push("");
  }

  fs.mkdirSync(path.join(ROOT, "test-results"), { recursive: true });
  const report = path.join(ROOT, "test-results", "chat-eval-report.md");
  fs.writeFileSync(report, out.join("\n"));
  fs.writeFileSync(
    path.join(ROOT, "test-results", "chat-eval-report.json"),
    JSON.stringify(results, null, 2),
  );
  console.log("\nSaved report to " + report);
  console.log(out.join("\n"));
});
