"use client";

import { useEffect, useRef, useState } from "react";
import Reveal from "./Reveal";

type Stat = {
  value: number;
  suffix?: string;
  label: string;
  decimals?: number;
};

const stats: Stat[] = [
  { value: 157, suffix: "+", label: "Indian bare acts covered" },
  { value: 5, suffix: "", label: "AI conversation modes" },
  { value: 8, suffix: "", label: "Legal analysis lenses in AI Lawyer" },
  { value: 0, suffix: "", label: "Cost to get started", decimals: 0 },
];

function useCountUp(target: number, durationMs = 1600, decimals = 0) {
  const [value, setValue] = useState(0);
  const ref = useRef<HTMLSpanElement | null>(null);
  const startedRef = useRef(false);

  useEffect(() => {
    const node = ref.current;
    if (!node || startedRef.current) return;

    if (typeof IntersectionObserver === "undefined") return;

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
  const { value, ref } = useCountUp(stat.value, 1600 + index * 150, decimals);

  return (
    <Reveal delay={((index % 3) + 1) as 1 | 2 | 3} className="h-full">
      <div className="group relative flex h-full flex-col justify-between overflow-hidden rounded-3xl border border-white/10 bg-white/[0.015] p-7 transition-all duration-500 hover:border-white/25 hover:bg-white/[0.03] sm:p-9">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-12 -top-12 h-32 w-32 rounded-full bg-white/0 blur-2xl transition-all duration-700 group-hover:bg-white/10"
        />
        <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-[0.25em] text-white/40">
          <span className="inline-block h-1 w-1 rounded-full bg-white/40" />
          {String(index + 1).padStart(2, "0")}
        </div>
        <div className="mt-10">
          <div className="flex items-baseline gap-1">
            <span
              ref={ref}
              className="text-5xl font-semibold tracking-tight text-white sm:text-6xl"
            >
              {value.toFixed(decimals)}
            </span>
            {stat.suffix && (
              <span className="text-2xl font-medium text-white/70 sm:text-3xl">
                {stat.suffix}
              </span>
            )}
          </div>
          <p className="mt-3 text-sm leading-relaxed text-white/55">
            {stat.label}
          </p>
        </div>
      </div>
    </Reveal>
  );
}

export default function Stats() {
  return (
    <section className="relative border-t border-white/10 py-28 sm:py-32">
      <div className="mx-auto max-w-6xl px-6">
        <Reveal>
          <p className="text-xs font-medium uppercase tracking-[0.3em] text-white/50">
            / By the numbers
          </p>
          <h2 className="mt-5 max-w-3xl text-balance text-3xl font-semibold leading-[1.15] tracking-tight sm:text-4xl md:text-5xl">
            Built for Indian legal research.
          </h2>
        </Reveal>

        <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat, i) => (
            <StatItem key={stat.label} stat={stat} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}
