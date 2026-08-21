import createMiddleware from "next-intl/middleware";

export default createMiddleware({
  // Idiomas soportados
  locales: ["es", "en"],

  // Idioma por defecto si no coincide ninguno
  defaultLocale: "es",

  // Prefijo de ruta siempre visible en la URL (/es/..., /en/...)
  localePrefix: "always",
});

export const config = {
  // Matchear todas las rutas excepto archivos estáticos y la API interna
  matcher: ["/", "/(es|en)/:path*", "/((?!_next|_vercel|.*\\..*).*)"],
};
