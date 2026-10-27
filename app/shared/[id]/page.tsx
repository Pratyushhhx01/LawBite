import type { Metadata } from "next";
import Link from "next/link";
import LogoIcon from "../../components/LogoIcon";
import { getSharedChat } from "@/lib/shares";
import { stripThinkingTokens } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Shared conversation — Lawbite",
  description: "A conversation shared from Lawbite.",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

function formatSharedDate(value: string): string | null {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function LinkExpired({ message }: { message: string }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0a0a0f] p-6 text-white">
      <div className="text-center">
        <Link
          href="/"
          aria-label="Lawbite home"
          className="mb-8 inline-flex items-center gap-2.5 text-sm font-semibold tracking-tight"
        >
          <LogoIcon className="h-6 w-6" />
          <span>Lawbite</span>
        </Link>
        <h1 className="text-xl font-semibold text-white">Link unavailable</h1>
        <p className="mt-2 text-sm text-white/50">{message}</p>
        <Link
          href="/chat"
          className="mt-5 inline-block rounded-full bg-white px-5 py-2 text-sm font-medium text-black transition-colors hover:bg-white/90"
        >
          Start a new chat
        </Link>
      </div>
    </div>
  );
}

export default async function SharedPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  let data;
  try {
    data = await getSharedChat(id);
  } catch (error) {
    console.error("Shared chat load error:", error);
    return <LinkExpired message="We couldn't load this shared chat." />;
  }

  if (!data) {
    return <LinkExpired message="This share link has expired or is invalid." />;
  }

  const sharedDate = formatSharedDate(data.sharedAt);
  const continueHref = `/chat?shareId=${encodeURIComponent(id)}`;
  const isMessageShare = data.scope === "message";

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      <div className="sticky top-0 z-10 border-b border-white/10 bg-[#0a0a0f]/80 backdrop-blur-sm">
        <div className="mx-auto flex max-w-4xl items-center justify-between gap-4 px-5 py-4 sm:px-6">
          <Link
            href="/"
            aria-label="Lawbite home"
            className="inline-flex items-center gap-2.5 text-sm font-semibold tracking-tight"
          >
            <LogoIcon className="h-6 w-6" />
            <span>Lawbite</span>
          </Link>
          <Link
            href={continueHref}
            className="rounded-full bg-white px-4 py-2 text-sm font-medium text-black transition-all hover:scale-[1.02] hover:bg-white/90 sm:px-5"
          >
            Continue this chat
          </Link>
        </div>
      </div>

      <div className="mx-auto max-w-4xl px-5 py-10 sm:px-6">
        <div className="mb-8">
          <div className="mb-3 inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-[11px] font-medium uppercase tracking-wider text-white/40">
            {isMessageShare
              ? "Read-only shared message"
              : "Read-only shared chat"}
          </div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            {data.title || "Shared conversation"}
          </h1>
          <p className="mt-2 text-sm text-white/40">
            {isMessageShare
              ? `A single message shared by ${data.sharedBy}`
              : `Shared by ${data.sharedBy}`}
            {sharedDate ? ` on ${sharedDate}` : ""}
          </p>
        </div>

        <div className="space-y-6">
          {data.messages.map((message, index) => (
            <div
              key={message.id ?? `${message.role}-${index}`}
              className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[85%] rounded-2xl px-5 py-4 ${
                  message.role === "user"
                    ? "bg-white text-black"
                    : "border border-white/10 bg-white/[0.03] text-white/90"
                }`}
              >
                <div
                  className={`mb-1.5 text-xs font-medium ${
                    message.role === "user" ? "text-black/40" : "text-white/30"
                  }`}
                >
                  {message.role === "user" ? "You" : "Lawbite AI"}
                </div>
                <div className="whitespace-pre-wrap break-words text-sm leading-relaxed">
                  {stripThinkingTokens(message.content)
                    .replaceAll("[ADVICE_COMPLETE]", "")
                    .trim()}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-12 rounded-2xl border border-white/10 bg-white/[0.02] p-8 text-center">
          <h2 className="text-lg font-semibold text-white">
            Want to continue this conversation?
          </h2>
          <p className="mt-2 text-sm text-white/50">
            {isMessageShare
              ? "Sign in to add this message to your history and continue the conversation from here."
              : "Sign in to add this chat to your history and pick up where it left off."}
          </p>
          <Link
            href={continueHref}
            className="mt-5 inline-block rounded-full bg-white px-6 py-2.5 text-sm font-medium text-black transition-all hover:scale-[1.02] hover:bg-white/90"
          >
            Continue to chat
          </Link>
        </div>

        <p className="mt-6 text-center text-xs text-white/25">
          {isMessageShare
            ? "This is a read-only snapshot of a single message. The rest of the original conversation is not included."
            : "This is a read-only snapshot. The original conversation is not changed when someone continues it."}
        </p>
      </div>
    </div>
  );
}
