import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { claimSharedChat } from "@/lib/shares";
import { db } from "@/lib/db";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import ChatApp from "./_components/ChatApp";

export const metadata: Metadata = {
  title: "AI Lawyer Chat — LawBite",
  description:
    "Interactive legal research assistant powered by Inception Mercury 2.5 dLLM with deterministic 157+ Indian bare acts verification and Good-Law precedent status checking.",
  keywords: [
    "Indian Legal Chat AI",
    "LawBite Chat",
    "Bare Acts AI",
    "BNS 2023",
    "Good Law Checker",
    "Legal Drafting Assistant",
  ],
  robots: { index: true, follow: true },
};

export default async function ChatPage({
  searchParams,
}: {
  searchParams: Promise<{
    shareId?: string;
    conversation?: string;
    caseId?: string;
    tool?: string;
    item?: string;
    modal?: string;
    cases?: string;
  }>;
}) {
  const params = await searchParams;
  const tool =
    params.tool === "templates" || params.tool === "filing"
      ? params.tool
      : null;
  const item = params.item ?? null;
  const caseId = params.caseId ?? null;
  const openCases =
    params.modal === "cases" ||
    params.modal === "ai-lawyer" ||
    params.cases === "true" ||
    params.cases === "open";

  let session = null;
  try {
    session = await auth.api.getSession({
      headers: await headers(),
    });
  } catch {
    session = null;
  }

  let caseName: string | null = null;
  if (caseId && session) {
    try {
      const folder = await db
        .selectFrom("case_folder")
        .select(["name"])
        .where("id", "=", caseId)
        .where("userId", "=", session.user.id)
        .executeTakeFirst();
      if (folder) {
        caseName = folder.name;
      }
    } catch (e) {
      console.error("Failed to fetch case name:", e);
    }
  }

  // A shared link is claimed on the server before the chat shell renders.
  if (params.shareId) {
    if (!session) {
      redirect(`/shared/${encodeURIComponent(params.shareId)}`);
    }

    let importedId: string | null = null;
    try {
      importedId = await claimSharedChat(session.user.id, params.shareId);
    } catch (error) {
      console.error("Failed to import shared chat:", error);
    }

    if (!importedId) {
      redirect(`/shared/${encodeURIComponent(params.shareId)}`);
    }

    const qs = new URLSearchParams({ conversation: importedId });
    if (caseId) qs.set("caseId", caseId);
    if (tool) qs.set("tool", tool);
    if (item) qs.set("item", item);
    if (openCases) qs.set("modal", "cases");
    redirect(`/chat?${qs.toString()}`);
  }

  const user = session
    ? {
        id: session.user.id,
        name: session.user.name,
        email: session.user.email,
        image: session.user.image ?? null,
      }
    : {
        id: "guest",
        name: "Guest Advocate",
        email: "guest@lawbite.local",
        image: null,
      };

  return (
    <ChatApp
      user={user}
      sessionId={session?.session?.id ?? null}
      initialConversationId={params.conversation ?? null}
      initialCaseId={caseId}
      initialCaseName={caseName}
      initialTool={tool}
      initialItem={item}
      initialOpenCases={openCases}
    />
  );
}
