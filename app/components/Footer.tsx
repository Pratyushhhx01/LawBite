"use client";

import Link from "next/link";
import { companyPages } from "../company/_data";
import { legalPages } from "../legal/_data";
import { resourceCategories } from "../resources/_data";
import {
  handleSectionAnchor,
  isSectionHref,
  handleTopAnchor,
} from "@/lib/section-nav";
import LogoIcon from "./LogoIcon";

const otherColumns: {
  title: string;
  links: { label: string; href: string; icon?: string }[];
}[] = [
  {
    title: "Product",
    links: [
      {
        label: "Features",
        href: "#features",
        icon: "M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z",
      },
      {
        label: "Matter Management",
        href: "/matters",
        icon: "M20.25 14.15v4.25c0 1.094-.787 2.036-1.872 2.18-2.087.277-4.216.42-6.378.42s-4.291-.143-6.378-.42c-1.085-.144-1.872-1.086-1.872-2.18v-4.25m16.5 0a2.18 2.18 0 00.75-1.661V8.706c0-1.081-.768-2.015-1.837-2.175a48.114 48.114 0 00-3.413-.387m4.5 8.006c-.194.165-.42.295-.673.38A23.978 23.978 0 0112 15.75c-2.648 0-5.195-.429-7.577-1.22a2.016 2.016 0 01-.673-.38m0 0A2.18 2.18 0 013 12.489V8.706c0-1.081.768-2.015 1.837-2.175a48.111 48.111 0 013.413-.387m7.5 0V5.25A2.25 2.25 0 0013.5 3h-3a2.25 2.25 0 00-2.25 2.25v.894m7.5 0a48.667 48.667 0 00-7.5 0",
      },
      {
        label: "Amendment Tracker",
        href: "/amendments",
        icon: "M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25",
      },
      {
        label: "AI Legal Chat",
        href: "/chat",
        icon: "M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z",
      },
      {
        label: "FAQ",
        href: "#faq",
        icon: "M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 5.25h.008v.008H12v-.008Z",
      },
    ],
  },
  {
    title: "Company",
    links: companyPages.map((page) => ({
      label: page.label,
      href: page.href,
      icon: page.icon,
    })),
  },
];

export default function Footer() {
  return (
    <footer id="contact" className="relative border-t border-white/10 bg-black">
      <div className="mx-auto max-w-6xl px-6 py-20">
        <div className="grid gap-12 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <Link
              href="/"
              onClick={handleTopAnchor}
              className="inline-flex items-center gap-2.5 text-sm font-semibold"
            >
              <LogoIcon className="h-7 w-7" />
              <span>Lawbite</span>
            </Link>
            <p className="mt-5 max-w-sm text-sm leading-relaxed text-white/55">
              AI-powered Indian legal intelligence platform. Fast diffusion model
              inference across 157+ bare acts, case-law precedent verification,
              and end-to-end matter management.
            </p>
            <form
              className="mt-7 flex max-w-sm items-center gap-2 rounded-full border border-white/10 bg-white/[0.02] p-1.5 pl-4 transition-colors duration-300 focus-within:border-white/30"
              onSubmit={(e) => e.preventDefault()}
            >
              <input
                type="email"
                required
                placeholder="you@company.com"
                className="w-full bg-transparent text-sm text-white placeholder:text-white/40 focus:outline-none"
              />
              <button
                type="submit"
                className="btn-shine group relative inline-flex items-center gap-1.5 overflow-hidden rounded-full bg-white px-4 py-2 text-xs font-medium text-black transition-transform duration-300 hover:scale-[1.03]"
              >
                Subscribe
                <span
                  aria-hidden
                  className="inline-block transition-transform duration-300 group-hover:translate-x-0.5"
                >
                  →
                </span>
              </button>
            </form>
          </div>

          <div className="grid grid-cols-2 gap-8 sm:grid-cols-4 lg:col-span-8">
            {otherColumns.map((col) => (
              <div key={col.title}>
                <h4 className="text-xs font-medium uppercase tracking-[0.25em] text-white/40">
                  {col.title}
                </h4>
                <ul className="mt-5 space-y-3 text-sm">
                  {col.links.map((link) => {
                    const isInternal = link.href.startsWith("/");
                    const anchorClass =
                      "group inline-flex items-center gap-1.5 text-white/70 transition-colors duration-300 hover:text-white";
                    const inner = (
                      <>
                        {link.icon ? (
                          <svg
                            viewBox="0 0 24 24"
                            className="h-4 w-4 shrink-0"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <path d={link.icon} />
                          </svg>
                        ) : null}
                        <span className="relative">
                          {link.label}
                          <span className="absolute -bottom-0.5 left-0 h-px w-0 bg-white transition-all duration-500 group-hover:w-full" />
                        </span>
                      </>
                    );
                    return (
                      <li key={link.label}>
                        {isInternal ? (
                          <Link href={link.href} className={anchorClass}>
                            {inner}
                          </Link>
                        ) : (
                          <a
                            href={link.href}
                            className={anchorClass}
                            onClick={
                              isSectionHref(link.href)
                                ? (e) => handleSectionAnchor(e, link.href)
                                : undefined
                            }
                          >
                            {inner}
                          </a>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}

            <div>
              <h4 className="text-xs font-medium uppercase tracking-[0.25em] text-white/40">
                Resources
              </h4>
              <ul className="mt-5 space-y-3 text-sm">
                {resourceCategories.map((cat) => (
                  <li key={cat.title}>
                    <Link
                      href={cat.href}
                      className="group inline-flex items-center gap-1.5 text-white/70 transition-colors duration-300 hover:text-white"
                    >
                      <svg
                        viewBox="0 0 24 24"
                        className="h-4 w-4"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d={cat.icon} />
                      </svg>
                      <span className="relative">
                        {cat.title}
                        <span className="absolute -bottom-0.5 left-0 h-px w-0 bg-white transition-all duration-500 group-hover:w-full" />
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="text-xs font-medium uppercase tracking-[0.25em] text-white/40">
                Legal
              </h4>
              <ul className="mt-5 space-y-3 text-sm">
                {legalPages.map((page) => (
                  <li key={page.slug}>
                    <Link
                      href={page.href}
                      className="group inline-flex items-center gap-1.5 text-white/70 transition-colors duration-300 hover:text-white"
                    >
                      <svg
                        viewBox="0 0 24 24"
                        className="h-4 w-4"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d={page.icon} />
                      </svg>
                      <span className="relative">
                        {page.label}
                        <span className="absolute -bottom-0.5 left-0 h-px w-0 bg-white transition-all duration-500 group-hover:w-full" />
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        <div className="mt-16 flex flex-col items-start justify-between gap-4 border-t border-white/10 pt-8 sm:flex-row sm:items-center">
          <p className="text-xs text-white/40">
            &copy; {new Date().getFullYear()} Lawbite. All rights reserved.
          </p>
          <div className="flex items-center gap-4 text-xs text-white/50">
            <Link href="/amendments" className="transition-colors hover:text-white">
              Amendments
            </Link>
            <Link href="/matters" className="transition-colors hover:text-white">
              Matters
            </Link>
            <a
              href="https://github.com/Pratyushhhx01/LawBite"
              target="_blank"
              rel="noopener noreferrer"
              className="transition-colors hover:text-white"
            >
              GitHub
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
