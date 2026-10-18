"use client";

import { useEffect, useState } from "react";
import Reveal from "./Reveal";

type Testimonial = {
  quote: string;
  name: string;
  role: string;
};

const testimonials: Testimonial[] = [
  {
    quote:
      "I used the AI Lawyer mode for a bail application. It walked me through every angle I hadn't considered — the structured approach saved me hours of research.",
    name: "Arjun Mehta",
    role: "Junior Advocate, Delhi High Court",
  },
  {
    quote:
      "Finally, an AI that understands Indian law specifically. The section-level references to actual bare acts make this genuinely useful, not just generic legal chatbots.",
    name: "Priya Sharma",
    role: "Legal Researcher, NLU Delhi",
  },
  {
    quote:
      "The deep analysis mode gave me a 12-point breakdown of a contract dispute. It cited relevant IPC sections and recent judgments I had missed.",
    name: "Rohan Desai",
    role: "Corporate Lawyer, Mumbai",
  },
  {
    quote:
      "As a law student, this is incredible for exam prep. I can ask about any provision and get a clear, structured answer with the exact section references.",
    name: "Kavya Nair",
    role: "Final Year Student, NALSAR",
  },
];

export default function Testimonials() {
  const [active, setActive] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setActive((i) => (i + 1) % testimonials.length);
    }, 6000);
    return () => clearInterval(id);
  }, []);

  return (
    <section className="relative border-t border-white/10 py-28 sm:py-36">
      <div className="mx-auto max-w-6xl px-6">
        <Reveal>
          <p className="text-xs font-medium uppercase tracking-[0.3em] text-white/50">
            / Testimonials
          </p>
          <h2 className="mt-5 max-w-3xl text-balance text-4xl font-semibold leading-[1.1] tracking-tight sm:text-5xl md:text-6xl">
            Words from the people who use it.
          </h2>
        </Reveal>

        <div className="mt-16 grid items-stretch gap-6 lg:grid-cols-5">
          <Reveal className="lg:col-span-3">
            <figure className="relative h-full overflow-hidden rounded-3xl border border-white/10 bg-white/[0.015] p-8 sm:p-12">
              <span
                aria-hidden
                className="pointer-events-none absolute -left-6 -top-10 select-none text-[14rem] font-serif leading-none text-white/[0.05]"
              >
                &ldquo;
              </span>
              <div className="relative min-h-[180px]">
                {testimonials.map((t, i) => (
                  <blockquote
                    key={t.name}
                    className={`absolute inset-0 flex flex-col justify-between transition-all duration-700 ${
                      i === active
                        ? "translate-y-0 opacity-100"
                        : "pointer-events-none translate-y-3 opacity-0"
                    }`}
                  >
                    <p className="text-balance text-xl leading-relaxed text-white/90 sm:text-2xl md:text-3xl">
                      {t.quote}
                    </p>
                    <footer className="mt-8 flex items-center gap-4">
                      <span className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-white/5 text-sm font-medium text-white">
                        {t.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </span>
                      <div>
                        <div className="text-sm font-medium text-white">
                          {t.name}
                        </div>
                        <div className="text-xs text-white/50">{t.role}</div>
                      </div>
                    </footer>
                  </blockquote>
                ))}
              </div>
              <div className="mt-10 flex items-center gap-2">
                {testimonials.map((_, i) => (
                  <button
                    type="button"
                    key={i}
                    aria-label={`Show testimonial ${i + 1}`}
                    onClick={() => setActive(i)}
                    className="group relative h-1 flex-1 overflow-hidden rounded-full bg-white/10"
                  >
                    <span
                      className={`absolute inset-y-0 left-0 rounded-full bg-white transition-all duration-500 ${
                        i === active ? "w-full" : "w-0"
                      }`}
                      style={
                        i === active
                          ? { transitionDuration: "6000ms" }
                          : undefined
                      }
                    />
                  </button>
                ))}
              </div>
            </figure>
          </Reveal>

          <div className="grid gap-4 lg:col-span-2">
            {testimonials.slice(0, 3).map((t, i) => (
              <Reveal
                key={t.name}
                delay={((i % 3) + 1) as 1 | 2 | 3}
                className="h-full"
              >
                <button
                  type="button"
                  onClick={() => setActive(i)}
                  className={`group flex h-full w-full flex-col rounded-2xl border p-5 text-left transition-all duration-500 ${
                    i === active
                      ? "border-white/30 bg-white/[0.04]"
                      : "border-white/10 bg-white/[0.01] hover:border-white/20 hover:bg-white/[0.03]"
                  }`}
                >
                  <p className="line-clamp-3 text-sm leading-relaxed text-white/70">
                    &ldquo;{t.quote}&rdquo;
                  </p>
                  <div className="mt-4 flex items-center gap-3">
                    <span className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-white/15 bg-white/5 text-[10px] font-medium text-white">
                      {t.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </span>
                    <div>
                      <div className="text-xs font-medium text-white">
                        {t.name}
                      </div>
                      <div className="text-[11px] text-white/40">{t.role}</div>
                    </div>
                  </div>
                </button>
              </Reveal>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
