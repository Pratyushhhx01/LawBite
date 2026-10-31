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
        icon: "M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z",
      },
      {
        label: "How It Works",
        href: "#process",
        icon: "M3.75 12h16.5m-16.5 3.75h16.5M3.75 19.5h16.5M5.625 4.5h12.75a1.875 1.875 0 010 3.75H5.625a1.875 1.875 0 010-3.75z",
      },
      {
        label: "Preview",
        href: "#preview",
        icon: "M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z M15 12a3 3 0 11-6 0 3 3 0 016 0z",
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
              AI-powered Indian legal assistant. Get instant answers from 157+
              bare acts, structured analysis, and real-time web search.
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
            <a href="#" className="transition-colors hover:text-white">
              X
            </a>
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
