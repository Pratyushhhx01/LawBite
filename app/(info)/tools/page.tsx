import type { Metadata } from "next";
import Link from "next/link";
import ResourceLayout from "../../resources/_components/ResourceLayout";

export const metadata: Metadata = {
  title: "Tools — Lawbite",
  description:
    "Free Indian legal tools and AI features — legal news, case tracking, calculators, chat, analysis, drafting, and more.",
};

const tools = [
  {
    title: "Legal News",
    description: "Latest legal updates, judgments, and law changes.",
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
    description: "Track your cases and their status in one place.",
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
    title: "Calculators",
    description: "Stamp duty, limitation periods, and interest calculations.",
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
    title: "Reminders",
    description: "Never miss a court date or filing deadline.",
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

const features = [
  {
    title: "Talk to AI",
    description:
      "Get quick, direct answers to any Indian legal question in plain language.",
    href: "/chat",
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
        <path d="M4 5h16a1 1 0 011 1v10a1 1 0 01-1 1h-9l-5 4v-4H4a1 1 0 01-1-1V6a1 1 0 011-1z" />
        <path d="M7 10h10M7 13h6" />
      </svg>
    ),
  },
  {
    title: "Deep Analysis",
    description:
      "Receive a detailed 10–12 point legal analysis with numbered findings, relevant sections, and a conclusion.",
    href: "/chat",
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
        <rect x="3" y="3" width="18" height="18" rx="2" />
        <path d="M7 8l2.5 2.5L14 6.5 18 10.5M7 16h10" />
      </svg>
    ),
  },
  {
    title: "AI Lawyer",
    description:
      "A structured interrogation mode that asks one question at a time across 8 legal lenses before delivering tailored advice.",
    href: "/chat",
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
        <circle cx="12" cy="12" r="9" />
        <path d="M12 8v5" />
        <circle cx="12" cy="16" r="0.5" fill="currentColor" />
      </svg>
    ),
  },
  {
    title: "Document Drafter",
    description:
      "Generate ready-to-use Indian legal documents — legal notice, FIR, consumer complaint, RTI, will, affidavit, petition, and contracts.",
    href: "/chat",
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
        <path d="M14 3H6a2 2 0 00-2 2v14a2 2 0 002 2h12a2 2 0 002-2V9z" />
        <path d="M14 3v6h6M14 14v4M12 16h4" />
      </svg>
    ),
  },
  {
    title: "Document Review",
    description:
      "Upload a PDF or image and get a clause-by-clause risk analysis with plain-language explanations.",
    href: "/chat",
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
        <path d="M9 11l2 2 4-4" />
        <circle cx="11" cy="11" r="8" />
      </svg>
    ),
  },
  {
    title: "File Attachment",
    description:
      "Attach PDFs and images to any chat conversation — ask questions about document contents or send them for review.",
    href: "/chat",
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
        <path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48" />
      </svg>
    ),
  },
  {
    title: "Organize & Pin",
    description:
      "Pin important conversations and organize cases by type across dedicated sections for every conversation mode.",
    href: "/chat",
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
        <path d="M12 2L8.5 8.5 2 9.3l4.7 4.5L5.5 21 12 17.5 18.5 21l-1.2-7.2L22 9.3l-6.5-.8z" />
      </svg>
    ),
  },
  {
    title: "157+ Bare Acts",
    description:
      "AI-powered retrieval from India's key legislation — IPC, BNS, CrPC, BNSS, the Constitution, and 157+ other acts.",
    href: "/chat",
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
        <path d="M4 5h6a3 3 0 013 3v12a2.5 2.5 0 00-2.5-2.5H4V5zM20 5h-6a3 3 0 00-3 3v12a2.5 2.5 0 012.5-2.5H20V5z" />
      </svg>
    ),
  },
  {
    title: "Live Web Search",
    description:
      "When your query needs current information, Lawbite automatically searches the web for recent judgments and amendments.",
    href: "/chat",
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
        <circle cx="12" cy="12" r="9" />
        <path d="M3 12h18M12 3a15 15 0 010 18 15 15 0 010-18z" />
      </svg>
    ),
  },
];

function ToolCard({ tool }: { tool: (typeof tools)[number] }) {
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
      title="Tools"
      description="Practical legal utilities and AI features — stay updated, track cases, calculate key figures, and get legal clarity."
    >
      <section>
        <h2 className="text-xl font-semibold text-white">AI Features</h2>
        <p className="mt-3 text-white/60">
          Everything Lawbite can do inside the chat — ask questions, analyze
          deeper, and draft documents.
        </p>
        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => (
            <ToolCard key={feature.title} tool={feature} />
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-xl font-semibold text-white">Utilities</h2>
        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {tools.map((tool) => (
            <ToolCard key={tool.href} tool={tool} />
          ))}
        </div>
      </section>
    </ResourceLayout>
  );
}
