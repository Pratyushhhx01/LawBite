"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Global error:", error);
  }, [error]);

  return (
    <html lang="en">
      <body className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center px-6">
          <h1 className="text-2xl font-semibold mb-3">Something went wrong</h1>
          <p className="text-white/50 text-sm mb-6 max-w-md">
            An unexpected error occurred. Please try again or contact support if
            the issue persists.
          </p>
          <button
            onClick={reset}
            className="rounded-full bg-white text-black px-6 py-2.5 text-sm font-medium transition-colors hover:bg-white/90"
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
