import Reveal from "./Reveal";

export default function CTASection() {
  return (
    <section
      id="cta"
      className="relative isolate overflow-hidden border-t border-white/10 py-28 sm:py-36"
    >
      <div className="mx-auto max-w-6xl px-6">
        <Reveal>
          <div className="relative overflow-hidden rounded-[2.5rem] border border-white/10 bg-gradient-to-b from-white/[0.04] to-transparent px-6 py-20 text-center sm:px-12 sm:py-28">
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 -z-10"
            >
              <div className="absolute inset-0 bg-dots opacity-30" />
              <div
                className="absolute left-1/2 top-1/2 h-[420px] w-[720px] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-60 blur-3xl"
                style={{
                  background:
                    "radial-gradient(closest-side, rgba(255,255,255,0.18), transparent 70%)",
                }}
              />
            </div>

            <div
              aria-hidden
              className="pointer-events-none absolute inset-0"
              style={{
                background:
                  "conic-gradient(from var(--angle, 0deg), transparent 0deg, rgba(255,255,255,0.18) 40deg, transparent 80deg)",
                animation: "border-spin 8s linear infinite",
                maskImage:
                  "radial-gradient(circle at center, black 60%, transparent 75%)",
                WebkitMaskImage:
                  "radial-gradient(circle at center, black 60%, transparent 75%)",
              }}
            />

            <p className="text-xs font-medium uppercase tracking-[0.3em] text-white/50">
              / Get started
            </p>
            <h2 className="mx-auto mt-5 max-w-3xl text-balance text-4xl font-semibold leading-[1.05] tracking-tight sm:text-5xl md:text-6xl">
              Your first legal answer is one question away.
            </h2>
            <p className="mx-auto mt-6 max-w-xl text-balance text-base leading-relaxed text-white/65">
              No sign-up walls. No credit card. Just type your question and get
              an answer grounded in Indian law.
            </p>

            <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <a
                href="/chat"
                className="btn-shine group relative inline-flex items-center gap-2 overflow-hidden rounded-full bg-white px-7 py-3.5 text-sm font-medium text-black transition-transform duration-300 hover:scale-[1.03]"
              >
                Ask a Legal Question
                <span
                  aria-hidden
                  className="inline-block transition-transform duration-300 group-hover:translate-x-0.5"
                >
                  →
                </span>
              </a>
              <a
                href="#features"
                className="group inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.02] px-7 py-3.5 text-sm text-white/80 transition-all duration-300 hover:border-white/30 hover:bg-white/[0.06] hover:text-white"
              >
                Explore Features
              </a>
            </div>

            <div className="mt-12 flex flex-col items-center justify-center gap-2 text-xs text-white/40 sm:flex-row sm:gap-6">
              <span className="flex items-center gap-2">
                <span className="inline-block h-1 w-1 rounded-full bg-white/50" />
                Free to start
              </span>
              <span className="flex items-center gap-2">
                <span className="inline-block h-1 w-1 rounded-full bg-white/50" />
                157+ bare acts covered
              </span>
              <span className="flex items-center gap-2">
                <span className="inline-block h-1 w-1 rounded-full bg-white/50" />
                No credit card required
              </span>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
