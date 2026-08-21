import LanguageSwitcher from "@/src/components/LanguageSwitcher";
import { prisma } from "@/src/lib/prisma";
import { getTranslations } from "next-intl/server";

interface Props {
  params: Promise<{
    locale: string;
  }>;
}

export default async function HomePage({ params }: Props) {
  const { locale } = await params;

  // En componentes async se usa getTranslations con await
  const tNav = await getTranslations({ locale, namespace: "Navigation" });
  const tHero = await getTranslations({ locale, namespace: "Hero" });

  // Consulta a PostgreSQL con Prisma
  const sectionData = await prisma.section.findFirst({
    where: { key: "features_section" },
    include: {
      translations: {
        where: { languageCode: locale },
      },
    },
  });

  const translation = sectionData?.translations[0];

  return (
    <main className="min-h-screen bg-slate-50 text-slate-800">
      {/* Navbar */}
      <header className="border-b border-slate-200 bg-white">
        <div className="max-w-6xl mx-auto px-4 h-16 flex justify-between items-center">
          <span className="text-xl font-bold text-blue-600">OmniVox</span>

          <nav className="flex items-center gap-6">
            <a href="#" className="hover:text-blue-600 transition-colors">
              {tNav("home")}
            </a>
            <a href="#" className="hover:text-blue-600 transition-colors">
              {tNav("about")}
            </a>
            <a href="#" className="hover:text-blue-600 transition-colors">
              {tNav("contact")}
            </a>
            <LanguageSwitcher />
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="max-w-4xl mx-auto text-center py-16 px-4">
        <h1 className="text-5xl font-extrabold tracking-tight text-slate-900 mb-6">
          {tHero("title")}
        </h1>
        <p className="text-xl text-slate-600 mb-8 max-w-2xl mx-auto">
          {tHero("subtitle")}
        </p>
        <button className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-8 py-3 rounded-lg shadow-md transition-all">
          {tHero("cta")}
        </button>
      </section>

      {/* Dynamic Section (PostgreSQL) */}
      {translation && (
        <section className="max-w-4xl mx-auto my-12 p-8 bg-white rounded-xl shadow-sm border border-slate-200 text-center">
          <span className="text-xs font-semibold uppercase tracking-wider text-blue-600 bg-blue-50 px-3 py-1 rounded-full">
            Contenido desde PostgreSQL
          </span>
          <h2 className="text-3xl font-bold text-slate-900 mt-4 mb-2">
            {translation.title}
          </h2>
          <h3 className="text-lg text-slate-500 mb-4">
            {translation.subtitle}
          </h3>
          <p className="text-slate-600 mb-6 max-w-xl mx-auto">
            {translation.content}
          </p>
          <button className="border border-slate-300 hover:bg-slate-100 text-slate-700 font-medium px-6 py-2 rounded-lg transition-all">
            {translation.buttonText}
          </button>
        </section>
      )}
    </main>
  );
}
