CREATE TABLE `precio` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`producto_id` integer NOT NULL,
	`valor_cents` integer NOT NULL,
	`moneda` text NOT NULL,
	`status` text DEFAULT 'ACTIVE' NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`producto_id`) REFERENCES `producto`(`id`) ON UPDATE no action ON DELETE cascade,
	CONSTRAINT "precio_valor_positivo" CHECK("precio"."valor_cents" > 0),
	CONSTRAINT "precio_moneda_valida" CHECK("precio"."moneda" IN ('CUP', 'USD', 'EUR', 'MLC')),
	CONSTRAINT "precio_status_valido" CHECK("precio"."status" IN ('ACTIVE', 'INACTIVE'))
);
--> statement-breakpoint
CREATE UNIQUE INDEX `precio_activo_unico_por_producto` ON `precio` (`producto_id`) WHERE "precio"."status" = 'ACTIVE';--> statement-breakpoint
CREATE TABLE `producto` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`descripcion` text NOT NULL,
	`cantidad` integer DEFAULT 0 NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	CONSTRAINT "producto_cantidad_no_negativa" CHECK("producto"."cantidad" >= 0)
);
--> statement-breakpoint
CREATE TABLE `tasa_cambio` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`moneda` text NOT NULL,
	`valor_cents` integer NOT NULL,
	`status` text DEFAULT 'ACTIVE' NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	CONSTRAINT "tasa_valor_positivo" CHECK("tasa_cambio"."valor_cents" > 0),
	CONSTRAINT "tasa_moneda_valida" CHECK("tasa_cambio"."moneda" IN ('CUP', 'USD', 'EUR', 'MLC')),
	CONSTRAINT "tasa_status_valido" CHECK("tasa_cambio"."status" IN ('ACTIVE', 'INACTIVE'))
);
--> statement-breakpoint
CREATE UNIQUE INDEX `tasa_activa_unica_por_moneda` ON `tasa_cambio` (`moneda`) WHERE "tasa_cambio"."status" = 'ACTIVE';--> statement-breakpoint
CREATE TABLE `venta` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`producto_id` integer NOT NULL,
	`cantidad` integer NOT NULL,
	`precio_id` integer NOT NULL,
	`tasa_cambio_id` integer,
	`status` text DEFAULT 'COMPLETED' NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`producto_id`) REFERENCES `producto`(`id`) ON UPDATE no action ON DELETE restrict,
	FOREIGN KEY (`precio_id`) REFERENCES `precio`(`id`) ON UPDATE no action ON DELETE restrict,
	FOREIGN KEY (`tasa_cambio_id`) REFERENCES `tasa_cambio`(`id`) ON UPDATE no action ON DELETE restrict,
	CONSTRAINT "venta_cantidad_positiva" CHECK("venta"."cantidad" > 0),
	CONSTRAINT "venta_status_valido" CHECK("venta"."status" IN ('COMPLETED', 'CANCELLED'))
);
