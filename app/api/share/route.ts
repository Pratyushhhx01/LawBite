import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { sql } from "kysely";

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { conversationId } = await request.json();
    if (!conversationId) {
      return NextResponse.json(
        { error: "conversationId required" },
        { status: 400 },
      );
    }

    const conversation = await db
      .selectFrom("conversation")
      .where("id", "=", conversationId)
      .where("userId", "=", session.user.id)
      .select(["id", "title", "messages", "type"])
      .executeTakeFirst();

    if (!conversation) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const shareId = crypto.randomUUID();
    const messages = conversation.messages as {
      role: string;
      content: string;
    }[];
    const exportData = JSON.stringify({
      title: conversation.title,
      type: conversation.type,
      messages,
      sharedBy: session.user.name || "Anonymous",
      sharedAt: new Date().toISOString(),
    });

    await sql`
      INSERT INTO conversation (id, "userId", title, preview, type, pinned, messages, "folderId", "createdAt", "updatedAt")
      VALUES (${"share-" + shareId}, ${session.user.id}, ${`[Shared] ${conversation.title}`}, ${"Shared conversation"}, ${"shared"}, ${false}, ${exportData}::jsonb, ${null}, ${new Date()}, ${new Date()})
      ON CONFLICT (id) DO NOTHING
    `.execute(db);

    return NextResponse.json({ shareId, url: `/shared/${shareId}` });
  } catch (error) {
    console.error("Share error:", error);
    return NextResponse.json({ error: "Failed to share" }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const shareId = url.searchParams.get("id");
    if (!shareId) {
      return NextResponse.json({ error: "Share ID required" }, { status: 400 });
    }

    const results = await sql<{ messages: string; title: string }>`
      SELECT messages, title FROM conversation WHERE id = ${"share-" + shareId}
    `.execute(db);

    const result = results.rows[0];

    if (!result) {
      return NextResponse.json(
        { error: "Share link expired or invalid" },
        { status: 404 },
      );
    }

    const data = JSON.parse(result.messages);
    return NextResponse.json(data);
  } catch (error) {
    console.error("Get share error:", error);
    return NextResponse.json(
      { error: "Failed to load shared conversation" },
      { status: 500 },
    );
  }
}
