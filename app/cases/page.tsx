import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import CasesApp from "./_components/CasesApp";

export const metadata: Metadata = {
  title: "AI Lawyer — Lawbite",
  description: "Track and manage your legal cases, deadlines, and documents.",
  robots: { index: false, follow: false },
};

export default async function CasesPage({
  searchParams,
}: {
  searchParams?: Promise<{ caseId?: string; id?: string }>;
}) {
  const params = searchParams ? await searchParams : undefined;
  const initialCaseId = params?.caseId ?? params?.id ?? null;

  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect(
      `/signin?next=${encodeURIComponent(
        initialCaseId ? `/cases?caseId=${initialCaseId}` : "/cases"
      )}`
    );
  }

  return (
    <CasesApp
      user={{
        id: session.user.id,
        name: session.user.name,
        email: session.user.email,
        image: session.user.image ?? null,
      }}
      initialCaseId={initialCaseId}
    />
  );
}
