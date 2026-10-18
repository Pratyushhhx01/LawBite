import type { Metadata } from "next";
import type { ReactNode } from "react";
import ResourceLayout from "../../resources/_components/ResourceLayout";

export const metadata: Metadata = {
  title: "Documents — Lawbite",
  description: "Legal documents and resources available through Lawbite.",
};

function DocHeading({ icon, children }: { icon: string; children: ReactNode }) {
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

export default function DocumentsPage() {
  return (
    <ResourceLayout
      title="Legal Documents"
      description="Lawbite can help you draft, review, and understand a wide range of Indian legal documents."
    >
      <section>
        <DocHeading icon="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10">
          Document Drafting
        </DocHeading>
        <p className="mt-3">
          Use the Document Drafter mode to generate ready-to-use Indian legal
          documents. Fill in the required information through our structured
          forms, and Lawbite will produce a properly formatted draft.
        </p>
        <ul className="mt-4 list-disc space-y-2 pl-6">
          <li>Legal Notices</li>
          <li>FIR Drafts</li>
          <li>Consumer Complaints</li>
          <li>RTI Applications</li>
          <li>Wills</li>
          <li>Affidavits</li>
          <li>Court Petitions / Plaints</li>
          <li>Contracts &amp; Agreements</li>
        </ul>
      </section>

      <section>
        <DocHeading icon="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z">
          Document Review
        </DocHeading>
        <p className="mt-3">
          Upload any legal document — rental agreement, employment contract,
          FIR, sale deed, or court notice — and Lawbite will provide a
          clause-by-clause risk analysis with plain-language explanations. Each
          clause is rated for risk and backed by relevant Indian law where
          applicable.
        </p>
      </section>

      <section>
        <DocHeading icon="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25">
          Knowledge Base
        </DocHeading>
        <p className="mt-3">
          Lawbite&apos;s knowledge base includes 157+ Indian bare acts at the
          section level, covering criminal law, civil procedure, constitutional
          law, family law, cyber law, corporate law, tax law, and more. Every
          response references the specific sections and provisions that apply to
          your query.
        </p>
      </section>
    </ResourceLayout>
  );
}
