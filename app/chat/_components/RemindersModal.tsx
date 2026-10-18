"use client";

import { useState, useEffect } from "react";

interface Reminder {
  id: string;
  title: string;
  deadlineAt: string;
  type: string;
  completed: boolean;
  createdAt: string;
}

const REMINDER_TYPES = [
  { value: "hearing", label: "Court Hearing" },
  { value: "filing", label: "Filing Deadline" },
  { value: "limitation", label: "Limitation Period" },
  { value: "other", label: "Other" },
];

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function daysUntil(dateStr: string): number {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const target = new Date(dateStr);
  target.setHours(0, 0, 0, 0);
  return Math.round((target.getTime() - now.getTime()) / (24 * 60 * 60 * 1000));
}

function getStatusColor(days: number): string {
  if (days < 0) return "text-red-400";
  if (days <= 7) return "text-amber-400";
  return "text-emerald-400";
}

function getStatusBg(days: number): string {
  if (days < 0) return "bg-red-500/[0.06] border-red-500/20";
  if (days <= 7) return "bg-amber-500/[0.06] border-amber-500/20";
  return "bg-emerald-500/[0.06] border-emerald-500/20";
}

function statusLabel(days: number): string {
  if (days < 0) return `Overdue by ${Math.abs(days)} days`;
  if (days === 0) return "Due today";
  return `${days} days left`;
}

