export type ResourceCategory = {
  title: string;
  icon: string;
  href: string;
  items: { label: string; href: string; description: string }[];
};

export const resourceCategories: ResourceCategory[] = [
  {
    title: "Documents",
    icon: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z",
    href: "/documents",
    items: [
      {
        label: "Legal Documents",
        href: "/documents",
        description: "Browse all legal document types",
      },
      {
        label: "Contract Templates",
        href: "/templates",
        description: "Ready-to-use contract drafts",
      },
      {
        label: "Legal Drafts",
        href: "/templates#drafts",
        description: "Court filings and notices",
      },
    ],
  },
  {
    title: "Guides",
    icon: "M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253",
    href: "/guides",
    items: [
      {
        label: "Legal Guides",
        href: "/guides",
        description: "Step-by-step legal processes",
      },
      {
        label: "Filing Help",
        href: "/filing",
        description: "How to file complaints & RTI",
      },
      {
        label: "Know Your Rights",
        href: "/guides#rights",
        description: "Understanding Indian laws",
      },
    ],
  },
  {
    title: "Templates",
    icon: "M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z",
    href: "/templates",
    items: [
      {
        label: "Rental Agreement",
        href: "/templates#rental",
        description: "11-month rental contracts",
      },
      {
        label: "Employment Contract",
        href: "/templates#employment",
        description: "Job offer letters & agreements",
      },
      {
        label: "NDA",
        href: "/templates#nda",
        description: "Non-disclosure agreements",
      },
    ],
  },
  {
    title: "Filing Help",
    icon: "M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z",
    href: "/filing",
    items: [
      {
        label: "Cyber Crime Complaint",
        href: "/filing#cybercrime",
        description: "Harassment, leaked photos & online fraud",
      },
      {
        label: "RTI Application",
        href: "/filing#rti",
        description: "File RTI requests online",
      },
      {
        label: "Consumer Complaint",
        href: "/filing#consumer",
        description: "Consumer forum complaints",
      },
      {
        label: "Consumer Grievance (NCH)",
        href: "/filing#nch-grievance",
        description: "National Consumer Helpline grievance",
      },
    ],
  },
  {
    title: "Tools",
    icon: "M13 10V3L4 14h7v7l9-11h-7z",
    href: "/tools",
    items: [
      {
        label: "Legal News",
        href: "/news",
        description: "Latest legal updates",
      },
      {
        label: "Case Tracker",
        href: "/cases",
        description: "Track your cases",
      },
      {
        label: "Calculators",
        href: "/calculators",
        description: "Stamp duty & limitation",
      },
      {
        label: "Reminders",
        href: "/reminders",
        description: "Court dates & filing deadlines",
      },
    ],
  },
  {
    title: "Matter Management",
    icon: "M20.25 14.15v4.25c0 1.094-.787 2.036-1.872 2.18-2.087.277-4.216.42-6.378.42s-4.291-.143-6.378-.42c-1.085-.144-1.872-1.086-1.872-2.18v-4.25m16.5 0a2.18 2.18 0 00.75-1.661V8.706c0-1.081-.768-2.015-1.837-2.175a48.114 48.114 0 00-3.413-.387m4.5 8.006c-.194.165-.42.295-.673.38A23.978 23.978 0 0112 15.75c-2.648 0-5.195-.429-7.577-1.22a2.016 2.016 0 01-.673-.38m0 0A2.18 2.18 0 013 12.489V8.706c0-1.081.768-2.015 1.837-2.175a48.111 48.111 0 013.413-.387m7.5 0V5.25A2.25 2.25 0 0013.5 3h-3a2.25 2.25 0 00-2.25 2.25v.894m7.5 0a48.667 48.667 0 00-7.5 0",
    href: "/matters",
    items: [
      {
        label: "Case Workspaces",
        href: "/matters",
        description: "Litigation & advisory dossiers",
      },
      {
        label: "Contract Risk Analyzer",
        href: "/matters?tab=contract",
        description: "Clause-by-clause legal risk audit",
      },
      {
        label: "Document Comparison",
        href: "/matters?tab=compare",
        description: "Contract revision diffs & shifts",
      },
      {
        label: "Courtroom Prep",
        href: "/matters?tab=prep",
        description: "Cross-examination & witness prep",
      },
    ],
  },
  {
    title: "Amendment Tracker",
    icon: "M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25",
    href: "/amendments",
    items: [
      {
        label: "Statutory Amendments",
        href: "/amendments",
        description: "Gazette notifications & dates",
      },
      {
        label: "BNS Criminal Code",
        href: "/amendments?view=table&q=BNS",
        description: "Bharatiya Nyaya Sanhita 2023",
      },
      {
        label: "BNSS Procedure",
        href: "/amendments?view=table&q=BNSS",
        description: "Bharatiya Nagarik Suraksha Sanhita",
      },
      {
        label: "BSA Evidence Law",
        href: "/amendments?view=table&q=BSA",
        description: "Bharatiya Sakshya Adhiniyam",
      },
    ],
  },
];

export function getResourceCategory(
  href: string,
): ResourceCategory | undefined {
  return resourceCategories.find((c) => c.href === href);
}
