import Link from "next/link";
import Reveal from "./Reveal";

type Feature = {
  title: string;
  description: string;
  tag: string;
  href: string;
};

const features: Feature[] = [
  {
    tag: "01",
    title: "Legal Matter Workspaces",
    description:
      "Dedicated multi-tenant workspace for every legal matter. Manage court stages, parties, key filing dates, documents, and cross-feature reports.",
    href: "/matters",
  },
  {
    tag: "02",
    title: "Case-Law & Good-Law Checker",
    description:
      "Search Supreme Court and High Court judgments with deterministic precedent status (Followed, Distinguished, Overruled, Reversed) and paragraph citations.",
    href: "/chat",
  },
  {
    tag: "03",
    title: "IPC ↔ BNS Transition Engine",
    description:
      "Instant bidirectional mapping between IPC 1860 and BNS 2023, CrPC ↔ BNSS, and IEA ↔ BSA with verbatim word diffs and transitional scope notes.",
    href: "/chat",
  },
  {
    tag: "04",
    title: "Contract Risk Analyzer",
    description:
      "Clause-by-clause audit checking Indian Contract Act §§23/27/28 compliance, unilateral indemnities, termination covenants, and stamp duty alerts.",
    href: "/matters",
  },
  {
    tag: "05",
    title: "Document Comparison Engine",
    description:
      "Side-by-side contract revision redlining with risk escalation metrics, clause shifts, and statutory exposure summaries.",
    href: "/matters",
  },
  {
    tag: "06",
    title: "Courtroom Prep Mode",
    description:
      "Examination-in-chief strategy, witness cross-examination outlines, impeachment traps with contradictory exhibits, and judicial tendency summaries.",
    href: "/matters",
  },
  {
    tag: "07",
    title: "Statutory Amendment Tracker",
    description:
      "Official gazette notifications, central statute enforcement timelines, and historical legislative amendments across India's principal enactments.",
    href: "/amendments",
  },
  {
    tag: "08",
    title: "157+ Bare Acts Grounding",
    description:
      "Deterministic section retrieval and real-time citation verification across India's key enactments. Eliminates hallucinated sections entirely.",
    href: "/chat",
  },
  {
    tag: "09",
    title: "AI Lawyer Adaptive Intake",
    description:
      "An interactive case-intake mode that asks only the questions relevant to your legal dispute, one at a time, before delivering tailored advice.",
    href: "/chat",
  },
  {
    tag: "10",
    title: "Deep Analysis (10–12 Points)",
    description:
      "Receive a structured 10–12 point comprehensive legal analysis with numbered findings, statutory sections, and strategic recommendations.",
    href: "/chat",
  },
  {
    tag: "11",
    title: "Legal Document Drafter",
    description:
      "Generate ready-to-use Indian legal documents — legal notice, FIR, consumer complaint, RTI, will, affidavit, petition, and commercial agreements.",
    href: "/chat",
  },
  {
    tag: "12",
    title: "Live Legal Web Search",
    description:
      "Automatic real-time web search for recent Supreme Court judgments, High Court rulings, circulars, and notifications when queries require fresh facts.",
    href: "/chat",
  },
];

