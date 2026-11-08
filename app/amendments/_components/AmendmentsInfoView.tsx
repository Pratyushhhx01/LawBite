"use client";

import Link from "next/link";
import ResourceLayout from "../../resources/_components/ResourceLayout";

export default function AmendmentsInfoView() {
  const amendmentSections = [
    {
      category: "2024 Criminal Law Overhauls",
      items: [
        {
          id: "bns",
          title: "Bharatiya Nyaya Sanhita (BNS), 2023",
          enactment: "Act No. 45 of 2023 (Enforced 1 July 2024)",
          description:
            "Replaced the colonial Indian Penal Code 1860 with 358 sections. Codifies snatching (§304), organized crime (§111), terrorist acts (§113), hit-and-run, and community service penalties.",
          query: "BNS",
          icon: (
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
            </svg>
          ),
        },
        {
          id: "bnss",
          title: "Bharatiya Nagarik Suraksha Sanhita (BNSS), 2023",
          enactment: "Act No. 46 of 2023 (Enforced 1 July 2024)",
          description:
            "Replaced CrPC 1973 with 531 sections. Governs police custody detention up to 60/90 days (§187), mandatory videography in search/seizure (§105), preliminary inquiry (§173), and trial in absentia (§356).",
          query: "BNSS",
          icon: (
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          ),
        },
        {
          id: "bsa",
          title: "Bharatiya Sakshya Adhiniyam (BSA), 2023",
          enactment: "Act No. 47 of 2023 (Enforced 1 July 2024)",
          description:
            "Replaced Indian Evidence Act 1872 with 170 sections. Expands electronic evidence standards (§63), secondary evidence admissibility, and presumption of digital signature authentication.",
          query: "BSA",
          icon: (
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          ),
        },
      ],
    },
    {
      category: "Commercial, Civil & Consumer Reforms",
      items: [
        {
          id: "sra",
          title: "Specific Relief (Amendment) Act, 2018",
          enactment: "Act No. 18 of 2018 (Enforced 1 Oct 2018)",
          description:
            "Mandated specific performance of contracts as a general rule (§10), barred civil court injunctions in infrastructure projects (§20A), and introduced court-appointed expert witnesses (§20).",
          query: "Specific Relief",
          icon: (
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M8 7v10M8 7l4-4m-4 4l-4-4m12 14V7m0 10l4 4m-4-4l-4 4" />
            </svg>
          ),
        },
        {
          id: "ni-act",
          title: "Negotiable Instruments (Amendment) Act, 2018",
          enactment: "Act No. 20 of 2018 (Enforced 1 Sept 2018)",
          description:
            "Introduced Section 143A empowering trial courts to direct drawer to pay interim compensation up to 20% in Section 138 cheque bounce trials, and appellate deposit under Section 148.",
          query: "143A",
          icon: (
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.5">
              <rect x="2" y="5" width="20" height="14" rx="2" />
              <line x1="2" y1="10" x2="22" y2="10" />
            </svg>
          ),
        },
        {
          id: "cpa",
          title: "Consumer Protection Act, 2019",
          enactment: "Act No. 35 of 2019 (Enforced 20 July 2020)",
          description:
            "Repealed 1986 Act; established the Central Consumer Protection Authority (CCPA), codified product liability under Chapter VI, introduced statutory mediation (§37), and regulated e-commerce.",
          query: "Consumer Protection",
          icon: (
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.5">
              <circle cx="12" cy="12" r="10" />
              <path d="M12 8v4l3 3" />
            </svg>
          ),
        },
        {
          id: "dpdp",
          title: "Digital Personal Data Protection Act, 2023",
          enactment: "Act No. 22 of 2023",
          description:
            "India's foundational privacy statute setting legal grounds for processing personal data, obligations of Significant Data Fiduciaries, cross-border transfers, and statutory penalties up to ₹250 crore.",
          query: "DPDP",
          icon: (
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.5">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
          ),
        },
      ],
    },
  ];

  return (
    <ResourceLayout
      title="Statutory Amendment Tracker"
      description="Track amendments to Indian Central and State legislation — official Gazette notifications, effective enforcement dates, original vs amended statutory texts, and transitional guidance."
    >
      {/* Top Action Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-white/10 bg-white/[0.02] p-5 backdrop-blur-md">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-amber-400">
              India Code &amp; Gazette Verified
            </span>
            <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-400 border border-emerald-500/20">
              Live Database
            </span>
          </div>
          <p className="mt-1 text-sm text-white/80">
            Search, filter, and inspect recent legislative amendments with authoritative government sources.
          </p>
        </div>
        <div className="flex flex-wrap gap-2.5">
          <Link
            href="/amendments?view=table"
            className="btn-shine inline-flex items-center justify-center gap-2 rounded-xl bg-white px-5 py-2.5 text-xs font-semibold text-black transition-transform duration-300 hover:scale-[1.03]"
          >
            Launch Live Tracker Table →
          </Link>
          <Link
            href="/chat"
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/5 px-4 py-2.5 text-xs font-semibold text-white transition-colors hover:bg-white/10"
          >
            Ask AI Assistant →
          </Link>
        </div>
      </div>

      {amendmentSections.map((section) => (
        <section key={section.category} className="space-y-4">
          <h2 className="text-xl font-semibold text-white">{section.category}</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {section.items.map((item) => (
              <div
                key={item.id}
                className="group flex flex-col justify-between rounded-xl border border-white/10 bg-white/[0.03] p-5 transition-all duration-300 hover:border-white/20 hover:bg-white/[0.06]"
              >
                <div>
                  <div className="flex items-center gap-3">
                    <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/5 text-amber-400 transition-colors group-hover:bg-amber-400/10">
                      {item.icon}
                    </span>
                    <div>
                      <h3 className="text-sm font-semibold text-white">
                        {item.title}
                      </h3>
                      <p className="text-[10px] text-white/40">{item.enactment}</p>
                    </div>
                  </div>
                  <p className="mt-3 text-xs leading-relaxed text-white/60">
                    {item.description}
                  </p>
                </div>
                <div className="mt-5 pt-4 border-t border-white/[0.06] flex items-center justify-between">
                  <Link
                    href={`/amendments?view=table&q=${encodeURIComponent(item.query)}`}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-300 transition-colors hover:text-amber-200"
                  >
                    View in Live Table →
                  </Link>
                  <Link
                    href={`/chat?message=${encodeURIComponent(`Explain the legal amendments under ${item.title} and their practical significance in India`)}`}
                    className="text-[11px] text-white/40 hover:text-white transition-colors"
                  >
                    Ask AI ↗
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </section>
      ))}

      {/* Cross link to Matter Management and Tools */}
      <section className="rounded-2xl border border-white/10 bg-white/[0.02] p-6 text-center sm:text-left sm:flex sm:items-center sm:justify-between">
        <div>
          <h3 className="text-base font-semibold text-white">
            Need to organize legal cases or audit contracts?
          </h3>
          <p className="mt-1 text-xs text-white/60">
            Explore Matter Management for case tracking, contract risk auditing, and courtroom prep.
          </p>
        </div>
        <div className="mt-4 sm:mt-0 flex flex-wrap gap-2 justify-center">
          <Link
            href="/matters"
            className="rounded-lg border border-amber-400/25 bg-amber-400/10 px-3.5 py-1.5 text-xs font-semibold text-amber-300 transition-colors hover:bg-amber-400/20"
          >
            Matter Management →
          </Link>
          <Link
            href="/tools"
            className="rounded-lg bg-white/10 px-3.5 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-white/20"
          >
            All Legal Tools →
          </Link>
        </div>
      </section>
    </ResourceLayout>
  );
}
