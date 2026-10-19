import Image from "next/image";
import GridBackground from "./GridBackground";
import Reveal from "./Reveal";

export default function Hero() {
  return (
    <section
      id="hero"
      className="relative isolate flex min-h-[100svh] items-center overflow-hidden pt-32 pb-24"
    >
      <div className="absolute inset-0 -z-10">
        <GridBackground />
        <div className="absolute inset-0 bg-gradient-to-b from-black via-black/60 to-black" />
        <div
          className="absolute left-1/2 top-1/2 h-[520px] w-[820px] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-70"
          style={{
            background:
              "radial-gradient(closest-side, rgba(255,255,255,0.18), transparent 70%)",
          }}
        />
      </div>

      <div className="relative mx-auto flex w-full max-w-6xl flex-col items-center px-6 text-center">
        <Reveal delay={1}>
          <Image
            src="/lawbite-hero.jpeg"
            alt="Lawbite — know your rights"
            width={1600}
            height={800}
            priority
            className="-mt-12 w-[min(92vw,44rem)] mix-blend-screen"
          />
        </Reveal>

        <Reveal delay={2}>
          <p className="mt-7 max-w-2xl text-balance text-base leading-relaxed text-white/65 sm:text-lg">
            Ask any Indian legal question in plain language. Get instant answers
            backed by 157+ bare acts, structured legal analysis, and real-time
            web search &mdash; all in one place.
          </p>
        </Reveal>

        <Reveal delay={3}>
          <div className="mt-10 flex flex-col items-center gap-3 sm:flex-row">
            <a
              href="/chat"
              className="btn-shine group relative inline-flex items-center gap-2 overflow-hidden rounded-full bg-white px-6 py-3 text-sm font-medium text-black transition-transform duration-300 hover:scale-[1.03]"
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
              className="group inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.02] px-6 py-3 text-sm text-white/80 transition-all duration-300 hover:border-white/30 hover:bg-white/[0.06] hover:text-white"
            >
              See how it works
              <span
                aria-hidden
                className="inline-block translate-y-0 transition-transform duration-300 group-hover:translate-y-0.5"
              >
                ↓
              </span>
            </a>
          </div>
        </Reveal>

        <Reveal delay={4} className="w-full">
          <div className="relative mt-20 w-full">
            <div className="absolute inset-x-10 -top-2 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent" />
            <div className="grid grid-cols-2 items-center gap-6 sm:grid-cols-4">
              {["IPC / BNS", "CrPC / BNSS", "Constitution", "157+ Acts"].map(
                (name, i) => (
                  <span
                    key={name}
                    className="text-center text-sm font-medium tracking-[0.2em] text-white/40 transition-colors duration-500 hover:text-white/80"
                    style={{ animationDelay: `${i * 100}ms` }}
                  >
                    {name.toUpperCase()}
                  </span>
                ),
              )}
            </div>
            <div className="absolute inset-x-10 -bottom-2 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
          </div>
        </Reveal>
      </div>

      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-b from-transparent to-black"
      />
    </section>
  );
}
