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

export default function Verification() {
  return (
    <section
      id="verification"
      className="relative isolate border-t border-white/10 py-28 sm:py-36"
    >
      <div className="mx-auto max-w-6xl px-6">
        <Reveal>
          <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.3em] text-white/50">
                / Verification
              </p>
              <h2 className="mt-5 max-w-2xl text-balance text-4xl font-semibold leading-[1.1] tracking-tight sm:text-5xl md:text-6xl">
                Every answer ends with proof.
              </h2>
            </div>
            <p className="max-w-sm text-sm leading-relaxed text-white/60">
              Legal answers are only useful if you can check them. Lawbite
              retrieves real section text from Indian bare acts and verifies
              every citation before it reaches your screen.
            </p>
          </div>
        </Reveal>

        <div className="relative mt-20">
          <ol className="relative space-y-12 before:absolute before:bottom-6 before:left-7 before:top-7 before:hidden before:w-px before:bg-gradient-to-b before:from-white/20 before:via-white/10 before:to-transparent sm:before:block">
            {steps.map((step, i) => (
              <Reveal
                key={step.number}
                delay={((i % 4) + 1) as 1 | 2 | 3 | 4}
              >
                <li className="group relative flex flex-col gap-5 sm:flex-row sm:items-start sm:gap-8">
                  <div className="relative shrink-0">
                    <span className="relative inline-flex h-14 w-14 items-center justify-center rounded-full border border-white/15 bg-black text-sm font-mono text-white/80 transition-all duration-500 group-hover:scale-105 group-hover:border-white/40 group-hover:text-white">
                      {step.number}
                    </span>
                  </div>
                  <div className="pt-2">
                    <h3 className="text-lg font-medium text-white sm:text-xl">
                      {step.title}
                    </h3>
                    <p className="mt-2 max-w-2xl text-sm leading-relaxed text-white/55">
                      {step.description}
                    </p>
                  </div>
                </li>
              </Reveal>
            ))}
          </ol>
        </div>

        <Reveal delay={1}>
          <p className="mt-16 max-w-3xl text-xs leading-relaxed text-white/35">
            Verification confirms that a cited provision exists in the named
            bare act. It does not replace advice from a qualified advocate, and
            Lawbite responses remain AI-generated for reference purposes.
          </p>
        </Reveal>
      </div>
    </section>
  );
}
