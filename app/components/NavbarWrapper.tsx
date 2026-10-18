"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import LogoIcon from "./LogoIcon";

const Navbar = dynamic(() => import("./Navbar"), {
  ssr: false,
  loading: () => (
    <header className="fixed inset-x-0 top-0 z-50 flex justify-center px-4 pt-4 sm:pt-6">
      <nav className="relative flex w-full max-w-6xl items-center justify-between gap-6 rounded-full border border-white/10 bg-black/40 px-4 py-2.5 sm:px-6 backdrop-blur-md">
        <a
          href="#"
          className="group flex items-center gap-2.5 text-sm font-semibold tracking-tight"
        >
          <LogoIcon className="h-7 w-7" />
          <span className="text-white">Lawbite</span>
        </a>
        <div className="hidden items-center gap-2 md:flex">
          <Link
            href="/signin"
            className="btn-shine group relative inline-flex items-center gap-1.5 overflow-hidden rounded-full bg-white px-4 py-1.5 text-sm font-medium text-black transition-transform duration-300 hover:scale-[1.03]"
          >
            Sign In
            <span
              aria-hidden
              className="inline-block transition-transform duration-300 group-hover:translate-x-0.5"
            >
              →
            </span>
          </Link>
        </div>
      </nav>
    </header>
  ),
});

export default function NavbarWrapper() {
  return <Navbar />;
}
