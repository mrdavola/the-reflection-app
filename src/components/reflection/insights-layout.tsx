"use client";

/**
 * Master Educator insights layout.
 *
 * Vertical, centred. Four ordered blocks separated by quiet space (and a soft
 * sky dot between core_insight and next_ripple):
 *
 *   1. YOU SHARED      → user_quote (italic Petrona)
 *   2. CORE INSIGHT    → core_insight (Petrona Medium 32–50px)
 *   • soft sky dot
 *   3. THE NEXT RIPPLE → next_ripple (Atkinson 16px)
 *   4. inspirational_quote (italic Petrona, opacity 0.4 → 1.0 on hover)
 *
 * Bottom actions are optional and slot in via props so the same shape can be
 * used inside the live flow (where they reset / read transcript) and inside
 * /app/reflections/[id] (where they navigate elsewhere). Agent E imports this
 * for the reflection detail page; do not break the prop shape without
 * coordinating.
 */

import { ArrowRight, Quote } from "lucide-react";
import type { ReactNode } from "react";
import type { ReflectionInsight } from "@/lib/use-reflection-flow";

export interface InsightsLayoutProps {
  insight: ReflectionInsight;
  /** Optional bottom action buttons. Each one is rendered as an uppercase ghost link. */
  actions?: InsightAction[];
  /** Optional eyebrow label above the layout — e.g. focus name. */
  eyebrow?: string;
  /** Optional className override on the outer container. */
  className?: string;
}

export interface InsightAction {
  label: string;
  onClick?: () => void;
  href?: string;
  icon?: ReactNode;
}

export function InsightsLayout({
  insight,
  actions,
  eyebrow,
  className = "",
}: InsightsLayoutProps) {
  const { user_quote, core_insight, next_ripple, inspirational_quote } = insight;

  return (
    <div
      className={`mx-auto flex w-full max-w-3xl flex-col items-center gap-12 px-6 py-16 text-center ${className}`}
    >
      {eyebrow && (
        <p className="margin-note uppercase tracking-[0.3em] text-[0.7rem]">{eyebrow}</p>
      )}

      {user_quote && (
        <section className="flex flex-col items-center gap-3">
          <p className="margin-note uppercase tracking-[0.3em] text-[0.7rem]">You shared</p>
          <p className="font-display italic text-[1.125rem] md:text-[1.375rem] leading-[1.45] text-foreground/60 max-w-2xl">
            &ldquo;{user_quote}&rdquo;
          </p>
        </section>
      )}

      <section className="flex flex-col items-center gap-4">
        <p className="margin-note uppercase tracking-[0.3em] text-[0.7rem]">Core insight</p>
        <h1 className="font-display text-[2rem] md:text-[2.75rem] lg:text-[3.125rem] leading-[1.05] tracking-[-0.018em] text-foreground/90 max-w-3xl">
          {core_insight}
        </h1>
      </section>

      <span
        aria-hidden
        className="block h-2 w-2 rounded-full bg-primary/20"
      />

      <section className="flex flex-col items-center gap-3">
        <p className="margin-note uppercase tracking-[0.3em] text-[0.7rem] text-primary inline-flex items-center gap-1.5">
          The next ripple <ArrowRight className="h-3 w-3" aria-hidden />
        </p>
        <p className="text-[1rem] leading-[1.6] text-foreground/80 max-w-lg">
          {next_ripple}
        </p>
      </section>

      {inspirational_quote && (
        <section className="group flex flex-col items-center gap-3 opacity-40 transition-opacity duration-500 hover:opacity-100 focus-within:opacity-100">
          <Quote className="h-4 w-4 text-primary/50" aria-hidden />
          <p className="font-display italic text-[1rem] leading-[1.55] text-foreground/60 max-w-xl">
            {inspirational_quote}
          </p>
        </section>
      )}

      {actions && actions.length > 0 && (
        <div className="mt-6 flex flex-wrap items-center justify-center gap-x-8 gap-y-3">
          {actions.map((action, i) => {
            const className =
              "inline-flex items-center gap-2 text-[0.7rem] uppercase tracking-[0.3em] text-foreground/40 transition-colors hover:text-foreground focus-visible:text-foreground focus-visible:outline-none";
            if (action.href) {
              return (
                <a key={i} href={action.href} className={className}>
                  {action.icon}
                  {action.label}
                </a>
              );
            }
            return (
              <button
                key={i}
                type="button"
                onClick={action.onClick}
                className={className}
              >
                {action.icon}
                {action.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
