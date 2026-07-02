CREATE TABLE `caja` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`fecha` integer NOT NULL,
	`notas` text,
	`status` text DEFAULT 'OPEN' NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	CONSTRAINT "caja_status_valido" CHECK("caja"."status" IN ('OPEN', 'CLOSED'))
);
--> statement-breakpoint
CREATE TABLE `caja_detalle` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`caja_id` integer NOT NULL,
	`moneda` text NOT NULL,
	`denominacion_cents` integer NOT NULL,
	`cantidad` integer DEFAULT 0 NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`caja_id`) REFERENCES `caja`(`id`) ON UPDATE no action ON DELETE cascade,
	CONSTRAINT "detalle_cantidad_no_negativa" CHECK("caja_detalle"."cantidad" >= 0),
	CONSTRAINT "detalle_denominacion_positiva" CHECK("caja_detalle"."denominacion_cents" > 0),
	CONSTRAINT "detalle_moneda_valida" CHECK("caja_detalle"."moneda" IN ('CUP', 'USD', 'EUR'))
);
