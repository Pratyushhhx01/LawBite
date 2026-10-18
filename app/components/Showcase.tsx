import Reveal from "./Reveal";

const leftFeatures = [
  {
    label: "Talk to AI",
    desc: "Chat about any legal question",
    iconPath:
      "M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z",
  },
  {
    label: "Deep Analysis",
    desc: "Deep case breakdown",
    iconPath:
      "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4",
  },
  {
    label: "Document Drafter",
    desc: "Notices, FIRs, contracts",
    iconPath:
      "M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z M14 2v6h6 M16 13H8 M16 17H8 M10 9H8",
  },
  {
    label: "Reminders",
    desc: "Never miss a deadline",
    iconPath:
      "M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9 M13.73 21a2 2 0 01-3.46 0",
  },
];

const rightFeatures = [
  {
    label: "Document Review",
    desc: "Analyze uploaded docs",
    iconPath:
      "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z",
  },
  {
    label: "Calculators",
    desc: "Limitation & interest",
    iconPath:
      "M4 4h16v16H4zM8 8h.01M12 8h.01M16 8h.01M8 12h.01M12 12h.01M16 12h.01M8 16h8",
  },
  {
    label: "Filing Assistance",
    desc: "Cyber, RTI & complaints online",
    iconPath:
      "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z M9 12h6m-6 4h6",
  },
  {
    label: "AI Lawyer",
    desc: "Track your active matters",
    iconPath:
      "M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z",
  },
];

function FeatureCard({ feature }: { feature: (typeof leftFeatures)[0] }) {
  return (
    <div className="group rounded-lg border border-white/10 bg-white/[0.03] p-4 transition-all hover:border-white/20 hover:bg-white/[0.06]">
      <div className="mb-3 text-white/50 transition-colors duration-300 group-hover:text-white">
        <svg
          viewBox="0 0 24 24"
          className="h-5 w-5"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d={feature.iconPath} />
        </svg>
      </div>
      <div className="text-sm font-medium text-white/85">{feature.label}</div>
      <div className="mt-1 text-xs text-white/45">{feature.desc}</div>
    </div>
  );
}

