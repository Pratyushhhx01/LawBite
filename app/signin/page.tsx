"use client";

import Link from "next/link";
import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { signIn } from "@/lib/auth-client";
import LogoIcon from "../components/LogoIcon";

function GitHubIcon({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 24 24"
      className={className}
      fill="currentColor"
    >
      <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12Z" />
    </svg>
  );
}

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg aria-hidden viewBox="0 0 24 24" className={className}>
      <path
        fill="#4285F4"
        d="M23.49 12.27c0-.78-.07-1.53-.2-2.27H12v4.51h6.47c-.28 1.4-1.07 2.59-2.27 3.4v2.81h3.66c2.16-1.99 3.43-4.91 3.43-8.45Z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.24 0 5.95-1.08 7.93-2.92l-3.66-2.81c-1.01.69-2.32 1.1-4.27 1.1-3.27 0-6.05-2.21-7.04-5.18H1.18v3.25C3.13 21.43 7.27 24 12 24Z"
      />
      <path
        fill="#FBBC05"
        d="M4.96 14.19c-.25-.69-.39-1.43-.39-2.19s.14-1.5.38-2.19V6.56H1.18A11.99 11.99 0 0 0 0 12c0 1.94.46 3.77 1.28 5.44l3.68-3.25Z"
      />
      <path
        fill="#EA4335"
        d="M12 4.77c1.84 0 3.49.63 4.79 1.87l3.25-3.25C17.95 1.19 15.24 0 12 0 7.27 0 3.13 2.57 1.18 6.56l3.78 3.25C5.95 6.98 8.73 4.77 12 4.77Z"
      />
    </svg>
  );
}

function SignInForm() {
  const searchParams = useSearchParams();
  const shareId = searchParams.get("shareId");
  const next = searchParams.get("next");
  const [loading, setLoading] = useState<"google" | "github" | null>(null);
  const [error, setError] = useState("");

  const safeNext =
    next && next.startsWith("/") && !next.startsWith("//") ? next : null;
  const callbackURL =
    safeNext ?? (shareId ? `/chat?shareId=${shareId}` : "/chat");

  async function handleSocialLogin(provider: "google" | "github") {
    setLoading(provider);
    setError("");
    try {
      await signIn.social(
        {
          provider,
          callbackURL,
        },
        {
          onSuccess: () => {
            setLoading(null);
          },
          onError: (ctx) => {
            setError(ctx.error.message);
            setLoading(null);
          },
        },
      );
    } catch {
      setLoading(null);
      setError("Something went wrong. Please try again.");
    }
  }

  return (
    <div className="w-full max-w-sm">
      <div className="flex flex-col items-center text-center">
        <Link
          href="/"
          aria-label="Lawbite home"
          className="inline-flex items-center gap-2.5 text-sm font-semibold tracking-tight"
        >
          <LogoIcon className="h-7 w-7" />
          <span>Lawbite</span>
        </Link>
        <h1 className="mt-8 text-2xl font-semibold tracking-tight sm:text-3xl">
          Sign in to Lawbite
        </h1>
        <p className="mt-2 text-sm text-white/55">
          {shareId
            ? "Sign in to continue this conversation."
            : "Sign in with Google or GitHub to continue."}
        </p>
      </div>

      {error && (
        <div className="mt-6 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-center text-sm text-red-400">
          {error}
        </div>
      )}

      <div className="mt-10 flex flex-col gap-3">
        <button
          type="button"
          onClick={() => handleSocialLogin("google")}
          disabled={loading !== null}
          className="group flex w-full items-center justify-center gap-3 rounded-full border border-white/15 bg-white px-5 py-3 text-sm font-medium text-black transition-all duration-300 hover:scale-[1.01] hover:bg-white/95 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60 focus-visible:ring-offset-2 focus-visible:ring-offset-black disabled:opacity-60"
        >
          <GoogleIcon className="h-5 w-5" />
          <span>
            {loading === "google" ? "Connecting…" : "Continue with Google"}
          </span>
        </button>
        <button
          type="button"
          onClick={() => handleSocialLogin("github")}
          disabled={loading !== null}
          className="group flex w-full items-center justify-center gap-3 rounded-full border border-white/15 bg-white px-5 py-3 text-sm font-medium text-black transition-all duration-300 hover:scale-[1.01] hover:bg-white/95 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60 focus-visible:ring-offset-2 focus-visible:ring-offset-black disabled:opacity-60"
        >
          <GitHubIcon className="h-5 w-5" />
          <span>
            {loading === "github" ? "Connecting…" : "Continue with GitHub"}
          </span>
        </button>
      </div>

      {shareId && (
        <div className="mt-8 text-center">
          <Link
            href={`/shared/${shareId}`}
            className="text-sm text-white/40 hover:text-white/60 hover:underline"
          >
            ← Back to shared chat
          </Link>
        </div>
      )}
    </div>
  );
}

export default function SignInPage() {
  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center bg-black px-6 py-24 text-white">
      <Suspense
        fallback={
          <div className="flex items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/20 border-t-white" />
          </div>
        }
      >
        <SignInForm />
      </Suspense>
    </main>
  );
}
