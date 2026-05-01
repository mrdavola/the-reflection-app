"use client";

import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";

export function GeneratingFeedback({ label = "Crafting your feedback…" }: { label?: string }) {
  const phrases = [
    "Reading what you said with care…",
    "Looking for what's working…",
    "Naming a possible next step…",
    "Putting it all together…",
  ];
  return (
    <div className="flex flex-col items-center gap-5 rounded-3xl border border-border/60 bg-card p-10 text-center shadow-sm">
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 5, repeat: Infinity, ease: "linear" }}
        className="grid h-16 w-16 place-items-center rounded-full bg-gradient-to-br from-primary/20 to-secondary/20"
      >
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </motion.div>
      <div>
        <h2 className="font-display text-2xl tracking-tight">{label}</h2>
        <ul className="mt-3 space-y-1 text-sm text-muted-foreground">
          {phrases.map((p, i) => (
            <motion.li
              key={p}
              initial={{ opacity: 0.3 }}
              animate={{ opacity: [0.3, 1, 0.3] }}
              transition={{ duration: 2.5, repeat: Infinity, delay: i * 0.6 }}
            >
              {p}
            </motion.li>
          ))}
        </ul>
      </div>
    </div>
  );
}
