import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { checkRateLimit } from "@/lib/utils";
import {
  fallbackConversationTitle,
  isPlaceholderConversationTitle,
  type ConversationTitleInput,
} from "@/lib/conversation-title";
import { generateConversationTitle } from "@/lib/conversation-title-server";

export const runtime = "nodejs";

type ConversationRow = {
  title: string;
  messages: unknown;
};

type TitleRequest = ConversationTitleInput & {
  conversationId: string;
  /**
   * Set by the chat client only when it has put its deterministic fallback on
   * screen. Lets the server replace that fallback without ever clobbering a
   * real title such as a drafter template.
   */
  allowTitleReplacement?: boolean;
};

/** In-process de-duplication for the same user + conversation. */
const inFlightTitles = new Map<string, Promise<string>>();

function countUserMessages(messages: unknown): number {
  if (!Array.isArray(messages)) return 0;
  return messages.filter(
    (message) =>
      message &&
      typeof message === "object" &&
      (message as { role?: unknown }).role === "user",
  ).length;
}

async function readConversation(
  userId: string,
  conversationId: string,
): Promise<ConversationRow | null> {
  try {
    const row = await db
      .selectFrom("conversation")
      .select(["title", "messages"])
      .where("id", "=", conversationId)
      .where("userId", "=", userId)
      .executeTakeFirst();
    return row ?? null;
  } catch (error) {
    console.error("Conversation title lookup error:", error);
    return null;
  }
}

async function saveGeneratedTitle(
  userId: string,
  conversationId: string,
  currentTitle: string,
  title: string,
): Promise<string> {
  try {
    // Conditional update: never overwrite a user rename or a title another
    // request already generated. Do not touch `updatedAt` so history ordering
    // stays exactly as it was.
    await db
      .updateTable("conversation")
      .set({ title })
      .where("id", "=", conversationId)
      .where("userId", "=", userId)
      .where("title", "=", currentTitle)
      .execute();

    const row = await db
      .selectFrom("conversation")
      .select("title")
      .where("id", "=", conversationId)
      .where("userId", "=", userId)
      .executeTakeFirst();
    return row?.title?.trim() || title;
  } catch (error) {
    console.error("Conversation title save error:", error);
    return title;
  }
}

async function resolveTitle(
  userId: string,
  request: TitleRequest,
): Promise<string> {
  const fallback = fallbackConversationTitle(request.message, {
    conversationType: request.conversationType,
    attachmentName: request.attachmentName,
  });

  const row = await readConversation(userId, request.conversationId);

  if (row) {
    const currentTitle = row.title?.trim() ?? "";
    const stillNeedsTitle =
      isPlaceholderConversationTitle(currentTitle) ||
      (request.allowTitleReplacement === true && currentTitle === fallback);

    // A conversation that already has a real title — whether generated, user
    // renamed or a drafter template name — must never be retitled.
    if (!stillNeedsTitle) return currentTitle;

    // Safety valve for old or unusual conversations: only the first user turn
    // may name the thread.
    if (countUserMessages(row.messages) > 1) {
      return currentTitle || fallback;
    }

    const generated =
      (await generateConversationTitle(request).catch(() => null)) ?? fallback;
    return saveGeneratedTitle(
      userId,
      request.conversationId,
      currentTitle,
      generated,
    );
  }

  // The first conversation sync is debounced, so the row may not exist yet.
  // Return the title; the client's normal sync persists it.
  return (
    (await generateConversationTitle(request).catch(() => null)) ?? fallback
  );
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    const user = session?.user;
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const rateLimit = checkRateLimit(`conversation-title:${user.id}`, 30, 60_000);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: "Too many title requests" },
        { status: 429 },
      );
    }

    const body = await request.json().catch(() => null);
    const conversationId =
      typeof body?.conversationId === "string"
        ? body.conversationId.trim().slice(0, 200)
        : "";
    const message =
      typeof body?.message === "string"
        ? body.message.trim().slice(0, 2_000)
        : "";

    if (!conversationId || !message) {
      return NextResponse.json(
        { error: "conversationId and message are required" },
        { status: 400 },
      );
    }

    const conversationType =
      typeof body?.conversationType === "string"
        ? body.conversationType.trim().slice(0, 40)
        : "chat";
    const attachmentName =
      typeof body?.attachmentName === "string"
        ? body.attachmentName.trim().slice(0, 200)
        : null;
    const allowTitleReplacement = body?.allowTitleReplacement === true;

    const key = `${user.id}:${conversationId}`;
    let pending = inFlightTitles.get(key);
    if (!pending) {
      pending = resolveTitle(user.id, {
        conversationId,
        message,
        conversationType,
        attachmentName,
        allowTitleReplacement,
      }).catch(() =>
        fallbackConversationTitle(message, {
          conversationType,
          attachmentName,
        }),
      );
      inFlightTitles.set(key, pending);
      pending.finally(() => {
        if (inFlightTitles.get(key) === pending) inFlightTitles.delete(key);
      });
    }

    const title = await pending;
    return NextResponse.json({ title });
  } catch (error) {
    console.error("Conversation title error:", error);
    return NextResponse.json(
      { error: "Failed to generate conversation title" },
      { status: 500 },
    );
  }
}
