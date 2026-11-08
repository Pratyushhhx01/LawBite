import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import MattersApp from "./_components/MattersApp";

export const metadata: Metadata = {
  title: "Legal Matters & Workspace — Lawbite",
  description:
    "Organize legal matters, analyze contracts, compare documents, and prepare for courtroom hearings.",
  robots: { index: false, follow: false },
};

export default async function MattersPage({
  searchParams,
}: {
  searchParams?: Promise<{ matterId?: string; caseId?: string; id?: string }>;
}) {
  const params = searchParams ? await searchParams : undefined;
  const initialMatterId = params?.matterId ?? params?.caseId ?? params?.id ?? null;

  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect(
      `/signin?next=${encodeURIComponent(
        initialMatterId ? `/matters?matterId=${initialMatterId}` : "/matters",
      )}`,
    );
  }

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
