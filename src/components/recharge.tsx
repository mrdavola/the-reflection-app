"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Check, Heart, Pencil, StretchHorizontal, Wind } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { t } from "@/lib/i18n/strings";
import { cn } from "@/lib/utils";

type RechargeKey = "breath" | "takeaway" | "stretch" | "sentence";

interface Props {
  /** Called when the user finishes; passes the optional saved takeaway. */
  onComplete: (data: { takeaway?: string }) => void;
  lang?: "en" | "es";
}

interface OptionDef {
  key: RechargeKey;
  labelKey:
    | "recharge_take_breath"
    | "recharge_save_takeaway"
    | "recharge_stretch"
    | "recharge_one_sentence";
  blurbEn: string;
  blurbEs: string;
  icon: React.ComponentType<{ className?: string }>;
}

const OPTIONS: OptionDef[] = [
  {
    key: "breath",
    labelKey: "recharge_take_breath",
    blurbEn: "A 4-second inhale, slow exhale.",
    blurbEs: "Inhala 4 segundos, exhala despacio.",
    icon: Wind,
  },
  {
    key: "takeaway",
    labelKey: "recharge_save_takeaway",
    blurbEn: "One thing worth keeping.",
    blurbEs: "Algo que valga la pena guardar.",
    icon: Pencil,
  },
  {
    key: "stretch",
    labelKey: "recharge_stretch",
    blurbEn: "Stand up. Roll your shoulders.",
    blurbEs: "Levántate. Rueda los hombros.",
    icon: StretchHorizontal,
  },
  {
    key: "sentence",
    labelKey: "recharge_one_sentence",
    blurbEn: "What did you learn, in a single line?",
    blurbEs: "¿Qué aprendiste, en una sola línea?",
    icon: Heart,
  },
];

