import { migrate } from "drizzle-orm/better-sqlite3/migrator";

import { db, sqlite } from "./connection";

console.log("Aplicando migraciones...");
migrate(db, { migrationsFolder: "./drizzle" });
console.log("Migraciones aplicadas correctamente.");
sqlite.close();
