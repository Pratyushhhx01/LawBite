import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { claimSharedChat } from "@/lib/shares";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import ChatApp from "./_components/ChatApp";

export const metadata: Metadata = {
  title: "Chat — Lawbite",
  description: "Chat with the Lawbite assistant.",
  robots: { index: false, follow: false },
};

export default async function ChatPage({
  searchParams,
}: {
  searchParams: Promise<{
    shareId?: string;
    conversation?: string;
    tool?: string;
    item?: string;
  }>;
}) {
  const params = await searchParams;
  const tool =
    params.tool === "templates" || params.tool === "filing"
      ? params.tool
      : null;
  const item = params.item ?? null;

  let session;
  try {
    session = await auth.api.getSession({
      headers: await headers(),
    });
  } catch {
    session = null;
  }

  if (!session) {
    const qs = new URLSearchParams();
    if (params.shareId) qs.set("shareId", params.shareId);
    if (params.conversation) qs.set("conversation", params.conversation);
    if (tool) qs.set("tool", tool);
    if (item) qs.set("item", item);
    const query = qs.toString();
    redirect(
      `/signin?next=${encodeURIComponent(`/chat${query ? `?${query}` : ""}`)}`,
    );
  }

  // A shared link is claimed on the server before the chat shell renders. That
  // makes the import idempotent and guarantees the conversation is in the
  // normal history fetch instead of racing it in the browser.
  if (params.shareId) {
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
    if (tool) qs.set("tool", tool);
    if (item) qs.set("item", item);
    redirect(`/chat?${qs.toString()}`);
  }

  return (
    <ChatApp
      user={{
        id: session.user.id,
        name: session.user.name,
        email: session.user.email,
        image: session.user.image ?? null,
      }}
      sessionId={session.session.id}
      initialConversationId={params.conversation ?? null}
      initialTool={tool}
      initialItem={item}
    />
  );
}