export function Recharge({ onComplete, lang = "en" }: Props) {
  const isEs = lang === "es";
  const COPY = isEs
    ? {
        sectionLabel: "Recarga",
        title: "Buen trabajo. Tómate un momento.",
        subtitle: "Elige uno — o sáltalo y toca Hecho. No hay respuesta incorrecta.",
        skip: "Saltar",
        breathReady: "Hermoso. Cuando estés listo.",
        breathLoop: "Inhala… exhala…",
        takeawayPlaceholder: "Algo que quieres recordar de esta reflexión…",
        sentencePlaceholder: "En una sola frase: ¿qué aprendiste?",
        stretchReady: "Bien hecho.",
        stretchLoop: "Levántate. Rueda los hombros. Mira por la ventana.",
      }
    : {
        sectionLabel: "Recharge",
        title: "Nice work. Take a small moment.",
        subtitle: "Pick one — or skip and tap Done. There's no wrong answer.",
        skip: "Skip",
        breathReady: "Beautiful. Whenever you're ready.",
        breathLoop: "Inhale… exhale…",
        takeawayPlaceholder: "One thing you want to remember from this reflection…",
        sentencePlaceholder: "In a single sentence: what did you learn?",
        stretchReady: "Nicely done.",
        stretchLoop: "Stand up. Roll your shoulders. Look out a window.",
      };

  const [active, setActive] = useState<RechargeKey | null>(null);
  const [takeaway, setTakeaway] = useState("");
  const [breathReady, setBreathReady] = useState(false);
  const [stretchReady, setStretchReady] = useState(false);

  // Breathing animation: enable Done after 4s.
  useEffect(() => {
    if (active !== "breath") return;
    setBreathReady(false);
    const t = window.setTimeout(() => setBreathReady(true), 4200);
    return () => window.clearTimeout(t);
  }, [active]);

  // Stretch timer: 30 seconds.
  useEffect(() => {
    if (active !== "stretch") return;
    setStretchReady(false);
    const t = window.setTimeout(() => setStretchReady(true), 30_000);
    return () => window.clearTimeout(t);
  }, [active]);

  const canFinish = (() => {
    if (!active) return true; // skipping is allowed
    if (active === "breath") return breathReady;
    if (active === "stretch") return stretchReady;
    if (active === "takeaway" || active === "sentence") return takeaway.trim().length > 0;
    return false;
  })();

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 rounded-3xl border border-border/60 bg-card p-8 shadow-sm">
      <div className="text-center">
        <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          {COPY.sectionLabel}
        </div>
        <h2 className="mt-1 font-display text-3xl tracking-tight">
          {COPY.title}
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          {COPY.subtitle}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {OPTIONS.map((opt) => {
          const Icon = opt.icon;
          const selected = active === opt.key;
          const label = t(lang, opt.labelKey);
          const blurb = isEs ? opt.blurbEs : opt.blurbEn;
          return (
            <button
              key={opt.key}
              type="button"
              onClick={() => setActive(selected ? null : opt.key)}
              className={cn(
                "group flex items-start gap-3 rounded-2xl border p-4 text-left transition-all",
                "hover:-translate-y-0.5 hover:shadow-md",
                selected
                  ? "border-primary/60 bg-accent/60 shadow-[0_18px_40px_-24px_hsl(var(--primary)/0.55)]"
                  : "border-border/70 bg-background/40 hover:border-primary/30",
              )}
            >
              <span
                className={cn(
                  "grid h-9 w-9 shrink-0 place-items-center rounded-full",
                  selected
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-foreground",
                )}
              >
                <Icon className="h-4 w-4" />
              </span>
              <span className="flex-1">
                <span className="block text-sm font-semibold tracking-tight">
                  {label}
                </span>
                <span className="block text-xs text-muted-foreground">
                  {blurb}
                </span>
              </span>
              {selected && (
                <span className="mt-0.5 grid h-5 w-5 place-items-center rounded-full bg-primary text-primary-foreground">
                  <Check className="h-3 w-3" />
                </span>
              )}
            </button>
          );
        })}
      </div>

      <AnimatePresence mode="wait">
        {active === "breath" && (
          <motion.div
            key="breath"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="flex flex-col items-center gap-3 py-4"
          >
            <motion.div
              aria-hidden
              animate={{ scale: [1, 1.6, 1.6, 1], opacity: [0.6, 1, 1, 0.6] }}
              transition={{
                duration: 4,
                ease: "easeInOut",
                repeat: Infinity,
                times: [0, 0.4, 0.6, 1],
              }}
              className="h-28 w-28 rounded-full bg-gradient-to-br from-primary/40 to-secondary/40"
            />
            <p className="text-sm text-muted-foreground">
              {breathReady ? COPY.breathReady : COPY.breathLoop}
            </p>
          </motion.div>
        )}

        {(active === "takeaway" || active === "sentence") && (
          <motion.div
            key={active}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="flex flex-col gap-2"
          >
            <Textarea
              value={takeaway}
              onChange={(e) => setTakeaway(e.target.value)}
              placeholder={
                active === "takeaway"
                  ? COPY.takeawayPlaceholder
                  : COPY.sentencePlaceholder
              }
              className="min-h-[110px]"
              autoFocus
            />
          </motion.div>
        )}

        {active === "stretch" && (
          <motion.div
            key="stretch"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="flex flex-col items-center gap-3 py-4 text-center"
          >
            <motion.div
              animate={{ rotate: [0, 8, -8, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              className="grid h-20 w-20 place-items-center rounded-full bg-accent text-2xl"
            >
              {stretchReady ? "✓" : "🤸"}
            </motion.div>
            <p className="text-sm text-muted-foreground">
              {stretchReady ? COPY.stretchReady : COPY.stretchLoop}
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex items-center justify-between">
        <button
          type="button"
          className="text-xs text-muted-foreground hover:text-foreground"
          onClick={() => onComplete({})}
        >
          {COPY.skip}
        </button>
        <Button
          size="lg"
          disabled={!canFinish}
          onClick={() =>
            onComplete({
              takeaway:
                (active === "takeaway" || active === "sentence") && takeaway.trim()
                  ? takeaway.trim()
                  : undefined,
            })
          }
        >
          {t(lang, "done")}
        </Button>
      </div>
    </div>
  );
}
