import { existsSync, rmSync } from "node:fs";

/**
 * Borra el archivo SQLite (y sus ficheros WAL/SHM) para empezar de cero.
 * Tras ejecutarlo, correr `npm run db:migrate` y `npm run db:seed`.
 */
const DB_FILE = process.env.DATABASE_URL ?? "calzarte.db";

for (const f of [DB_FILE, `${DB_FILE}-wal`, `${DB_FILE}-shm`]) {
  if (existsSync(f)) {
    rmSync(f);
    console.log(`Eliminado: ${f}`);
  }
}
console.log("Base de datos reiniciada.");
