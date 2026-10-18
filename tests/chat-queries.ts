import { createTestSession } from "./chat-test-auth";

const BASE = process.env.BASE_URL || "http://localhost:3000";

type Mode = "talk-to-ai" | "analysis" | "draft" | "review";

interface Query {
  q: string;
  mode: Mode;
}

const BATCH_SIZE = 5;

const queries: Query[] = [
  // ── talk-to-ai (20) ──
  { q: "What is Section 302 of BNS?", mode: "talk-to-ai" },
  {
    q: "Can a landlord evict a tenant without notice in India?",
    mode: "talk-to-ai",
  },
  { q: "What are my rights if police arrest me?", mode: "talk-to-ai" },
  { q: "How do I file an FIR?", mode: "talk-to-ai" },
  { q: "What is the punishment for cheating under BNS?", mode: "talk-to-ai" },
  { q: "How does limitation period work for civil suits?", mode: "talk-to-ai" },
  { q: "What is anticipatory bail?", mode: "talk-to-ai" },
  { q: "Can I claim maintenance under Section 125 CrPC?", mode: "talk-to-ai" },
  {
    q: "What are fundamental rights under Indian Constitution?",
    mode: "talk-to-ai",
  },
  { q: "How does consumer protection work in India?", mode: "talk-to-ai" },
  { q: "What is the process for property registration?", mode: "talk-to-ai" },
  { q: "Can an employer terminate without notice period?", mode: "talk-to-ai" },
  { q: "What is the penalty for drink driving in India?", mode: "talk-to-ai" },
  { q: "How do I get a divorce by mutual consent?", mode: "talk-to-ai" },
  { q: "What are the grounds for defamation in India?", mode: "talk-to-ai" },
  { q: "Explain the Right to Information Act", mode: "talk-to-ai" },
  {
    q: "What is the difference between bailable and non-bailable offence?",
    mode: "talk-to-ai",
  },
  { q: "Can I sue for medical negligence?", mode: "talk-to-ai" },
  {
    q: "What are the labour laws for working hours in India?",
    mode: "talk-to-ai",
  },
  { q: "How does the POCSO Act protect children?", mode: "talk-to-ai" },

  // ── analysis (15) ──
  { q: "Analyze Section 498A IPC and its misuse in India", mode: "analysis" },
  {
    q: "Analyze the constitutional validity of Article 370 abrogation",
    mode: "analysis",
  },
  {
    q: "Analyze the new criminal laws BNS BNSS BSA vs old IPC CrPC",
    mode: "analysis",
  },
  {
    q: "Analyze the Digital Personal Data Protection Act 2023",
    mode: "analysis",
  },
  {
    q: "Analyze landlord tenant dispute under Rent Control Act",
    mode: "analysis",
  },
  {
    q: "Analyze enforceability of arbitration clauses in Indian contracts",
    mode: "analysis",
  },
  {
    q: "Analyze workplace sexual harassment law under POSH Act",
    mode: "analysis",
  },
  {
    q: "Analyze the legal framework for startup compliance in India",
    mode: "analysis",
  },
  {
    q: "Analyze environmental liability under National Green Tribunal",
    mode: "analysis",
  },
  {
    q: "Analyze the legal implications of cryptocurrency in India",
    mode: "analysis",
  },
  {
    q: "Analyze inheritance laws for Hindu undivided family",
    mode: "analysis",
  },
  {
    q: "Analyze the new Labour Codes impact on Indian employers",
    mode: "analysis",
  },
  {
    q: "Analyze consumer rights for e-commerce purchases in India",
    mode: "analysis",
  },
  {
    q: "Analyze the legal framework for data localization in India",
    mode: "analysis",
  },
  {
    q: "Analyze the scope of Section 138 NI Act for bounced cheques",
    mode: "analysis",
  },

  // ── draft (15) ──
  { q: "Draft a legal notice for breach of contract", mode: "draft" },
  {
    q: "Draft a rent agreement for a residential property in Bangalore",
    mode: "draft",
  },
  { q: "Draft a will for distribution of ancestral property", mode: "draft" },
  { q: "Draft a consumer complaint for defective product", mode: "draft" },
  { q: "Draft a non-disclosure agreement for a tech startup", mode: "draft" },
  { q: "Draft an employment agreement for a software engineer", mode: "draft" },
  { q: "Draft a power of attorney for property sale", mode: "draft" },
  { q: "Draft a reply notice to a defamation claim", mode: "draft" },
  { q: "Draft a partnership deed for a small business", mode: "draft" },
  { q: "Draft a bail application for Section 420 BNS", mode: "draft" },
  { q: "Draft an RTI application for government records", mode: "draft" },
  { q: "Draft a legal notice for recovery of money", mode: "draft" },
  { q: "Draft a service agreement for an IT consultant", mode: "draft" },
  { q: "Draft a mutation application for land records", mode: "draft" },
  { q: "Draft a domestic violence complaint under DV Act", mode: "draft" },

  // ── review (11) ──
  {
    q: "Review this contract: Tenant forfeits entire security deposit if lease terminated early. Landlord can increase rent 50% annually without notice.",
    mode: "review",
  },
  {
    q: "Review this employment agreement: Non-compete for 5 years globally. Company owns all IP including personal projects. No severance pay.",
    mode: "review",
  },
  {
    q: "Review this NDA: Confidential for 2 years. No data breach remedies. No return of information upon termination.",
    mode: "review",
  },
  {
    q: "Review this sale deed: Seller warrants no encumbrances but property has existing home loan. No indemnity for title defects.",
    mode: "review",
  },
  {
    q: "Review this will: Typed on plain paper, no witnesses, no signature, property distributed unequally among legal heirs.",
    mode: "review",
  },
  {
    q: "Review this freelance contract: Client owns all deliverables including pre-existing IP. No payment timeline. No dispute resolution.",
    mode: "review",
  },
  {
    q: "Review this lease renewal: Landlord may refuse renewal without reason. Tenant forfeits all improvements.",
    mode: "review",
  },
  {
    q: "Review this vendor agreement: Unlimited liability for vendor. Force majeure only benefits client. No data protection.",
    mode: "review",
  },
  {
    q: "Review this pre-nuptial agreement for enforceability in India",
    mode: "review",
  },
  {
    q: "Review this insurance claim denial letter for policy violations",
    mode: "review",
  },
  {
    q: "Review this arbitral award for natural justice violations",
    mode: "review",
  },
];

