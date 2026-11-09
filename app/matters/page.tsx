import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import MattersInfoView from "./_components/MattersInfoView";

export const metadata: Metadata = {
  title: "Legal Matters & Litigation Workspace — LawBite",
  description:
    "Organize legal matters, analyze contracts, compare documents, and prepare for courtroom hearings across 8 litigation stages.",
  robots: { index: true, follow: true },
};

export default async function MattersPage({
  searchParams,
}: {
  searchParams?: Promise<{
    matterId?: string;
    caseId?: string;
    id?: string;
    view?: string;
    tab?: string;
  }>;
}) {
  const params = searchParams ? await searchParams : undefined;
  const initialMatterId = params?.matterId ?? params?.caseId ?? params?.id ?? null;
  const view = params?.view ?? null;
  const tab = params?.tab ?? null;

  let session = null;
  try {
    session = await auth.api.getSession({
      headers: await headers(),
    });
  } catch {
    session = null;
  }

  // If view=info is explicitly requested (e.g. from landing page resources)
  if (view === "info") {
    return (
      <MattersInfoView
        isLoggedIn={Boolean(session)}
        userName={session?.user.name ?? null}
      />
    );
  }

  // Any direct visit to /matters enters the specific workspace in Case Tracker seamlessly
  const query = new URLSearchParams();
  query.set("tab", "matters");
  if (initialMatterId) query.set("matterId", initialMatterId);
  if (tab) query.set("matterTab", tab);

  redirect(`/cases?${query.toString()}`);
}
