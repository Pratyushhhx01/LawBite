"use client";

import { useState } from "react";

/* ─── Shared helpers ─── */

function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

function addYears(date: Date, years: number): Date {
  const result = new Date(date);
  result.setFullYear(result.getFullYear() + years);
  return result;
}

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

function formatCurrency(amount: number): string {
  return amount.toLocaleString("en-IN", {
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
  });
}

/* ─── Limitation Calculator Modal ─── */

const CASE_TYPES = [
  {
    id: "contract",
    label: "Breach of Contract",
    years: 3,
    description: "Indian Contract Act, 1872 — S. 73",
    icon: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z",
  },
  {
    id: "money",
    label: "Money Recovery",
    years: 3,
    description: "Suit for recovery of money",
    icon: "M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
  },
  {
    id: "property",
    label: "Property Dispossession",
    years: 12,
    description: "Suit for possession of immovable property",
    icon: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6",
  },
  {
    id: "cheque",
    label: "Cheque Bounce (S.138 NI Act)",
    days: 30,
    description: "Negotiable Instruments Act — 30 days from cause of action",
    icon: "M2.5 9a14.197 14.197 0 0119 0M2.5 15a14.197 14.197 0 0019 0M5 5h14a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2z",
  },
  {
    id: "consumer",
    label: "Consumer Complaint",
    years: 2,
    description: "Consumer Protection Act, 2019",
    icon: "M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z",
  },
  {
    id: "motor",
    label: "Motor Accident Claim",
    years: 3,
    description: "Motor Vehicles Act, 1988 — S. 166",
    icon: "M8 17h.01M16 17h.01M3 11l1.5-5A2 2 0 016.4 4h11.2a2 2 0 011.9 1.4L21 11M3 11h18M3 11v6a1 1 0 001 1h1a1 1 0 001-1v-1h12v1a1 1 0 001 1h1a1 1 0 001-1v-6",
  },
  {
    id: "termination",
    label: "Wrongful Termination",
    years: 1,
    description: "Industrial Disputes Act, 1947",
    icon: "M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1",
  },
  {
    id: "defamation",
    label: "Defamation",
    years: 1,
    description: "Indian Penal Code / BNS — S. 499/356",
    icon: "M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
  },
  {
    id: "government",
    label: "Suit Against Government",
    years: 1,
    description: "Section 80 CPC — 2 months notice required",
    icon: "M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4",
  },
  {
    id: "promissory",
    label: "Promissory Note / Written Instrument",
    years: 3,
    description: "Article 17, Limitation Act, 1963",
    icon: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z",
  },
  {
    id: "rent",
    label: "Arrears of Rent",
    years: 3,
    description: "Suit for recovery of rent arrears",
    icon: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6",
  },
  {
    id: "tort",
    label: "Tort / Negligence",
    years: 2,
    description: "General tortious liability",
    icon: "M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z",
  },
];

