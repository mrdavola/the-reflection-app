import { Brand } from "@/components/brand";

export default function WorkshopFlowLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative min-h-screen bg-background">
      <header className="px-6 py-5">
        <div className="mx-auto flex w-full max-w-4xl items-center justify-between">
          <Brand href="/" className="text-base" />
          <span className="margin-note uppercase tracking-[0.3em] text-[0.65rem]">
            Workshop
          </span>
        </div>
      </header>
      <main className="mx-auto w-full max-w-4xl px-6 pb-16 pt-2">
        {children}
      </main>
    </div>
  );
}
