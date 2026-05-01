"use client";

interface Props {
  /** 0–100. Drives scale + glow intensity + color shift. */
  audioLevel?: number;
  mode?: "reactive" | "steady" | "breathing";
  className?: string;
}

export function GlowingDot({ audioLevel = 0, mode = "reactive", className = "" }: Props) {
  const level = mode === "reactive" ? audioLevel : mode === "steady" ? 8 : 20;
  const scale = mode === "reactive" ? 1 + level / 30 : 1;
  const glowSize = 15 + level;
  const glowSpread = level / 4;
  const glowAlpha = 0.3 + level / 100;
  const color = level > 20 ? "#ffffff" : "oklch(0.86 0.090 230)";

  return (
    <div
      aria-hidden
      className={`absolute z-10 rounded-full transition-all duration-75 ease-out ${className}`}
      style={{
        width: "4px",
        height: "4px",
        transform: `scale(${scale})`,
        boxShadow: `0 0 ${glowSize}px ${glowSpread}px oklch(0.78 0.105 230 / ${glowAlpha})`,
        backgroundColor: color,
      }}
    />
  );
}
