import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "./schema";

const { Pool } = pg;

// Database is optional for local development
// If DATABASE_URL is not set, we'll return null and let the API handle it
export type DbClient = NodePgDatabase<typeof schema>;

let _pool: pg.Pool | null = null;
let _db: DbClient | null = null;

if (process.env.DATABASE_URL) {
  _pool = new Pool({ connectionString: process.env.DATABASE_URL });
  _db = drizzle(_pool, { schema });
}

export const pool = _pool;
export const db = _db;

export * from "./schema";