"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface Props {
  prompt: string;
  index?: number;
  total?: number;
  className?: string;
}

export function PromptBubble({ prompt, index, total, className }: Props) {
  return (
    <motion.div
      key={prompt}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
      className={cn(
        "relative w-full rounded-3xl bg-gradient-to-br from-primary/95 to-secondary/95 p-7 text-primary-foreground shadow-[0_24px_60px_-30px_hsl(var(--primary)/0.6)]",
        className,
      )}
    >
      {typeof index === "number" && typeof total === "number" && (
        <div className="mb-3 text-xs font-medium uppercase tracking-wider text-primary-foreground/70">
          Question {index + 1} of {total}
        </div>
      )}
      <p className="font-display text-2xl leading-snug sm:text-3xl">
        {prompt}
      </p>
    </motion.div>
  );
}
