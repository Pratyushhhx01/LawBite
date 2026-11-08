"use client";

import { useState } from "react";
import Reveal from "./Reveal";

type Item = { q: string; a: string };

const items: Item[] = [
  {
    q: "What Indian laws does LawBite cover?",
    a: "LawBite indexes 157+ Indian bare acts including the new criminal codes (Bharatiya Nyaya Sanhita 2023, Bharatiya Nagarik Suraksha Sanhita 2023, Bharatiya Sakshya Adhiniyam 2023), historical codes (IPC 1860, CrPC 1973, Indian Evidence Act 1872), the Constitution of India, Companies Act 2013, Arbitration Act 1996, IBC 2016, and IT Act 2000. It retrieves information at the granular section and sub-section level.",
  },
  {
    q: "How does LawBite handle the transition from IPC to BNS?",
    a: "LawBite includes a dedicated statutory transition engine that provides bidirectional cross-mapping between legacy sections (IPC/CrPC/IEA) and 2023 codes (BNS/BNSS/BSA). It generates exact word-level diffs, highlights newly criminalized acts (e.g., snatching, organized crime, terrorism), and alerts you to the correct transitional scope based on the date of offence.",
  },
  {
    q: "What is the Good-Law Precedent Checker?",
    a: "Our precedent engine analyzes subsequent judicial treatment across Supreme Court and High Court judgments to determine whether a ruling remains good law (Followed, Distinguished, Overruled, Reversed, Affirmed, or Referred to). Unlike generic LLMs that guess precedent status, LawBite requires authoritative judicial records and explicitly marks citations as 'Unknown / Unverified' if subsequent treatment cannot be deterministically proven.",
  },
  {
    q: "What is Legal Matter Management in LawBite?",
    a: "Matter Management provides dedicated workspaces for litigation and advisory cases. You can organize case details, client information, court stages (Pre-litigation, Pleadings, Evidence, Arguments, Judgment, Appeal), key filing deadlines, hearing reminders, and attach Contract Risk audits, Document Comparisons, and Courtroom Prep outlines directly to the matter dossier.",
  },
  {
    q: "How does citation verification prevent AI hallucinations?",
    a: "Every statutory section cited in an AI response is deterministically parsed and checked in real-time against verified statutory texts. If a section does not exist in the cited act, LawBite badges it with a red warning ('Not found in named act') rather than silently misleading you with a fabricated citation.",
  },
  {
    q: "Is my case data and uploaded documents private?",
    a: "Yes. LawBite enforces strict multi-tenant isolation with row-level parameterization in PostgreSQL. Documents uploaded for contract analysis or review are processed in transient request memory scope, are never saved to public storage, and are never used to train third-party foundation models.",
  },
  {
    q: "Is LawBite a substitute for an advocate?",
    a: "No. LawBite is an AI-powered legal intelligence, research, and drafting platform designed for legal research and preliminary workflow preparation. It does not constitute legal representation or create an advocate-client relationship under the Advocates Act, 1961.",
  },
];

export default function FAQ() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <section
      id="faq"
      className="relative border-t border-white/10 py-28 sm:py-36"
    >
      <div className="mx-auto max-w-4xl px-6">
        <Reveal>
          <p className="text-xs font-medium uppercase tracking-[0.3em] text-white/50">
            / FAQ
          </p>
          <h2 className="mt-5 text-balance text-4xl font-semibold leading-[1.1] tracking-tight sm:text-5xl md:text-6xl">
            Frequently asked questions.
          </h2>
        </Reveal>

        <Reveal delay={1} className="mt-12">
          <ul className="divide-y divide-white/10 overflow-hidden rounded-3xl border border-white/10 bg-white/[0.015]">
            {items.map((item, i) => {
              const isOpen = open === i;
              return (
                <li key={item.q}>
                  <button
                    type="button"
                    onClick={() => setOpen(isOpen ? null : i)}
                    aria-expanded={isOpen}
                    className="group flex w-full items-center justify-between gap-6 px-6 py-5 text-left transition-colors duration-300 hover:bg-white/[0.02] sm:px-8 sm:py-6"
                  >
                    <span className="flex items-center gap-5">
                      <span className="font-mono text-xs text-white/30">
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      <span className="text-base font-medium text-white sm:text-lg">
                        {item.q}
                      </span>
                    </span>
                    <span
                      aria-hidden
                      className={`relative inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-white/15 text-white/70 transition-all duration-500 group-hover:border-white/30 ${
                        isOpen ? "rotate-45 border-white/40 text-white" : ""
                      }`}
                    >
                      <span className="absolute h-0.5 w-3 bg-current" />
                      <span className="absolute h-3 w-0.5 bg-current" />
                    </span>
                  </button>
                  <div
                    className="grid overflow-hidden px-6 transition-all duration-500 ease-out sm:px-8"
                    style={{
                      gridTemplateRows: isOpen ? "1fr" : "0fr",
                      opacity: isOpen ? 1 : 0,
                    }}
                  >
                    <div className="min-h-0">
                      <p
                        className={`pb-6 pl-12 pr-12 text-sm leading-relaxed text-white/65 transition-transform duration-500 sm:pb-8 ${
                          isOpen ? "translate-y-0" : "-translate-y-1"
                        }`}
                      >
                        {item.a}
                      </p>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </Reveal>
      </div>
    </section>
  );
}
