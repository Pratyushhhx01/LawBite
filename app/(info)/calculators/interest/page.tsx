"use client";

import { useState } from "react";

function addMonths(date: Date, months: number): Date {
  const result = new Date(date);
  result.setMonth(result.getMonth() + months);
  return result;
}

function formatDate(date: Date): string {
  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function daysBetween(a: Date, b: Date): number {
  const msPerDay = 24 * 60 * 60 * 1000;
  return Math.round((b.getTime() - a.getTime()) / msPerDay);
}

export default function InterestCalculator() {
  const [principal, setPrincipal] = useState("");
  const [rate, setRate] = useState("");
  const [timeMonths, setTimeMonths] = useState("");
  const [startDate, setStartDate] = useState("");
  const [compound, setCompound] = useState(false);
  const [frequency, setFrequency] = useState<
    "yearly" | "half-yearly" | "quarterly" | "monthly"
  >("yearly");

  const P = parseFloat(principal) || 0;
  const R = parseFloat(rate) || 0;
  const months = parseInt(timeMonths) || 0;
  const T = months / 12;

  let simpleInterest = 0;
  let compoundInterest = 0;
  let totalSimple = 0;
  let totalCompound = 0;

  if (P > 0 && R > 0 && T > 0) {
    simpleInterest = (P * R * T) / 100;
    totalSimple = P + simpleInterest;

    const n =
      frequency === "yearly"
        ? 1
        : frequency === "half-yearly"
          ? 2
          : frequency === "quarterly"
            ? 4
            : 12;
    compoundInterest = P * Math.pow(1 + R / (100 * n), n * T) - P;
    totalCompound = P + compoundInterest;
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let dueDate: Date | null = null;
  let daysUntilDue: number | null = null;

  if (startDate && months > 0) {
    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);
    dueDate = addMonths(start, months);
    daysUntilDue = daysBetween(today, dueDate);
  }

  function formatCurrency(amount: number): string {
    return amount.toLocaleString("en-IN", {
      maximumFractionDigits: 2,
      minimumFractionDigits: 2,
    });
  }

  return (
    <section className="relative pt-32 pb-24 sm:pt-40 sm:pb-32">
      <div className="mx-auto max-w-6xl px-6">
        <article className="mx-auto max-w-3xl">
          <header className="border-b border-white/10 pb-10">
            <p className="text-xs font-medium uppercase tracking-[0.3em] text-white/40">
              / Calculators / Interest
            </p>
            <h1 className="mt-4 text-4xl font-semibold leading-[1.05] tracking-tight sm:text-5xl">
              Interest Calculator
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-relaxed text-white/65">
              Calculate simple or compound interest on any principal amount.
              Enter the start date to see exactly when your payment is due.
            </p>
          </header>

          <div className="mt-10 space-y-8">
            <div className="grid gap-6 sm:grid-cols-2">
              <div className="space-y-2">
                <label
                  htmlFor="principal"
                  className="block text-sm font-medium text-white/70"
                >
                  Principal Amount (₹)
                </label>
                <input
                  id="principal"
                  type="number"
                  min="0"
                  placeholder="e.g. 500000"
                  value={principal}
                  onChange={(e) => setPrincipal(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white placeholder:text-white/35 focus:border-white/30 focus:outline-none [appearance-none] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                />
              </div>
              <div className="space-y-2">
                <label
                  htmlFor="rate"
                  className="block text-sm font-medium text-white/70"
                >
                  Annual Interest Rate (%)
                </label>
                <input
                  id="rate"
                  type="number"
                  min="0"
                  step="0.1"
                  placeholder="e.g. 12"
                  value={rate}
                  onChange={(e) => setRate(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white placeholder:text-white/35 focus:border-white/30 focus:outline-none [appearance-none] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                />
              </div>
              <div className="space-y-2">
                <label
                  htmlFor="time-months"
                  className="block text-sm font-medium text-white/70"
                >
                  Time Period (Months)
                </label>
                <input
                  id="time-months"
                  type="number"
                  min="0"
                  placeholder="e.g. 36"
                  value={timeMonths}
                  onChange={(e) => setTimeMonths(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white placeholder:text-white/35 focus:border-white/30 focus:outline-none [appearance-none] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                />
              </div>
              <div className="space-y-2">
                <label
                  htmlFor="start-date"
                  className="block text-sm font-medium text-white/70"
                >
                  Start Date
                </label>
                <input
                  id="start-date"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white placeholder:text-white/35 focus:border-white/30 focus:outline-none"
                />
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setCompound(false)}
                  className={`rounded-full px-4 py-2 text-sm font-medium transition-all duration-200 ${
                    !compound
                      ? "bg-white text-black"
                      : "border border-white/10 bg-white/[0.02] text-white/60 hover:text-white"
                  }`}
                >
                  Simple Interest
                </button>
                <button
                  type="button"
                  onClick={() => setCompound(true)}
                  className={`rounded-full px-4 py-2 text-sm font-medium transition-all duration-200 ${
                    compound
                      ? "bg-white text-black"
                      : "border border-white/10 bg-white/[0.02] text-white/60 hover:text-white"
                  }`}
                >
                  Compound Interest
                </button>
              </div>

              {compound && (
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-white/70">
                    Compounding Frequency
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {(
                      ["yearly", "half-yearly", "quarterly", "monthly"] as const
                    ).map((f) => (
                      <button
                        key={f}
                        type="button"
                        onClick={() => setFrequency(f)}
                        className={`rounded-full px-3 py-1.5 text-xs font-medium transition-all duration-200 ${
                          frequency === f
                            ? "bg-white text-black"
                            : "border border-white/10 bg-white/[0.02] text-white/60 hover:text-white"
                        }`}
                      >
                        {f.charAt(0).toUpperCase() + f.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {P > 0 && R > 0 && T > 0 && (
              <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-6">
                <div className="flex items-start gap-4">
                  {dueDate && (
                    <div
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
                        daysUntilDue !== null && daysUntilDue < 0
                          ? "bg-red-500/10 text-red-400"
                          : daysUntilDue !== null && daysUntilDue <= 30
                            ? "bg-amber-500/10 text-amber-400"
                            : "bg-emerald-500/10 text-emerald-400"
                      }`}
                    >
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="h-5 w-5"
                      >
                        <rect
                          x="3"
                          y="4"
                          width="18"
                          height="18"
                          rx="2"
                          ry="2"
                        />
                        <line x1="16" y1="2" x2="16" y2="6" />
                        <line x1="8" y1="2" x2="8" y2="6" />
                        <line x1="3" y1="10" x2="21" y2="10" />
                      </svg>
                    </div>
                  )}
                  <div className="flex-1">
                    <p className="text-xs font-medium uppercase tracking-[0.2em] text-white/40">
                      Payment Due Date
                    </p>
                    {dueDate ? (
                      <>
                        <p className="mt-2 text-2xl font-semibold text-white">
                          {formatDate(dueDate)}
                        </p>
                        {daysUntilDue !== null && (
                          <p
                            className={`mt-1 text-sm font-medium ${
                              daysUntilDue < 0
                                ? "text-red-400"
                                : daysUntilDue <= 30
                                  ? "text-amber-400"
                                  : "text-emerald-400"
                            }`}
                          >
                            {daysUntilDue < 0
                              ? `Overdue by ${Math.abs(daysUntilDue)} days`
                              : daysUntilDue === 0
                                ? "Due today"
                                : `${daysUntilDue} days remaining`}
                          </p>
                        )}
                      </>
                    ) : (
                      <p className="mt-2 text-sm text-white/40">
                        Enter a start date and time period
                      </p>
                    )}
                  </div>
                </div>

                <div className="mt-6 grid gap-4 text-sm sm:grid-cols-2">
                  <div className="rounded-lg border border-white/[0.06] bg-white/[0.03] p-3">
                    <p className="text-xs text-white/40">Start Date</p>
                    <p className="mt-1 font-medium text-white">
                      {startDate ? formatDate(new Date(startDate)) : "—"}
                    </p>
                  </div>
                  <div className="rounded-lg border border-white/[0.06] bg-white/[0.03] p-3">
                    <p className="text-xs text-white/40">Time Period</p>
                    <p className="mt-1 font-medium text-white">
                      {months} months ({T.toFixed(1)} years)
                    </p>
                  </div>
                </div>

                <div className="mt-4 border-t border-white/[0.06] pt-4">
                  <p className="text-xs font-medium uppercase tracking-[0.2em] text-white/40">
                    {compound ? "Compound Interest" : "Simple Interest"}
                  </p>
                  <p className="mt-2 text-3xl font-semibold text-white">
                    ₹
                    {formatCurrency(
                      compound ? compoundInterest : simpleInterest,
                    )}
                  </p>
                  <p className="mt-1 text-sm text-white/50">
                    Total payable: ₹
                    {formatCurrency(compound ? totalCompound : totalSimple)}
                  </p>
                  <div className="mt-4 space-y-2 text-sm">
                    <div className="flex justify-between text-white/50">
                      <span>Principal</span>
                      <span className="font-medium text-white/70">
                        ₹{formatCurrency(P)}
                      </span>
                    </div>
                    <div className="flex justify-between text-white/50">
                      <span>Interest</span>
                      <span className="font-medium text-white/70">
                        ₹
                        {formatCurrency(
                          compound ? compoundInterest : simpleInterest,
                        )}
                      </span>
                    </div>
                    <div className="border-t border-white/[0.06] pt-2 flex justify-between text-white/70">
                      <span className="font-medium">Total Payable</span>
                      <span className="font-semibold text-white">
                        ₹
                        {formatCurrency(compound ? totalCompound : totalSimple)}
                      </span>
                    </div>
                  </div>
                </div>

                {compound && (
                  <div className="mt-4 rounded-lg border border-white/[0.06] bg-white/[0.03] p-3 text-xs text-white/40">
                    Compounding: {frequency} | Rate: {R}% p.a.
                  </div>
                )}
              </div>
            )}

            <p className="text-xs leading-relaxed text-white/35">
              Disclaimer: This calculator provides informational estimates only.
              Actual interest rates may be governed by specific contracts,
              statutes, or court orders. The Reserve Bank of India and various
              state laws may prescribe different interest rates for different
              categories of transactions. Always verify with a qualified legal
              professional.
            </p>
          </div>
        </article>
      </div>
    </section>
  );
}
