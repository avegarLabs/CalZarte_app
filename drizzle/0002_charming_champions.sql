PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_precio` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`producto_id` integer NOT NULL,
	`valor_cents` integer NOT NULL,
	`moneda` text NOT NULL,
	`status` text DEFAULT 'ACTIVE' NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`producto_id`) REFERENCES `producto`(`id`) ON UPDATE no action ON DELETE cascade,
	CONSTRAINT "precio_valor_positivo" CHECK("__new_precio"."valor_cents" > 0),
	CONSTRAINT "precio_moneda_valida" CHECK("__new_precio"."moneda" IN ('CUP', 'USD', 'EUR')),
	CONSTRAINT "precio_status_valido" CHECK("__new_precio"."status" IN ('ACTIVE', 'INACTIVE'))
);
--> statement-breakpoint
INSERT INTO `__new_precio`("id", "producto_id", "valor_cents", "moneda", "status", "created_at", "updated_at") SELECT "id", "producto_id", "valor_cents", "moneda", "status", "created_at", "updated_at" FROM `precio`;--> statement-breakpoint
DROP TABLE `precio`;--> statement-breakpoint
ALTER TABLE `__new_precio` RENAME TO `precio`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE UNIQUE INDEX `precio_activo_unico_por_producto` ON `precio` (`producto_id`) WHERE "precio"."status" = 'ACTIVE';--> statement-breakpoint
CREATE TABLE `__new_tasa_cambio` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`moneda` text NOT NULL,
	`valor_cents` integer NOT NULL,
	`status` text DEFAULT 'ACTIVE' NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	CONSTRAINT "tasa_valor_positivo" CHECK("__new_tasa_cambio"."valor_cents" > 0),
	CONSTRAINT "tasa_moneda_valida" CHECK("__new_tasa_cambio"."moneda" IN ('CUP', 'USD', 'EUR')),
	CONSTRAINT "tasa_status_valido" CHECK("__new_tasa_cambio"."status" IN ('ACTIVE', 'INACTIVE'))
);
--> statement-breakpoint
INSERT INTO `__new_tasa_cambio`("id", "moneda", "valor_cents", "status", "created_at", "updated_at") SELECT "id", "moneda", "valor_cents", "status", "created_at", "updated_at" FROM `tasa_cambio`;--> statement-breakpoint
DROP TABLE `tasa_cambio`;--> statement-breakpoint
ALTER TABLE `__new_tasa_cambio` RENAME TO `tasa_cambio`;--> statement-breakpoint
CREATE UNIQUE INDEX `tasa_activa_unica_por_moneda` ON `tasa_cambio` (`moneda`) WHERE "tasa_cambio"."status" = 'ACTIVE';