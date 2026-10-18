import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { Pool } from "pg";
import { db } from "@/lib/db";
import { sql } from "kysely";

// Probe DB once at module load; skip all DB tests if unreachable
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

describeDb("Conversations — Schema", () => {
  let pool: Pool;

  beforeAll(() => {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false },
    });
  });

  afterAll(async () => {
    await pool.end();
  });

  it("should have the conversation table", async () => {
    const result = await pool.query(
      `SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_name = 'conversation'
      ) as exists`,
    );
    expect(result.rows[0].exists).toBe(true);
  });

  it("should have correct columns on conversation table", async () => {
    const result = await pool.query(
      `SELECT column_name, data_type
       FROM information_schema.columns
       WHERE table_name = 'conversation'
       ORDER BY ordinal_position`,
    );
    const columns = result.rows.map(
      (r: { column_name: string }) => r.column_name,
    );
    expect(columns).toContain("id");
    expect(columns).toContain("userId");
    expect(columns).toContain("title");
    expect(columns).toContain("preview");
    expect(columns).toContain("type");
    expect(columns).toContain("pinned");
    expect(columns).toContain("messages");
    expect(columns).toContain("createdAt");
    expect(columns).toContain("updatedAt");
  });

  it("should have an index on conversation.userId", async () => {
    const result = await pool.query(
      `SELECT EXISTS (
        SELECT FROM pg_indexes
        WHERE tablename = 'conversation' AND indexname = 'conversation_user_id_idx'
      ) as exists`,
    );
    expect(result.rows[0].exists).toBe(true);
  });
});

describeDb("Conversations — Kysely round-trip", () => {
  const testId = `test-${Date.now()}`;

  afterAll(async () => {
    if (testId) {
      await db.deleteFrom("conversation").where("id", "=", testId).execute();
    }
    await db.destroy();
  });

  it("should insert, read back, and delete a conversation", async () => {
    const users = await db.selectFrom("user").select("id").limit(1).execute();

    if (users.length === 0) {
      // No user rows to attach to — nothing to exercise
      return;
    }

    const userId = users[0].id;
    const messages = [
      { id: "m1", role: "user", content: "What is theft?" },
      { id: "m2", role: "assistant", content: "Under BNS Section 303…" },
    ];

    await db
      .insertInto("conversation")
      .values({
        id: testId,
        userId,
        title: "Test conversation",
        preview: "What is theft?",
        type: "talk-to-ai",
        pinned: true,
        messages: sql`${JSON.stringify(messages)}::jsonb`,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .execute();

    const row = await db
      .selectFrom("conversation")
      .selectAll()
      .where("id", "=", testId)
      .executeTakeFirst();

    expect(row).toBeDefined();
    expect(row!.title).toBe("Test conversation");
    expect(row!.pinned).toBe(true);
    const stored = row!.messages as {
      id: string;
      role: string;
      content: string;
    }[];
    expect(stored).toHaveLength(2);
    expect(stored[0].role).toBe("user");
    expect(stored[1].content).toContain("BNS");

    const deleted = await db
      .deleteFrom("conversation")
      .where("id", "=", testId)
      .execute();
    expect(Number(deleted[0].numDeletedRows)).toBe(1);
  });
});
