"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import LogoIcon from "../../components/LogoIcon";

type Message = { role: string; content: string };

export default function SharedPage() {
  const params = useParams();
  const shareId = params?.id as string;
  const [data, setData] = useState<{
    title: string;
    messages: Message[];
    sharedBy: string;
    sharedAt: string;
  } | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!shareId) return;
    fetch(`/api/share?id=${shareId}`)
      .then((r) => {
        if (!r.ok) throw new Error("not found");
        return r.json();
      })
      .then(setData)
      .catch(() => setError("This share link has expired or is invalid."));
  }, [shareId]);

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0a0a0f] p-6">
        <div className="text-center">
          <h1 className="text-xl font-semibold text-white">Link Expired</h1>
          <p className="mt-2 text-sm text-white/50">{error}</p>
          <Link
            href="/"
            className="mt-4 inline-block text-sm text-blue-400 hover:underline"
          >
            Go to LawBite
          </Link>
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

  return (
    <div className="min-h-screen bg-[#0a0a0f]">
      {/* Header */}
      <div className="border-b border-white/10 bg-[#0a0a0f]/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-4">
          <Link
            href="/"
            aria-label="Lawbite home"
            className="inline-flex items-center gap-2.5 text-sm font-semibold tracking-tight text-white"
          >
            <LogoIcon className="h-6 w-6" />
            <span>Lawbite</span>
          </Link>
          <Link
            href={`/signin?shareId=${shareId}`}
            className="rounded-full bg-white px-5 py-2 text-sm font-medium text-black transition-all hover:scale-[1.02] hover:bg-white/90"
          >
            Continue this chat
          </Link>
        </div>
      </div>

      {/* Content */}
      <div className="mx-auto max-w-4xl px-6 py-10">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white sm:text-3xl">
            {data.title || "Shared Conversation"}
          </h1>
          <p className="mt-2 text-sm text-white/40">
            Shared by {data.sharedBy} on{" "}
            {new Date(data.sharedAt).toLocaleDateString("en-IN", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </p>
        </div>

        <div className="space-y-6">
          {data.messages.map((m, i) => (
            <div
              key={i}
              className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[85%] rounded-2xl px-5 py-4 ${
                  m.role === "user"
                    ? "bg-white text-black"
                    : "border border-white/10 bg-white/[0.03] text-white/90"
                }`}
              >
                <div
                  className={`mb-1.5 text-xs font-medium ${m.role === "user" ? "text-black/40" : "text-white/30"}`}
                >
                  {m.role === "user" ? "You" : "Lawbite AI"}
                </div>
                <div className="whitespace-pre-wrap text-sm leading-relaxed">
                  {typeof m.content === "string"
                    ? m.content
                    : JSON.stringify(m.content)}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Continue CTA at bottom */}
        <div className="mt-12 rounded-2xl border border-white/10 bg-white/[0.02] p-8 text-center">
          <h2 className="text-lg font-semibold text-white">
            Want to continue this conversation?
          </h2>
          <p className="mt-2 text-sm text-white/50">
            Sign in to pick up where this chat left off.
          </p>
          <Link
            href={`/signin?shareId=${shareId}`}
            className="mt-5 inline-block rounded-full bg-white px-6 py-2.5 text-sm font-medium text-black transition-all hover:scale-[1.02] hover:bg-white/90"
          >
            Continue with Lawbite
          </Link>
        </div>
      </div>
    </div>
  );
}
