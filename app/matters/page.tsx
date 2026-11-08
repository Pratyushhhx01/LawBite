import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import MattersApp from "./_components/MattersApp";
import MattersInfoView from "./_components/MattersInfoView";

export const metadata: Metadata = {
  title: "Legal Matters & Workspace — Lawbite",
  description:
    "Organize legal matters, analyze contracts, compare documents, and prepare for courtroom hearings.",
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

  const session = await auth.api.getSession({
    headers: await headers(),
  });

  // If user is not logged in, show the informational overview page with feature details & login prompts
  if (!session) {
    return <MattersInfoView isLoggedIn={false} />;
  }

  // If an authenticated user explicitly requests the overview/guide page
  if (view === "info") {
    return (
      <MattersInfoView
        isLoggedIn={true}
        userName={session.user.name}
      />
    );
  }

  // Authenticated user accessing workspace
  return (
    <MattersApp
      user={{
        id: session.user.id,
        name: session.user.name,
        email: session.user.email,
        image: session.user.image ?? null,
      }}
      initialMatterId={initialMatterId}
    />
  );
}
