import { Brand } from "@/components/brand";

export default function WorkshopFlowLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative min-h-screen bg-gradient-to-br from-primary/[0.04] via-background to-secondary/[0.04]">
      <header className="px-6 py-5">
        <div className="mx-auto flex w-full max-w-4xl items-center justify-between">
          <Brand href="/" className="text-base" />
          <span className="text-[11px] uppercase tracking-wider text-muted-foreground">
            Workshop
          </span>
        </div>
      </header>
      <main className="mx-auto w-full max-w-4xl px-6 pb-16 pt-2">{children}</main>
    </div>
  );
}
