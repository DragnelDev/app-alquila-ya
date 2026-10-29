import { exigirSesion } from "@/src/lib/auth/session";
import { Sidebar } from "@/src/components/layout/Sidebar";

export default async function PanelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const sesion = await exigirSesion();
  return (
    <div className="min-h-screen">
      <Sidebar sesion={sesion} />
      <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:ml-60 lg:max-w-none lg:px-10 lg:py-8 print:m-0 print:p-0">
        {children}
      </main>
    </div>
  );
}
