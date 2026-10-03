import { Pool } from "pg";

const globalForPg = globalThis as unknown as { pool?: Pool };

function createPool(): Pool {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL, connectionTimeoutMillis: 3000 });
  // Bez tego zerwane bezczynne połączenie (np. restart bazy) to nieobsłużony 'error' — proces Node pada.
  pool.on("error", (err) => console.error("Postgres: błąd bezczynnego połączenia", err.message));
  return pool;
}

export const db = globalForPg.pool ?? createPool();

// W trybie deweloperskim HMR przeładowuje moduły — jedna pula na proces.
if (process.env.NODE_ENV !== "production") globalForPg.pool = db;
