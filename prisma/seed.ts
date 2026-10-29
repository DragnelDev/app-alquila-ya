import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { hash } from "bcryptjs";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL no está definida en el archivo .env");
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString }),
});

async function main() {
  const adminEmail = (
    process.env.SEED_ADMIN_EMAIL ?? "admin@alquilaya.local"
  ).toLowerCase();
  const propEmail = (
    process.env.SEED_PROPIETARIO_EMAIL ?? "propietario@alquilaya.local"
  ).toLowerCase();

  await prisma.usuario.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      nombre: "Administrador",
      email: adminEmail,
      passwordHash: await hash(
        process.env.SEED_ADMIN_PASSWORD ?? "Admin1234!",
        10
      ),
      rol: "ADMIN",
      emailVerificado: new Date(),
    },
  });

  await prisma.usuario.upsert({
    where: { email: propEmail },
    update: {},
    create: {
      nombre: "Propietario",
      email: propEmail,
      passwordHash: await hash(
        process.env.SEED_PROPIETARIO_PASSWORD ?? "Propietario1234!",
        10
      ),
      rol: "PROPIETARIO",
      emailVerificado: new Date(),
    },
  });

  // Habitaciones de ejemplo (solo si aún no hay ninguna)
  if ((await prisma.habitacion.count()) === 0) {
    await prisma.habitacion.createMany({
      data: [
        {
          nombre: "101",
          piso: 1,
          precioBase: 600,
          descripcion: "Baño compartido",
        },
        {
          nombre: "102",
          piso: 1,
          precioBase: 650,
          descripcion: "Ventana a la calle",
        },
        {
          nombre: "103",
          piso: 1,
          precioBase: 700,
          descripcion: "Baño privado",
        },
        {
          nombre: "201",
          piso: 2,
          precioBase: 750,
          descripcion: "Baño privado y balcón",
        },
        { nombre: "202", piso: 2, precioBase: 700 },
        { nombre: "203", piso: 2, precioBase: 700 },
      ],
    });
  }

  console.log("Seed ejecutado con éxito");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
