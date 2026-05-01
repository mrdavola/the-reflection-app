import Link from "next/link";
import { cn } from "@/lib/utils";

export function Brand({ className, href = "/app" }: { className?: string; href?: string }) {
  return (
    <Link
      href={href}
      className={cn(
        "group inline-flex items-baseline gap-2 font-display text-[1.0625rem] font-medium tracking-tight",
        className,
      )}
    >
      <BrandMark className="h-7 w-7 -mb-1.5" />
      <span className="text-foreground">
        Refleckt
        <span aria-hidden className="text-[oklch(0.50_0.150_25)]">.</span>
      </span>
    </Link>
  );
}

/**
 * The mark reads as a bookplate stamp: a hairline serif "R" in a soft
 * paper square, with a single carmine annotation dot — a reader's mark.
 */
export function BrandMark({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <rect
        x="1.25"
        y="1.25"
        width="29.5"
        height="29.5"
        rx="5"
        fill="oklch(0.992 0.005 82)"
        stroke="oklch(0.34 0.060 252)"
        strokeWidth="1.25"
      />
      <text
        x="16"
        y="22.5"
        textAnchor="middle"
        fontFamily="var(--font-display), Georgia, serif"
        fontSize="20"
        fontWeight="600"
        fill="oklch(0.34 0.060 252)"
      >
        R
      </text>
      <circle cx="25.5" cy="6.5" r="1.6" fill="oklch(0.55 0.150 25)" />
    </svg>
  );
}
