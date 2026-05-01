"use client";

import { Wind } from "lucide-react";

interface Props {
  /** Caption shown below circle. Default "Breathe in…". */
  label?: string;
  /** px diameter. Default 192 (w-48). */
  size?: number;
  className?: string;
}

export function BreathingCircle({ label = "Breathe in…", size = 192, className = "" }: Props) {
  return (
    <div className={`flex flex-col items-center ${className}`}>
      <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
        <div className="absolute w-full h-full rounded-full border border-primary/20 animate-breathe" />
        <Wind size={24} className="text-primary/40" aria-hidden />
      </div>
      <p className="mt-16 text-sm md:text-base font-light tracking-[0.2em] text-foreground/50 uppercase animate-pulse-slow">
        {label}
      </p>
    </div>
  );
}
