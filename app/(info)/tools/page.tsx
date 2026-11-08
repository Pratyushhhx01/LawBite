import type { Metadata } from "next";
import Link from "next/link";
import ResourceLayout from "../../resources/_components/ResourceLayout";

export const metadata: Metadata = {
  title: "Legal AI Tools & Workflows — LawBite",
  description:
    "Indian legal AI tools: Matter Management, Contract Risk Analyzer, Document Comparison, Courtroom Prep, Statutory Amendment Tracker, Case-Law Research, and Calculators.",
};

const utilities = [
  {
    title: "Statutory Amendments",
    description:
      "Track enforcement dates, gazette notifications, and historical changes across Indian central legislation.",
    href: "/amendments",
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-5 w-5"
      >
        <path d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
      </svg>
    ),
  },
  {
    title: "Matter Workspaces",
    description:
      "Dedicated multi-tenant matter dashboard for court stages, parties, key dates, and cross-feature reports.",
    href: "/matters",
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-5 w-5"
      >
        <path d="M20.25 14.15v4.25c0 1.094-.787 2.036-1.872 2.18-2.087.277-4.216.42-6.378.42s-4.291-.143-6.378-.42c-1.085-.144-1.872-1.086-1.872-2.18v-4.25m16.5 0a2.18 2.18 0 00.75-1.661V8.706c0-1.081-.768-2.015-1.837-2.175a48.114 48.114 0 00-3.413-.387m4.5 8.006c-.194.165-.42.295-.673.38A23.978 23.978 0 0112 15.75c-2.648 0-5.195-.429-7.577-1.22a2.016 2.016 0 01-.673-.38m0 0A2.18 2.18 0 013 12.489V8.706c0-1.081.768-2.015 1.837-2.175a48.111 48.111 0 013.413-.387m7.5 0V5.25A2.25 2.25 0 0013.5 3h-3a2.25 2.25 0 00-2.25 2.25v.894m7.5 0a48.667 48.667 0 00-7.5 0" />
      </svg>
    ),
  },
  {
    title: "Legal Calculators",
    description:
      "Limitation periods under the Limitation Act 1963, interest calculations, and stamp duty schedules.",
    href: "/calculators",
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-5 w-5"
      >
        <rect x="4" y="2" width="16" height="20" rx="2" />
        <line x1="8" y1="6" x2="16" y2="6" />
        <line x1="16" y1="14" x2="16" y2="18" />
        <path d="M16 10h.01M12 10h.01M8 10h.01M12 14h.01M8 14h.01M12 18h.01M8 18h.01" />
      </svg>
    ),
  },
  {
    title: "Legal News & Updates",
    description: "Latest legal developments, Supreme Court judgments, and statutory amendments.",
    href: "/news",
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-5 w-5"
      >
        <path d="M4 22h16a2 2 0 002-2V4a2 2 0 00-2-2H8a2 2 0 00-2 2v16a2 2 0 01-2 2zm0 0a2 2 0 01-2-2v-9h4" />
        <path d="M18 14h-8M15 18h-5M10 6h8v4h-8V6z" />
      </svg>
    ),
  },
  {
    title: "Case Tracker",
    description: "Track courtroom progression, hearing stages, and matter milestones.",
    href: "/cases",
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-5 w-5"
      >
        <circle cx="12" cy="12" r="10" />
        <polyline points="12 6 12 12 16 14" />
      </svg>
    ),
  },
  {
    title: "Court Reminders",
    description: "Filing limitation warnings and next hearing schedule notifications.",
    href: "/reminders",
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-5 w-5"
      >
        <path d="M18 8a6 6 0 10-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
        <path d="M13.73 21a2 2 0 01-3.46 0" />
      </svg>
    ),
  },
];

