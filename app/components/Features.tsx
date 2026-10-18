import Link from "next/link";
import Reveal from "./Reveal";

type Feature = {
  title: string;
  description: string;
  tag: string;
};

const features: Feature[] = [
  {
    tag: "01",
    title: "Talk to AI",
    description:
      "Get quick, direct answers to any Indian legal question in plain language. No legal jargon, no fluff — just clear guidance.",
  },
  {
    tag: "02",
    title: "Deep Analysis",
    description:
      "Receive a detailed 10–12 point legal analysis with numbered findings, relevant sections, and a clear conclusion.",
  },
  {
    tag: "03",
    title: "AI Lawyer",
    description:
      "A structured interrogation mode that asks one question at a time across 8 legal lenses — building a complete picture before delivering tailored advice.",
  },
  {
    tag: "04",
    title: "Document Drafter",
    description:
      "Generate ready-to-use Indian legal documents with structured forms — pick from 8 types (legal notice, FIR, consumer complaint, RTI, will, affidavit, petition, contract) via the popup selector and get professionally formatted drafts.",
  },
  {
    tag: "05",
    title: "Document Review",
    description:
      "Upload a PDF or image — rental agreement, employment contract, FIR, or any legal document — and get a clause-by-clause risk analysis with plain-language explanations.",
  },
  {
    tag: "06",
    title: "File Attachment",
    description:
      "Attach PDFs and images to any chat conversation. Ask questions about document contents, get summaries, or send them straight to the document reviewer for analysis.",
  },
  {
    tag: "07",
    title: "Organize & Pin",
    description:
      "Pin important conversations, organize cases by type, and manage your legal research across dedicated sections for every conversation mode.",
  },
  {
    tag: "08",
    title: "157+ Bare Acts",
    description:
      "AI-powered retrieval from India's key legislation — IPC, BNS, CrPC, BNSS, the Constitution, and 157+ other acts at the section level.",
  },
  {
    tag: "09",
    title: "Live Web Search",
    description:
      "When your query needs current information, Lawbite automatically searches the web for recent judgments, amendments, and legal developments.",
  },
];

function FeatureIcon({ index }: { index: number }) {
  const shapes = [
    <svg
      key="chat"
      viewBox="0 0 32 32"
      className="h-6 w-6"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.4"
    >
      <path d="M6 6h20a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H14l-6 4v-4H6a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2z" />
      <path d="M10 12h12M10 16h8" />
    </svg>,
    <svg
      key="analysis"
      viewBox="0 0 32 32"
      className="h-6 w-6"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.4"
    >
      <rect x="4" y="4" width="24" height="24" rx="2" />
      <path d="M10 12l3 3 4-4 5 5" />
      <path d="M10 22h12" />
    </svg>,
    <svg
      key="grill"
      viewBox="0 0 32 32"
      className="h-6 w-6"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.4"
    >
      <circle cx="16" cy="16" r="11" />
      <path d="M16 11v6" />
      <circle cx="16" cy="21" r="1" fill="currentColor" />
    </svg>,
    <svg
      key="conversation"
      viewBox="0 0 32 32"
      className="h-6 w-6"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.4"
    >
      <path d="M4 8h18a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2H12l-4 3v-3H4a2 2 0 0 1-2-2v-6a2 2 0 0 1 2-2z" />
      <path d="M26 18l4 3v-3h-2" />
    </svg>,
    <svg
      key="books"
      viewBox="0 0 32 32"
      className="h-6 w-6"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.4"
    >
      <path d="M4 5h8a4 4 0 0 1 4 4v18a3 3 0 0 0-3-3H4V5z" />
      <path d="M28 5h-8a4 4 0 0 0-4 4v18a3 3 0 0 1 3-3h9V5z" />
    </svg>,
    <svg
      key="search"
      viewBox="0 0 32 32"
      className="h-6 w-6"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.4"
    >
      <circle cx="14" cy="14" r="8" />
      <path d="M20 20l6 6" />
      <path d="M11 11h6M11 14h4" />
    </svg>,
    <svg
      key="review"
      viewBox="0 0 32 32"
      className="h-6 w-6"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.4"
    >
      <path d="M14 4H6a2 2 0 0 0-2 2v18a2 2 0 0 0 2 2h18a2 2 0 0 0 2-2V12z" />
      <path d="M14 4v8h8" />
      <path d="M16 20v-6" />
      <path d="M13 17h6" />
    </svg>,
    <svg
      key="pin"
      viewBox="0 0 32 32"
      className="h-6 w-6"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.4"
    >
      <path d="M12 2L8.5 8.5 2 9.3l4.7 4.5L5.5 21 12 17.5 18.5 21l-1.2-7.2L22 9.3l-6.5-.8z" />
    </svg>,
    <svg
      key="globe"
      viewBox="0 0 32 32"
      className="h-6 w-6"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.4"
    >
      <circle cx="16" cy="16" r="11" />
      <path d="M2 16h28M16 5a15.3 15.3 0 0 1 4 11 15.3 15.3 0 0 1-4 11 15.3 15.3 0 0 1-4-11A15.3 15.3 0 0 1 16 5z" />
    </svg>,
    <svg
      key="attach"
      viewBox="0 0 32 32"
      className="h-6 w-6"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.4"
    >
      <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
    </svg>,
  ];
  return shapes[index % shapes.length];
}

