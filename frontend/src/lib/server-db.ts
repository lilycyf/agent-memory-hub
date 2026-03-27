import "server-only";

import { Pool } from "pg";

const globalForPg = globalThis as typeof globalThis & {
  __memoryRouterPgPool?: Pool;
};

export function getPool(): Pool | null {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) return null;

  try {
    if (!globalForPg.__memoryRouterPgPool) {
      globalForPg.__memoryRouterPgPool = new Pool({
        connectionString,
        ssl: { rejectUnauthorized: false },
        max: 5,
        idleTimeoutMillis: 10_000,
      });
    }
  } catch {
    return null;
  }

  return globalForPg.__memoryRouterPgPool;
}
