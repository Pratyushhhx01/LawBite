import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { sql } from "kysely";

const ALLOWED_TYPES = [
  "talk-to-ai",
  "chat",
  "analysis",
  "grill",
  "draft",
  "review",
];

type ConversationMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  type?: string;
  documentName?: string;
};

async function getSessionUser(request: NextRequest) {
  const session = await auth.api.getSession({ headers: request.headers });
  return session?.user ?? null;
}

export async function GET(request: NextRequest) {
  try {
    const user = await getSessionUser(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await db
      .deleteFrom("conversation")
      .where("userId", "=", user.id)
      .where(
        sql<boolean>`coalesce(case when jsonb_typeof(messages) = 'array' then jsonb_array_length(messages) else 1 end, 1) = 0`,
      )
      .execute();

    const rows = await db
      .selectFrom("conversation")
      .selectAll()
      .where("userId", "=", user.id)
      .orderBy("pinned", "desc")
      .orderBy("updatedAt", "desc")
      .execute();

    const conversations = rows
      .map((r) => ({
        id: r.id,
        title: r.title,
        preview: r.preview,
        type: r.type,
        pinned: r.pinned,
        folderId: r.folderId,
        createdAt: new Date(r.createdAt).getTime(),
        messages: (r.messages as ConversationMessage[]) ?? [],
      }))
      .filter((c) => Array.isArray(c.messages) && c.messages.length > 0);

    return NextResponse.json({ conversations });
  } catch (err) {
    console.error("Conversations GET error:", err);
    return NextResponse.json(
      { error: "Failed to load conversations" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getSessionUser(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json().catch(() => null);
    const items = Array.isArray(body?.conversations)
      ? body.conversations
      : null;
    if (!items) {
      return NextResponse.json({ error: "Invalid body" }, { status: 400 });
    }
    if (items.length > 500) {
      return NextResponse.json(
        { error: "Too many conversations" },
        { status: 400 },
      );
    }

    for (const item of items) {
      if (!item || typeof item.id !== "string" || !item.id) continue;

      const type = ALLOWED_TYPES.includes(item.type) ? item.type : "talk-to-ai";
      const title =
        typeof item.title === "string" && item.title.trim()
          ? item.title.slice(0, 200)
          : "New conversation";
      const preview =
        typeof item.preview === "string" ? item.preview.slice(0, 500) : "";
      const pinned = item.pinned === true;
      const folderId =
        typeof item.folderId === "string" && item.folderId
          ? item.folderId
          : null;
      const messages = Array.isArray(item.messages) ? item.messages : [];
      if (messages.length === 0) continue;
      const createdAt = item.createdAt ? new Date(item.createdAt) : new Date();

      await db
        .insertInto("conversation")
        .values({
          id: item.id,
          userId: user.id,
          title,
          preview,
          type,
          pinned,
          folderId,
          messages: sql`${JSON.stringify(messages)}::jsonb`,
          createdAt,
          updatedAt: new Date(),
        })
        .onConflict((oc) =>
          oc.column("id").doUpdateSet({
            title,
            preview,
            type,
            pinned,
            folderId,
            messages: sql`${JSON.stringify(messages)}::jsonb`,
            updatedAt: new Date(),
          }),
        )
        .execute();
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Conversations POST error:", err);
    return NextResponse.json(
      { error: "Failed to save conversations" },
      { status: 500 },
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const user = await getSessionUser(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json().catch(() => null);
    const ids = Array.isArray(body?.ids)
      ? body.ids.filter((i: unknown) => typeof i === "string" && i.length > 0)
      : [];
    if (ids.length === 0) {
      return NextResponse.json({ error: "Invalid body" }, { status: 400 });
    }

    await db
      .deleteFrom("conversation")
      .where("id", "in", ids)
      .where("userId", "=", user.id)
      .execute();

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Conversations DELETE error:", err);
    return NextResponse.json(
      { error: "Failed to delete conversations" },
      { status: 500 },
    );
  }
}
