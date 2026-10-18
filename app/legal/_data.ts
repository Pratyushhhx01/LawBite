export type LegalPageMeta = {
  slug: string;
  label: string;
  href: string;
  title: string;
  description: string;
  icon: string;
};

export const legalPages: LegalPageMeta[] = [
  {
    slug: "privacy",
    label: "Privacy",
    href: "/legal/privacy",
    title: "Privacy Policy",
    description:
      "How we collect, use, store, and protect information when you use Lawbite.",
    icon: "M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016a11.959 11.959 0 01-8.618 3.016z",
  },
  {
    slug: "disclaimer",
    label: "Disclaimer",
    href: "/legal/disclaimer",
    title: "Disclaimer",
    description:
      "Limitations of liability, no legal advice, and the boundaries of the information we provide.",
    icon: "M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z",
  },
  {
    slug: "terms",
    label: "Terms of Service",
    href: "/legal/terms",
    title: "Terms of Service",
    description:
      "The rules, rights, and responsibilities that govern your use of the Lawbite platform.",
    icon: "M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z",
  },
  {
    slug: "risk-closure",
    label: "Risk Closure",
    href: "/legal/risk-closure",
    title: "Risk Closure",
    description:
      "Acknowledgement of the inherent risks of using automated legal workflows and our shared responsibilities.",
    icon: "M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z",
  },
  {
    slug: "cookies",
    label: "Cookies",
    href: "/legal/cookies",
    title: "Cookies Policy",
    description:
      "The cookies and similar technologies we use, why we use them, and how you can manage them.",
    icon: "M21 12a9 9 0 11-18 0 9 9 0 0118 0zM12 7.5h.008v.008H12V7.5zm3 3h.008v.008H15v-.008zm-6 3h.008v.008H9v-.008zm4.5 1.5h.008v.008h-.008V15z",
  },
  {
    slug: "refund",
    label: "Refund",
    href: "/legal/refund",
    title: "Refund Policy",
    description:
      "Eligibility, timelines, and the process for requesting a refund of paid plans or one-off services.",
    icon: "M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z",
  },
];

export function getLegalPage(slug: string): LegalPageMeta | undefined {
  return legalPages.find((p) => p.slug === slug);
}
