"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpen, LayoutDashboard, LibraryBig, Presentation, Radio, Sparkles, TrendingUp } from "lucide-react";
import { Brand } from "@/components/brand";
import { GroupSelector } from "@/components/group-selector";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface Props {
  children: React.ReactNode;
}

export function AppShell({ children }: Props) {
  const pathname = usePathname();

  const groupSelectorValue = pathname.startsWith("/app/personal")
    ? "personal"
    : pathname.match(/^\/app\/groups\/([^\/]+)/)?.[1] ?? "all";

  const navItems = [
    { href: "/app", label: "Dashboard", icon: LayoutDashboard },
    { href: "/app/library", label: "Library", icon: LibraryBig },
    { href: "/app/personal", label: "Personal", icon: BookOpen },
    { href: "/app/growth", label: "Growth", icon: TrendingUp },
    { href: "/app/live", label: "Live", icon: Radio },
    { href: "/app/workshops", label: "Workshops", icon: Presentation },
  ];

  return (
    <div className="flex min-h-screen flex-col">
      <header
        data-app-header
        className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur-md"
      >
        <div className="mx-auto flex w-full max-w-7xl items-center gap-3 px-4 py-3 sm:px-6">
          <Brand />
          <div className="ml-2 hidden md:block">
            <GroupSelector current={groupSelectorValue} />
          </div>
          <nav data-app-shell-nav className="ml-auto flex items-center gap-1">
            {navItems.map((item) => {
              const active =
                item.href === "/app" ? pathname === "/app" : pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "hidden items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition-colors sm:inline-flex",
                    active
                      ? "bg-accent text-accent-foreground"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground",
                  )}
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
            <Button asChild size="sm" className="ml-2 hidden sm:inline-flex">
              <Link href="/app/personal">
                <Sparkles className="h-4 w-4" />
                New reflection
              </Link>
            </Button>
          </nav>
        </div>
        {/* Mobile group selector */}
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 pb-3 sm:px-6 md:hidden">
          <GroupSelector current={groupSelectorValue} />
          <Button asChild size="sm" variant="default">
            <Link href="/app/personal">
              <Sparkles className="h-4 w-4" />
              Reflect
            </Link>
          </Button>
        </div>
      </header>

      <main className="flex-1 px-4 py-8 sm:px-6">
        <div className="mx-auto w-full max-w-7xl">{children}</div>
      </main>

      <footer
        data-app-shell-footer
        className="border-t border-border/60 px-6 py-6 text-xs text-muted-foreground"
      >
        <div className="mx-auto flex w-full max-w-7xl flex-wrap items-center justify-between gap-2">
          <p>
            The Reflection App · AI reflection coach. Your reflections live in this browser.
          </p>
          <p>
            <Link href="/" className="hover:text-foreground">
              About
            </Link>
            <span className="mx-2">·</span>
            <Link href="/privacy" className="hover:text-foreground">
              Privacy
            </Link>
          </p>
        </div>
      </footer>
    </div>
  );
}
