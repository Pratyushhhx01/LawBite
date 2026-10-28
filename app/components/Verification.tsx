import Reveal from "./Reveal";

const steps = [
  {
    number: "01",
    title: "Retrieve",
    description:
      "Your question is matched to the right act and section inside a 157+ act knowledge base.",
  },
  {
    number: "02",
    title: "Cite",
    description:
      "The answer is written from the retrieved section text, not from the model's memory alone.",
  },
  {
    number: "03",
    title: "Verify",
    description:
      "Every cited section is checked against the bare act while the answer is still streaming.",
  },
  {
    number: "04",
    title: "Show",
    description:
      "The Sources strip labels each citation: verified, not found, or not checkable.",
  },
];

const states = [
  {
    title: "Verified",
    description:
      "The section exists in the named bare act. Marked with a green check in the Sources strip.",
    dot: "bg-emerald-400",
    border: "border-emerald-400/20",
    text: "text-emerald-300/90",
  },
  {
    title: "Not found",
    description:
      "The cited section is missing from that act. Flagged in amber so you do not rely on it.",
    dot: "bg-amber-400",
    border: "border-amber-400/20",
    text: "text-amber-300/90",
  },
  {
    title: "Could not check",
    description:
      "The knowledge base was unavailable. We say so instead of pretending the citation passed.",
    dot: "bg-white/40",
    border: "border-white/15",
    text: "text-white/60",
  },
];

export default function Verification() {
  return (
    <section
      id="verification"
      className="relative isolate border-t border-white/10 py-28 sm:py-36"
    >
      <div className="mx-auto max-w-6xl px-6">
        <div className="grid items-end gap-10 md:grid-cols-2">
          <Reveal>
            <p className="text-xs font-medium uppercase tracking-[0.3em] text-white/50">
              / Verification
            </p>
            <h2 className="mt-5 text-balance text-4xl font-semibold leading-[1.1] tracking-tight sm:text-5xl md:text-6xl">
              Every answer ends with proof.
            </h2>
          </Reveal>
          <Reveal delay={1}>
            <p className="max-w-md text-base leading-relaxed text-white/60">
              Legal answers are only useful if you can check them. Lawbite
              retrieves real section text from Indian bare acts and verifies
              every citation before it reaches your screen.
            </p>
          </Reveal>
        </div>

        <div className="mt-16 grid gap-12 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
          <ol className="space-y-8">
            {steps.map((step, i) => (
              <Reveal key={step.number} delay={((i % 4) + 1) as 1 | 2 | 3 | 4}>
                <li className="flex gap-5">
                  <span className="mt-0.5 font-mono text-xs tracking-widest text-white/30">
                    {step.number}
                  </span>
                  <div>
                    <h3 className="text-base font-medium text-white">
                      {step.title}
                    </h3>
                    <p className="mt-1.5 max-w-md text-sm leading-relaxed text-white/55">
                      {step.description}
                    </p>
                  </div>
                </li>
              </Reveal>
            ))}
          </ol>

          <Reveal delay={2}>
            <div className="rounded-3xl border border-white/10 bg-gradient-to-b from-white/[0.04] to-transparent p-6 sm:p-8">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-white/35">
                  Sources
                </span>
                <span className="inline-flex items-center gap-1 rounded-full border border-emerald-400/20 bg-emerald-400/[0.07] px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-emerald-300/90">
                  <svg
                    viewBox="0 0 24 24"
                    className="h-3 w-3"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden
                  >
                    <path d="M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6l7-3z" />
                    <path d="M9 12l2 2 4-4" />
                  </svg>
                  2/2 verified
                </span>
              </div>

              <div className="mt-4 space-y-2.5">
                {[
                  "Bharatiya Nyaya Sanhita, Section 103",
                  "Bharatiya Nyaya Sanhita, Section 4",
                ].map((label) => (
                  <div
                    key={label}
                    className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2.5"
                  >
                    <svg
                      viewBox="0 0 24 24"
                      className="h-3.5 w-3.5 shrink-0 text-emerald-400"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden
                    >
                      <path d="M20 6L9 17l-5-5" />
                    </svg>
                    <span className="truncate text-xs font-medium text-white/80">
                      {label}
                    </span>
                  </div>
                ))}
              </div>

              <p className="mt-5 text-xs leading-relaxed text-white/45">
                Each citation is resolved to an act key and checked against the
                stored bare-act text. A failed lookup is never counted as
                verified.
              </p>
            </div>
          </Reveal>
        </div>

        <Reveal delay={1}>
          <div className="mt-14 grid gap-4 sm:grid-cols-3">
            {states.map((state) => (
              <div
                key={state.title}
                className={`rounded-2xl border ${state.border} bg-white/[0.02] p-5`}
              >
                <div className="flex items-center gap-2">
                  <span className={`h-1.5 w-1.5 rounded-full ${state.dot}`} />
                  <h3
                    className={`text-xs font-semibold uppercase tracking-wider ${state.text}`}
                  >
                    {state.title}
                  </h3>
                </div>
                <p className="mt-2.5 text-sm leading-relaxed text-white/55">
                  {state.description}
                </p>
              </div>
            ))}
          </div>
        </Reveal>

        <Reveal delay={1}>
          <p className="mt-10 max-w-3xl text-xs leading-relaxed text-white/35">
            Verification confirms that a cited provision exists in the named
            bare act. It does not replace advice from a qualified advocate, and
            Lawbite responses remain AI-generated for reference purposes.
          </p>
        </Reveal>
      </div>
    </section>
  );
}
