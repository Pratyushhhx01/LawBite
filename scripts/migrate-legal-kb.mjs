import { Pool } from "pg";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

async function migrate() {
  try {
    console.log("Enabling vector extension...");
    await pool.query("CREATE EXTENSION IF NOT EXISTS vector;");

    console.log("Creating legal_chunks table...");
    await pool.query(`
      CREATE TABLE IF NOT EXISTS legal_chunks (
        id TEXT PRIMARY KEY,
        category VARCHAR(32) NOT NULL,
        act_id VARCHAR(128) NOT NULL,
        act_title TEXT NOT NULL,
        provision VARCHAR(64) NOT NULL,
        title TEXT NOT NULL,
        year INTEGER,
        court VARCHAR(64),
        content TEXT NOT NULL,
        embedding vector(768),
        tsv_content tsvector GENERATED ALWAYS AS (to_tsvector('english', title || ' ' || content)) STORED,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);

    console.log("Creating indexes...");
    await pool.query(`
      CREATE INDEX IF NOT EXISTS legal_chunks_tsv_idx ON legal_chunks USING gin (tsv_content);
    `);
    await pool.query(`
      CREATE INDEX IF NOT EXISTS legal_chunks_act_prov_idx ON legal_chunks (act_id, provision);
    `);
    await pool.query(`
      CREATE INDEX IF NOT EXISTS legal_chunks_embedding_hnsw 
      ON legal_chunks USING hnsw (embedding vector_cosine_ops) 
      WITH (m = 16, ef_construction = 64);
    `);

    console.log("Migration successful: legal_chunks and indexes created!");
  } catch (err) {
    console.error("Migration failed:", err);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

migrate();