export function RemindersModal({ onClose }: { onClose: () => void }) {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [deadlineAt, setDeadlineAt] = useState("");
  const [type, setType] = useState("other");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/reminders");
        if (res.ok && !cancelled) {
          const data = await res.json();
          setReminders(data);
        }
      } catch {
        /* ignore */
      }
      if (!cancelled) setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  async function addReminder(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !deadlineAt) return;
    try {
      const res = await fetch("/api/reminders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: title.trim(), deadlineAt, type }),
      });
      if (res.ok) {
        const newReminder = await res.json();
        setReminders((prev) =>
          [...prev, newReminder].sort(
            (a, b) =>
              new Date(a.deadlineAt).getTime() -
              new Date(b.deadlineAt).getTime(),
          ),
        );
        setTitle("");
        setDeadlineAt("");
        setType("other");
        setShowForm(false);
      }
    } catch {
      /* ignore */
    }
  }

  async function toggleComplete(id: string, completed: boolean) {
    try {
      await fetch("/api/reminders", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, completed: !completed }),
      });
      setReminders((prev) =>
        prev.map((r) => (r.id === id ? { ...r, completed: !completed } : r)),
      );
    } catch {
      /* ignore */
    }
  }

  async function deleteReminder(id: string) {
    try {
      await fetch(`/api/reminders?id=${id}`, { method: "DELETE" });
      setReminders((prev) => prev.filter((r) => r.id !== id));
    } catch {
      /* ignore */
    }
  }

  const active = reminders.filter((r) => !r.completed);
  const completed = reminders.filter((r) => r.completed);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="animate-overlay-in mx-4 flex w-full max-w-2xl flex-col rounded-2xl border border-white/10 bg-[#0a0a0a] shadow-2xl max-h-[85vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-white/[0.06] px-6 py-4">
          <h2 className="text-sm font-semibold text-white">
            Deadline Reminders
          </h2>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowForm(!showForm)}
              className="rounded-full bg-white px-3 py-1.5 text-xs font-medium text-black transition-transform hover:scale-[1.03]"
            >
              {showForm ? "Cancel" : "+ New"}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-1.5 text-white/40 transition-colors hover:bg-white/5 hover:text-white"
              aria-label="Close reminders"
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
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5">
          <p className="mb-5 text-xs text-white/40">
            Track court dates, filing deadlines, and limitation periods.
            You&apos;ll be notified 7, 3, and 1 day before each deadline.
          </p>

          {showForm && (
            <form
              onSubmit={addReminder}
              className="mb-6 rounded-xl border border-white/10 bg-white/[0.03] p-5 space-y-4"
            >
              <div>
                <label
                  htmlFor="modal-reminder-title"
                  className="block text-xs font-medium text-white/50 mb-1.5"
                >
                  Case / Reminder Title
                </label>
                <input
                  id="modal-reminder-title"
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. State v. Sharma — Hearing"
                  required
                  className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-sm text-white placeholder:text-white/35 focus:border-white/30 focus:outline-none"
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="modal-reminder-date"
                    className="block text-xs font-medium text-white/50 mb-1.5"
                  >
                    Deadline Date
                  </label>
                  <input
                    id="modal-reminder-date"
                    type="date"
                    value={deadlineAt}
                    onChange={(e) => setDeadlineAt(e.target.value)}
                    required
                    className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-sm text-white focus:border-white/30 focus:outline-none"
                    style={{ colorScheme: "dark" }}
                  />
                </div>
                <div>
                  <label
                    htmlFor="modal-reminder-type"
                    className="block text-xs font-medium text-white/50 mb-1.5"
                  >
                    Type
                  </label>
                  <select
                    id="modal-reminder-type"
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-sm text-white focus:border-white/30 focus:outline-none"
                    style={{ colorScheme: "dark" }}
                  >
                    {REMINDER_TYPES.map((t) => (
                      <option
                        key={t.value}
                        value={t.value}
                        style={{ backgroundColor: "#111", color: "#fff" }}
                      >
                        {t.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <button
                type="submit"
                className="rounded-full bg-white px-5 py-2 text-sm font-medium text-black transition-transform hover:scale-[1.03]"
              >
                Add Reminder
              </button>
            </form>
          )}

          {loading ? (
            <div className="py-16 text-center text-sm text-white/40">
              Loading reminders...
            </div>
          ) : reminders.length === 0 ? (
            <div className="py-16 text-center">
              <p className="text-sm text-white/40">No reminders yet.</p>
              <p className="mt-2 text-xs text-white/25">
                Add a reminder to track court dates and filing deadlines.
              </p>
            </div>
          ) : (
            <>
              {active.length > 0 && (
                <section>
                  <h3 className="mb-3 text-[11px] font-medium uppercase tracking-wider text-white/40">
                    Upcoming ({active.length})
                  </h3>
                  <div className="space-y-2">
                    {active.map((r) => {
                      const days = daysUntil(r.deadlineAt);
                      return (
                        <div
                          key={r.id}
                          className={`flex items-center gap-3 rounded-xl border p-3 transition-colors ${getStatusBg(days)}`}
                        >
                          <button
                            type="button"
                            onClick={() => toggleComplete(r.id, r.completed)}
                            className="h-4 w-4 shrink-0 rounded-full border border-white/20 transition-colors hover:border-white/40"
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-white truncate">
                              {r.title}
                            </p>
                            <div className="mt-0.5 flex items-center gap-2 text-[11px]">
                              <span className="text-white/50">
                                {formatDate(r.deadlineAt)}
                              </span>
                              <span
                                className={`font-medium ${getStatusColor(days)}`}
                              >
                                {statusLabel(days)}
                              </span>
                              <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] text-white/50">
                                {REMINDER_TYPES.find((t) => t.value === r.type)
                                  ?.label || r.type}
                              </span>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => deleteReminder(r.id)}
                            className="shrink-0 rounded-md p-1 text-white/30 transition-colors hover:text-red-400"
                          >
                            <svg
                              viewBox="0 0 24 24"
                              className="h-3.5 w-3.5"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <polyline points="3 6 5 6 21 6" />
                              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                            </svg>
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </section>
              )}

              {completed.length > 0 && (
                <section className="mt-6">
                  <h3 className="mb-3 text-[11px] font-medium uppercase tracking-wider text-white/40">
                    Completed ({completed.length})
                  </h3>
                  <div className="space-y-1.5">
                    {completed.map((r) => (
                      <div
                        key={r.id}
                        className="flex items-center gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] p-3 opacity-50"
                      >
                        <button
                          type="button"
                          onClick={() => toggleComplete(r.id, r.completed)}
                          className="h-4 w-4 shrink-0 rounded-full border border-emerald-400/40 bg-emerald-400/20 flex items-center justify-center"
                        >
                          <svg
                            viewBox="0 0 24 24"
                            className="h-2.5 w-2.5 text-emerald-400"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="3"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        </button>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-white/50 line-through truncate">
                            {r.title}
                          </p>
                          <p className="mt-0.5 text-[11px] text-white/30">
                            {formatDate(r.deadlineAt)}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => deleteReminder(r.id)}
                          className="shrink-0 rounded-md p-1 text-white/20 transition-colors hover:text-red-400"
                        >
                          <svg
                            viewBox="0 0 24 24"
                            className="h-3.5 w-3.5"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <polyline points="3 6 5 6 21 6" />
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                </section>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