export function CalculatorLimitsModal({
  onClose,
  onBack,
}: {
  onClose: () => void;
  onBack: () => void;
}) {
  const [selectedType, setSelectedType] = useState("");
  const [incidentDate, setIncidentDate] = useState("");

  const caseType = CASE_TYPES.find((c) => c.id === selectedType);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let deadline: Date | null = null;
  let daysRemaining: number | null = null;
  let status: "safe" | "approaching" | "overdue" | null = null;

  if (caseType && incidentDate) {
    const incident = new Date(incidentDate);
    incident.setHours(0, 0, 0, 0);

    if (caseType.days) {
      deadline = addDays(incident, caseType.days);
    } else if (caseType.years) {
      deadline = addYears(incident, caseType.years);
    }

    if (deadline) {
      daysRemaining = daysBetween(today, deadline);
      if (daysRemaining < 0) status = "overdue";
      else if (daysRemaining <= 30) status = "approaching";
      else status = "safe";
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="animate-overlay-in mx-4 flex w-full max-w-2xl flex-col rounded-2xl border border-white/10 bg-[#0a0a0a] shadow-2xl max-h-[85vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 border-b border-white/[0.06] px-6 py-4">
          <button
            type="button"
            onClick={onBack}
            className="rounded-lg p-1.5 text-white/40 transition-colors hover:bg-white/5 hover:text-white"
            aria-label="Back to calculators"
          >
            <svg
              viewBox="0 0 24 24"
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
          </button>
          <h2 className="text-sm font-semibold text-white">
            Statute of Limitations
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="ml-auto rounded-lg p-1.5 text-white/40 transition-colors hover:bg-white/5 hover:text-white"
            aria-label="Close"
          >
            <svg
              viewBox="0 0 24 24"
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          <div className="space-y-3">
            <label className="block text-xs font-medium text-white/50">
              Case Type
            </label>
            <div className="grid gap-2 sm:grid-cols-2">
              {CASE_TYPES.map((ct) => (
                <button
                  key={ct.id}
                  type="button"
                  onClick={() => setSelectedType(ct.id)}
                  className={`rounded-xl border p-3 text-left transition-all duration-200 ${
                    selectedType === ct.id
                      ? "border-white/30 bg-white/[0.06]"
                      : "border-white/[0.08] bg-white/[0.02] hover:border-white/15 hover:bg-white/[0.04]"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-white/10 text-white/50">
                      <svg
                        viewBox="0 0 24 24"
                        className="h-4 w-4"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d={ct.icon} />
                      </svg>
                    </div>
                    <div>
                      <span className="block text-sm font-medium text-white">
                        {ct.label}
                      </span>
                      <span className="mt-0.5 block text-[11px] text-white/40">
                        {ct.days ? `${ct.days} days` : `${ct.years} years`} —{" "}
                        {ct.description}
                      </span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <label
              htmlFor="calc-incident-date"
              className="block text-xs font-medium text-white/50"
            >
              Date of Incident / Cause of Action
            </label>
            <input
              id="calc-incident-date"
              type="date"
              value={incidentDate}
              onChange={(e) => setIncidentDate(e.target.value)}
              max={today.toISOString().split("T")[0]}
              className="w-full max-w-xs rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-sm text-white placeholder:text-white/35 focus:border-white/30 focus:outline-none"
            />
          </div>

          {deadline && daysRemaining !== null && status && (
            <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-5">
              <div className="flex items-start gap-4">
                <div
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
                    status === "safe"
                      ? "bg-emerald-500/10 text-emerald-400"
                      : status === "approaching"
                        ? "bg-amber-500/10 text-amber-400"
                        : "bg-red-500/10 text-red-400"
                  }`}
                >
                  {status === "safe" ? (
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      className="h-5 w-5"
                    >
                      <path
                        d="M20 6L9 17l-5-5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  ) : status === "approaching" ? (
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      className="h-5 w-5"
                    >
                      <path
                        d="M12 9v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  ) : (
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      className="h-5 w-5"
                    >
                      <path
                        d="M18 6L6 18M6 6l12 12"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  )}
                </div>
                <div>
                  <p className="text-xs text-white/40">Filing Deadline</p>
                  <p className="mt-1 text-xl font-semibold text-white">
                    {formatDate(deadline)}
                  </p>
                  <p
                    className={`mt-1 text-sm font-medium ${status === "safe" ? "text-emerald-400" : status === "approaching" ? "text-amber-400" : "text-red-400"}`}
                  >
                    {status === "overdue"
                      ? `Overdue by ${Math.abs(daysRemaining)} days`
                      : status === "approaching"
                        ? `${daysRemaining} days remaining — act now`
                        : `${daysRemaining} days remaining`}
                  </p>
                </div>
              </div>
              <div className="mt-4 grid gap-3 text-xs sm:grid-cols-3">
                <div className="rounded-lg border border-white/[0.06] bg-white/[0.03] p-2.5">
                  <p className="text-white/40">Case Type</p>
                  <p className="mt-0.5 font-medium text-white">
                    {caseType?.label}
                  </p>
                </div>
                <div className="rounded-lg border border-white/[0.06] bg-white/[0.03] p-2.5">
                  <p className="text-white/40">Limitation Period</p>
                  <p className="mt-0.5 font-medium text-white">
                    {caseType?.days
                      ? `${caseType.days} days`
                      : `${caseType?.years} years`}
                  </p>
                </div>
                <div className="rounded-lg border border-white/[0.06] bg-white/[0.03] p-2.5">
                  <p className="text-white/40">Incident Date</p>
                  <p className="mt-0.5 font-medium text-white">
                    {formatDate(new Date(incidentDate))}
                  </p>
                </div>
              </div>
            </div>
          )}

          <p className="text-[11px] leading-relaxed text-white/30">
            Disclaimer: Limitation periods under the Limitation Act, 1963 may
            vary based on specific facts, court interpretations, and legislative
            amendments. Always consult a qualified legal professional.
          </p>
        </div>
      </div>
    </div>
  );
}

/* ─── Interest Calculator Modal ─── */

export function CalculatorInterestModal({
  onClose,
  onBack,
}: {
  onClose: () => void;
  onBack: () => void;
}) {
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

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="animate-overlay-in mx-4 flex w-full max-w-2xl flex-col rounded-2xl border border-white/10 bg-[#0a0a0a] shadow-2xl max-h-[85vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 border-b border-white/[0.06] px-6 py-4">
          <button
            type="button"
            onClick={onBack}
            className="rounded-lg p-1.5 text-white/40 transition-colors hover:bg-white/5 hover:text-white"
            aria-label="Back to calculators"
          >
            <svg
              viewBox="0 0 24 24"
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
          </button>
          <h2 className="text-sm font-semibold text-white">
            Interest Calculator
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="ml-auto rounded-lg p-1.5 text-white/40 transition-colors hover:bg-white/5 hover:text-white"
            aria-label="Close"
          >
            <svg
              viewBox="0 0 24 24"
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label
                htmlFor="calc-principal"
                className="block text-xs font-medium text-white/50"
              >
                Principal Amount (₹)
              </label>
              <input
                id="calc-principal"
                type="number"
                min="0"
                placeholder="e.g. 500000"
                value={principal}
                onChange={(e) => setPrincipal(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-sm text-white placeholder:text-white/35 focus:border-white/30 focus:outline-none [appearance-none] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
              />
            </div>
            <div className="space-y-2">
              <label
                htmlFor="calc-rate"
                className="block text-xs font-medium text-white/50"
              >
                Annual Interest Rate (%)
              </label>
              <input
                id="calc-rate"
                type="number"
                min="0"
                step="0.1"
                placeholder="e.g. 12"
                value={rate}
                onChange={(e) => setRate(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-sm text-white placeholder:text-white/35 focus:border-white/30 focus:outline-none [appearance-none] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
              />
            </div>
            <div className="space-y-2">
              <label
                htmlFor="calc-time"
                className="block text-xs font-medium text-white/50"
              >
                Time Period (Months)
              </label>
              <input
                id="calc-time"
                type="number"
                min="0"
                placeholder="e.g. 36"
                value={timeMonths}
                onChange={(e) => setTimeMonths(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-sm text-white placeholder:text-white/35 focus:border-white/30 focus:outline-none [appearance-none] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
              />
            </div>
            <div className="space-y-2">
              <label
                htmlFor="calc-start-date"
                className="block text-xs font-medium text-white/50"
              >
                Start Date
              </label>
              <input
                id="calc-start-date"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-sm text-white placeholder:text-white/35 focus:border-white/30 focus:outline-none"
              />
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setCompound(false)}
                className={`rounded-full px-4 py-1.5 text-sm font-medium transition-all duration-200 ${
                  !compound
                    ? "bg-white text-black"
                    : "border border-white/10 bg-white/[0.02] text-white/60 hover:text-white"
                }`}
              >
                Simple
              </button>
              <button
                type="button"
                onClick={() => setCompound(true)}
                className={`rounded-full px-4 py-1.5 text-sm font-medium transition-all duration-200 ${
                  compound
                    ? "bg-white text-black"
                    : "border border-white/10 bg-white/[0.02] text-white/60 hover:text-white"
                }`}
              >
                Compound
              </button>
            </div>
            {compound && (
              <div className="flex flex-wrap gap-1.5">
                {(
                  ["yearly", "half-yearly", "quarterly", "monthly"] as const
                ).map((f) => (
                  <button
                    key={f}
                    type="button"
                    onClick={() => setFrequency(f)}
                    className={`rounded-full px-3 py-1 text-xs font-medium transition-all duration-200 ${
                      frequency === f
                        ? "bg-white text-black"
                        : "border border-white/10 bg-white/[0.02] text-white/60 hover:text-white"
                    }`}
                  >
                    {f.charAt(0).toUpperCase() + f.slice(1)}
                  </button>
                ))}
              </div>
            )}
          </div>

          {P > 0 && R > 0 && T > 0 && (
            <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-5">
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
                      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                      <line x1="16" y1="2" x2="16" y2="6" />
                      <line x1="8" y1="2" x2="8" y2="6" />
                      <line x1="3" y1="10" x2="21" y2="10" />
                    </svg>
                  </div>
                )}
                <div className="flex-1">
                  <p className="text-[11px] font-medium uppercase tracking-wider text-white/40">
                    Payment Due Date
                  </p>
                  {dueDate ? (
                    <>
                      <p className="mt-1 text-xl font-semibold text-white">
                        {formatDate(dueDate)}
                      </p>
                      {daysUntilDue !== null && (
                        <p
                          className={`mt-0.5 text-sm font-medium ${daysUntilDue < 0 ? "text-red-400" : daysUntilDue <= 30 ? "text-amber-400" : "text-emerald-400"}`}
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
                    <p className="mt-1 text-xs text-white/40">
                      Enter a start date and time period
                    </p>
                  )}
                </div>
              </div>

              <div className="mt-4 border-t border-white/[0.06] pt-4">
                <p className="text-[11px] font-medium uppercase tracking-wider text-white/40">
                  {compound ? "Compound Interest" : "Simple Interest"}
                </p>
                <p className="mt-1 text-2xl font-semibold text-white">
                  ₹
                  {formatCurrency(compound ? compoundInterest : simpleInterest)}
                </p>
                <p className="mt-0.5 text-sm text-white/50">
                  Total payable: ₹
                  {formatCurrency(compound ? totalCompound : totalSimple)}
                </p>
                <div className="mt-3 space-y-1.5 text-sm">
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
                  <div className="border-t border-white/[0.06] pt-1.5 flex justify-between text-white/70">
                    <span className="font-medium">Total Payable</span>
                    <span className="font-semibold text-white">
                      ₹{formatCurrency(compound ? totalCompound : totalSimple)}
                    </span>
                  </div>
                </div>
              </div>

              {compound && (
                <div className="mt-3 rounded-lg border border-white/[0.06] bg-white/[0.03] p-2.5 text-xs text-white/40">
                  Compounding: {frequency} | Rate: {R}% p.a.
                </div>
              )}
            </div>
          )}

          <p className="text-[11px] leading-relaxed text-white/30">
            Disclaimer: This calculator provides informational estimates only.
            Actual interest rates may be governed by specific contracts,
            statutes, or court orders. Always verify with a qualified legal
            professional.
          </p>
        </div>
      </div>
    </div>
  );
}
