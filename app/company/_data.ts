export type CompanyPageMeta = {
  slug: string;
  label: string;
  href: string;
  title: string;
  description: string;
  icon: string;
};

export const companyPages: CompanyPageMeta[] = [
  {
    slug: "about",
    label: "About",
    href: "/about",
    title: "About Lawbite",
    description:
      "Making Indian law accessible, understandable, and actionable for everyone.",
    icon: "M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z",
  },
  {
    slug: "contact",
    label: "Contact",
    href: "/contact",
    title: "Get in Touch",
    description:
      "Have a question, suggestion, or need support? We'd love to hear from you.",
    icon: "M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75",
  },
];

export function getCompanyPage(slug: string): CompanyPageMeta | undefined {
  return companyPages.find((p) => p.slug === slug);
}
