"use client";

import { useEffect, useRef, useState } from "react";
import Reveal from "./Reveal";

type Stat = {
  value: number;
  suffix?: string;
  suffixValue?: number;
  label: string;
  decimals?: number;
  suffixSameSize?: boolean;
};

const stats: Stat[] = [
  { value: 157, suffix: "+", label: "Indian bare acts covered" },
  { value: 12, suffix: "+", label: "Specialized legal tools & workflows" },
  { value: 712, suffix: "", label: "Automated test assertions passing" },
  {
    value: 100,
    suffix: "%",
    label: "Deterministic statutory citation checks",
  },
];

function useCountUp(target: number, durationMs = 1600, decimals = 0) {
  const [value, setValue] = useState(0);
  const ref = useRef<HTMLSpanElement | null>(null);
  const startedRef = useRef(false);

  useEffect(() => {
    const node = ref.current;
    if (!node || startedRef.current) return;

    if (typeof IntersectionObserver === "undefined") {
      requestAnimationFrame(() => setValue(target));
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !startedRef.current) {
            startedRef.current = true;
            const start = performance.now();
            const tick = (now: number) => {
              const t = Math.min(1, (now - start) / durationMs);
              const eased = 1 - Math.pow(1 - t, 3);
              setValue(Number((eased * target).toFixed(decimals)));
              if (t < 1) requestAnimationFrame(tick);
            };
            requestAnimationFrame(tick);
            observer.disconnect();
          }
        });
      },
      { threshold: 0.4 },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [target, durationMs, decimals]);

  return { value, ref };
}

function StatItem({ stat, index }: { stat: Stat; index: number }) {
  const decimals = stat.decimals ?? 0;
  const duration = 1600 + index * 150;
  const { value, ref } = useCountUp(stat.value, duration, decimals);
  const { value: suffixValue, ref: suffixRef } = useCountUp(
    stat.suffixValue ?? 0,
    duration,
    0,
  );
  const suffixClass = stat.suffixSameSize
    ? "text-5xl font-semibold tracking-tight text-white sm:text-6xl"
    : "text-2xl font-medium text-white/70 sm:text-3xl";

  return (
    <Reveal delay={((index % 4) + 1) as 1 | 2 | 3 | 4} className="h-full">
      <div className="group relative flex h-full flex-col justify-between overflow-hidden rounded-3xl border border-white/10 bg-white/[0.015] p-7 transition-all duration-500 hover:border-white/25 hover:bg-white/[0.03] sm:p-9">
        <div
          aria-hidden
          className="hover-blur-glow pointer-events-none absolute -right-12 -top-12 h-32 w-32 rounded-full bg-white/0 blur-2xl transition-all duration-700 group-hover:bg-white/10"
        />
        <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-[0.25em] text-white/40">
          <span className="inline-block h-1 w-1 rounded-full bg-white/40" />
          {String(index + 1).padStart(2, "0")}
        </div>
        <div className="mt-10">
          <div
            className={`flex items-baseline ${
              stat.suffixSameSize ? "gap-0" : "gap-1"
            }`}
          >
            <span
              ref={ref}
              className="text-5xl font-semibold tracking-tight text-white sm:text-6xl"
            >
              {decimals > 0 ? value.toFixed(decimals) : value}
            </span>
            {stat.suffixValue !== undefined ? (
              <>
                <span className={suffixClass}>/</span>
                <span ref={suffixRef} className={suffixClass}>
                  {suffixValue}
                </span>
              </>
            ) : stat.suffix ? (
              <span className={suffixClass}>{stat.suffix}</span>
            ) : null}
          </div>
          <p className="mt-3 text-sm leading-relaxed text-white/60">
            {stat.label}
          </p>
        </div>
      </div>
    </Reveal>
  );
}

export default function Stats() {
  return (
    <section
      id="stats"
      className="relative isolate border-t border-white/10 py-28 sm:py-36"
    >
      <div className="mx-auto max-w-6xl px-6">
        <div className="grid items-end gap-10 md:grid-cols-2">
          <Reveal>
            <p className="text-xs font-medium uppercase tracking-[0.3em] text-white/50">
              / Verified Grounding
            </p>
            <h2 className="mt-5 text-balance text-4xl font-semibold leading-[1.1] tracking-tight sm:text-5xl md:text-6xl">
              Backed by verified data.
            </h2>
          </Reveal>
          <Reveal delay={1}>
            <p className="max-w-md text-base leading-relaxed text-white/60">
              No hallucinated citations or unverified guesswork. Every statutory
              reference is parsed, verified against primary law, and validated by
              automated test suites.
            </p>
          </Reveal>
        </div>

        <div className="mt-16 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat, i) => (
            <StatItem key={stat.label} stat={stat} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}
