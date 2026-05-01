import Link from "next/link";
import { cn } from "@/lib/utils";

export function Brand({ className, href = "/app" }: { className?: string; href?: string }) {
  return (
    <Link
      href={href}
      className={cn("inline-flex items-center gap-2 font-display text-lg font-semibold tracking-tight", className)}
    >
      <BrandMark className="h-7 w-7" />
      <span className="text-foreground">The Reflection App</span>
    </Link>
  );
}

export function BrandMark({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <defs>
        <linearGradient id="r-grad" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="hsl(261 60% 56%)" />
          <stop offset="1" stopColor="hsl(220 80% 60%)" />
        </linearGradient>
      </defs>
      <rect width="32" height="32" rx="9" fill="url(#r-grad)" />
      <path
        d="M9.6 21.6V10.4h6.72c2.4 0 4 1.44 4 3.84 0 1.68-.96 2.88-2.4 3.36L21.12 21.6h-2.88l-2.88-3.84h-2.4v3.84H9.6Zm3.36-6.4h3.04c1.04 0 1.6-.56 1.6-1.44 0-.88-.56-1.44-1.6-1.44h-3.04v2.88Z"
        fill="white"
        fillOpacity="0.96"
      />
    </svg>
  );
}
