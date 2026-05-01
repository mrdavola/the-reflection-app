"use client";

import { useMemo } from "react";
import { cn } from "@/lib/utils";

interface Props {
  /** seed string used to generate the deterministic block grid (e.g. share code or join code). */
  seed: string;
  /** rendered size in px. Defaults to 200. */
  size?: number;
  /**
   * "primary" → cells render in sky-glow primary color (the share-moment look).
   * "ink"     → cells render in foreground (warm cream).
   */
  tone?: "primary" | "ink";
  className?: string;
}

const GRID = 17;

/**
 * Deterministic SVG QR-code placeholder. Real share is the link/code printed
 * elsewhere — this is the visual marker. Anchor blocks at three corners read
 * as a real QR even from across a classroom.
 */
export function QrPlaceholder({ seed, size = 200, tone = "primary", className }: Props) {
  const cells = useMemo(() => buildGrid(seed), [seed]);

  const fill = tone === "primary" ? "var(--color-primary)" : "var(--color-foreground)";
  // Card-tinted background so the QR reads as glowing on dark.
  const bg = "var(--color-card)";

  return (
    <div
      className={cn(
        "rounded-2xl border border-border/70 bg-card p-3",
        "shadow-[0_1px_2px_rgba(0,0,0,0.3),0_24px_60px_-30px_rgba(120,165,220,0.4)]",
        className,
      )}
      style={{ width: size + 24, height: size + 24 }}
    >
      <svg
        viewBox={`0 0 ${GRID} ${GRID}`}
        width={size}
        height={size}
        aria-hidden="true"
        className="block"
      >
        <rect x="0" y="0" width={GRID} height={GRID} fill={bg} />
        {cells.map((on, i) =>
          on ? (
            <rect
              key={i}
              x={i % GRID}
              y={Math.floor(i / GRID)}
              width={1}
              height={1}
              fill={fill}
            />
          ) : null,
        )}
      </svg>
    </div>
  );
}

function buildGrid(seed: string): boolean[] {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  const grid: boolean[] = [];
  for (let i = 0; i < GRID * GRID; i++) {
    h = (h * 1664525 + 1013904223) >>> 0;
    grid.push((h & 0xff) > 130);
  }
  // anchor squares (top-left, top-right, bottom-left)
  const setBlock = (r: number, c: number) => {
    for (let dr = 0; dr < 5; dr++) {
      for (let dc = 0; dc < 5; dc++) {
        const rr = r + dr;
        const cc = c + dc;
        if (rr >= 0 && rr < GRID && cc >= 0 && cc < GRID) {
          const ringEdge = dr === 0 || dr === 4 || dc === 0 || dc === 4;
          const innerCenter = dr >= 1 && dr <= 3 && dc >= 1 && dc <= 3;
          grid[rr * GRID + cc] = ringEdge || (innerCenter && dr === 2 && dc === 2);
        }
      }
    }
  };
  setBlock(0, 0);
  setBlock(0, GRID - 5);
  setBlock(GRID - 5, 0);
  return grid;
}
