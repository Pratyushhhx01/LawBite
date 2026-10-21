import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { Pool } from "pg";
import { sql } from "kysely";
import { db } from "@/lib/db";
import {
  claimSharedChat,
  createSharedChat,
  getSharedChat,
  importedConversationId,
  isShareId,
  resolvePublicOrigin,
  shareRecordId,
} from "@/lib/shares";

const dbAvailable = await (async () => {
  try {
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false },
      connectionTimeoutMillis: 5000,
    });
    await pool.query("SELECT 1");
    await pool.end();
    return true;
  } catch {
    return false;
  }
})();

const describeDb = describe.skipIf(!dbAvailable);

describe("sharing helpers", () => {
  it("accepts only well-formed share UUIDs", () => {
    expect(isShareId("a4f1c2e8-3b7d-4c91-8e2a-1f6b5d7c9e03")).toBe(true);
    expect(isShareId("share-a4f1c2e8")).toBe(false);
    expect(isShareId("../../etc/passwd")).toBe(false);
    expect(isShareId(null)).toBe(false);
  });

  it("builds stable per-user imported conversation ids", () => {
    const shareId = "a4f1c2e8-3b7d-4c91-8e2a-1f6b5d7c9e03";
    const first = importedConversationId("user-one", shareId);
    const second = importedConversationId("user-one", shareId);
    const other = importedConversationId("user-two", shareId);

    expect(first).toBe(second);
    expect(first).not.toBe(other);
    expect(first).toMatch(/^shared-[a-f0-9]{24}$/);
  });

  it("prefers the configured public origin over the request origin", () => {
    expect(
      resolvePublicOrigin(
        "https://preview-example.vercel.app/api/share",
        "https://law-bite.vercel.app",
      ),
    ).toBe("https://law-bite.vercel.app");

    expect(
      resolvePublicOrigin(
        "https://preview-example.vercel.app/api/share",
        "not a valid url",
      ),
    ).toBe("https://preview-example.vercel.app");

    expect(
      resolvePublicOrigin(
        "https://law-bite.vercel.app/api/share",
        "http://localhost:3000",
      ),
    ).toBe("https://law-bite.vercel.app");

    expect(
      resolvePublicOrigin(
        "http://localhost:3000/api/share",
        "http://localhost:3000",
      ),
    ).toBe("http://localhost:3000");
  });

  it("namespaces public snapshots separately from user conversations", () => {
    const shareId = "a4f1c2e8-3b7d-4c91-8e2a-1f6b5d7c9e03";
    expect(shareRecordId(shareId)).toBe(`share-${shareId}`);
  });
});

describeDb("shared conversation persistence", () => {
  const suffix = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const sourceId = `test-share-source-${suffix}`;
  let userId = "";
  let shareId = "";
  let messageShareId = "";
  let importedId = "";

  beforeAll(async () => {
    const user = await db
      .selectFrom("user")
      .select("id")
      .limit(1)
      .executeTakeFirst();
    userId = user?.id ?? "";
  });

  afterAll(async () => {
    const ids = [
      sourceId,
      importedId,
      shareId ? shareRecordId(shareId) : "",
      messageShareId ? shareRecordId(messageShareId) : "",
    ].filter(Boolean);
    if (ids.length > 0) {
      await db.deleteFrom("conversation").where("id", "in", ids).execute();
    }
  });

  it("creates a public snapshot, reads it, and imports it idempotently", async () => {
    if (!userId) return;

    await db
      .insertInto("conversation")
      .values({
        id: sourceId,
        userId,
        title: "Shared test conversation",
        preview: "What is theft?",
        type: "talk-to-ai",
        pinned: false,
        folderId: null,
        messages: sql`${JSON.stringify([
          { id: "m1", role: "user", content: "What is theft?" },
          {
            id: "m2",
            role: "assistant",
            content: "Theft is defined under the Bharatiya Nyaya Sanhita.",
          },
        ])}::jsonb`,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .execute();

    const created = await createSharedChat({
      userId,
      userName: "Share Test User",
      conversationId: sourceId,
    });

    expect(created).not.toBeNull();
    shareId = created!.shareId;
    expect(isShareId(shareId)).toBe(true);

    const publicChat = await getSharedChat(shareId);
    expect(publicChat).not.toBeNull();
    expect(publicChat?.title).toBe("Shared test conversation");
    expect(publicChat?.sharedBy).toBe("Share Test User");
    expect(publicChat?.type).toBe("talk-to-ai");
    expect(publicChat?.scope).toBe("conversation");
    expect(publicChat?.messages).toHaveLength(2);
    expect(publicChat?.messages[1].content).toContain(
      "Bharatiya Nyaya Sanhita",
    );

    importedId = (await claimSharedChat(userId, shareId)) ?? "";
    expect(importedId).toBe(importedConversationId(userId, shareId));

    const imported = await db
      .selectFrom("conversation")
      .selectAll()
      .where("id", "=", importedId)
      .executeTakeFirst();

    expect(imported?.userId).toBe(userId);
    expect(imported?.title).toBe("Shared test conversation");
    expect(imported?.type).toBe("talk-to-ai");

    const again = await claimSharedChat(userId, shareId);
    expect(again).toBe(importedId);

    const copies = await db
      .selectFrom("conversation")
      .select("id")
      .where("userId", "=", userId)
      .where("id", "=", importedId)
      .execute();
    expect(copies).toHaveLength(1);
  });

  it("does not share a conversation owned by somebody else", async () => {
    const stranger = await createSharedChat({
      userId: "someone-else",
      conversationId: sourceId,
    });
    expect(stranger).toBeNull();
  });

  it("shares a single message and imports only that message", async () => {
    if (!userId) return;

    const created = await createSharedChat({
      userId,
      userName: "Share Test User",
      conversationId: sourceId,
      messageId: "m2",
    });

    expect(created).not.toBeNull();
    messageShareId = created!.shareId;
    expect(created!.chat.scope).toBe("message");
    expect(created!.chat.messages).toHaveLength(1);
    expect(created!.chat.messages[0].id).toBe("m2");
    expect(created!.chat.messages[0].role).toBe("assistant");

    const publicChat = await getSharedChat(messageShareId);
    expect(publicChat).not.toBeNull();
    expect(publicChat?.scope).toBe("message");
    expect(publicChat?.messages).toHaveLength(1);
    expect(publicChat?.messages[0].content).toContain(
      "Bharatiya Nyaya Sanhita",
    );

    const importedMessageId = await claimSharedChat(userId, messageShareId);
    expect(importedMessageId).toBe(
      importedConversationId(userId, messageShareId),
    );

    const imported = await db
      .selectFrom("conversation")
      .selectAll()
      .where("id", "=", importedMessageId ?? "")
      .executeTakeFirst();

    expect(imported?.userId).toBe(userId);
    const importedMessages = imported?.messages as unknown[];
    expect(Array.isArray(importedMessages)).toBe(true);
    expect(importedMessages).toHaveLength(1);

    // Clean up the imported copy so it does not linger in this user's history.
    if (importedMessageId) {
      await db
        .deleteFrom("conversation")
        .where("id", "=", importedMessageId)
        .where("userId", "=", userId)
        .execute();
    }
  });

  it("refuses to share a message id that is not in the conversation", async () => {
    if (!userId) return;

    const created = await createSharedChat({
      userId,
      userName: "Share Test User",
      conversationId: sourceId,
      messageId: "does-not-exist",
    });

    expect(created).toBeNull();
  });
});
