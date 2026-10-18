"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function SignInError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Sign-in error:", error);
  }, [error]);

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center px-6">
      <div className="text-center">
        <h1 className="text-2xl font-semibold mb-3">Sign-in failed</h1>
        <p className="text-white/50 text-sm mb-6 max-w-md">
          An error occurred during sign-in. Please try again.
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
