import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "AlquilaYa", template: "%s · AlquilaYa" },
  description:
    "Gestión de alquiler de habitaciones: contratos, cobranzas y recibos.",
};

// Aplica el tema guardado (o el del sistema) antes del primer pintado para evitar parpadeos
const scriptTema = `(function(){try{var t=localStorage.getItem("tema");var o=t?t==="oscuro":window.matchMedia("(prefers-color-scheme: dark)").matches;document.documentElement.dataset.theme=o?"dark":"light"}catch(e){}})()`;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: scriptTema }} />
      </head>
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
