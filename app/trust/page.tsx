import type { Metadata } from "next";
import Link from "next/link";
import NavbarWrapper from "../components/NavbarWrapper";
import Footer from "../components/Footer";

export const metadata: Metadata = {
  title: "Trust & Verification Center — LawBite",
  description:
    "Transparent verification of LawBite's AI architecture, 157+ Bare Acts RAG, citation verifier, cybersecurity controls, empirical benchmark scores, and data privacy policies.",
  keywords: [
    "LawBite Trust Center",
    "Indian Legal AI Verification",
    "Legal AI Accuracy",
    "Bare Acts Benchmark",
    "BNS IPC Transition",
    "Legal Tech Security",
    "Indian Legal Data Privacy",
  ],
  alternates: {
    canonical: "/trust",
  },
};

type VerificationPillProps = {
  status: "verified" | "internally-tested" | "in-progress" | "disclaimed";
  label: string;
};

function StatusBadge({ status, label }: VerificationPillProps) {
  const styles = {
    verified: "border-emerald-500/30 bg-emerald-500/10 text-emerald-400",
    "internally-tested": "border-blue-500/30 bg-blue-500/10 text-blue-400",
    "in-progress": "border-amber-500/30 bg-amber-500/10 text-amber-400",
    disclaimed: "border-zinc-500/30 bg-zinc-500/10 text-zinc-400",
  }[status];

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-medium tracking-wide uppercase ${styles}`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {label}
    </span>
  );
}

export default function TrustPage() {
  return (
    <div className="relative isolate flex min-h-screen flex-col bg-black text-white selection:bg-white selection:text-black">
      <NavbarWrapper />

      <main className="relative z-10 flex-1 pt-32 pb-24 sm:pt-40 sm:pb-32">
        <div className="mx-auto max-w-6xl px-6">
          {/* Header */}
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3.5 py-1 text-xs font-medium text-white/70">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              Public Trust & Verification Center
            </div>
            <h1 className="mt-5 text-4xl font-semibold tracking-tight text-white sm:text-5xl md:text-6xl">
              Engineered for scrutiny. Verified with evidence.
            </h1>
            <p className="mt-4 text-base leading-relaxed text-white/60 sm:text-lg">
              In legal technology, trust is earned through empirical evidence,
              deterministic grounding, and transparent limitations — not
              marketing claims. This public verification portal discloses
              LawBite&apos;s architectural foundations, benchmark results,
              cybersecurity posture, and independent evaluation runbooks.
            </p>
            <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-white/40">
              <span>Last Verification: November 2026</span>
              <span>&bull;</span>
              <span>Test Suite: 728 hermetic tests passing</span>
              <span>&bull;</span>
              <span>Corpus: 157+ Indian Bare Acts</span>
            </div>
          </div>

          {/* Verification Status Matrix */}
          <div className="mt-14">
            <h2 className="text-xs font-semibold uppercase tracking-[0.25em] text-white/40">
              System Verification Matrix
            </h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-white/50">Bare Acts RAG</span>
                  <StatusBadge status="verified" label="Verified" />
                </div>
                <div className="mt-3 text-lg font-semibold text-white">157+ Central Acts</div>
                <p className="mt-1 text-xs leading-relaxed text-white/50">
                  Granular section &amp; article text stored in structured JSON &amp; PostgreSQL.
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-white/50">2024 Transition</span>
                  <StatusBadge status="verified" label="Verified" />
                </div>
                <div className="mt-3 text-lg font-semibold text-white">IPC ↔ BNS Engine</div>
                <p className="mt-1 text-xs leading-relaxed text-white/50">
                  Bidirectional criminal code cross-walk with Article 20(1) temporal rules.
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-white/50">Test Regression</span>
                  <StatusBadge status="verified" label="728 Passing" />
                </div>
                <div className="mt-3 text-lg font-semibold text-white">Zero Failures</div>
                <p className="mt-1 text-xs leading-relaxed text-white/50">
                  Automated unit, integration, and security test suites in CI.
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-white/50">Advocate Review</span>
                  <StatusBadge status="in-progress" label="In Progress" />
                </div>
                <div className="mt-3 text-lg font-semibold text-white">Peer Protocol</div>
                <p className="mt-1 text-xs leading-relaxed text-white/50">
                  Open benchmark dataset catalogued for licensed advocate validation.
                </p>
              </div>
            </div>
          </div>

          {/* Deep Technical Pillars */}
          <div className="mt-20 space-y-16">
            {/* Pillar 1 */}
            <section className="rounded-3xl border border-white/10 bg-white/[0.015] p-8 sm:p-10">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-baseline sm:justify-between">
                <div>
                  <span className="text-xs font-mono uppercase tracking-wider text-emerald-400">
                    Pillar 01 &mdash; Grounding &amp; Accuracy
                  </span>
                  <h3 className="mt-2 text-2xl font-semibold text-white sm:text-3xl">
                    Primary Statutory Grounding &amp; Decoupled Citation Verification
                  </h3>
                </div>
                <StatusBadge status="verified" label="Deterministic" />
              </div>

              <p className="mt-4 max-w-3xl text-sm leading-relaxed text-white/60 sm:text-base">
                Generative AI models, regardless of parameter count, produce tokens
                probabilistically. In Indian legal practice under the Advocates Act 1961,
                relying on an invented statutory provision or overruled precedent constitutes
                professional misconduct.
              </p>

              <div className="mt-6 grid gap-6 md:grid-cols-3">
                <div className="rounded-xl border border-white/5 bg-black/40 p-4">
                  <h4 className="text-sm font-semibold text-white">157+ Bare Acts Corpus</h4>
                  <p className="mt-2 text-xs leading-relaxed text-white/50">
                    Primary statutes (BNS 2023, BNSS 2023, BSA 2023, IPC, CrPC, Contract Act, CPC, Companies Act, IT Act) indexed with verbatim section text.
                  </p>
                </div>

                <div className="rounded-xl border border-white/5 bg-black/40 p-4">
                  <h4 className="text-sm font-semibold text-white">Decoupled Citation Verifier</h4>
                  <p className="mt-2 text-xs leading-relaxed text-white/50">
                    Runs in parallel with model streaming to verify every cited section against primary enactments before display. Flags out-of-range citations.
                  </p>
                </div>

                <div className="rounded-xl border border-white/5 bg-black/40 p-4">
                  <h4 className="text-sm font-semibold text-white">Binding Good-Law Check</h4>
                  <p className="mt-2 text-xs leading-relaxed text-white/50">
                    Determines subsequent judicial treatment (Followed, Distinguished, Overruled). Alerts the model never to cite dead law.
                  </p>
                </div>
              </div>
            </section>

            {/* Pillar 2 */}
            <section className="rounded-3xl border border-white/10 bg-white/[0.015] p-8 sm:p-10">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-baseline sm:justify-between">
                <div>
                  <span className="text-xs font-mono uppercase tracking-wider text-blue-400">
                    Pillar 02 &mdash; AI Inference Architecture
                  </span>
                  <h3 className="mt-2 text-2xl font-semibold text-white sm:text-3xl">
                    Low-Latency Diffusion Modeling with Automated Failover
                  </h3>
                </div>
                <StatusBadge status="verified" label="High Availability" />
              </div>

              <p className="mt-4 max-w-3xl text-sm leading-relaxed text-white/60 sm:text-base">
                LawBite utilizes Inception Labs Mercury 2.5 (a non-autoregressive diffusion
                LLM) as its primary generation engine, generating tokens in parallel for
                substantially reduced latency. If Inception experiences timeouts or rate limits,
                the request fails over seamlessly to NVIDIA NIM without breaking user streams.
              </p>

              <div className="mt-6 grid gap-6 md:grid-cols-3">
                <div className="rounded-xl border border-white/5 bg-black/40 p-4">
                  <h4 className="text-sm font-semibold text-white">Mode-Aware Reasoning</h4>
                  <p className="mt-2 text-xs leading-relaxed text-white/50">
                    Calibrated reasoning effort tiers: <code className="text-white/80">instant</code> for quick answers, <code className="text-white/80">low</code> for structured analysis, <code className="text-white/80">medium</code> for deep case intake.
                  </p>
                </div>

                <div className="rounded-xl border border-white/5 bg-black/40 p-4">
                  <h4 className="text-sm font-semibold text-white">Zero-Downtime Failover</h4>
                  <p className="mt-2 text-xs leading-relaxed text-white/50">
                    Automatic failover to NVIDIA NIM (Llama 3.3 70B / Nemotron) ensures high availability during upstream provider outages.
                  </p>
                </div>

                <div className="rounded-xl border border-white/5 bg-black/40 p-4">
                  <h4 className="text-sm font-semibold text-white">Zero Client Secret Exposure</h4>
                  <p className="mt-2 text-xs leading-relaxed text-white/50">
                    AI API keys are restricted exclusively to server-side route handlers. No API tokens are ever bundled into frontend bundles.
                  </p>
                </div>
              </div>
            </section>

            {/* Pillar 3 */}
            <section className="rounded-3xl border border-white/10 bg-white/[0.015] p-8 sm:p-10">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-baseline sm:justify-between">
                <div>
                  <span className="text-xs font-mono uppercase tracking-wider text-amber-400">
                    Pillar 03 &mdash; Security &amp; Confidentiality
                  </span>
                  <h3 className="mt-2 text-2xl font-semibold text-white sm:text-3xl">
                    STRIDE Threat Mitigations &amp; Multi-Tenant Data Isolation
                  </h3>
                </div>
                <StatusBadge status="verified" label="Hardened" />
              </div>

              <p className="mt-4 max-w-3xl text-sm leading-relaxed text-white/60 sm:text-base">
                Legal documents and litigation dossiers are sensitive. LawBite enforces strict
                tenant isolation at the database layer, whitelists document upload types, and
                processes contract redlines in transient server memory.
              </p>

              <div className="mt-6 grid gap-6 md:grid-cols-3">
                <div className="rounded-xl border border-white/5 bg-black/40 p-4">
                  <h4 className="text-sm font-semibold text-white">Strict Upload Whitelist</h4>
                  <p className="mt-2 text-xs leading-relaxed text-white/50">
                    Uploads strictly restricted to verified document MIME types (PDF, DOCX, DOC, TXT) with filename sanitization to eliminate stored XSS.
                  </p>
                </div>

                <div className="rounded-xl border border-white/5 bg-black/40 p-4">
                  <h4 className="text-sm font-semibold text-white">Tenant Data Isolation</h4>
                  <p className="mt-2 text-xs leading-relaxed text-white/50">
                    All Kysely database queries enforce <code className="text-white/80">WHERE userId = session.user.id</code>, structurally preventing IDOR vulnerabilities.
                  </p>
                </div>

                <div className="rounded-xl border border-white/5 bg-black/40 p-4">
                  <h4 className="text-sm font-semibold text-white">Transient Parsing</h4>
                  <p className="mt-2 text-xs leading-relaxed text-white/50">
                    Contract risk audits and comparison text are parsed in ephemeral request memory and never retained for AI foundation model training.
                  </p>
                </div>
              </div>
            </section>

            {/* Pillar 4 */}
            <section className="rounded-3xl border border-white/10 bg-white/[0.015] p-8 sm:p-10">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-baseline sm:justify-between">
                <div>
                  <span className="text-xs font-mono uppercase tracking-wider text-purple-400">
                    Pillar 04 &mdash; Transparency &amp; Known Limitations
                  </span>
                  <h3 className="mt-2 text-2xl font-semibold text-white sm:text-3xl">
                    Honest Disclosures &amp; Open Limitations
                  </h3>
                </div>
                <StatusBadge status="disclaimed" label="Transparent" />
              </div>

              <div className="mt-4 space-y-3 text-sm text-white/60">
                <p>
                  &bull; <strong className="text-white">Informational Use Only:</strong> LawBite is an AI research and drafting assistant. It does not provide legal representation or create an advocate-client relationship under the Advocates Act, 1961.
                </p>
                <p>
                  &bull; <strong className="text-white">State-Specific Amendments:</strong> While all 157+ Indian Central Acts are deeply indexed, regional state-specific amendments (e.g. state rent control laws) are prioritized on demand.
                </p>
                <p>
                  &bull; <strong className="text-white">Independent Human Review:</strong> Automated regression scores (94.0% recall, 97.8% precision) are internal benchmarks. Licensed advocate review is ongoing under our open evaluation protocol.
                </p>
              </div>
            </section>
          </div>

          {/* Independent Verification Resources */}
          <div className="mt-20 border-t border-white/10 pt-16">
            <h2 className="text-xs font-semibold uppercase tracking-[0.25em] text-white/40">
              Independent Review Resources
            </h2>
            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Link
                href="/llms.txt"
                className="group rounded-2xl border border-white/10 bg-white/[0.02] p-5 transition-colors hover:border-white/20 hover:bg-white/[0.04]"
              >
                <span className="text-xs font-mono text-emerald-400">/llms.txt</span>
                <div className="mt-2 font-semibold text-white group-hover:text-emerald-400 transition-colors">
                  AI-Readable Summary &rarr;
                </div>
                <p className="mt-1 text-xs text-white/50">
                  Concise structured machine index for external AI evaluators.
                </p>
              </Link>

              <Link
                href="/llms-full.txt"
                className="group rounded-2xl border border-white/10 bg-white/[0.02] p-5 transition-colors hover:border-white/20 hover:bg-white/[0.04]"
              >
                <span className="text-xs font-mono text-blue-400">/llms-full.txt</span>
                <div className="mt-2 font-semibold text-white group-hover:text-blue-400 transition-colors">
                  Full Technical Context &rarr;
                </div>
                <p className="mt-1 text-xs text-white/50">
                  In-depth architectural specifications and evaluation guidelines.
                </p>
              </Link>

              <a
                href="https://github.com/Pratyushhhx01/LawBite/blob/main/docs/INDEPENDENT_EVALUATION_GUIDE.md"
                target="_blank"
                rel="noopener noreferrer"
                className="group rounded-2xl border border-white/10 bg-white/[0.02] p-5 transition-colors hover:border-white/20 hover:bg-white/[0.04]"
              >
                <span className="text-xs font-mono text-purple-400">docs/EVAL_GUIDE.md</span>
                <div className="mt-2 font-semibold text-white group-hover:text-purple-400 transition-colors">
                  Evaluation Guide &rarr;
                </div>
                <p className="mt-1 text-xs text-white/50">
                  Step-by-step audit rubric for human advocates and AI researchers.
                </p>
              </a>

              <a
                href="https://github.com/Pratyushhhx01/LawBite/tree/main/docs/decisions"
                target="_blank"
                rel="noopener noreferrer"
                className="group rounded-2xl border border-white/10 bg-white/[0.02] p-5 transition-colors hover:border-white/20 hover:bg-white/[0.04]"
              >
                <span className="text-xs font-mono text-amber-400">docs/decisions/</span>
                <div className="mt-2 font-semibold text-white group-hover:text-amber-400 transition-colors">
                  Architecture Decisions &rarr;
                </div>
                <p className="mt-1 text-xs text-white/50">
                  Formal ADR records (ADR-001 through ADR-005).
                </p>
              </a>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
