-- CreateEnum
CREATE TYPE "TipoServicio" AS ENUM ('LUZ', 'AGUA', 'WIFI');

-- CreateEnum
CREATE TYPE "ModoServicio" AS ENUM ('FIJO', 'MEDIDOR', 'MANUAL');

-- CreateEnum
CREATE TYPE "TipoToken" AS ENUM ('VERIFICAR_EMAIL', 'RECUPERAR_PASSWORD', 'INVITACION', 'CAMBIO_EMAIL');

-- AlterTable: usuarios (perfil, verificación de correo, contraseña opcional)
ALTER TABLE "usuarios"
  ADD COLUMN "email_verificado" TIMESTAMP(3),
  ADD COLUMN "email_pendiente" TEXT,
  ADD COLUMN "telefono" TEXT,
  ADD COLUMN "imagen" TEXT,
  ALTER COLUMN "password_hash" DROP NOT NULL;

-- Los usuarios que ya existían se consideran verificados
UPDATE "usuarios" SET "email_verificado" = CURRENT_TIMESTAMP;

-- CreateTable
CREATE TABLE "cuentas" (
    "id" TEXT NOT NULL,
    "usuario_id" TEXT NOT NULL,
    "proveedor" TEXT NOT NULL,
    "proveedor_cuenta_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cuentas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tokens_usuario" (
    "id" TEXT NOT NULL,
    "usuario_id" TEXT NOT NULL,
    "tipo" "TipoToken" NOT NULL,
    "token_hash" TEXT NOT NULL,
    "expira_en" TIMESTAMP(3) NOT NULL,
    "usado_en" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tokens_usuario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "servicios_contrato" (
    "id" TEXT NOT NULL,
    "contrato_id" TEXT NOT NULL,
    "tipo" "TipoServicio" NOT NULL,
    "modo" "ModoServicio" NOT NULL,
    "monto_fijo" DECIMAL(10,2),
    "tarifa_unitaria" DECIMAL(10,4),
    "lectura_inicial" DECIMAL(12,2),
    "vigente_desde" DATE NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "servicios_contrato_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "recibos" (
    "id" TEXT NOT NULL,
    "numero" SERIAL NOT NULL,
    "fecha_pago" TIMESTAMP(3) NOT NULL,
    "metodo_pago" "MetodoPago" NOT NULL,
    "referencia" TEXT,
    "total" DECIMAL(10,2) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "recibos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cobros_servicio" (
    "id" TEXT NOT NULL,
    "pago_id" TEXT NOT NULL,
    "tipo" "TipoServicio" NOT NULL,
    "modo" "ModoServicio" NOT NULL,
    "lectura_anterior" DECIMAL(12,2),
    "lectura_actual" DECIMAL(12,2),
    "consumo" DECIMAL(12,2),
    "tarifa_unitaria" DECIMAL(10,4),
    "monto" DECIMAL(10,2) NOT NULL,
    "fecha_vencimiento" DATE NOT NULL,
    "estado" "EstadoPago" NOT NULL DEFAULT 'PENDIENTE',
    "recibo_id" TEXT,
    "observaciones" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cobros_servicio_pkey" PRIMARY KEY ("id")
);

-- Migración de datos: cada pago ya cobrado pasa a ser un recibo (se reutiliza el id del pago)
ALTER TABLE "pagos" ADD COLUMN "recibo_id" TEXT;

INSERT INTO "recibos" ("id", "numero", "fecha_pago", "metodo_pago", "referencia", "total")
SELECT "id", "numero_recibo", "fecha_pago", "metodo_pago", "referencia", "monto"
FROM "pagos"
WHERE "estado" = 'PAGADO' AND "numero_recibo" IS NOT NULL AND "fecha_pago" IS NOT NULL AND "metodo_pago" IS NOT NULL;

UPDATE "pagos" SET "recibo_id" = "id" WHERE "id" IN (SELECT "id" FROM "recibos");

SELECT setval(pg_get_serial_sequence('"recibos"', 'numero'), COALESCE((SELECT MAX("numero") FROM "recibos"), 0) + 1, false);

DROP INDEX "pagos_numero_recibo_key";
ALTER TABLE "pagos"
  DROP COLUMN "fecha_pago",
  DROP COLUMN "metodo_pago",
  DROP COLUMN "referencia",
  DROP COLUMN "numero_recibo";

-- CreateIndex
CREATE INDEX "cuentas_usuario_id_idx" ON "cuentas"("usuario_id");
CREATE UNIQUE INDEX "cuentas_proveedor_proveedor_cuenta_id_key" ON "cuentas"("proveedor", "proveedor_cuenta_id");
CREATE UNIQUE INDEX "tokens_usuario_token_hash_key" ON "tokens_usuario"("token_hash");
CREATE INDEX "tokens_usuario_usuario_id_tipo_idx" ON "tokens_usuario"("usuario_id", "tipo");
CREATE UNIQUE INDEX "servicios_contrato_contrato_id_tipo_key" ON "servicios_contrato"("contrato_id", "tipo");
CREATE UNIQUE INDEX "recibos_numero_key" ON "recibos"("numero");
CREATE INDEX "recibos_fecha_pago_idx" ON "recibos"("fecha_pago");
CREATE INDEX "pagos_recibo_id_idx" ON "pagos"("recibo_id");
CREATE UNIQUE INDEX "cobros_servicio_pago_id_tipo_key" ON "cobros_servicio"("pago_id", "tipo");
CREATE INDEX "cobros_servicio_estado_fecha_vencimiento_idx" ON "cobros_servicio"("estado", "fecha_vencimiento");
CREATE INDEX "cobros_servicio_recibo_id_idx" ON "cobros_servicio"("recibo_id");

-- AddForeignKey
ALTER TABLE "cuentas" ADD CONSTRAINT "cuentas_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "tokens_usuario" ADD CONSTRAINT "tokens_usuario_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "servicios_contrato" ADD CONSTRAINT "servicios_contrato_contrato_id_fkey" FOREIGN KEY ("contrato_id") REFERENCES "contratos"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "pagos" ADD CONSTRAINT "pagos_recibo_id_fkey" FOREIGN KEY ("recibo_id") REFERENCES "recibos"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "cobros_servicio" ADD CONSTRAINT "cobros_servicio_pago_id_fkey" FOREIGN KEY ("pago_id") REFERENCES "pagos"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "cobros_servicio" ADD CONSTRAINT "cobros_servicio_recibo_id_fkey" FOREIGN KEY ("recibo_id") REFERENCES "recibos"("id") ON DELETE SET NULL ON UPDATE CASCADE;
