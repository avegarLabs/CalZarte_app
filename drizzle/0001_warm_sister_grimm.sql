CREATE TABLE `corte_venta` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`fecha_inicio` integer NOT NULL,
	`fecha_fin` integer NOT NULL,
	`notas` text,
	`status` text DEFAULT 'CLOSED' NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	CONSTRAINT "corte_fechas_validas" CHECK("corte_venta"."fecha_fin" >= "corte_venta"."fecha_inicio"),
	CONSTRAINT "corte_status_valido" CHECK("corte_venta"."status" IN ('OPEN', 'CLOSED'))
);
--> statement-breakpoint
ALTER TABLE `venta` ADD `corte_venta_id` integer REFERENCES corte_venta(id);