function FeatureIcon({ index }: { index: number }) {
  const shapes = [
    <svg key="matter" viewBox="0 0 32 32" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.4">
      <path d="M26 18v6a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2v-6M4 14l12-8 12 8v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V14z" />
      <path d="M12 26V16h8v10" />
    </svg>,
    <svg key="caselaw" viewBox="0 0 32 32" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.4">
      <path d="M16 6v20M6 10l10-4 10 4M6 10l-2 6h4l-2-6zm20 0l-2 6h4l-2-6zM10 26h12" />
    </svg>,
    <svg key="transition" viewBox="0 0 32 32" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.4">
      <path d="M6 10h16M18 6l4 4-4 4M26 22H10M14 18l-4 4 4 4" />
    </svg>,
    <svg key="risk" viewBox="0 0 32 32" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.4">
      <path d="M16 4l10 5v8c0 7-5 11-10 13-5-2-10-6-10-13V9l10-5z" />
      <path d="M12 16l3 3 6-6" />
    </svg>,
    <svg key="compare" viewBox="0 0 32 32" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.4">
      <rect x="4" y="6" width="10" height="20" rx="2" />
      <rect x="18" y="6" width="10" height="20" rx="2" />
      <path d="M8 12h2M8 16h2M22 12h2M22 16h2" />
    </svg>,
    <svg key="courtroom" viewBox="0 0 32 32" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.4">
      <path d="M4 26h24M6 14h20M8 14v12M24 14v12M16 6v8" />
    </svg>,
    <svg key="amendment" viewBox="0 0 32 32" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.4">
      <path d="M6 6h12l6 6v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2z" />
      <path d="M18 6v6h6M10 16h12M10 20h8" />
    </svg>,
    <svg key="books" viewBox="0 0 32 32" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.4">
      <path d="M4 5h8a4 4 0 0 1 4 4v18a3 3 0 0 0-3-3H4V5z" />
      <path d="M28 5h-8a4 4 0 0 0-4 4v18a3 3 0 0 1 3-3h9V5z" />
    </svg>,
    <svg key="grill" viewBox="0 0 32 32" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.4">
      <circle cx="16" cy="16" r="11" />
      <path d="M16 11v6" />
      <circle cx="16" cy="21" r="1" fill="currentColor" />
    </svg>,
    <svg key="analysis" viewBox="0 0 32 32" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.4">
      <rect x="4" y="4" width="24" height="24" rx="2" />
      <path d="M10 12l3 3 4-4 5 5" />
      <path d="M10 22h12" />
    </svg>,
    <svg key="draft" viewBox="0 0 32 32" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.4">
      <path d="M14 4H6a2 2 0 0 0-2 2v18a2 2 0 0 0 2 2h18a2 2 0 0 0 2-2V12z" />
      <path d="M14 4v8h8" />
      <path d="M10 18h12M10 22h8" />
    </svg>,
    <svg key="search" viewBox="0 0 32 32" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.4">
      <circle cx="14" cy="14" r="8" />
      <path d="M20 20l6 6" />
      <path d="M11 11h6M11 14h4" />
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
              / Platform Capabilities
            </p>
            <h2 className="mt-5 text-balance text-4xl font-semibold leading-[1.1] tracking-tight sm:text-5xl md:text-6xl">
              End-to-end Indian legal intelligence.
            </h2>
          </Reveal>
          <Reveal delay={1}>
            <p className="max-w-md text-base leading-relaxed text-white/60">
              From multi-tenant matter management to courtroom preparation and
              deterministic statutory verification across 157+ Bare Acts.
            </p>
          </Reveal>
        </div>

        <div className="features-grid mt-16 grid gap-px rounded-3xl border border-white/[0.18] bg-white/[0.18] bg-clip-padding sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, i) => (
            <Reveal
              key={feature.title}
              delay={((i % 3) + 1) as 1 | 2 | 3}
              className="group relative h-full"
            >
              <Link
                href={feature.href}
                className="group relative block h-full overflow-hidden bg-black p-7 transition-all duration-500 hover:bg-[#0a0a0a] sm:p-8"
              >
                <div
                  aria-hidden
                  className="hover-blur-glow pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-white/0 blur-2xl transition-all duration-700 group-hover:bg-white/[0.06]"
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
                  Open tool
                  <span
                    aria-hidden
                    className="inline-block transition-transform duration-500 group-hover:translate-x-1"
                  >
                    →
                  </span>
                </div>
              </Link>
              <div
                aria-hidden
                className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-px origin-left scale-x-0 bg-gradient-to-r from-white/0 via-white/80 to-white/0 shadow-[0_0_10px_rgba(255,255,255,0.6)] transition-transform duration-700 group-hover:scale-x-100"
              />
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