const aiFeatures = [
  {
    title: "Contract Risk Analyzer",
    description:
      "Automated clause-by-clause audit checking Indian Contract Act §23/27/28, unilateral indemnity, and stamp duty requirements.",
    href: "/matters",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-5 w-5">
        <path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    ),
  },
  {
    title: "Document Comparison Engine",
    description:
      "Compare two contract revisions side-by-side with statutory risk escalation, redline diffs, and clause shift summaries.",
    href: "/matters",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-5 w-5">
        <path d="M8 7v10M8 7l4-4m-4 4l-4-4m12 14V7m0 10l4 4m-4-4l-4 4" />
      </svg>
    ),
  },
  {
    title: "Courtroom Prep Mode",
    description:
      "Generate witness cross-examination strategies, impeachment traps with contradictory exhibits, and judicial tendency notes.",
    href: "/matters",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-5 w-5">
        <path d="M3 21h18M3 10h18M5 10v11M19 10v11M9 10V5a2 2 0 012-2h2a2 2 0 012 2v5" />
      </svg>
    ),
  },
  {
    title: "Case-Law & Good-Law Checker",
    description:
      "Search Supreme Court and High Court precedents with deterministic precedent status (Followed, Overruled, Distinguished).",
    href: "/chat",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-5 w-5">
        <path d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
      </svg>
    ),
  },
  {
    title: "IPC ↔ BNS Transition Engine",
    description:
      "Bidirectional cross-reference mapping between Indian Penal Code 1860 and Bharatiya Nyaya Sanhita 2023 with text diffs.",
    href: "/chat",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-5 w-5">
        <path d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
      </svg>
    ),
  },
  {
    title: "157+ Bare Acts Knowledge Base",
    description:
      "Deterministic section retrieval and citation verification across India's principal central enactments.",
    href: "/chat",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-5 w-5">
        <path d="M4 5h6a3 3 0 013 3v12a2.5 2.5 0 00-2.5-2.5H4V5zM20 5h-6a3 3 0 00-3 3v12a2.5 2.5 0 012.5-2.5H20V5z" />
      </svg>
    ),
  },
  {
    title: "AI Lawyer Adaptive Intake",
    description:
      "Interactive case-intake mode asking targeted questions one by one before providing customized legal opinions.",
    href: "/chat",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-5 w-5">
        <circle cx="12" cy="12" r="9" />
        <path d="M12 8v5" />
        <circle cx="12" cy="16" r="0.5" fill="currentColor" />
      </svg>
    ),
  },
  {
    title: "Deep Analysis (10–12 Points)",
    description:
      "Exhaustive structured legal analysis with numbered findings, statutory citations, and procedural options.",
    href: "/chat",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-5 w-5">
        <rect x="3" y="3" width="18" height="18" rx="2" />
        <path d="M7 8l2.5 2.5L14 6.5 18 10.5M7 16h10" />
      </svg>
    ),
  },
  {
    title: "Document Drafter",
    description:
      "Generate ready-to-file Indian legal notices, consumer complaints, RTI applications, affidavits, and commercial agreements.",
    href: "/chat",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-5 w-5">
        <path d="M14 3H6a2 2 0 00-2 2v14a2 2 0 002 2h12a2 2 0 002-2V9z" />
        <path d="M14 3v6h6M14 14v4M12 16h4" />
      </svg>
    ),
  },
];

function ToolCard({ tool }: { tool: (typeof utilities)[number] }) {
  return (
    <Link
      href={tool.href}
      className="group rounded-lg border border-white/10 bg-white/[0.03] p-4 transition-all hover:border-white/20 hover:bg-white/[0.06]"
    >
      <div className="flex items-center gap-2.5">
        <div className="text-white/50 transition-colors duration-300 group-hover:text-white [&>svg]:h-5 [&>svg]:w-5">
          {tool.icon}
        </div>
        <h3 className="text-sm font-semibold text-white">{tool.title}</h3>
      </div>
      <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-white/55">
        {tool.description}
      </p>
    </Link>
  );
}

export default function ToolsPage() {
  return (
    <ResourceLayout
      title="Legal AI Tools & Workflows"
      description="Professional-grade legal intelligence for Indian Law: matter workspaces, contract audits, courtroom prep, and statutory research."
    >
      <section>
        <h2 className="text-xl font-semibold text-white">AI Capabilities & Research Tools</h2>
        <p className="mt-3 text-white/60">
          Powered by Inception Mercury 2.5 dLLM with deterministic statutory verification across 157+ Bare Acts.
        </p>
        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {aiFeatures.map((feature) => (
            <ToolCard key={feature.title} tool={feature} />
          ))}
        </div>
      </section>

      <section className="mt-12">
        <h2 className="text-xl font-semibold text-white">Legal Utilities & Workspaces</h2>
        <p className="mt-3 text-white/60">
          Statutory timelines, court calculators, and matter tracking tools.
        </p>
        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {utilities.map((tool) => (
            <ToolCard key={tool.title} tool={tool} />
          ))}
        </div>
      </section>
    </ResourceLayout>
  );
}
