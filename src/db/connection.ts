import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";

import * as schema from "./schema";

const DB_FILE = process.env.DATABASE_URL ?? "calzarte.db";

// Conexión única reutilizada (evita múltiples handles en dev/hot-reload).
const globalForDb = globalThis as unknown as {
  __sqlite?: Database.Database;
};

export const sqlite =
  globalForDb.__sqlite ??
  (() => {
    const conn = new Database(DB_FILE);
    conn.pragma("journal_mode = WAL");
    conn.pragma("foreign_keys = ON");
    return conn;
  })();

if (process.env.NODE_ENV !== "production") {
  globalForDb.__sqlite = sqlite;
}

export const db = drizzle(sqlite, { schema });
export { schema };
