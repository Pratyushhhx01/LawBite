"use client";

import { useState, useMemo, useRef } from "react";
import Link from "next/link";
import type { LegalAmendment, AmendmentCategory } from "@/lib/amendment-tracker";
import { AUTHORITATIVE_AMENDMENTS } from "@/lib/amendment-tracker";

const CATEGORY_COLORS: Record<AmendmentCategory, string> = {
  Criminal: "bg-red-500/10 text-red-400 border-red-500/20",
  Commercial: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  Procedural: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  "Consumer & Civil": "bg-purple-500/10 text-purple-400 border-purple-500/20",
  "Tech & Data": "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
};

interface AmendmentTrackerAppProps {
  onSwitchModule?: (mod: "cases" | "matters" | "amendments") => void;
  initialQuery?: string | null;
}

export default function AmendmentTrackerApp({
  onSwitchModule,
  initialQuery = null,
}: AmendmentTrackerAppProps = {}) {
  const [search, setSearch] = useState(initialQuery || "");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [expandedId, setExpandedId] = useState<string | null>("amend-bns-2023");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const sidebarCloseTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const cancelSidebarClose = () => {
    if (sidebarCloseTimer.current) {
      clearTimeout(sidebarCloseTimer.current);
      sidebarCloseTimer.current = null;
    }
  };

  const scheduleSidebarClose = (delay = 150) => {
    cancelSidebarClose();
    sidebarCloseTimer.current = setTimeout(() => {
      setSidebarOpen(false);
      sidebarCloseTimer.current = null;
    }, delay);
  };

  const categories: string[] = [
    "all",
    "Criminal",
    "Commercial",
    "Procedural",
    "Consumer & Civil",
    "Tech & Data",
  ];

  const filteredAmendments = useMemo(() => {
    return AUTHORITATIVE_AMENDMENTS.filter((item) => {
      if (selectedCategory !== "all" && item.category !== selectedCategory) {
        return false;
      }
      if (!search.trim()) return true;
      const q = search.toLowerCase().trim();
      return (
        item.actName.toLowerCase().includes(q) ||
        item.amendmentActName.toLowerCase().includes(q) ||
        item.gazetteNumber.toLowerCase().includes(q) ||
        item.originalProvisionSummary.toLowerCase().includes(q) ||
        item.amendedProvisionSummary.toLowerCase().includes(q) ||
        item.practicalSignificance.toLowerCase().includes(q) ||
        item.affectedSections.some((s) => s.toLowerCase().includes(q))
      );
    });
  }, [search, selectedCategory]);

  const copyCitation = (item: LegalAmendment) => {
    const text = `${item.amendmentActName} (${item.gazetteNumber}), enacted ${item.enactmentDate}, effective ${item.effectiveDate}. India Code: ${item.authoritativeSourceUrl}`;
    navigator.clipboard.writeText(text);
    setCopiedId(item.id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  return (
    <div className="relative flex h-screen w-full overflow-hidden bg-black text-white selection:bg-amber-400/30 selection:text-white">
      {/* Mobile backdrop */}
      <div
        aria-hidden
        className={`fixed inset-0 z-30 bg-black/60 backdrop-blur-sm transition-opacity duration-300 md:hidden ${
          sidebarOpen ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        onClick={() => setSidebarOpen(false)}
      />

      {/* Sidebar: Amendments Search & Filtering */}
      <aside
        onMouseEnter={() => {
          cancelSidebarClose();
          setSidebarOpen(true);
        }}
        onMouseLeave={() => scheduleSidebarClose(150)}
        className={`fixed inset-y-0 left-0 z-40 flex flex-col border-r border-white/10 bg-black/95 backdrop-blur-xl shadow-2xl transition-[width,transform] duration-300 ease-in-out md:translate-x-0 ${
          sidebarOpen
            ? "w-80 translate-x-0 shadow-[0_0_30px_rgba(0,0,0,0.8)]"
            : "w-80 -translate-x-full md:w-16 md:translate-x-0"
        }`}
      >
        <div className="border-b border-white/10 p-3 sm:p-4">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2.5 overflow-hidden">
              <Link
                href="/chat?modal=cases"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/5 text-white/50 hover:bg-white/10 hover:text-white transition-colors"
                title="Back to AI Lawyer menu"
              >
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 12H5M12 19l-7-7 7-7" />
                </svg>
              </Link>
              <h1
                className={`text-sm font-bold tracking-tight text-white whitespace-nowrap transition-opacity duration-200 ${
                  sidebarOpen ? "opacity-100" : "opacity-0 md:hidden"
                }`}
              >
                Amendments
              </h1>
            </div>
            <button
              type="button"
              onClick={() => setSidebarOpen(false)}
              className="rounded-full p-1.5 text-white/60 hover:bg-white/5 hover:text-white md:hidden"
              aria-label="Close sidebar"
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Module Switcher Tabs */}
          {sidebarOpen ? (
            <div className="mb-3 grid grid-cols-3 gap-1 rounded-xl border border-white/10 bg-white/[0.03] p-1 text-center text-xs">
              <Link
                href="/cases?tab=cases"
                onClick={onSwitchModule ? (e) => { e.preventDefault(); setSidebarOpen(false); onSwitchModule("cases"); } : undefined}
                className="rounded-lg py-1 font-medium text-white/60 transition-colors hover:bg-white/5 hover:text-white"
              >
                Cases
              </Link>
              <Link
                href="/cases?tab=matters"
                onClick={onSwitchModule ? (e) => { e.preventDefault(); setSidebarOpen(false); onSwitchModule("matters"); } : undefined}
                className="rounded-lg py-1 font-medium text-white/60 transition-colors hover:bg-white/5 hover:text-white"
              >
                Matters
              </Link>
              <span className="rounded-lg bg-white/10 py-1 font-semibold text-white">
                Amendments
              </span>
            </div>
          ) : (
            <div className="mb-3 hidden md:flex flex-col items-center gap-1.5">
              <Link
                href="/cases?tab=cases"
                onClick={onSwitchModule ? (e) => { e.preventDefault(); onSwitchModule("cases"); } : undefined}
                title="Switch to Cases"
                className="flex h-9 w-9 items-center justify-center rounded-xl text-white/40 hover:bg-white/5 hover:text-white transition-colors"
              >
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
                </svg>
              </Link>
              <Link
                href="/cases?tab=matters"
                onClick={onSwitchModule ? (e) => { e.preventDefault(); onSwitchModule("matters"); } : undefined}
                title="Switch to Matters"
                className="flex h-9 w-9 items-center justify-center rounded-xl text-white/40 hover:bg-white/5 hover:text-white transition-colors"
              >
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
                  <rect x="8" y="2" width="8" height="4" rx="1" />
                </svg>
              </Link>
              <span title="Amendments (Active)" className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/15 text-white">
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                </svg>
              </span>
            </div>
          )}

          {/* Search & Filters */}
          {sidebarOpen && (
            <>
              <div className="relative mt-2">
                <svg
                  className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-white/40"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                >
                  <circle cx="11" cy="11" r="8" />
                  <path d="m21 21-4.35-4.35" />
                </svg>
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search statutes, sections..."
                  className="w-full rounded-lg border border-white/10 bg-white/5 pl-8 pr-3 py-1.5 text-xs text-white placeholder-white/40 outline-none focus:border-white/20"
                />
              </div>

              {/* Category Chips */}
              <div className="mt-3 flex flex-wrap gap-1">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setSelectedCategory(cat)}
                    className={`rounded-md px-2 py-0.5 text-[10px] capitalize transition-all ${
                      selectedCategory === cat
                        ? "bg-amber-400 text-black font-semibold shadow-sm"
                        : "border border-white/10 bg-white/5 text-white/60 hover:text-white hover:bg-white/10"
                    }`}
                  >
                    {cat === "all" ? "All" : cat}
                  </button>
                ))}
              </div>

              <div className="mt-2 text-[10px] text-white/40">
                Showing {filteredAmendments.length} verified statutes
              </div>
            </>
          )}
        </div>

        {/* List of Statutes in Sidebar for quick navigation */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden">
          {filteredAmendments.map((item) => {
            const isSelected = expandedId === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  setExpandedId(item.id);
                  setSidebarOpen(false);
                }}
                title={item.actName}
                className={`w-full transition-all hover:bg-white/[0.04] ${
                  sidebarOpen
                    ? "border-b border-white/5 px-4 py-3 text-left block"
                    : "flex h-12 w-16 items-center justify-center"
                } ${
                  isSelected
                    ? sidebarOpen
                      ? "bg-white/[0.08] border-l-2 border-l-amber-400"
                      : "bg-white/[0.08] text-amber-400"
                    : "border-l-2 border-l-transparent text-white/60"
                }`}
              >
                {sidebarOpen ? (
                  <>
                    <div className="flex items-center justify-between gap-1.5">
                      <span className="truncate text-xs font-semibold text-white">
                        {item.actName}
                      </span>
                      <span
                        className={`shrink-0 rounded px-1.5 py-0.2 text-[9px] font-semibold border ${
                          CATEGORY_COLORS[item.category]
                        }`}
                      >
                        {item.category}
                      </span>
                    </div>
                    <p className="mt-0.5 truncate text-[11px] text-white/50">
                      {item.amendmentActName}
                    </p>
                    <div className="mt-1 flex items-center gap-2 text-[10px] text-white/40">
                      <span>Eff: {item.effectiveDate}</span>
                      <span>•</span>
                      <span>{item.affectedSections.length} sections</span>
                    </div>
                  </>
                ) : (
                  <div
                    className={`flex h-9 w-9 items-center justify-center rounded-xl text-xs font-semibold uppercase transition-colors hover:bg-white/10 border ${
                      CATEGORY_COLORS[item.category]
                    }`}
                  >
                    {item.actName.split(" ")[0]?.slice(0, 3) || "ACT"}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </aside>

      {/* Main Workspace Pane: Amendment details & comparison */}
      <main className="flex flex-1 flex-col overflow-y-auto bg-black/95 md:pl-16 transition-[padding] duration-300">
        {/* Top App Navigation Bar */}
        <header className="flex h-12 shrink-0 items-center justify-between border-b border-white/10 bg-black/40 px-4 sm:px-6">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                cancelSidebarClose();
                setSidebarOpen(true);
              }}
              className="rounded-lg p-1.5 text-white/60 hover:bg-white/5 hover:text-white md:hidden"
              aria-label="Open amendments menu"
            >
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            </button>
            <nav className="flex items-center gap-2 text-xs text-white/50">
              <Link
                href="/chat"
                className="flex items-center gap-1.5 rounded-lg px-2 py-1 text-white/60 transition-colors hover:bg-white/5 hover:text-white"
              >
                <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                </svg>
                AI Chat
              </Link>
              <span>/</span>
              <span className="font-semibold text-white">
                Amendments
              </span>
            </nav>
          </div>
        </header>

        {/* Three-line horizontal button at top left just below the LawBite hero section (mobile view only) */}
        {!sidebarOpen && (
          <button
            type="button"
            onClick={() => {
              cancelSidebarClose();
              setSidebarOpen(true);
            }}
            className="fixed top-[56px] left-3 z-30 flex h-9 w-9 items-center justify-center rounded-xl border border-white/15 bg-black/85 backdrop-blur-md text-white/80 shadow-[0_4px_16px_rgba(0,0,0,0.5)] transition-all hover:bg-white/10 hover:text-white active:scale-95 md:hidden"
            aria-label="Open amendments menu"
            aria-expanded={sidebarOpen}
            aria-controls="amendments-sidebar"
            title="Open menu"
          >
            <svg
              viewBox="0 0 24 24"
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="4" y1="6" x2="20" y2="6" />
              <line x1="4" y1="12" x2="20" y2="12" />
              <line x1="4" y1="18" x2="20" y2="18" />
            </svg>
          </button>
        )}

        <div className="p-6 space-y-4">
          {filteredAmendments.length === 0 ? (
            <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-12 text-center">
              <p className="text-sm font-medium text-white/60">No statutory amendments matched your search</p>
              <p className="mt-1 text-xs text-white/40">Try searching for &quot;BNS&quot;, &quot;Section 10&quot;, &quot;Specific Relief&quot;, or &quot;Cheque&quot;</p>
              <button
                type="button"
                onClick={() => {
                  setSearch("");
                  setSelectedCategory("all");
                }}
                className="mt-4 rounded-lg bg-white/10 px-4 py-2 text-xs font-semibold text-white hover:bg-white/15"
              >
                Reset Filters
              </button>
            </div>
          ) : (
            filteredAmendments.map((item) => {
              const isExpanded = expandedId === item.id;
              const isCopied = copiedId === item.id;

              return (
                <article
                  key={item.id}
                  className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] transition-all hover:border-white/20"
                >
                  {/* Card Header */}
                  <div className="p-6">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span
                            className={`rounded-full border px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${
                              CATEGORY_COLORS[item.category]
                            }`}
                          >
                            {item.category}
                          </span>
                          <span className="text-xs text-white/40">•</span>
                          <span className="text-xs text-white/60">
                            Effective from:{" "}
                            <strong className="text-emerald-400 font-semibold">
                              {new Date(item.effectiveDate).toLocaleDateString("en-IN", {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                              })}
                            </strong>
                          </span>
                          <span className="text-xs text-white/40">•</span>
                          <span className="text-xs text-white/50">
                            Enacted: {item.enactmentDate}
                          </span>
                        </div>
                        <h3 className="mt-2 text-lg font-semibold text-white">
                          {item.actName}
                        </h3>
                        <p className="mt-0.5 text-xs text-white/50">
                          {item.amendmentActName}
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => copyCitation(item)}
                          className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-xs text-white/70 hover:bg-white/10 hover:text-white"
                          title="Copy official citation"
                        >
                          {isCopied ? (
                            <>
                              <svg className="h-3.5 w-3.5 text-emerald-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                              </svg>
                              <span className="text-emerald-400 font-medium">Copied!</span>
                            </>
                          ) : (
                            <>
                              <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                                <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
                              </svg>
                              <span>Cite</span>
                            </>
                          )}
                        </button>
                        <a
                          href={item.authoritativeSourceUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-xs text-amber-400/90 hover:bg-white/10 hover:text-amber-300"
                        >
                          <span>India Code</span>
                          <svg className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                          </svg>
                        </a>
                      </div>
                    </div>

                    {/* Gazette details */}
                    <div className="mt-3 flex items-center gap-2 rounded-lg bg-white/[0.02] border border-white/5 px-3 py-1.5 text-[11px] text-white/50">
                      <svg className="h-3.5 w-3.5 text-amber-400/70 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <span className="truncate">{item.gazetteNumber}</span>
                    </div>

                    {/* Sections impacted */}
                    <div className="mt-3 flex flex-wrap items-center gap-1.5">
                      <span className="text-[11px] text-white/40 mr-1">Impacted Sections:</span>
                      {item.affectedSections.map((sec) => (
                        <span
                          key={sec}
                          className="rounded-md bg-white/5 border border-white/10 px-2 py-0.5 text-[11px] font-mono text-white/80"
                        >
                          {sec}
                        </span>
                      ))}
                    </div>

                    {/* Practical significance highlight */}
                    <div className="mt-4 rounded-xl border border-amber-500/20 bg-amber-500/[0.04] p-3.5">
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-400">
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Litigation & Commercial Impact
                      </div>
                      <p className="mt-1 text-xs text-white/80 leading-relaxed">
                        {item.practicalSignificance}
                      </p>
                    </div>

                    {/* Toggle Historical Comparison */}
                    <button
                      type="button"
                      onClick={() => setExpandedId(isExpanded ? null : item.id)}
                      className="mt-4 inline-flex items-center gap-1.5 text-xs font-medium text-white/60 hover:text-white transition-colors"
                    >
                      <svg
                        className={`h-3.5 w-3.5 transition-transform ${isExpanded ? "rotate-180" : ""}`}
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                      </svg>
                      {isExpanded ? "Hide Provision Comparison" : "View Original vs Amended Provision Comparison"}
                    </button>
                  </div>

                  {/* Expanded Comparative View */}
                  {isExpanded && (
                    <div className="border-t border-white/10 bg-black/40 p-6">
                      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        {/* Original */}
                        <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
                          <div className="flex items-center justify-between pb-2 border-b border-white/5">
                            <span className="text-xs font-semibold uppercase tracking-wider text-white/50">
                              Prior / Original Provision
                            </span>
                            <span className="rounded bg-white/5 px-1.5 py-0.5 text-[10px] text-white/40">
                              Earlier Law
                            </span>
                          </div>
                          <p className="mt-3 text-xs text-white/70 leading-relaxed">
                            {item.originalProvisionSummary}
                          </p>
                        </div>

                        {/* Amended */}
                        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/[0.03] p-4">
                          <div className="flex items-center justify-between pb-2 border-b border-emerald-500/20">
                            <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400">
                              Amended / Current Provision
                            </span>
                            <span className="rounded bg-emerald-500/20 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-300">
                              In Force
                            </span>
                          </div>
                          <p className="mt-3 text-xs text-emerald-100/90 leading-relaxed">
                            {item.amendedProvisionSummary}
                          </p>
                        </div>
                      </div>

                      {/* Detailed historical provisions if present */}
                      {item.historicalVersions && item.historicalVersions.length > 0 && (
                        <div className="mt-4 pt-4 border-t border-white/5">
                          <h4 className="text-xs font-semibold text-white/60 mb-2">Statutory Text Excerpts:</h4>
                          <div className="space-y-2">
                            {item.historicalVersions.map((hv, idx) => (
                              <div key={idx} className="rounded-lg bg-black/60 border border-white/5 p-3 text-xs">
                                <div className="flex items-center justify-between text-[11px] text-white/40 mb-1">
                                  <span className="font-semibold text-white/70">{hv.versionTitle}</span>
                                  <span>{hv.era}</span>
                                </div>
                                <p className="font-mono text-[11px] text-white/70 leading-relaxed">
                                  {hv.provisionText}
                                </p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </article>
              );
            })
          )}
        </div>
      </main>
    </div>
  );
}
