--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "proveedor" (
  "id" SERIAL PRIMARY KEY NOT NULL,
  "nombre" VARCHAR(100) NOT NULL,
  "telefono" VARCHAR(20),
  "direccion" TEXT,
  "created_at" TIMESTAMP DEFAULT now() NOT NULL,
  "updated_at" TIMESTAMP DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "camion" (
  "placa" VARCHAR(20) PRIMARY KEY NOT NULL,
  "dueno_id" INTEGER,
  "created_at" TIMESTAMP DEFAULT now() NOT NULL,
  "updated_at" TIMESTAMP DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "producto" (
  "id" SERIAL PRIMARY KEY NOT NULL,
  "nombre" VARCHAR(100) NOT NULL,
  "descripcion" TEXT,
  "created_at" TIMESTAMP DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "clasificacion" (
  "id" SERIAL PRIMARY KEY NOT NULL,
  "producto_id" INTEGER NOT NULL,
  "nombre" VARCHAR(100) NOT NULL,
  "descripcion" TEXT,
  "created_at" TIMESTAMP DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "ingreso" (
  "id" SERIAL PRIMARY KEY NOT NULL,
  "fecha" TIMESTAMP DEFAULT now() NOT NULL,
  "observaciones" TEXT,
  "created_at" TIMESTAMP DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "ingreso_detalle" (
  "id" SERIAL PRIMARY KEY NOT NULL,
  "ingreso_id" INTEGER NOT NULL,
  "camion_placa" VARCHAR(20) NOT NULL,
  "proveedor_id" INTEGER NOT NULL,
  "producto_id" INTEGER NOT NULL,
  "clasificacion_id" INTEGER,
  "tipo_envase" VARCHAR(50) NOT NULL,
  "cantidad" INTEGER NOT NULL,
  "precio_unitario" NUMERIC(10,2) NOT NULL,
  "total" NUMERIC(10,2) NOT NULL,
  "created_at" TIMESTAMP DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "cliente" (
  "id" SERIAL PRIMARY KEY NOT NULL,
  "nombre" VARCHAR(100) NOT NULL,
  "telefono" VARCHAR(20) NOT NULL,
  "correo" VARCHAR(100),
  "direccion" TEXT NOT NULL,
  "created_at" TIMESTAMP DEFAULT now() NOT NULL,
  "updated_at" TIMESTAMP DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "pedido" (
  "id" SERIAL PRIMARY KEY NOT NULL,
  "cliente_id" INTEGER NOT NULL,
  "fecha" TIMESTAMP DEFAULT now() NOT NULL,
  "total" NUMERIC(10,2) DEFAULT 0 NOT NULL,
  "saldo_pendiente" NUMERIC(10,2) DEFAULT 0 NOT NULL,
  "estado" VARCHAR(20) DEFAULT 'pendiente' NOT NULL,
  "created_at" TIMESTAMP DEFAULT now() NOT NULL,
  "updated_at" TIMESTAMP DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "pedido_detalle" (
  "id" SERIAL PRIMARY KEY NOT NULL,
  "pedido_id" INTEGER NOT NULL,
  "producto_id" INTEGER NOT NULL,
  "clasificacion_id" INTEGER,
  "cantidad" INTEGER NOT NULL,
  "precio_unitario" NUMERIC(10,2) NOT NULL,
  "total" NUMERIC(10,2) NOT NULL,
  "created_at" TIMESTAMP DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "pagos" (
  "id" SERIAL PRIMARY KEY NOT NULL,
  "cliente_id" INTEGER NOT NULL,
  "fecha_pago" TIMESTAMP DEFAULT now() NOT NULL,
  "monto" NUMERIC(10,2) NOT NULL,
  "metodo_pago" VARCHAR(20) NOT NULL CHECK (
    metodo_pago IN ('efectivo', 'deposito', 'transferencia')
  ),
  "referencia_pago" VARCHAR(100),
  "created_at" TIMESTAMP DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "cierres_caja" (
  "id" SERIAL PRIMARY KEY NOT NULL,
  "fecha" DATE NOT NULL UNIQUE,
  "saldo_inicial" NUMERIC(10,2) NOT NULL,
  "saldo_final" NUMERIC(10,2),
  "observaciones" TEXT,
  "creado_en" TIMESTAMP DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "movimientos_caja" (
  "id" SERIAL PRIMARY KEY NOT NULL,
  "fecha" DATE DEFAULT CURRENT_DATE NOT NULL,
  "tipo_movimiento" VARCHAR(20) NOT NULL CHECK (
    tipo_movimiento IN ('saldo_inicial', 'ingreso', 'retiro')
  ),
  "descripcion" TEXT,
  "monto" NUMERIC(10,2) NOT NULL,
  "metodo_pago" VARCHAR(20) CHECK (
    metodo_pago IN ('efectivo', 'deposito', 'transferencia')
  ),
  "referencia_pago" VARCHAR(100),
  "creado_en" TIMESTAMP DEFAULT now() NOT NULL
);
--> statement-breakpoint

-- Relaciones
DO $$ BEGIN
 ALTER TABLE "camion" ADD CONSTRAINT "camion_dueno_id_fk"
 FOREIGN KEY ("dueno_id") REFERENCES "public"."proveedor"("id")
 ON DELETE SET NULL ON UPDATE NO ACTION;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "clasificacion" ADD CONSTRAINT "clasificacion_producto_id_fk"
 FOREIGN KEY ("producto_id") REFERENCES "public"."producto"("id")
 ON DELETE CASCADE ON UPDATE NO ACTION;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "ingreso_detalle" ADD CONSTRAINT "ingreso_detalle_ingreso_id_fk"
 FOREIGN KEY ("ingreso_id") REFERENCES "public"."ingreso"("id")
 ON DELETE CASCADE ON UPDATE NO ACTION;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "ingreso_detalle" ADD CONSTRAINT "ingreso_detalle_camion_placa_fk"
 FOREIGN KEY ("camion_placa") REFERENCES "public"."camion"("placa")
 ON DELETE NO ACTION ON UPDATE NO ACTION;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "ingreso_detalle" ADD CONSTRAINT "ingreso_detalle_proveedor_id_fk"
 FOREIGN KEY ("proveedor_id") REFERENCES "public"."proveedor"("id")
 ON DELETE NO ACTION ON UPDATE NO ACTION;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "ingreso_detalle" ADD CONSTRAINT "ingreso_detalle_producto_id_fk"
 FOREIGN KEY ("producto_id") REFERENCES "public"."producto"("id")
 ON DELETE NO ACTION ON UPDATE NO ACTION;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "ingreso_detalle" ADD CONSTRAINT "ingreso_detalle_clasificacion_id_fk"
 FOREIGN KEY ("clasificacion_id") REFERENCES "public"."clasificacion"("id")
 ON DELETE SET NULL ON UPDATE NO ACTION;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "pedido" ADD CONSTRAINT "pedido_cliente_id_fk"
 FOREIGN KEY ("cliente_id") REFERENCES "public"."cliente"("id")
 ON DELETE NO ACTION ON UPDATE NO ACTION;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "pedido_detalle" ADD CONSTRAINT "pedido_detalle_pedido_id_fk"
 FOREIGN KEY ("pedido_id") REFERENCES "public"."pedido"("id")
 ON DELETE CASCADE ON UPDATE NO ACTION;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "pedido_detalle" ADD CONSTRAINT "pedido_detalle_producto_id_fk"
 FOREIGN KEY ("producto_id") REFERENCES "public"."producto"("id")
 ON DELETE NO ACTION ON UPDATE NO ACTION;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "pedido_detalle" ADD CONSTRAINT "pedido_detalle_clasificacion_id_fk"
 FOREIGN KEY ("clasificacion_id") REFERENCES "public"."clasificacion"("id")
 ON DELETE SET NULL ON UPDATE NO ACTION;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "pagos" ADD CONSTRAINT "pagos_cliente_id_fk"
 FOREIGN KEY ("cliente_id") REFERENCES "public"."cliente"("id")
 ON DELETE NO ACTION ON UPDATE NO ACTION;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
