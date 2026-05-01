import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset transition-colors",
  {
    variants: {
      variant: {
        default: "bg-accent text-accent-foreground ring-accent",
        outline: "bg-transparent text-foreground/80 ring-border",
        primary: "bg-primary/10 text-primary ring-primary/20",
        secondary: "bg-secondary/10 text-secondary ring-secondary/20",
        sunny: "bg-triage-sunny-bg text-triage-sunny ring-triage-sunny/20",
        orange: "bg-triage-orange-bg text-triage-orange ring-triage-orange/20",
        blue: "bg-triage-blue-bg text-triage-blue ring-triage-blue/20",
        rose: "bg-triage-rose-bg text-triage-rose ring-triage-rose/20",
        muted: "bg-muted text-muted-foreground ring-border",
      },
    },
    defaultVariants: { variant: "default" },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant, className }))} {...props} />;
}
