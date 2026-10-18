import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { Pool } from "pg";

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

describeDb("Database Connection", () => {
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

  it("should connect to Neon database", async () => {
    const client = await pool.connect();
    expect(client).toBeDefined();
    client.release();
  });

  it("should have the user table", async () => {
    const result = await pool.query(
      `SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_name = 'user'
      ) as exists`,
    );
    expect(result.rows[0].exists).toBe(true);
  });

  it("should have the session table", async () => {
    const result = await pool.query(
      `SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_name = 'session'
      ) as exists`,
    );
    expect(result.rows[0].exists).toBe(true);
  });

  it("should have the account table", async () => {
    const result = await pool.query(
      `SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_name = 'account'
      ) as exists`,
    );
    expect(result.rows[0].exists).toBe(true);
  });

  it("should have the verification table", async () => {
    const result = await pool.query(
      `SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_name = 'verification'
      ) as exists`,
    );
    expect(result.rows[0].exists).toBe(true);
  });

  it("should have correct columns on user table", async () => {
    const result = await pool.query(
      `SELECT column_name, data_type
       FROM information_schema.columns
       WHERE table_name = 'user'
       ORDER BY ordinal_position`,
    );
    const columns = result.rows.map(
      (r: { column_name: string }) => r.column_name,
    );
    expect(columns).toContain("id");
    expect(columns).toContain("email");
    expect(columns).toContain("name");
    expect(columns).toContain("emailVerified");
    expect(columns).toContain("image");
  });

  it("should have correct columns on session table", async () => {
    const result = await pool.query(
      `SELECT column_name, data_type
       FROM information_schema.columns
       WHERE table_name = 'session'
       ORDER BY ordinal_position`,
    );
    const columns = result.rows.map(
      (r: { column_name: string }) => r.column_name,
    );
    expect(columns).toContain("id");
    expect(columns).toContain("token");
    expect(columns).toContain("userId");
    expect(columns).toContain("expiresAt");
  });

  it("should have correct columns on account table", async () => {
    const result = await pool.query(
      `SELECT column_name, data_type
       FROM information_schema.columns
       WHERE table_name = 'account'
       ORDER BY ordinal_position`,
    );
    const columns = result.rows.map(
      (r: { column_name: string }) => r.column_name,
    );
    expect(columns).toContain("id");
    expect(columns).toContain("accountId");
    expect(columns).toContain("providerId");
    expect(columns).toContain("userId");
  });

  it("should have indexes on session.userId", async () => {
    const result = await pool.query(
      `SELECT EXISTS (
        SELECT FROM pg_indexes
        WHERE tablename = 'session' AND indexname = 'idx_session_userid'
      ) as exists`,
    );
    expect(result.rows[0].exists).toBe(true);
  });

  it("should have indexes on account.userId", async () => {
    const result = await pool.query(
      `SELECT EXISTS (
        SELECT FROM pg_indexes
        WHERE tablename = 'account' AND indexname = 'idx_account_userid'
      ) as exists`,
    );
    expect(result.rows[0].exists).toBe(true);
  });

  it("should have the database URL configured", () => {
    expect(process.env.DATABASE_URL).toBeDefined();
    expect(process.env.DATABASE_URL).toContain("neon.tech");
  });
});
