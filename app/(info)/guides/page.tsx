import type { Metadata } from "next";
import type { ReactNode } from "react";
import ResourceLayout from "../../resources/_components/ResourceLayout";

export const metadata: Metadata = {
  title: "Guides — Lawbite",
  description:
    "Learn how to use Lawbite effectively with these quick-start guides.",
};

function GuideHeading({
  icon,
  children,
}: {
  icon: string;
  children: ReactNode;
}) {
  return (
    <h2 className="flex items-center gap-2.5 text-xl font-semibold text-white">
      <span aria-hidden className="text-white/50">
        <svg
          viewBox="0 0 24 24"
          className="h-5 w-5"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d={icon} />
        </svg>
      </span>
      {children}
    </h2>
  );
}

export default function GuidesPage() {
  return (
    <ResourceLayout
      title="How to Use Lawbite"
      description="Quick-start guides to help you get the most out of each feature."
    >
      <section>
        <GuideHeading icon="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z">
          Talk to AI
        </GuideHeading>
        <p className="mt-3">
          The fastest way to get answers. Simply type your legal question in
          plain language and receive a concise two-line response. Ideal for
          quick lookups, definitions, and straightforward questions about Indian
          law.
        </p>
      </section>

      <section>
        <GuideHeading icon="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4">
          Deep Analysis
        </GuideHeading>
        <p className="mt-3">
          Switch to Analysis mode for complex legal questions. You will receive
          a structured 10&ndash;12 point breakdown covering applicable laws,
          relevant sections, legal principles, and a concluding summary. Use
          this when you need more than a quick answer.
        </p>
      </section>

      <section>
        <GuideHeading icon="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z">
          AI Lawyer
        </GuideHeading>
        <p className="mt-3">
          An adaptive case intake session that asks only the questions relevant
          to your problem, one at a time, and never repeats one you have already
          answered. Once it has the facts it needs, Lawbite delivers tailored
          advice with actionable next steps.
        </p>
      </section>

      <section>
        <GuideHeading icon="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10">
          Document Drafter
        </GuideHeading>
        <p className="mt-3">
          Select a document type from the popup, fill in the required fields
          through the structured form, and receive a professionally formatted
          legal document. Available types include legal notices, FIR drafts,
          consumer complaints, RTI applications, wills, affidavits, petitions,
          and contracts.
        </p>
      </section>

      <section>
        <GuideHeading icon="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z">
          Document Review
        </GuideHeading>
        <p className="mt-3">
          Upload a PDF or image of any legal document. Lawbite will analyse it
          clause by clause, assigning a risk rating to each section and
          providing plain-language explanations of what each clause means for
          you.
        </p>
      </section>

      <section>
        <GuideHeading icon="M12 18v-5.25m0 0a6.01 6.01 0 001.5-.189m-1.5.189a6.01 6.01 0 01-1.5-.189m3.75 7.478a12.06 12.06 0 01-4.5 0m3.75 2.383a14.406 14.406 0 01-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 10-7.517 0c.85.493 1.509 1.333 1.509 2.316V18">
          Tips for Best Results
        </GuideHeading>
        <ul className="mt-4 list-disc space-y-2 pl-6">
          <li>Be specific about the area of law your question relates to.</li>
          <li>
            Mention relevant states or cities when asking about
            location-specific laws.
          </li>
          <li>
            Use the attachment feature to upload documents for review or
            context.
          </li>
          <li>
            Pin important conversations to keep them organised in your sidebar.
          </li>
        </ul>
      </section>
    </ResourceLayout>
  );
}
