"use client";

/**
 * 5-second breathing interlude.
 *
 * Plays exactly once per session, between the FINAL prompt's analyzing screen
 * and the insights screen. The state machine in use-reflection-flow.ts handles
 * the timing — this component is purely presentational.
 *
 * Label cycles "Breathe in…" → "Hold…" → "And out…" across the 5 seconds.
 */

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { BreathingCircle } from "@/components/ambient";

const PHRASES = ["Breathe in…", "Hold…", "And out…"];

interface Props {
  /** Total visible duration in ms. Defaults to 5000. */
  durationMs?: number;
  className?: string;
}

export function RechargeScreen({ durationMs = 5000, className = "" }: Props) {
  const [labelIndex, setLabelIndex] = useState(0);

  useEffect(() => {
    // Three phrases evenly spaced across the duration.
    const slice = Math.max(800, Math.floor(durationMs / PHRASES.length));
    const id = setInterval(() => {
      setLabelIndex((i) => Math.min(PHRASES.length - 1, i + 1));
    }, slice);
    return () => clearInterval(id);
  }, [durationMs]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.6 }}
      className={`fixed inset-0 z-50 flex w-full items-center justify-center bg-background ${className}`}
    >
      <BreathingCircle label={PHRASES[labelIndex]} />
    </motion.div>
  );
}
