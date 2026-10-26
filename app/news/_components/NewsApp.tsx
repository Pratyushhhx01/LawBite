"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";

interface NewsItem {
  title: string;
  url: string;
  snippet: string;
  date?: string;
}

const CATEGORIES = [
  { label: "All", query: "" },
  { label: "Supreme Court", query: "Supreme Court India judgment" },
  { label: "New Laws", query: "India new law act passed parliament" },
  { label: "High Courts", query: "High Court India judgment" },
  { label: "Criminal Law", query: "India criminal law BNS BNSS" },
  {
    label: "Constitutional",
    query: "India constitutional law fundamental rights",
  },
];

function newsHostname(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
}

function formatNewsDate(d?: string) {
  if (!d) return "Date unavailable";
  const date = new Date(d);
  if (Number.isNaN(date.getTime())) return d;

  const now = new Date();
  const startOfToday = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
  ).getTime();
  const startOfDate = new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
  ).getTime();
  const days = Math.round((startOfToday - startOfDate) / 86_400_000);

  if (days <= 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days <= 7) return `${days} days ago`;
  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function NewsApp() {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState(0);
  const cacheRef = useRef<Record<string, NewsItem[]>>({});

  useEffect(() => {
    let cancelled = false;
    const category = CATEGORIES[activeCategory];
    const cached = cacheRef.current[category.label];

    if (cached) {
      setNews(cached);
      setLoading(false);
      return () => {
        cancelled = true;
      };
    }

    setLoading(true);
    (async () => {
      try {
        const url = category.query
          ? `/api/news?query=${encodeURIComponent(category.query)}`
          : "/api/news";
        const res = await fetch(url);
        const data = await res.json();
        const items: NewsItem[] = data.news || [];
        cacheRef.current[category.label] = items;
        if (!cancelled) setNews(items);
      } catch {
        console.error("Failed to load news");
        if (!cancelled) setNews([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [activeCategory]);

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="mb-6 inline-flex items-center gap-1.5 text-sm text-white/50 transition-colors hover:text-white"
        >
          <svg
            className="h-4 w-4"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M10 19l-7-7m0 0l7-7m-7 7h18"
            />
          </svg>
          Back
        </Link>
        <div className="mb-10 text-center">
          <h1 className="text-3xl font-bold tracking-tight">Legal News</h1>
          <p className="mt-3 text-sm text-white/50">
            Stay updated with the latest Indian legal developments, judgments,
            and law changes.
          </p>
        </div>

        <div className="mb-8 flex flex-wrap gap-2">
          {CATEGORIES.map((cat, i) => (
            <button
              key={cat.label}
              onClick={() => setActiveCategory(i)}
              className={`rounded-full border px-4 py-1.5 text-xs font-medium transition-colors ${
                activeCategory === i
                  ? "border-white/30 bg-white/10 text-white"
                  : "border-white/10 text-white/40 hover:text-white/60"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className="animate-pulse rounded-xl border border-white/5 bg-white/[0.02] p-5"
              >
                <div className="mb-2 h-4 w-3/4 rounded bg-white/5" />
                <div className="h-3 w-full rounded bg-white/5" />
                <div className="mt-2 h-3 w-2/3 rounded bg-white/5" />
              </div>
            ))}
          </div>
        ) : news.length === 0 ? (
          <div className="rounded-xl border border-dashed border-white/10 p-12 text-center">
            <p className="text-sm text-white/40">
              No news found for this category.
            </p>
            <p className="mt-2 text-xs text-white/25">
              Check back later for updates.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {news.map((item, i) => (
              <a
                key={`${item.url}-${i}`}
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group block rounded-xl border border-white/10 bg-white/[0.03] p-5 transition-all hover:border-white/20 hover:bg-white/[0.06]"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <h3 className="text-sm font-semibold text-white/80 group-hover:text-white">
                      {item.title}
                    </h3>
                    <p className="mt-2 text-xs text-white/40 line-clamp-2">
                      {item.snippet}
                    </p>
                  </div>
                  <div className="shrink-0">
                    <span className="text-[11px] text-white/40">
                      {formatNewsDate(item.date)}
                    </span>
                  </div>
                </div>
                <div className="mt-3 flex items-center gap-1 text-[11px] text-white/20 group-hover:text-white/30">
                  <svg
                    className="h-3 w-3"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                    />
                  </svg>
                  {newsHostname(item.url)}
                </div>
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
