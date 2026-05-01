"use client";

interface Props {
  /** 0–1, scales opacity by audio level. Default 1. */
  intensity?: number;
  /** Pause animations (e.g. when not recording). */
  paused?: boolean;
  className?: string;
}

export function RippleField({ intensity = 1, paused = false, className = "" }: Props) {
  const opacity = Math.min(1, 0.02 + intensity);
  return (
    <div
      aria-hidden
      className={`absolute inset-0 flex items-center justify-center pointer-events-none transition-opacity duration-300 ${className}`}
      style={{ opacity }}
    >
      <div className="animate-calm-ripple" style={{ animationDelay: "0s", animationPlayState: paused ? "paused" : "running" }} />
      <div className="animate-calm-ripple" style={{ animationDelay: "4s", animationPlayState: paused ? "paused" : "running" }} />
      <div className="animate-calm-ripple" style={{ animationDelay: "8s", animationPlayState: paused ? "paused" : "running" }} />
    </div>
  );
}
