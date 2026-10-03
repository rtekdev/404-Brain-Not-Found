import { Pool } from "pg";

const globalForPg = globalThis as unknown as { pool?: Pool };

export const db = globalForPg.pool
  ?? new Pool({ connectionString: process.env.DATABASE_URL, connectionTimeoutMillis: 3000 });

if (process.env.NODE_ENV_TYPE !== "production") globalForPg.pool = db;