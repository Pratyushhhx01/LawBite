import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Legal Calculators — Lawbite",
  description:
    "Free Indian legal calculators — statute of limitations, interest calculations, and more.",
};

const calculators = [
  {
    title: "Statute of Limitations",
    description:
      "Find the deadline to file your case. Select your case type and incident date to see exactly how many days you have left.",
    href: "/calculators/limitations",
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-6 w-6"
      >
        <circle cx="12" cy="12" r="10" />
        <polyline points="12 6 12 12 16 14" />
      </svg>
    ),
  },
  {
    title: "Interest Calculator",
    description:
      "Calculate simple or compound interest on any principal amount. Useful for debt recovery, damages, and award calculations.",
    href: "/calculators/interest",
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-6 w-6"
      >
        <line x1="12" y1="1" x2="12" y2="23" />
        <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
      </svg>
    ),
  },
];

export default function CalculatorsPage() {
  return (
    <section className="relative pt-32 pb-24 sm:pt-40 sm:pb-32">
      <div className="mx-auto max-w-6xl px-6">
        <article className="mx-auto max-w-3xl">
          <header className="border-b border-white/10 pb-10">
            <p className="text-xs font-medium uppercase tracking-[0.3em] text-white/40">
              / Calculators
            </p>
            <h1 className="mt-4 text-4xl font-semibold leading-[1.05] tracking-tight sm:text-5xl">
              Legal Calculators
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-relaxed text-white/65">
              Free tools to help you understand deadlines, interest amounts, and
              key legal timelines under Indian law.
            </p>
          </header>

          <div className="mt-10 grid gap-6 sm:grid-cols-2">
            {calculators.map((calc) => (
              <Link
                key={calc.href}
                href={calc.href}
                className="group rounded-xl border border-white/[0.08] bg-white/[0.02] p-6 transition-all duration-300 hover:border-white/20 hover:bg-white/[0.05]"
              >
                <div className="text-white/50 transition-colors duration-300 group-hover:text-white">
                  {calc.icon}
                </div>
                <h2 className="mt-4 text-lg font-semibold text-white">
                  {calc.title}
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-white/55">
                  {calc.description}
                </p>
                <span className="mt-4 inline-flex items-center gap-1.5 text-xs font-medium text-white/40 transition-colors duration-300 group-hover:text-white/70">
                  Open calculator
                  <span className="transition-transform duration-300 group-hover:translate-x-0.5">
                    →
                  </span>
                </span>
              </Link>
            ))}
          </div>

          <p className="mt-10 text-xs leading-relaxed text-white/35">
            Disclaimer: These calculators provide informational estimates only.
            Limitation periods may vary based on specific facts, court
            interpretations, and legislative amendments. Always verify with a
            qualified legal professional before relying on these calculations.
          </p>
        </article>
      </div>
    </section>
  );
}
