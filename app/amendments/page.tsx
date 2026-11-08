import type { Metadata } from "next";
import AmendmentTrackerApp from "./_components/AmendmentTrackerApp";
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
  const isTableView = params?.view === "table" || Boolean(params?.q) || Boolean(params?.act);

  if (isTableView) {
    return <AmendmentTrackerApp />;
  }

  return <AmendmentsInfoView />;
}
