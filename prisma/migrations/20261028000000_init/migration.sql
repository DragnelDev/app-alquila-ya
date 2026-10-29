-- CreateEnum
CREATE TYPE "Rol" AS ENUM ('ADMIN', 'PROPIETARIO');

-- CreateEnum
CREATE TYPE "EstadoHabitacion" AS ENUM ('DISPONIBLE', 'OCUPADA', 'MANTENIMIENTO');

-- CreateEnum
CREATE TYPE "ModalidadCobro" AS ENUM ('MES_CALENDARIO', 'DIA_CORTE');

-- CreateEnum
CREATE TYPE "EstadoContrato" AS ENUM ('ACTIVO', 'FINALIZADO', 'CANCELADO');

-- CreateEnum
CREATE TYPE "EstadoPago" AS ENUM ('PENDIENTE', 'PAGADO', 'ATRASADO');

-- CreateEnum
CREATE TYPE "MetodoPago" AS ENUM ('EFECTIVO', 'TRANSFERENCIA', 'QR');

-- CreateTable
CREATE TABLE "usuarios" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "rol" "Rol" NOT NULL DEFAULT 'ADMIN',
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "usuarios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "habitaciones" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "piso" INTEGER NOT NULL,
    "precio_base" DECIMAL(10,2) NOT NULL,
    "descripcion" TEXT,
    "estado" "EstadoHabitacion" NOT NULL DEFAULT 'DISPONIBLE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "habitaciones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inquilinos" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "apellidos" TEXT NOT NULL,
    "documento" TEXT NOT NULL,
    "telefono" TEXT NOT NULL,
    "contacto_emergencia_nombre" TEXT NOT NULL,
    "contacto_emergencia_telefono" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "inquilinos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contratos" (
    "id" TEXT NOT NULL,
    "habitacion_id" TEXT NOT NULL,
    "inquilino_id" TEXT NOT NULL,
    "fecha_inicio" DATE NOT NULL,
    "fecha_fin" DATE,
    "modalidad_cobro" "ModalidadCobro" NOT NULL DEFAULT 'MES_CALENDARIO',
    "dia_corte" INTEGER NOT NULL DEFAULT 1,
    "monto_mensual" DECIMAL(10,2) NOT NULL,
    "incluye_luz" BOOLEAN NOT NULL DEFAULT false,
    "incluye_agua" BOOLEAN NOT NULL DEFAULT false,
    "incluye_wifi" BOOLEAN NOT NULL DEFAULT false,
    "deposito_garantia" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "estado" "EstadoContrato" NOT NULL DEFAULT 'ACTIVO',
    "observaciones" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "contratos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pagos" (
    "id" TEXT NOT NULL,
    "contrato_id" TEXT NOT NULL,
    "periodo_inicio" DATE NOT NULL,
    "periodo_fin" DATE NOT NULL,
    "fecha_vencimiento" DATE NOT NULL,
    "monto" DECIMAL(10,2) NOT NULL,
    "estado" "EstadoPago" NOT NULL DEFAULT 'PENDIENTE',
    "fecha_pago" TIMESTAMP(3),
    "metodo_pago" "MetodoPago",
    "referencia" TEXT,
    "numero_recibo" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pagos_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_email_key" ON "usuarios"("email");

-- CreateIndex
CREATE UNIQUE INDEX "habitaciones_nombre_key" ON "habitaciones"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "inquilinos_documento_key" ON "inquilinos"("documento");

-- CreateIndex
CREATE INDEX "contratos_habitacion_id_estado_idx" ON "contratos"("habitacion_id", "estado");

-- CreateIndex
CREATE INDEX "contratos_inquilino_id_idx" ON "contratos"("inquilino_id");

-- CreateIndex
CREATE UNIQUE INDEX "pagos_numero_recibo_key" ON "pagos"("numero_recibo");

-- CreateIndex
CREATE INDEX "pagos_estado_fecha_vencimiento_idx" ON "pagos"("estado", "fecha_vencimiento");

-- CreateIndex
CREATE UNIQUE INDEX "pagos_contrato_id_fecha_vencimiento_key" ON "pagos"("contrato_id", "fecha_vencimiento");

-- AddForeignKey
ALTER TABLE "contratos" ADD CONSTRAINT "contratos_habitacion_id_fkey" FOREIGN KEY ("habitacion_id") REFERENCES "habitaciones"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contratos" ADD CONSTRAINT "contratos_inquilino_id_fkey" FOREIGN KEY ("inquilino_id") REFERENCES "inquilinos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pagos" ADD CONSTRAINT "pagos_contrato_id_fkey" FOREIGN KEY ("contrato_id") REFERENCES "contratos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Regla de negocio: una habitación solo puede tener un contrato ACTIVO a la vez
CREATE UNIQUE INDEX "contrato_activo_por_habitacion" ON "contratos"("habitacion_id") WHERE "estado" = 'ACTIVO';
