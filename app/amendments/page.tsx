import type { Metadata } from "next";
import { redirect } from "next/navigation";
import AmendmentsInfoView from "./_components/AmendmentsInfoView";

export const metadata: Metadata = {
  title: "Indian Legal Amendment Tracker — LawBite",
  description:
    "Track amendments to Indian Central and State legislation with Gazette notifications, effective dates, original vs amended provisions, and practice significance.",
  keywords: [
    "Indian Legal Amendments",
    "Bharatiya Nyaya Sanhita",
    "BNS 2023",
    "Specific Relief Amendment 2018",
    "Negotiable Instruments Section 143A",
    "Consumer Protection Act 2019",
    "DPDP Act 2023",
    "Gazette of India",
  ],
};

export default async function AmendmentsPage({
  searchParams,
}: {
  searchParams?: Promise<{ view?: string; q?: string; act?: string }>;
}) {
  const params = searchParams ? await searchParams : undefined;
  const view = params?.view ?? null;

  // If view=info is requested (e.g. from landing page resources)
  if (view === "info") {
    return <AmendmentsInfoView />;
  }

  // Any other visit directly to /amendments enters the specific workspace in Case Tracker
  const query = new URLSearchParams();
  query.set("tab", "amendments");
  if (params?.q) query.set("q", params.q);
  if (params?.act) query.set("act", params.act);

  redirect(`/cases?${query.toString()}`);
}
