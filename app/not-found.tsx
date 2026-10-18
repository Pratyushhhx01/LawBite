import Link from "next/link";
import LogoIcon from "./components/LogoIcon";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center px-6">
      <Link
        href="/"
        aria-label="Lawbite home"
        className="absolute top-6 left-6 inline-flex items-center gap-2.5 text-sm font-semibold tracking-tight"
      >
        <LogoIcon className="h-7 w-7" />
        <span>Lawbite</span>
      </Link>

      <div className="text-center">
        <p className="text-sm font-medium text-white/40 uppercase tracking-[0.3em]">
          Error 404
        </p>
        <h1 className="mt-4 text-7xl font-bold tracking-tight sm:text-8xl">
          4<span className="text-white/20">0</span>4
        </h1>
        <h2 className="mt-4 text-xl font-semibold sm:text-2xl">
          Page not found
        </h2>
        <p className="mx-auto mt-3 max-w-md text-sm text-white/50 sm:text-base">
          The page you are looking for does not exist or has been moved. Check
          the address or head back to start a legal query.
        </p>
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            href="/"
            className="rounded-full bg-white px-6 py-2.5 text-sm font-medium text-black transition-colors hover:bg-white/90"
          >
            Go home
          </Link>
          <Link
            href="/chat"
            className="rounded-full border border-white/20 px-6 py-2.5 text-sm font-medium transition-colors hover:bg-white/10"
          >
            Ask a legal question
          </Link>
        </div>
      </div>
    </div>
  );
}
