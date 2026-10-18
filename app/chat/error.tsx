"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function ChatError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Chat error:", error);
  }, [error]);

  return (
    <div className="flex h-screen w-full items-center justify-center bg-black">
      <div className="text-center px-6">
        <h1 className="text-2xl font-semibold mb-3">Chat unavailable</h1>
        <p className="text-white/50 text-sm mb-6 max-w-md">
          Something went wrong while loading the chat. Please try again.
        </p>
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={reset}
            className="rounded-full bg-white text-black px-6 py-2.5 text-sm font-medium transition-colors hover:bg-white/90"
          >
            Try again
          </button>
          <Link
            href="/"
            className="rounded-full border border-white/20 px-6 py-2.5 text-sm font-medium transition-colors hover:bg-white/10"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}
