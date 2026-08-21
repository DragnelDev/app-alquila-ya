import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import "dotenv/config";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL no está definida en el archivo .env");
}

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

async function main() {
  // 1. Crear Idiomas
  await prisma.language.upsert({
    where: { code: "es" },
    update: {},
    create: { code: "es", name: "Español", isDefault: true },
  });

  await prisma.language.upsert({
    where: { code: "en" },
    update: {},
    create: { code: "en", name: "English", isDefault: false },
  });

  // 2. Crear una Página base
  const homePage = await prisma.page.upsert({
    where: { id: "home-page-id" },
    update: {},
    create: {
      id: "home-page-id",
      slugBase: "home",
      translations: {
        create: [
          { languageCode: "es", title: "Inicio", slug: "inicio" },
          { languageCode: "en", title: "Home", slug: "home" },
        ],
      },
    },
  });

  // 3. Crear una Sección Dinámica con Traducciones
  await prisma.section.create({
    data: {
      pageId: homePage.id,
      key: "features_section",
      order: 1,
      translations: {
        create: [
          {
            languageCode: "es",
            title: "Características Principales",
            subtitle: "Lo que hace única a nuestra plataforma.",
            content:
              "Contenido dinámico directamente desde PostgreSQL usando Prisma y Server Components.",
            buttonText: "Saber Más",
          },
          {
            languageCode: "en",
            title: "Key Features",
            subtitle: "What makes our platform unique.",
            content:
              "Dynamic content straight from PostgreSQL using Prisma and Server Components.",
            buttonText: "Learn More",
          },
        ],
      },
    },
  });

  console.log("Seed ejecutado con éxito");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
