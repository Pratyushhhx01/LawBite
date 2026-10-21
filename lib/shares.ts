import { createHash, randomUUID } from "node:crypto";
import { sql } from "kysely";
import { db } from "@/lib/db";

export type SharedRole = "user" | "assistant";

/**
 * What a public snapshot contains: the whole conversation, or just one message
 * that the sender picked from it. A message share deliberately hides the rest
 * of the conversation, and the recipient continues from that single message.
 */
export type ShareScope = "conversation" | "message";

export type SharedMessage = {
  id?: string;
  role: SharedRole;
  content: string;
  type?: string;
  documentName?: string;
  citations?: unknown;
};

export type SharedChat = {
  title: string;
  type: string;
  messages: SharedMessage[];
  sharedBy: string;
  sharedAt: string;
  scope: ShareScope;
};

const SHARE_ID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const CONVERSATION_TYPES = [
  "chat",
  "analysis",
  "talk-to-ai",
  "grill",
  "draft",
  "review",
] as const;

const MAX_SHARED_MESSAGES = 500;

/** True for a well-formed share UUID. */
export function isShareId(value: unknown): value is string {
  return typeof value === "string" && SHARE_ID_PATTERN.test(value);
}

/** Primary key used for the public snapshot row in the conversation table. */
export function shareRecordId(shareId: string): string {
  return `share-${shareId}`;
}

/**
 * Deterministic id for the copy that a signed-in user receives when they
 * continue a shared chat. Hashing the recipient means the same user always
 * lands on the same imported conversation instead of piling up duplicates.
 */
export function importedConversationId(
  userId: string,
  shareId: string,
): string {
  const digest = createHash("sha256")
    .update(`lawbite-shared:${userId}:${shareId}`)
    .digest("hex")
    .slice(0, 24);
  return `shared-${digest}`;
}

/**
 * Canonical public origin for share links. Prefers the configured app URL so
 * links generated from a preview/local checkout still point at the real site
 * when `NEXT_PUBLIC_APP_URL` is set, and falls back to the incoming request.
 * If the configured URL is localhost but the share was generated from a public
 * deployment, the request origin wins so a bad env value cannot produce a
 * localhost share link in production.
 */
export function resolvePublicOrigin(
  requestUrl: string,
  configured?: string | null,
): string {
  let requestOrigin = "";
  try {
    requestOrigin = new URL(requestUrl).origin;
  } catch {
    /* leave empty */
  }

  const candidate = configured?.trim();
  if (candidate) {
    try {
      const url = new URL(candidate);
      if (url.protocol === "http:" || url.protocol === "https:") {
        if (
          isLocalOrigin(url.origin) &&
          requestOrigin &&
          !isLocalOrigin(requestOrigin)
        ) {
          return requestOrigin;
        }
        return url.origin;
      }
    } catch {
      /* fall through to the request origin */
    }
  }

  return requestOrigin;
}

function isLocalOrigin(origin: string): boolean {
  try {
    const hostname = new URL(origin).hostname.toLowerCase();
    return (
      hostname === "localhost" ||
      hostname === "127.0.0.1" ||
      hostname === "::1" ||
      hostname.endsWith(".local")
    );
  } catch {
    return false;
  }
}

function normalizeType(value: unknown): string {
  return typeof value === "string" &&
    (CONVERSATION_TYPES as readonly string[]).includes(value)
    ? value
    : "chat";
}

function normalizeMessage(value: unknown): SharedMessage | null {
  if (!value || typeof value !== "object") return null;
  const record = value as Record<string, unknown>;
  const content = typeof record.content === "string" ? record.content : "";
  const role: SharedRole = record.role === "assistant" ? "assistant" : "user";

  const message: SharedMessage = { role, content };
  if (typeof record.id === "string" && record.id.trim()) {
    message.id = record.id;
  }
  if (typeof record.type === "string" && record.type.trim()) {
    message.type = record.type;
  }
  if (typeof record.documentName === "string" && record.documentName.trim()) {
    message.documentName = record.documentName;
  }
  if (Array.isArray(record.citations)) {
    message.citations = record.citations;
  }
  return message;
}

function normalizeMessages(value: unknown): SharedMessage[] {
  if (!Array.isArray(value)) return [];
  return value
    .map(normalizeMessage)
    .filter((message): message is SharedMessage => message !== null)
    .slice(0, MAX_SHARED_MESSAGES);
}