export default function Showcase() {
  return (
    <section
      id="preview"
      className="relative isolate overflow-hidden border-t border-white/10 py-28 sm:py-36"
    >
      <div className="mx-auto max-w-screen-2xl px-4 sm:px-6 lg:px-12">
        <Reveal>
          <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.3em] text-white/50">
                / Preview
              </p>
              <h2 className="mt-5 max-w-2xl text-balance text-4xl font-semibold leading-[1.1] tracking-tight sm:text-5xl md:text-6xl">
                See it in action.
              </h2>
            </div>
            <p className="max-w-sm text-sm leading-relaxed text-white/60">
              Ask a question, pick a mode, get an answer grounded in Indian law.
              Here&apos;s what it looks like.
            </p>
          </div>
        </Reveal>

        <Reveal delay={1}>
          <div className="mt-14 flex items-stretch gap-6 lg:gap-10">
            {/* Left feature cards */}
            <div className="hidden w-48 flex-shrink-0 flex-col justify-between py-2 lg:flex xl:w-56">
              {leftFeatures.map((feature) => (
                <FeatureCard key={feature.label} feature={feature} />
              ))}
            </div>

            {/* Main preview */}
            <div className="relative min-w-0 flex-1 overflow-hidden rounded-3xl border border-white/10 bg-black">
              <div className="flex h-[480px] sm:h-[560px] lg:h-[600px]">
                {/* Sidebar */}
                <aside className="hidden w-60 flex-shrink-0 flex-col border-r border-white/10 bg-black p-3 md:flex">
                  <div className="flex items-center gap-2 border-b border-white/10 pb-3">
                    <span className="inline-flex h-6 w-6 items-center justify-center">
                      <svg
                        viewBox="0 0 64 64"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="h-full w-full text-white"
                      >
                        <path d="M32 4 L60 32 L32 60 L4 32 Z" />
                        <ellipse cx="32" cy="24" rx="12" ry="14" />
                        <ellipse cx="32" cy="40" rx="12" ry="14" />
                      </svg>
                    </span>
                    <span className="text-sm font-semibold text-white">
                      Lawbite
                    </span>
                  </div>

                  <div className="mt-3 flex flex-col gap-2">
                    <div className="flex items-center gap-2 rounded-full border border-white/15 bg-white px-3 py-2 text-xs font-medium text-black">
                      <svg
                        viewBox="0 0 24 24"
                        className="h-3.5 w-3.5"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <line x1="12" y1="5" x2="12" y2="19" />
                        <line x1="5" y1="12" x2="19" y2="12" />
                      </svg>
                      New chat
                    </div>
                    <div className="flex items-center gap-2 rounded-full border border-white/15 bg-white px-3 py-2 text-xs font-medium text-black">
                      <svg
                        viewBox="0 0 24 24"
                        className="h-3.5 w-3.5"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
                      </svg>
                      AI Lawyer
                    </div>
                  </div>

                  <div className="mt-4 flex flex-col gap-0.5">
                    {[
                      {
                        label: "History",
                        icon: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z",
                      },
                      {
                        label: "Calculators",
                        icon: "M4 4h16v16H4zM8 8h.01M12 8h.01M16 8h.01M8 12h.01M12 12h.01M16 12h.01M8 16h8",
                      },
                      {
                        label: "Filing",
                        icon: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z M9 12h6m-6 4h6",
                      },
                      {
                        label: "Reminders",
                        icon: "M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9 M13.73 21a2 2 0 01-3.46 0",
                      },
                    ].map((item) => (
                      <div
                        key={item.label}
                        className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] font-medium text-white/50"
                      >
                        <svg
                          viewBox="0 0 24 24"
                          className="h-4 w-4 shrink-0"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d={item.icon} />
                        </svg>
                        {item.label}
                      </div>
                    ))}
                  </div>

                  <div className="mt-auto border-t border-white/10 pt-3">
                    <div className="flex items-center gap-2.5 px-1">
                      <div className="flex h-7 w-7 items-center justify-center rounded-full bg-white/10 text-[11px] font-medium text-white/60">
                        U
                      </div>
                      <span className="flex-1 truncate text-xs text-white/50">
                        user
                      </span>
                      <svg
                        viewBox="0 0 24 24"
                        className="h-3.5 w-3.5 text-white/30"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <circle cx="12" cy="12" r="3" />
                        <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" />
                      </svg>
                    </div>
                  </div>
                </aside>

                {/* Main chat area */}
                <div className="flex flex-1 flex-col">
                  <div className="flex items-center justify-between border-b border-white/10 px-5 py-3 sm:px-8">
                    <div>
                      <div className="text-sm font-semibold text-white">
                        Tenant eviction rights
                      </div>
                      <div className="text-[11px] uppercase tracking-[0.2em] text-white/40">
                        Talk to AI
                      </div>
                    </div>
                    <div className="hidden items-center gap-1.5 sm:flex">
                      <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-400" />
                      <span className="text-xs text-white/40">Online</span>
                    </div>
                  </div>

                  <div className="flex-1 overflow-hidden px-5 py-6 sm:px-8">
                    <div className="mx-auto flex max-w-3xl flex-col gap-5">
                      <div className="flex justify-end">
                        <div className="max-w-[85%] rounded-2xl rounded-br-md bg-white px-4 py-3 text-sm leading-relaxed text-black">
                          What are my rights if my landlord wants to evict me
                          without notice?
                        </div>
                      </div>

                      <div className="flex justify-start">
                        <div className="max-w-[85%] rounded-2xl rounded-bl-md border border-white/10 bg-white/[0.03] px-4 py-3 text-sm leading-relaxed text-white/85">
                          <p className="mb-2">
                            Under Indian law, a landlord{"'"}s right to evict a
                            tenant is governed by{" "}
                            <span className="font-medium text-white/95">
                              state-specific rent control acts
                            </span>{" "}
                            and the{" "}
                            <span className="font-medium text-white/95">
                              Transfer of Property Act, 1882
                            </span>
                            .
                          </p>
                          <p className="mb-2">Key protections you have:</p>
                          <ol className="mb-2 list-decimal pl-5 text-white/75">
                            <li className="mb-1">
                              <span className="font-medium text-white/90">
                                Notice period
                              </span>{" "}
                              — Landlord must give proper written notice
                              (typically 1-3 months depending on the state)
                            </li>
                            <li className="mb-1">
                              <span className="font-medium text-white/90">
                                Valid ground required
                              </span>{" "}
                              — Eviction requires a legally recognized ground
                              (non-payment, subletting, personal use, etc.)
                            </li>
                            <li className="mb-1">
                              <span className="font-medium text-white/90">
                                Court order mandatory
                              </span>{" "}
                              — Self-help eviction is illegal; only a court can
                              order eviction
                            </li>
                          </ol>
                          <p>
                            Would you like me to analyze your specific situation
                            in detail? I can check the rent control act for your
                            state.
                          </p>
                        </div>
                      </div>

                      <div className="flex justify-end">
                        <div className="max-w-[85%] rounded-2xl rounded-br-md bg-white px-4 py-3 text-sm leading-relaxed text-black">
                          I live in Maharashtra. What does the Rent Control Act
                          say?
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="border-t border-white/10 px-5 py-4 sm:px-8">
                    <div className="mx-auto max-w-3xl">
                      <div className="flex items-end gap-2 rounded-2xl border border-white/10 bg-white/[0.03] p-2">
                        <button
                          type="button"
                          className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-white/40 transition-colors hover:text-white/70"
                        >
                          <svg
                            viewBox="0 0 24 24"
                            className="h-4 w-4"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <line x1="12" y1="5" x2="12" y2="19" />
                            <line x1="5" y1="12" x2="19" y2="12" />
                          </svg>
                        </button>
                        <button
                          type="button"
                          className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-white/40 transition-colors hover:text-white/70"
                        >
                          <svg
                            viewBox="0 0 24 24"
                            className="h-4 w-4"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48" />
                          </svg>
                        </button>
                        <div className="flex-1 px-1 py-1.5 text-sm text-white/40">
                          Message Lawbite...
                        </div>
                        <button
                          type="button"
                          className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white text-black transition-transform hover:scale-105"
                        >
                          <svg
                            viewBox="0 0 20 20"
                            className="h-3.5 w-3.5"
                            fill="currentColor"
                          >
                            <path d="M2.5 2.5l15 7.5-15 7.5V12l10-2-10-2V2.5z" />
                          </svg>
                        </button>
                      </div>
                      <p className="mt-2 text-center text-[11px] text-white/30">
                        Press Enter to send, Shift+Enter for a new line.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right feature cards */}
            <div className="hidden w-48 flex-shrink-0 flex-col justify-between py-2 lg:flex xl:w-56">
              {rightFeatures.map((feature) => (
                <FeatureCard key={feature.label} feature={feature} />
              ))}
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
