import type { Metadata } from "next";
import Link from "next/link";
import ResourceLayout from "../resources/_components/ResourceLayout";
import { templatePreviews } from "./_data";

export const metadata: Metadata = {
  title: "Contract Templates — Lawbite",
  description:
    "Browse ready-to-use Indian legal contract templates available on Lawbite.",
};

export default function TemplatesPage() {
  return (
    <ResourceLayout
      title="Contract Templates"
      description="Lawbite includes ready-to-use Indian legal contract templates. Fill in the blanks and download a finished draft."
    >
      <section>
        <h2 className="text-xl font-semibold text-white">
          Available Templates
        </h2>
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {templatePreviews.map((template) => (
            <Link
              key={template.id}
              id={template.id}
              href={`/chat?tool=templates&item=${template.id}`}
              className="group rounded-lg border border-white/10 bg-white/[0.03] p-4 transition-all hover:border-white/20 hover:bg-white/[0.06]"
            >
              <div className="flex items-center gap-2.5">
                <span className="shrink-0 text-white/50 transition-colors duration-300 group-hover:text-white">
                  <svg
                    viewBox="0 0 24 24"
                    className="h-5 w-5"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d={template.icon} />
                  </svg>
                </span>
                <h3 className="text-sm font-semibold text-white">
                  {template.name}
                </h3>
              </div>
              <span className="mt-2.5 inline-block rounded-full border border-white/10 px-2.5 py-0.5 text-[11px] font-medium text-white/50">
                {template.category}
              </span>
              <p className="mt-1.5 text-xs leading-relaxed text-white/55">
                {template.description}
              </p>
            </Link>
          ))}
        </div>
      </section>
    </ResourceLayout>
  );
}
