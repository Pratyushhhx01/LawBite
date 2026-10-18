"use client";

import { useState } from "react";
import Reveal from "./Reveal";

type Item = { q: string; a: string };

const items: Item[] = [
  {
    q: "What Indian laws does Lawbite cover?",
    a: "Lawbite has knowledge of 157+ Indian bare acts including the IPC, BNS, CrPC, BNSS, Constitution, Indian Contract Act, Evidence Act, and many more. It retrieves information at the section and article level for precise legal references.",
  },
  {
    q: "Is Lawbite a replacement for a lawyer?",
    a: "No. Lawbite is a research and analysis tool — it helps you understand legal provisions, explore your options, and prepare better questions for your lawyer. It does not provide legal advice or represent you in any proceeding.",
  },
  {
    q: "How does the AI Lawyer mode work?",
    a: "AI Lawyer asks one question at a time across 8 legal lenses — problem, state, role, details, sections, evidence, status, and outcome. It builds a complete picture of your situation before delivering tailored legal analysis.",
  },
  {
    q: "Is my data secure?",
    a: "Your conversations are protected and never shared with third parties. Authentication is handled through secure OAuth (Google/GitHub), and all data is encrypted in transit.",
  },
  {
    q: "Is it free to use?",
    a: "Yes — Lawbite is free to start. You can ask questions across all four AI modes without any payment. A Plus plan with additional features is available for power users.",
  },
  {
    q: "Does it search the web for current legal developments?",
    a: "Yes. When your query requires up-to-date information — such as recent judgments, amendments, or notifications — Lawbite automatically searches the web and incorporates current results into its response.",
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
            Quick answers.
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
