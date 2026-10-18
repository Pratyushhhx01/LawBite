import type { Metadata } from "next";
import { auth } from "@/lib/auth";
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
  searchParams: Promise<{ shareId?: string; tool?: string; item?: string }>;
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
    if (tool) qs.set("tool", tool);
    if (item) qs.set("item", item);
    const query = qs.toString();
    redirect(
      `/signin?next=${encodeURIComponent(`/chat${query ? `?${query}` : ""}`)}`,
    );
  }

  return (
    <ChatApp
      user={{
        id: session.user.id,
        name: session.user.name,
        email: session.user.email,
        image: session.user.image ?? null,
      }}
      shareId={params.shareId ?? null}
      initialTool={tool}
      initialItem={item}
    />
  );
}
