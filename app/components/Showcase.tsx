import LogoIcon from "./LogoIcon";
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
    desc: "10–12 point case breakdown",
    iconPath:
      "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4",
  },
  {
    label: "Matter Workspaces",
    desc: "Litigation & dossier tracking",
    iconPath:
      "M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4",
  },
  {
    label: "Courtroom Prep",
    desc: "Cross-examination & traps",
    iconPath:
      "M4 26h24M6 14h20M8 14v12M24 14v12M16 6v8",
  },
];

const rightFeatures = [
  {
    label: "Contract Risk Analyzer",
    desc: "Clause-by-clause audit",
    iconPath:
      "M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z",
  },
  {
    label: "Case-Law & Precedents",
    desc: "Good-law status checking",
    iconPath:
      "M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253",
  },
  {
    label: "Document Comparison",
    desc: "Revision redlining & shifts",
    iconPath:
      "M8 7v10M8 7l4-4m-4 4l-4-4m12 14V7m0 10l4 4m-4-4l-4 4",
  },
  {
    label: "Amendment Tracker",
    desc: "Gazettes & effective dates",
    iconPath:
      "M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25",
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
              Ask a question, analyze risk, or prepare your courtroom strategy.
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
                    <LogoIcon className="h-6 w-6" />
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
                      Legal Matters
                    </div>
                  </div>

                  <div className="mt-4 flex flex-col gap-0.5">
                    {[
                      {
                        label: "Matters Dashboard",
                        icon: "M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4",
                      },
                      {
                        label: "Case Law Search",
                        icon: "M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253",
                      },
                      {
                        label: "Calculators",
                        icon: "M4 4h16v16H4zM8 8h.01M12 8h.01M16 8h.01M8 12h.01M12 12h.01M16 12h.01M8 16h8",
                      },
                      {
                        label: "Amendments",
                        icon: "M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25",
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
                        advocate.user
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
                        Tenant eviction rights & Notice validity
                      </div>
                      <div className="text-[11px] uppercase tracking-[0.2em] text-white/40">
                        Deep Analysis &bull; Verified Statutory Grounding
                      </div>
                    </div>
                  </div>

                  <div className="flex-1 overflow-hidden px-5 py-6 sm:px-8">
                    <div className="mx-auto flex max-w-3xl flex-col gap-5">
                      <div className="flex justify-end">
                        <div className="max-w-[85%] rounded-2xl rounded-br-md bg-white px-4 py-3 text-sm leading-relaxed text-black">
                          What are my rights if my landlord wants to evict me without notice?
                        </div>
                      </div>

                      <div className="flex justify-start">
                        <div className="max-w-[85%] rounded-2xl rounded-bl-md border border-white/10 bg-white/[0.03] px-4 py-3 text-sm leading-relaxed text-white/85">
                          <p className="mb-2">
                            Under Indian law, tenant eviction is governed by{" "}
                            <span className="font-medium text-white/95">
                              state rent control enactments
                            </span>{" "}
                            and Section 106 of the{" "}
                            <span className="font-medium text-white/95">
                              Transfer of Property Act, 1882
                            </span>
                            .
                          </p>
                          <p className="mb-2">Key legal protections:</p>
                          <ol className="mb-2 list-decimal pl-5 text-white/75">
                            <li className="mb-1">
                              <span className="font-medium text-white/90">
                                Statutory Notice Period:
                              </span>{" "}
                              Mandatory 15-day or monthly written notice under TPA §106.
                            </li>
                            <li className="mb-1">
                              <span className="font-medium text-white/90">
                                Prohibition on Self-Help:
                              </span>{" "}
                              Supreme Court held in <em>Bishandas v. State of Punjab</em> that forceful eviction without due process of law is illegal.
                            </li>
                            <li className="mb-1">
                              <span className="font-medium text-white/90">
                                Judicial Decree Mandatory:
                              </span>{" "}
                              Only a competent Rent Controller or Civil Court can order eviction on specific statutory grounds.
                            </li>
                          </ol>
                          <p className="text-xs text-emerald-400 mt-2 flex items-center gap-1.5">
                            <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-400" />
                            Verified against Transfer of Property Act 1882 &sect;106
                          </p>
                        </div>
                      </div>

                      <div className="flex justify-end">
                        <div className="max-w-[85%] rounded-2xl rounded-br-md bg-white px-4 py-3 text-sm leading-relaxed text-black">
                          Can we save this analysis directly into my Matter workspace?
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
