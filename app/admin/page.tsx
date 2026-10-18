"use client";

import { useEffect, useState } from "react";

type Stats = {
  totalUsers: number;
  totalConversations: number;
  totalFeedback: number;
  positiveFeedback: number;
  negativeFeedback: number;
};

type FeedbackByRating = { rating: string; count: number };
type Conversation = {
  id: string;
  title: string;
  type: string;
  createdAt: string;
};
type Feedback = {
  id: string;
  messageId: string;
  rating: string;
  comment: string | null;
  createdAt: string;
};

export default function AdminPage() {
  const [data, setData] = useState<{
    stats: Stats;
    feedbackByRating: FeedbackByRating[];
    recentConversations: Conversation[];
    recentFeedback: Feedback[];
  } | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/admin")
      .then((r) => {
        if (r.status === 403) {
          setError("You don't have admin access.");
          return null;
        }
        if (!r.ok) throw new Error("Failed to load");
        return r.json();
      })
      .then((d) => {
        if (d) setData(d);
      })
      .catch(() => setError("Failed to load admin data."));
  }, []);

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0a0a0f] p-6">
        <div className="text-center">
          <h1 className="text-xl font-semibold text-white">Access Denied</h1>
          <p className="mt-2 text-sm text-white/50">{error}</p>
          <a
            href="/chat"
            className="mt-4 inline-block text-sm text-blue-400 hover:underline"
          >
            Go to Chat
          </a>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0a0a0f]">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/20 border-t-white" />
      </div>
    );
  }

  const sentimentRate =
    data.stats.totalFeedback > 0
      ? Math.round(
          (data.stats.positiveFeedback / data.stats.totalFeedback) * 100,
        )
      : 0;

  return (
    <div className="min-h-screen bg-[#0a0a0f] p-6">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">LawBite Admin</h1>
            <p className="mt-1 text-sm text-white/40">
              Usage analytics and feedback overview
            </p>
          </div>
          <a
            href="/chat"
            className="rounded-lg bg-white/10 px-4 py-2 text-sm text-white hover:bg-white/20"
          >
            Back to Chat
          </a>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Total Users" value={data.stats.totalUsers} />
          <StatCard
            label="Total Conversations"
            value={data.stats.totalConversations}
          />
          <StatCard label="Total Feedback" value={data.stats.totalFeedback} />
          <StatCard label="Positive Rate" value={`${sentimentRate}%`} />
        </div>

        <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
            <h2 className="mb-4 text-lg font-semibold text-white">
              Feedback Breakdown
            </h2>
            <div className="space-y-3">
              {data.feedbackByRating.map((f) => (
                <div key={f.rating} className="flex items-center gap-3">
                  <span
                    className={`w-8 text-sm ${f.rating === "up" ? "text-green-400" : "text-red-400"}`}
                  >
                    {f.rating === "up" ? "👍" : "👎"}
                  </span>
                  <div className="flex-1">
                    <div className="h-2 overflow-hidden rounded-full bg-white/10">
                      <div
                        className={`h-full rounded-full ${f.rating === "up" ? "bg-green-500" : "bg-red-500"}`}
                        style={{
                          width: `${data.stats.totalFeedback > 0 ? (Number(f.count) / data.stats.totalFeedback) * 100 : 0}%`,
                        }}
                      />
                    </div>
                  </div>
                  <span className="text-sm text-white/60">{f.count}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
            <h2 className="mb-4 text-lg font-semibold text-white">
              Recent Feedback
            </h2>
            <div className="space-y-3 max-h-80 overflow-y-auto">
              {data.recentFeedback.length === 0 && (
                <p className="text-sm text-white/40">No feedback yet.</p>
              )}
              {data.recentFeedback.map((f) => (
                <div key={f.id} className="border-b border-white/5 pb-3">
                  <div className="flex items-center gap-2">
                    <span
                      className={
                        f.rating === "up" ? "text-green-400" : "text-red-400"
                      }
                    >
                      {f.rating === "up" ? "👍" : "👎"}
                    </span>
                    <span className="text-xs text-white/30">
                      {new Date(f.createdAt).toLocaleDateString("en-IN")}
                    </span>
                  </div>
                  {f.comment && (
                    <p className="mt-1 text-sm text-white/60">{f.comment}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-8 rounded-2xl border border-white/10 bg-white/5 p-6">
          <h2 className="mb-4 text-lg font-semibold text-white">
            Recent Conversations
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-white/10 text-white/40">
                  <th className="pb-3 pr-4">Title</th>
                  <th className="pb-3 pr-4">Type</th>
                  <th className="pb-3">Date</th>
                </tr>
              </thead>
              <tbody>
                {data.recentConversations.map((c) => (
                  <tr key={c.id} className="border-b border-white/5">
                    <td className="py-3 pr-4 text-white/80 max-w-[300px] truncate">
                      {c.title || "Untitled"}
                    </td>
                    <td className="py-3 pr-4">
                      <span className="rounded-full bg-white/10 px-2 py-0.5 text-xs text-white/60">
                        {c.type}
                      </span>
                    </td>
                    <td className="py-3 text-white/40">
                      {new Date(c.createdAt).toLocaleDateString("en-IN")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
      <div className="text-sm text-white/40">{label}</div>
      <div className="mt-2 text-3xl font-bold text-white">{value}</div>
    </div>
  );
}
