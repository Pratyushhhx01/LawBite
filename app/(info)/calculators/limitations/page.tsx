"use client";

import { useState } from "react";
import { buildIcsEvent, downloadIcs } from "@/lib/ics";

const CASE_TYPES = [
  {
    id: "contract",
    label: "Breach of Contract",
    years: 3,
    description: "Indian Contract Act, 1872 — S. 73",
  },
  {
    id: "money",
    label: "Money Recovery",
    years: 3,
    description: "Suit for recovery of money",
  },
  {
    id: "property",
    label: "Property Dispossession",
    years: 12,
    description: "Suit for possession of immovable property",
  },
  {
    id: "cheque",
    label: "Cheque Bounce (S.138 NI Act)",
    days: 30,
    description: "Negotiable Instruments Act — 30 days from cause of action",
  },
  {
    id: "consumer",
    label: "Consumer Complaint",
    years: 2,
    description: "Consumer Protection Act, 2019",
  },
  {
    id: "motor",
    label: "Motor Accident Claim",
    years: 3,
    description: "Motor Vehicles Act, 1988 — S. 166",
  },
  {
    id: "termination",
    label: "Wrongful Termination",
    years: 1,
    description: "Industrial Disputes Act, 1947",
  },
  {
    id: "defamation",
    label: "Defamation",
    years: 1,
    description: "Indian Penal Code / BNS — S. 499/356",
  },
  {
    id: "government",
    label: "Suit Against Government",
    years: 3,
    description:
      "Article 113, Limitation Act — S. 80 CPC requires 2 months notice",
  },
  {
    id: "promissory",
    label: "Promissory Note / Written Instrument",
    years: 3,
    description: "Article 17, Limitation Act, 1963",
  },
  {
    id: "rent",
    label: "Arrears of Rent",
    years: 3,
    description: "Suit for recovery of rent arrears",
  },
  {
    id: "tort",
    label: "Tort / Negligence",
    years: 2,
    description: "General tortious liability",
  },
];

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