export default function Features() {
  return (
    <section
      id="features"
      className="relative isolate border-t border-white/10 py-28 sm:py-36"
    >
      <div className="mx-auto max-w-6xl px-6">
        <div className="grid items-end gap-10 md:grid-cols-2">
          <Reveal>
            <p className="text-xs font-medium uppercase tracking-[0.3em] text-white/50">
              / Features
            </p>
            <h2 className="mt-5 text-balance text-4xl font-semibold leading-[1.1] tracking-tight sm:text-5xl md:text-6xl">
              Nine ways to get legal clarity.
            </h2>
          </Reveal>
          <Reveal delay={1}>
            <p className="max-w-md text-base leading-relaxed text-white/60">
              From quick answers to deep analysis, choose the mode that fits
              your situation. Every response is grounded in Indian law.
            </p>
          </Reveal>
        </div>

        <div className="features-grid mt-16 grid gap-px rounded-3xl border border-white/10 bg-white/10 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, i) => (
            <Reveal
              key={feature.title}
              delay={((i % 3) + 1) as 1 | 2 | 3}
              className="h-full"
            >
              <Link
                href="/chat"
                className="group relative block h-full overflow-hidden bg-black p-7 transition-all duration-500 hover:bg-[#0a0a0a] sm:p-8"
              >
                <div
                  aria-hidden
                  className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-white/0 blur-2xl transition-all duration-700 group-hover:bg-white/[0.06]"
                />
                <div
                  aria-hidden
                  className="pointer-events-none absolute inset-x-0 bottom-0 h-px origin-left scale-x-0 bg-gradient-to-r from-white/0 via-white/60 to-white/0 transition-transform duration-700 group-hover:scale-x-100"
                />
                <div className="flex items-start justify-between">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 bg-white/[0.03] text-white transition-all duration-500 group-hover:rotate-[8deg] group-hover:border-white/30 group-hover:bg-white/[0.07]">
                    <FeatureIcon index={i} />
                  </div>
                  <span className="text-xs font-mono tracking-widest text-white/30">
                    {feature.tag}
                  </span>
                </div>
                <h3 className="mt-8 text-lg font-medium text-white sm:text-xl">
                  {feature.title}
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-white/55">
                  {feature.description}
                </p>
                <div className="mt-8 inline-flex items-center gap-1.5 text-xs font-medium text-white/0 transition-colors duration-500 group-hover:text-white/80">
                  Try it now
                  <span
                    aria-hidden
                    className="inline-block transition-transform duration-500 group-hover:translate-x-1"
                  >
                    →
                  </span>
                </div>
              </Link>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
