import Reveal from "./Reveal";

type Step = {
  number: string;
  title: string;
  description: string;
};

const steps: Step[] = [
  {
    number: "01",
    title: "Ask",
    description:
      "Type your legal question in plain language. No need to know the right section or act — just describe your situation.",
  },
  {
    number: "02",
    title: "Choose a Mode",
    description:
      "Pick quick answer, deep analysis, structured interrogation, or free-form chat — depending on how much detail you need.",
  },
  {
    number: "03",
    title: "Upload & Draft",
    description:
      "Attach PDFs and images to any chat, or use the Document Drafter to generate legal documents from 8 ready templates — legal notices, FIRs, contracts, and more.",
  },
  {
    number: "04",
    title: "Get Grounded Answers",
    description:
      "AI retrieves from 157+ Indian bare acts and searches the web for current legal developments to support its response.",
  },
  {
    number: "05",
    title: "Save & Share",
    description:
      "Pin important conversations, save completed cases for reference, and share findings to social platforms.",
  },
];

export default function HowItWorks() {
  return (
    <section
      id="process"
      className="relative isolate border-t border-white/10 py-28 sm:py-36"
    >
      <div className="mx-auto max-w-6xl px-6">
        <Reveal>
          <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.3em] text-white/50">
                / Process
              </p>
              <h2 className="mt-5 max-w-2xl text-balance text-4xl font-semibold leading-[1.1] tracking-tight sm:text-5xl md:text-6xl">
                From question to clarity in five steps.
              </h2>
            </div>
            <p className="max-w-sm text-sm leading-relaxed text-white/60">
              No legal training required. Just ask, and Lawbite does the heavy
              lifting.
            </p>
          </div>
        </Reveal>

        <div className="relative mt-20">
          <div
            aria-hidden
            className="pointer-events-none absolute left-0 right-0 top-7 hidden h-px bg-gradient-to-r from-transparent via-white/15 to-transparent lg:block"
          />
          <ol className="grid gap-10 sm:grid-cols-2 lg:grid-cols-5">
            {steps.map((step, i) => (
              <Reveal
                key={step.number}
                delay={((i % 5) + 1) as 1 | 2 | 3 | 4 | 5}
              >
                <li className="group relative">
                  <div className="relative flex items-center gap-4">
                    <div className="relative">
                      <span
                        aria-hidden
                        className="absolute inset-0 -z-10 rounded-full bg-white/0 blur-md transition-all duration-700 group-hover:bg-white/30"
                      />
                      <span className="relative inline-flex h-14 w-14 items-center justify-center rounded-full border border-white/15 bg-black text-sm font-mono text-white/80 transition-all duration-500 group-hover:scale-105 group-hover:border-white/40 group-hover:text-white">
                        {step.number}
                      </span>
                    </div>
                    <span
                      aria-hidden
                      className="hidden h-px flex-1 origin-left scale-x-0 bg-white/20 transition-transform duration-700 group-hover:scale-x-100 lg:block"
                    />
                  </div>
                  <h3 className="mt-6 text-lg font-medium text-white sm:text-xl">
                    {step.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-white/55">
                    {step.description}
                  </p>
                </li>
              </Reveal>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
