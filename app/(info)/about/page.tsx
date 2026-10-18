import type { Metadata } from "next";
import CompanyLayout from "../../company/_components/CompanyLayout";

export const metadata: Metadata = {
  title: "About — Lawbite",
  description: "Learn about Lawbite, an AI-powered Indian legal assistant.",
};

export default function AboutPage() {
  return (
    <CompanyLayout
      title="About Lawbite"
      description="Making Indian law accessible, understandable, and actionable for everyone."
    >
      <section>
        <h2 className="text-xl font-semibold text-white">Our Mission</h2>
        <p className="mt-3">
          Lawbite was built to bridge the gap between India&apos;s complex legal
          system and the people who need to navigate it. We believe that
          understanding the law should not require a law degree. Our platform
          uses artificial intelligence to deliver clear, accurate legal
          information drawn from India&apos;s key legislation — including the
          Constitution, IPC, BNS, CrPC, BNSS, and 157+ other bare acts.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold text-white">What We Do</h2>
        <p className="mt-3">
          Lawbite is an AI-powered legal assistant that provides instant answers
          to Indian legal questions. Users can ask quick questions, request deep
          analysis, draft legal documents, review agreements, or go through a
          structured case intake session. Every response is grounded in Indian
          law, sourced from our comprehensive knowledge base of bare acts and
          legal references.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold text-white">Why Lawbite</h2>
        <ul className="mt-4 list-disc space-y-2 pl-6">
          <li>
            <strong className="text-white/90">Section-level accuracy:</strong>{" "}
            Responses are backed by specific sections and articles from Indian
            legislation.
          </li>
          <li>
            <strong className="text-white/90">Multiple modes:</strong> From
            quick Q&amp;A to document drafting, choose the right tool for your
            situation.
          </li>
          <li>
            <strong className="text-white/90">Always up to date:</strong> Live
            web search augmentation ensures you get current information when it
            matters.
          </li>
          <li>
            <strong className="text-white/90">Built for India:</strong> Covers
            central and state-specific laws, with support for all major Indian
            legal frameworks.
          </li>
        </ul>
      </section>

      <section>
        <h2 className="text-xl font-semibold text-white">Disclaimer</h2>
        <p className="mt-3">
          Lawbite is an informational tool and does not constitute legal advice.
          Always consult a qualified legal professional for advice specific to
          your situation.
        </p>
      </section>
    </CompanyLayout>
  );
}
