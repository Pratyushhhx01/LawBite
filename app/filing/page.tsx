import type { Metadata } from "next";
import Link from "next/link";
import ResourceLayout from "../resources/_components/ResourceLayout";
import { filingGuidePreviews } from "./_data";

export const metadata: Metadata = {
  title: "Filing Assistance — Lawbite",
  description:
    "See the filing assistance features available on Lawbite — cyber crime complaints, RTI, consumer complaints, and FIRs.",
};

export default function FilingPage() {
  return (
    <ResourceLayout
      title="Filing Assistance"
      description="Lawbite guides you through filing cyber crime complaints, RTI applications, consumer complaints, FIRs, and more — all online."
    >
      <section>
        <h2 className="text-xl font-semibold text-white">
          Filing Features Available
        </h2>
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {filingGuidePreviews.map((guide) => (
            <Link
              key={guide.id}
              id={guide.id}
              href={`/chat?tool=filing&item=${guide.id}`}
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
                    <path d={guide.icon} />
                  </svg>
                </span>
                <h3 className="text-sm font-semibold text-white">
                  {guide.name}
                </h3>
                <span className="ml-auto shrink-0 text-[11px] text-white/35">
                  ~{guide.estimatedTime}
                </span>
              </div>
              <p className="mt-1.5 text-xs leading-relaxed text-white/55">
                {guide.description}
              </p>
            </Link>
          ))}
        </div>
      </section>
    </ResourceLayout>
  );
}
