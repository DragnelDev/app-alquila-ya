import { ThemeToggle } from "@/src/components/layout/ThemeToggle";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-10">
      <div className="absolute right-4 top-4">
        <ThemeToggle />
      </div>
      <div className="w-full max-w-sm">
        <p className="mb-6 text-sm font-semibold tracking-tight text-muted">
          AlquilaYa
        </p>
        {children}
      </div>
    </main>
  );
}
