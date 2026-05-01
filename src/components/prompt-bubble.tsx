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
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -6 }}
      transition={{ duration: 0.36, ease: [0.22, 1, 0.36, 1] }}
      className={cn(
        "relative w-full rounded-lg border border-border bg-card p-7 sm:p-9",
        className,
      )}
    >
      {typeof index === "number" && typeof total === "number" && (
        <div className="margin-note mb-5 flex items-center gap-3 text-[0.7rem] uppercase tracking-[0.18em] not-italic text-muted-foreground">
          <span className="tabular-nums">
            Q.{String(index + 1).padStart(2, "0")} of{" "}
            {String(total).padStart(2, "0")}
          </span>
          <span aria-hidden className="h-px flex-1 bg-border" />
        </div>
      )}
      <p className="font-display text-[1.625rem] leading-[1.18] tracking-tight text-foreground sm:text-[2rem]">
        {prompt}
      </p>
    </motion.div>
  );
}
