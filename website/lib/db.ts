import { Pool } from "pg";

const globalForPg = globalThis as unknown as { pool?: Pool };
const u = new URL(process.env.DATABASE_URL!);
console.log(u.hostname, u.port, u.pathname);

export const db = globalForPg.pool
  ?? new Pool({ connectionString: process.env.DATABASE_URL });

if (process.env.NODE_ENV_TYPE !== "production") globalForPg.pool = db;