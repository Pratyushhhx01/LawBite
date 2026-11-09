import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { MatterService } from "@/lib/matter-service";
import CasesApp from "./_components/CasesApp";

export const metadata: Metadata = {
  title: "AI Lawyer — Lawbite",
  description: "Track and manage your legal cases, deadlines, and documents.",
  robots: { index: false, follow: false },
};

export default async function CasesPage({
  searchParams,
}: {
  searchParams?: Promise<{
    caseId?: string;
    id?: string;
    tab?: string;
    matterId?: string;
    q?: string;
  }>;
}) {
  const params = searchParams ? await searchParams : undefined;
  const initialCaseId = params?.caseId ?? params?.id ?? null;
  const rawTab = params?.tab?.toLowerCase();
  const initialTab: "cases" | "matters" | "amendments" | null =
    rawTab === "matters" || rawTab === "workspace" || Boolean(params?.matterId)
      ? "matters"
      : rawTab === "amendments"
      ? "amendments"
      : rawTab === "cases"
      ? "cases"
      : null;

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

  // Pre-fetch cases and matters in parallel on the server
  const [casesRows, mattersList] = await Promise.all([
    db
      .selectFrom("case_folder")
      .selectAll()
      .where("userId", "=", session.user.id)
      .orderBy("createdAt", "desc")
      .execute()
      .catch((err) => {
        console.error("Failed to prefetch cases:", err);
        return [];
      }),
    MatterService.listMatters(session.user.id).catch((err) => {
      console.error("Failed to prefetch matters:", err);
      return [];
    }),
  ]);

  const serializedCases = casesRows.map((r) => ({
    id: r.id,
    name: r.name,
    description: r.description || "",
    status: r.status,
    parties: r.parties || "",
    court: r.court || "",
    nextHearing: r.nextHearing
      ? new Date(r.nextHearing).toISOString().split("T")[0]
      : null,
    notes: r.notes || "",
    createdAt: new Date(r.createdAt).toISOString(),
  }));

  const targetCaseId =
    initialCaseId ||
    (initialTab !== "matters" && serializedCases.length > 0
      ? serializedCases[0].id
      : null);

  const targetMatterId =
    params?.matterId ||
    (initialTab === "matters" && mattersList.length > 0
      ? mattersList[0].id
      : null);

  const [detailResult, workspaceResult] = await Promise.all([
    targetCaseId
      ? Promise.all([
          db
            .selectFrom("case_document")
            .selectAll()
            .where("caseId", "=", targetCaseId)
            .orderBy("createdAt", "desc")
            .execute()
            .catch(() => []),
          db
            .selectFrom("conversation")
            .select(["id", "title", "preview", "type", "updatedAt"])
            .where("folderId", "=", targetCaseId)
            .where("userId", "=", session.user.id)
            .execute()
            .catch(() => []),
        ])
          .then(([docs, convs]) => {
            const folder = serializedCases.find((c) => c.id === targetCaseId);
            if (!folder) return null;
            return {
              ...folder,
              documents: docs.map((d) => ({
                id: d.id,
                fileName: d.fileName,
                fileType: d.fileType,
                fileUrl: d.fileUrl,
                createdAt: new Date(d.createdAt).toISOString(),
              })),
              conversations: convs.map((c) => ({
                id: c.id,
                title: c.title,
                preview: c.preview,
                type: c.type,
                updatedAt: new Date(c.updatedAt).toISOString(),
              })),
            };
          })
          .catch(() => null)
      : Promise.resolve(null),
    targetMatterId
      ? MatterService.getMatterWorkspace(targetMatterId, session.user.id).catch(
          () => null
        )
      : Promise.resolve(null),
  ]);

  return (
    <CasesApp
      user={{
        id: session.user.id,
        name: session.user.name,
        email: session.user.email,
        image: session.user.image ?? null,
      }}
      initialCaseId={initialCaseId}
      initialTab={initialTab}
      initialMatterId={params?.matterId ?? null}
      initialQuery={params?.q ?? null}
      initialCases={serializedCases}
      initialDetail={detailResult}
      initialMatters={mattersList}
      initialMatterWorkspace={workspaceResult}
    />
  );
}