interface Result {
  index: number;
  query: string;
  mode: string;
  pass: boolean;
  duration: number;
  contentLength: number;
  error?: string;
  preview?: string;
}

async function sendQuery(
  query: Query,
  index: number,
  cookies: string,
): Promise<Result> {
  const start = Date.now();
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 540_000);
    const res = await fetch(`${BASE}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: cookies },
      body: JSON.stringify({
        messages: [{ role: "user", content: query.q }],
        conversationType: query.mode,
      }),
      signal: controller.signal,
    });
    clearTimeout(timer);

    const text = await res.text();
    const duration = Date.now() - start;

    if (!res.ok) {
      return {
        index,
        query: query.q,
        mode: query.mode,
        pass: false,
        duration,
        contentLength: 0,
        error: `HTTP ${res.status}: ${text.slice(0, 200)}`,
      };
    }

    let fullContent = "";
    for (const line of text.split("\n")) {
      if (line.startsWith("data: ") && line !== "data: [DONE]") {
        try {
          const d = JSON.parse(line.slice(6));
          if (d.content) fullContent += d.content;
        } catch {}
      }
    }

    return {
      index,
      query: query.q,
      mode: query.mode,
      pass: fullContent.length > 20,
      duration,
      contentLength: fullContent.length,
      preview: fullContent.slice(0, 100).replace(/\n/g, " "),
    };
  } catch (err) {
    return {
      index,
      query: query.q,
      mode: query.mode,
      pass: false,
      duration: Date.now() - start,
      contentLength: 0,
      error: String(err),
    };
  }
}

async function main() {
  const arg = process.argv[2];
  let startIdx = 0;
  let endIdx = queries.length;
  if (arg) {
    const parts = arg.split("-").map(Number);
    startIdx = (parts[0] ?? 1) - 1;
    endIdx = parts[1] ?? queries.length;
  }

  const slice = queries.slice(startIdx, endIdx);
  console.log(
    `\nQueries ${startIdx + 1}–${startIdx + slice.length} of ${queries.length} (batch: ${BATCH_SIZE})\n`,
  );

  const { cookies } = await createTestSession();

  const batches: { q: Query; i: number }[][] = [];
  for (let i = 0; i < slice.length; i += BATCH_SIZE) {
    batches.push(
      slice
        .slice(i, i + BATCH_SIZE)
        .map((q, j) => ({ q, i: startIdx + i + j + 1 })),
    );
  }

  const all: Result[] = [];
  for (let b = 0; b < batches.length; b++) {
    const t0 = Date.now();
    const results = await Promise.all(
      batches[b].map(({ q, i }) => sendQuery(q, i, cookies)),
    );
    const dt = Date.now() - t0;
    all.push(...results);
    const ok = results.filter((r) => r.pass).length;
    const fail = results.filter((r) => !r.pass);
    console.log(
      `Batch ${b + 1}/${batches.length} — ${ok}/${results.length} passed (${dt}ms)`,
    );
    for (const r of fail)
      console.log(
        `  FAIL #${r.index} [${r.mode}] "${r.query.slice(0, 50)}…" — ${r.error ?? "empty"}`,
      );
  }

  const passed = all.filter((r) => r.pass).length;
  const failed = all.filter((r) => !r.pass);
  const avg = Math.round(all.reduce((s, r) => s + r.duration, 0) / all.length);

  console.log(`\n${"═".repeat(50)}`);
  console.log(`TOTAL: ${passed}/${all.length} passed | avg ${avg}ms/query`);
  console.log(`${"═".repeat(50)}`);

  if (failed.length > 0) {
    console.log("\nFailed:");
    for (const r of failed)
      console.log(
        `  #${r.index} [${r.mode}] "${r.query}" → ${r.error ?? "empty"}`,
      );
  }

  for (const mode of ["talk-to-ai", "analysis", "draft", "review"] as Mode[]) {
    const mr = all.filter((r) => r.mode === mode);
    const mp = mr.filter((r) => r.pass).length;
    const ma = Math.round(
      mr.reduce((s, r) => s + r.duration, 0) / (mr.length || 1),
    );
    console.log(`  ${mode}: ${mp}/${mr.length} passed | avg ${ma}ms`);
  }
}

main().catch(console.error);
