"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { resourceCategories } from "../_data";

type ResourceLayoutProps = {
  title: string;
  description?: string;
  children: ReactNode;
};

export default function ResourceLayout({
  title,
  description,
  children,
}: ResourceLayoutProps) {
  const pathname = usePathname();

  return (
    <section className="relative pt-32 pb-24 sm:pt-40 sm:pb-32">
      <div className="mx-auto max-w-6xl px-6">
        <div className="grid gap-12 lg:grid-cols-[240px_1fr] lg:gap-16">
          <aside className="lg:sticky lg:top-32 lg:self-start">
            <h3 className="text-xs font-medium uppercase tracking-[0.25em] text-white/40">
              Resources
            </h3>
            <ul className="mt-5 space-y-1 text-sm">
              {resourceCategories.map((cat) => {
                const isActive =
                  pathname === cat.href || pathname.startsWith(`${cat.href}/`);
                return (
                  <li key={cat.title}>
                    <Link
                      href={cat.href}
                      aria-current={isActive ? "page" : undefined}
                      className={`group relative flex items-center gap-2 rounded-lg px-3 py-2 transition-colors duration-300 ${
                        isActive
                          ? "bg-white/[0.06] text-white"
                          : "text-white/60 hover:bg-white/[0.04] hover:text-white"
                      }`}
                    >
                      <span
                        aria-hidden
                        className={`h-1 w-1 rounded-full transition-all duration-300 ${
                          isActive
                            ? "bg-white"
                            : "bg-white/30 group-hover:bg-white/60"
                        }`}
                      />
                      <span className="relative">
                        {cat.title}
                        <span
                          className={`absolute -bottom-0.5 left-0 h-px bg-white transition-all duration-500 ${
                            isActive ? "w-full" : "w-0 group-hover:w-full"
                          }`}
                        />
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </aside>

          <article className="min-w-0">
            <header className="border-b border-white/10 pb-10">
              <p className="text-xs font-medium uppercase tracking-[0.3em] text-white/40">
                / Resources
              </p>
              <h1 className="mt-4 text-4xl font-semibold leading-[1.05] tracking-tight sm:text-5xl">
                {title}
              </h1>
              {description ? (
                <p className="mt-5 max-w-2xl text-base leading-relaxed text-white/65">
                  {description}
                </p>
              ) : null}
            </header>

            <div className="mt-10 space-y-10 text-[15px] leading-[1.75] text-white/75">
              {children}
            </div>
          </article>
        </div>
      </div>
    </section>
  );
}
