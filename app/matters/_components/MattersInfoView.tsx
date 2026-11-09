"use client";

import Link from "next/link";
import ResourceLayout from "../../resources/_components/ResourceLayout";
import NavbarWrapper from "@/app/components/NavbarWrapper";
import Footer from "@/app/components/Footer";

interface MattersInfoViewProps {
  isLoggedIn?: boolean;
  userName?: string | null;
}

export default function MattersInfoView({
  isLoggedIn = false,
  userName = null,
}: MattersInfoViewProps) {
  const getActionHref = (targetTab?: string) => {
    const destination = targetTab
      ? `/matters?view=app&tab=${encodeURIComponent(targetTab)}`
      : "/matters?view=app";
    if (isLoggedIn) {
      return destination;
    }
    return `/signin?next=${encodeURIComponent(destination)}`;
  };

  const featureCards = [
    {
      category: "Litigation & Advisory Workspaces",
      items: [
        {
          id: "workspace",
          title: "Litigation Matter Dossier",
          description:
            "Manage court matters from Pre-litigation to Pleadings, Evidence, Arguments, Judgment, and Appeal. Store court details, opposing counsel, and filing schedules.",
          tab: "matters",
          buttonLabel: isLoggedIn ? "Open Workspace →" : "Sign In to Access →",
          icon: (
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.5">
              <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
              <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
            </svg>
          ),
        },
        {
          id: "documents",
          title: "Matter Document & Report Vault",
          description:
            "Securely attach pleadings, court orders, agreement revisions, and AI-generated risk reports to matters with version tracking and multi-tenant isolation.",
          tab: "documents",
          buttonLabel: isLoggedIn ? "View Documents →" : "Sign In to Access →",
          icon: (
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
            </svg>
          ),
        },
      ],
    },
    {
      category: "Contract & Transaction Intelligence",
      items: [
        {
          id: "contract-risk",
          title: "Contract Risk Analyzer",
          description:
            "Automated clause-by-clause audit checking Indian Contract Act §§23/27/28 compliance, unilateral indemnity, termination covenants, and state stamp duty requirements.",
          tab: "contract",
          buttonLabel: isLoggedIn ? "Run Contract Audit →" : "Sign In to Access →",
          icon: (
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          ),
        },
        {
          id: "doc-compare",
          title: "Document Comparison Engine",
          description:
            "Compare two contract revisions side-by-side with statutory risk escalation, redline diffs, and clause shift summaries.",
          tab: "compare",
          buttonLabel: isLoggedIn ? "Compare Contracts →" : "Sign In to Access →",
          icon: (
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M8 7v10M8 7l4-4m-4 4l-4-4m12 14V7m0 10l4 4m-4-4l-4 4" />
            </svg>
          ),
        },
      ],
    },
    {
      category: "Courtroom Preparation & Strategy",
      items: [
        {
          id: "courtroom-prep",
          title: "Courtroom Preparation Mode",
          description:
            "Generate examination-in-chief strategy, witness cross-examination question paths, and impeachment traps using contradictory exhibits.",
          tab: "prep",
          buttonLabel: isLoggedIn ? "Prepare Hearing →" : "Sign In to Access →",
          icon: (
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M3 21h18M3 10h18M5 10v11M19 10v11M9 10V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v5" />
            </svg>
          ),
        },
        {
          id: "reminders",
          title: "Hearing & Limitation Deadlines",
          description:
            "Limitation periods under the Limitation Act 1963, appeal filing windows, and upcoming court hearing reminders.",
          tab: "matters",
          buttonLabel: isLoggedIn ? "Track Deadlines →" : "Sign In to Access →",
          icon: (
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.5">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
          ),
        },
      ],
    },
  ];

  return (
    <div className="relative isolate flex min-h-screen flex-col bg-black text-white">
      <NavbarWrapper />
      <main className="relative z-10 flex flex-1 flex-col">
        <ResourceLayout
          title="Matter Management"
          description="Professional workspace for Indian legal practitioners — organize litigation and advisory matters, audit contracts, compare drafts, and prepare for courtroom hearings."
        >
          {/* Session status banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-white/10 bg-white/[0.02] p-5 backdrop-blur-md">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-amber-400">
            {isLoggedIn ? "Active Session" : "Public Platform Overview"}
          </span>
          <p className="mt-1 text-sm text-white/80">
            {isLoggedIn
              ? `Signed in as ${userName || "User"}. Your matter workspaces are ready.`
              : "Sign in to create, organize, and analyze your confidential legal matters."}
          </p>
        </div>
        <Link
          href={getActionHref()}
          className="btn-shine inline-flex items-center justify-center gap-2 rounded-xl bg-white px-5 py-2.5 text-xs font-semibold text-black transition-transform duration-300 hover:scale-[1.03]"
        >
          {isLoggedIn ? "Launch Matter Workspace →" : "Sign In to Get Started →"}
        </Link>
      </div>

      {featureCards.map((section) => (
        <section key={section.category} className="space-y-4">
          <h2 className="text-xl font-semibold text-white">{section.category}</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {section.items.map((item) => (
              <div
                key={item.id}
                className="group flex flex-col justify-between rounded-xl border border-white/10 bg-white/[0.03] p-5 transition-all duration-300 hover:border-white/20 hover:bg-white/[0.06]"
              >
                <div>
                  <div className="flex items-center gap-3">
                    <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/5 text-amber-400 transition-colors group-hover:bg-amber-400/10">
                      {item.icon}
                    </span>
                    <h3 className="text-base font-semibold text-white">
                      {item.title}
                    </h3>
                  </div>
                  <p className="mt-3 text-xs leading-relaxed text-white/60">
                    {item.description}
                  </p>
                </div>
                <div className="mt-5 pt-4 border-t border-white/[0.06]">
                  <Link
                    href={getActionHref(item.tab)}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-300 transition-colors hover:text-amber-200"
                  >
                    {item.buttonLabel}
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </section>
      ))}

      {/* Cross link to Amendment Tracker and Chat */}
      <section className="rounded-2xl border border-white/10 bg-white/[0.02] p-6 text-center sm:text-left sm:flex sm:items-center sm:justify-between">
        <div>
          <h3 className="text-base font-semibold text-white">
            Need statutory amendment details or case-law research?
          </h3>
          <p className="mt-1 text-xs text-white/60">
            Check the Statutory Amendment Tracker or explore court precedents in AI Legal Chat.
          </p>
        </div>
        <div className="mt-4 sm:mt-0 flex flex-wrap gap-2 justify-center">
          <Link
            href="/amendments"
            className="rounded-lg border border-white/15 px-3 py-1.5 text-xs font-medium text-white/80 transition-colors hover:border-white/30 hover:text-white"
          >
            Amendment Tracker →
          </Link>
          <Link
            href="/chat"
            className="rounded-lg bg-white/10 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-white/20"
          >
            AI Legal Chat →
          </Link>
        </div>
      </section>
        </ResourceLayout>
      </main>
      <Footer />
    </div>
  );
}