export default function LimitationsCalculator() {
  const [selectedType, setSelectedType] = useState("");
  const [incidentDate, setIncidentDate] = useState("");
  const [reminderSaved, setReminderSaved] = useState(false);

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

      if (daysRemaining < 0) {
        status = "overdue";
      } else if (daysRemaining <= 30) {
        status = "approaching";
      } else {
        status = "safe";
      }
    }
  }

  return (
    <section className="relative pt-32 pb-24 sm:pt-40 sm:pb-32">
      <div className="mx-auto max-w-6xl px-6">
        <article className="mx-auto max-w-3xl">
          <header className="border-b border-white/10 pb-10">
            <p className="text-xs font-medium uppercase tracking-[0.3em] text-white/40">
              / Calculators / Limitations
            </p>
            <h1 className="mt-4 text-4xl font-semibold leading-[1.05] tracking-tight sm:text-5xl">
              Statute of Limitations
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-relaxed text-white/65">
              Find the deadline to file your case under the Limitation Act,
              1963. Select your case type and enter the date of incident.
            </p>
          </header>

          <div className="mt-10 space-y-8">
            <div className="space-y-4">
              <label className="block text-sm font-medium text-white/70">
                Case Type
              </label>
              <div className="grid gap-3 sm:grid-cols-2">
                {CASE_TYPES.map((ct) => (
                  <button
                    key={ct.id}
                    type="button"
                    onClick={() => setSelectedType(ct.id)}
                    className={`rounded-xl border p-4 text-left transition-all duration-200 ${
                      selectedType === ct.id
                        ? "border-white/30 bg-white/[0.06]"
                        : "border-white/[0.08] bg-white/[0.02] hover:border-white/15 hover:bg-white/[0.04]"
                    }`}
                  >
                    <span className="block text-sm font-medium text-white">
                      {ct.label}
                    </span>
                    <span className="mt-1 block text-xs text-white/40">
                      {ct.days ? `${ct.days} days` : `${ct.years} years`} —{" "}
                      {ct.description}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <label
                htmlFor="incident-date"
                className="block text-sm font-medium text-white/70"
              >
                Date of Incident / Cause of Action
              </label>
              <input
                id="incident-date"
                type="date"
                value={incidentDate}
                onChange={(e) => setIncidentDate(e.target.value)}
                max={today.toISOString().split("T")[0]}
                className="w-full max-w-xs rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white placeholder:text-white/35 focus:border-white/30 focus:outline-none"
              />
            </div>

            {deadline && daysRemaining !== null && status && (
              <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-6">
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
                    <p className="text-sm font-medium text-white/50">
                      Filing Deadline
                    </p>
                    <p className="mt-1 text-2xl font-semibold text-white">
                      {formatDate(deadline)}
                    </p>
                    <p
                      className={`mt-2 text-sm font-medium ${
                        status === "safe"
                          ? "text-emerald-400"
                          : status === "approaching"
                            ? "text-amber-400"
                            : "text-red-400"
                      }`}
                    >
                      {status === "overdue"
                        ? `Overdue by ${Math.abs(daysRemaining)} days`
                        : status === "approaching"
                          ? `${daysRemaining} days remaining — act now`
                          : `${daysRemaining} days remaining`}
                    </p>
                  </div>
                </div>

                <div className="mt-6 grid gap-4 text-sm sm:grid-cols-3">
                  <div className="rounded-lg border border-white/[0.06] bg-white/[0.03] p-3">
                    <p className="text-xs text-white/40">Case Type</p>
                    <p className="mt-1 font-medium text-white">
                      {caseType?.label}
                    </p>
                  </div>
                  <div className="rounded-lg border border-white/[0.06] bg-white/[0.03] p-3">
                    <p className="text-xs text-white/40">Limitation Period</p>
                    <p className="mt-1 font-medium text-white">
                      {caseType?.days
                        ? `${caseType.days} days`
                        : `${caseType?.years} years`}
                    </p>
                  </div>
                  <div className="rounded-lg border border-white/[0.06] bg-white/[0.03] p-3">
                    <p className="text-xs text-white/40">Incident Date</p>
                    <p className="mt-1 font-medium text-white">
                      {formatDate(new Date(incidentDate))}
                    </p>
                  </div>
                </div>

                <div className="mt-6 flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={() =>
                      downloadIcs(
                        `lawbite-deadline-${deadline.toISOString().split("T")[0]}.ics`,
                        buildIcsEvent({
                          uid: `deadline-${deadline.getTime()}`,
                          summary: `Filing deadline — ${caseType?.label ?? "Case"}`,
                          description: `Limitation period: ${caseType?.days ? `${caseType.days} days` : `${caseType?.years} years`} from ${formatDate(new Date(incidentDate))}. Calculated with Lawbite.`,
                          start: deadline,
                        }),
                      )
                    }
                    className="rounded-lg bg-white px-4 py-2 text-sm font-medium text-black transition-colors hover:bg-white/90"
                  >
                    Add to calendar (.ics)
                  </button>
                  <button
                    type="button"
                    onClick={async () => {
                      try {
                        const res = await fetch("/api/reminders", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({
                            title: `Filing deadline — ${caseType?.label ?? "Case"}`,
                            deadlineAt: deadline.toISOString(),
                            type: "limitation",
                          }),
                        });
                        if (res.ok) setReminderSaved(true);
                      } catch {
                        /* ignore */
                      }
                    }}
                    className={`rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${
                      reminderSaved
                        ? "border-emerald-400/30 text-emerald-400"
                        : "border-white/10 text-white/70 hover:border-white/25 hover:text-white"
                    }`}
                  >
                    {reminderSaved ? "Saved to reminders" : "Save as reminder"}
                  </button>
                </div>
              </div>
            )}

            <p className="text-xs leading-relaxed text-white/35">
              Disclaimer: Limitation periods under the Limitation Act, 1963 may
              vary based on specific facts, court interpretations, and
              legislative amendments. Some states may have different limitation
              periods for certain categories of suits. Always consult a
              qualified legal professional for advice on your specific case.
            </p>
          </div>
        </article>
      </div>
    </section>
  );
}
