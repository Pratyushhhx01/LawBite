"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useSession, signOut } from "@/lib/auth-client";
import { clearDisclaimerAcceptance } from "@/lib/disclaimer";
import {
  handleSectionAnchor,
  isSectionHref,
  handleTopAnchor,
} from "@/lib/section-nav";
import LogoIcon from "./LogoIcon";

const links = [
  { label: "Features", href: "#features" },
  { label: "Preview", href: "#preview" },
  { label: "How It Works", href: "#process" },
  { label: "FAQ", href: "#faq" },
  { label: "Contact", href: "/contact" },
];

export default function Navbar() {
  const router = useRouter();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const { data: session, isPending } = useSession();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      const target = e.target as HTMLElement;
      if (!target.closest("[data-profile-menu]")) {
        setProfileOpen(false);
      }
    }
    if (profileOpen) {
      document.addEventListener("click", handleClickOutside);
      return () => document.removeEventListener("click", handleClickOutside);
    }
  }, [profileOpen]);

  async function handleSignOut() {
    clearDisclaimerAcceptance();
    await signOut();
    router.replace("/");
    router.refresh();
  }

  return (
    <header className="fixed inset-x-0 top-0 z-50 flex justify-center px-4 pt-4 sm:pt-6">
      <nav
        className={`relative flex w-full max-w-6xl items-center justify-between gap-6 rounded-full border px-4 py-2.5 sm:px-6 transition-colors duration-500 ${
          scrolled
            ? "border-white/15 bg-black/70 backdrop-blur-xl [@media(hover:none)]:bg-black/90 [@media(hover:none)]:backdrop-blur-none"
            : "border-white/10 bg-black/40 backdrop-blur-md [@media(hover:none)]:bg-black/80 [@media(hover:none)]:backdrop-blur-none"
        }`}
      >
        <Link
          href="/"
          onClick={handleTopAnchor}
          className="group flex items-center gap-2.5 text-sm font-semibold tracking-tight"
        >
          <LogoIcon className="h-7 w-7" />
          <span className="text-white">Lawbite</span>
        </Link>

        <ul className="hidden items-center gap-1 text-sm text-white/70 md:flex">
          {links.map((link) => (
            <li key={link.href}>
              <a
                href={link.href}
                className="relative inline-block rounded-full px-3.5 py-1.5 transition-colors duration-300 hover:text-white"
                onClick={
                  isSectionHref(link.href)
                    ? (e) => handleSectionAnchor(e, link.href)
                    : undefined
                }
              >
                <span className="relative z-10">{link.label}</span>
                <span className="absolute inset-0 -z-0 scale-90 rounded-full bg-white/0 transition-all duration-300 group-hover:bg-white/10" />
              </a>
            </li>
          ))}
        </ul>

        <div className="hidden items-center gap-2 md:flex">
          {isPending ? (
            <div className="h-9 w-20 animate-pulse rounded-full bg-white/10" />
          ) : session?.user ? (
            <div className="relative" data-profile-menu>
              <button
                type="button"
                onClick={() => setProfileOpen((v) => !v)}
                className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full border border-white/20 bg-white/10 transition-all duration-300 hover:border-white/40 hover:bg-white/15"
                aria-label="Account menu"
              >
                {session.user.image ? (
                  <Image
                    src={session.user.image}
                    alt=""
                    width={36}
                    height={36}
                    unoptimized
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <svg
                    viewBox="0 0 24 24"
                    className="h-4 w-4 text-white/70"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                )}
              </button>
              {profileOpen && (
                <div className="absolute right-0 top-full mt-2 w-56 overflow-hidden rounded-xl border border-white/10 bg-black/90 backdrop-blur-xl">
                  <div className="border-b border-white/10 px-4 py-3">
                    <p className="truncate text-sm font-medium text-white">
                      {session.user.name || "User"}
                    </p>
                    <p className="truncate text-xs text-white/50">
                      {session.user.email}
                    </p>
                  </div>
                  <div className="p-1">
                    <Link
                      href="/"
                      onClick={() => setProfileOpen(false)}
                      className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-white/70 transition-colors hover:bg-white/5 hover:text-white"
                    >
                      <svg
                        viewBox="0 0 24 24"
                        className="h-4 w-4"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                        <polyline points="9 22 9 12 15 12 15 22" />
                      </svg>
                      Home
                    </Link>
                    <Link
                      href="/chat"
                      onClick={() => setProfileOpen(false)}
                      className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-white/70 transition-colors hover:bg-white/5 hover:text-white"
                    >
                      <svg
                        viewBox="0 0 24 24"
                        className="h-4 w-4"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                      </svg>
                      Open Chat
                    </Link>
                    <Link
                      href="/news"
                      onClick={() => setProfileOpen(false)}
                      className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-white/70 transition-colors hover:bg-white/5 hover:text-white"
                    >
                      <svg
                        viewBox="0 0 24 24"
                        className="h-4 w-4"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2" />
                      </svg>
                      Legal News
                    </Link>
                    <button
                      type="button"
                      onClick={handleSignOut}
                      className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-white/70 transition-colors hover:bg-white/5 hover:text-white"
                    >
                      <svg
                        viewBox="0 0 24 24"
                        className="h-4 w-4"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                        <polyline points="16 17 21 12 16 7" />
                        <line x1="21" y1="12" x2="9" y2="12" />
                      </svg>
                      Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
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
          )}
        </div>

        <button
          type="button"
          aria-label="Toggle menu"
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
          className="relative inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/15 text-white/80 transition-colors hover:text-white md:hidden"
        >
          <span className="relative block h-3.5 w-4">
            <span
              className={`absolute left-0 top-0 block h-0.5 w-4 bg-current transition-transform duration-300 ${
                open ? "translate-y-1.5 rotate-45" : ""
              }`}
            />
            <span
              className={`absolute left-0 top-1.5 block h-0.5 w-4 bg-current transition-opacity duration-300 ${
                open ? "opacity-0" : "opacity-100"
              }`}
            />
            <span
              className={`absolute left-0 top-3 block h-0.5 w-4 bg-current transition-transform duration-300 ${
                open ? "-translate-y-1.5 -rotate-45" : ""
              }`}
            />
          </span>
        </button>
      </nav>

      <div
        className={`absolute left-4 right-4 top-full mt-2 origin-top overflow-hidden rounded-2xl border border-white/10 bg-black/85 backdrop-blur-xl transition-all duration-500 md:hidden ${
          open
            ? "scale-y-100 opacity-100"
            : "pointer-events-none scale-y-90 opacity-0"
        }`}
      >
        <ul className="flex flex-col p-3 text-sm">
          {links.map((link, i) => (
            <li
              key={link.href}
              style={{ transitionDelay: `${i * 40}ms` }}
              className={`transform transition-all duration-500 ${
                open ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0"
              }`}
            >
              <a
                onClick={(e) => {
                  setOpen(false);
                  handleSectionAnchor(e, link.href);
                }}
                href={link.href}
                className="block rounded-xl px-3 py-2.5 text-white/80 transition-colors hover:bg-white/5 hover:text-white"
              >
                {link.label}
              </a>
            </li>
          ))}
          <li
            style={{ transitionDelay: `${links.length * 40}ms` }}
            className={`mt-2 transform transition-all duration-500 ${
              open ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0"
            }`}
          >
            {session?.user ? (
              <div className="space-y-2">
                <Link
                  href="/"
                  onClick={() => setOpen(false)}
                  className="block rounded-xl bg-white/10 px-3 py-2.5 text-center font-medium text-white/80 transition-colors hover:bg-white/15 hover:text-white"
                >
                  Home
                </Link>
                <Link
                  href="/chat"
                  onClick={() => setOpen(false)}
                  className="block rounded-xl bg-white px-3 py-2.5 text-center font-medium text-black"
                >
                  Open Chat
                </Link>
                <button
                  type="button"
                  onClick={() => {
                    setOpen(false);
                    handleSignOut();
                  }}
                  className="block w-full rounded-xl border border-white/15 px-3 py-2.5 text-center font-medium text-white/70"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <Link
                href="/signin"
                onClick={() => setOpen(false)}
                className="block rounded-xl bg-white px-3 py-2.5 text-center font-medium text-black"
              >
                Sign In
              </Link>
            )}
          </li>
        </ul>
      </div>
    </header>
  );
}