function parseStoredMessages(value: unknown): unknown {
  if (typeof value !== "string") return value;
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

/**
 * Create an immutable public snapshot of one of the caller's conversations.
 * When `messageId` is given the snapshot contains only that one message (a
 * "message share"); otherwise it contains the whole conversation. Returns null
 * when the conversation/message is missing, empty, or not owned by the caller
 * so the route can surface a single 404 without leaking existence.
 */
export async function createSharedChat(params: {
  userId: string;
  userName?: string | null;
  conversationId: string;
  messageId?: string | null;
}): Promise<{ shareId: string; chat: SharedChat } | null> {
  const { userId, userName, conversationId } = params;
  if (!conversationId || conversationId.startsWith("share-")) return null;

  const conversation = await db
    .selectFrom("conversation")
    .select(["id", "title", "messages", "type"])
    .where("id", "=", conversationId)
    .where("userId", "=", userId)
    .where("type", "!=", "shared")
    .executeTakeFirst();

  if (!conversation) return null;

  const allMessages = normalizeMessages(conversation.messages);
  if (allMessages.length === 0) return null;

  const requestedMessageId =
    typeof params.messageId === "string" && params.messageId.trim()
      ? params.messageId.trim()
      : null;

  let messages = allMessages;
  let scope: ShareScope = "conversation";
  if (requestedMessageId) {
    const target = allMessages.find(
      (message) => message.id === requestedMessageId,
    );
    if (!target) return null;
    messages = [target];
    scope = "message";
  }

  const title =
    typeof conversation.title === "string" && conversation.title.trim()
      ? conversation.title.trim().slice(0, 200)
      : "Shared conversation";

  const chat: SharedChat = {
    title,
    type: normalizeType(conversation.type),
    messages,
    sharedBy:
      typeof userName === "string" && userName.trim()
        ? userName.trim().slice(0, 80)
        : "A Lawbite user",
    sharedAt: new Date().toISOString(),
    scope,
  };

  const shareId = randomUUID();
  await db
    .insertInto("conversation")
    .values({
      id: shareRecordId(shareId),
      userId,
      title: `[Shared] ${title}`.slice(0, 200),
      preview:
        scope === "message" ? "Shared message" : "Shared conversation",
      type: "shared",
      pinned: false,
      folderId: null,
      messages: sql`${JSON.stringify(chat)}::jsonb`,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    .execute();

  return { shareId, chat };
}

/** Read a public share snapshot. Safe to call without a session. */
export async function getSharedChat(
  shareId: string,
): Promise<SharedChat | null> {
  if (!isShareId(shareId)) return null;

  const row = await db
    .selectFrom("conversation")
    .select(["title", "messages"])
    .where("id", "=", shareRecordId(shareId))
    .where("type", "=", "shared")
    .executeTakeFirst();

  if (!row) return null;

  const parsed = parseStoredMessages(row.messages);
  const payload =
    parsed && typeof parsed === "object" && !Array.isArray(parsed)
      ? (parsed as Record<string, unknown>)
      : null;
  const rawMessages = Array.isArray(parsed) ? parsed : payload?.messages;
  const messages = normalizeMessages(rawMessages);
  if (messages.length === 0) return null;

  const storedTitle =
    payload && typeof payload.title === "string" && payload.title.trim()
      ? payload.title.trim()
      : typeof row.title === "string"
        ? row.title.replace(/^\[Shared\]\s*/i, "")
        : "Shared conversation";

  return {
    title: storedTitle.slice(0, 200) || "Shared conversation",
    type: normalizeType(payload?.type),
    messages,
    sharedBy:
      payload && typeof payload.sharedBy === "string" && payload.sharedBy.trim()
        ? payload.sharedBy.trim().slice(0, 80)
        : "A Lawbite user",
    sharedAt:
      payload && typeof payload.sharedAt === "string"
        ? payload.sharedAt
        : new Date().toISOString(),
    scope: payload?.scope === "message" ? "message" : "conversation",
  };
}

/**
 * Import a shared chat into a signed-in user's account, exactly once. Returns
 * the imported conversation id, or null when the share link is invalid.
 */
export async function claimSharedChat(
  userId: string,
  shareId: string,
): Promise<string | null> {
  const chat = await getSharedChat(shareId);
  if (!chat) return null;

  const id = importedConversationId(userId, shareId);
  const existing = await db
    .selectFrom("conversation")
    .select("id")
    .where("id", "=", id)
    .where("userId", "=", userId)
    .executeTakeFirst();
  if (existing) return existing.id;

  const messages = chat.messages.map((message, index) => ({
    id:
      message.id && message.id.trim()
        ? message.id
        : `shared-${shareId.slice(0, 8)}-${index}`,
    role: message.role,
    content: message.content,
    ...(message.type ? { type: message.type } : {}),
    ...(message.documentName ? { documentName: message.documentName } : {}),
    ...(message.citations ? { citations: message.citations } : {}),
  }));

  const firstUserMessage = messages.find((message) => message.role === "user");
  const previewSource =
    firstUserMessage?.content ?? messages[0]?.content ?? "Shared chat";

  await db
    .insertInto("conversation")
    .values({
      id,
      userId,
      title: chat.title.slice(0, 200),
      preview:
        previewSource.replace(/\s+/g, " ").trim().slice(0, 500) ||
        "Shared chat",
      type: normalizeType(chat.type),
      pinned: false,
      folderId: null,
      messages: sql`${JSON.stringify(messages)}::jsonb`,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    .onConflict((oc) => oc.column("id").doNothing())
    .execute();

  const inserted = await db
    .selectFrom("conversation")
    .select("id")
    .where("id", "=", id)
    .where("userId", "=", userId)
    .executeTakeFirst();

  return inserted?.id ?? null;
}
