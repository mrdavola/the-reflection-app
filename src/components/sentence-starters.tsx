"use client";

import { Button } from "@/components/ui/button";
import { t } from "@/lib/i18n/strings";
import type { FocusId, GradeBand } from "@/lib/types";

interface Props {
  gradeBand: GradeBand;
  focus?: FocusId;
  lang?: "en" | "es";
  onPick: (text: string) => void;
}

const STARTERS_K2 = [
  "I learned…",
  "I noticed…",
  "I tried…",
  "I was proud of…",
  "I need help with…",
  "Next time I will…",
];

const STARTERS_3_5 = [
  "One strategy I used was…",
  "I changed my thinking when…",
  "A connection I made was…",
  "One question I still have is…",
  "My next step is…",
];

const STARTERS_6_12 = [
  "My evidence shows…",
  "My approach changed because…",
  "A pattern I noticed was…",
  "I need to revise…",
  "This formative connects to the summative because…",
];

const STARTERS_ADULT = [
  "Key insight:…",
  "What surprised me was…",
  "Implication for my work:…",
  "What I'd do differently:…",
  "Open question:…",
];

const STARTERS_K2_ES = [
  "Aprendí…",
  "Me di cuenta de…",
  "Intenté…",
  "Estuve orgulloso de…",
  "Necesito ayuda con…",
  "La próxima vez voy a…",
];

const STARTERS_3_5_ES = [
  "Una estrategia que usé fue…",
  "Cambié mi forma de pensar cuando…",
  "Una conexión que hice fue…",
  "Una pregunta que aún tengo es…",
  "Mi próximo paso es…",
];

const STARTERS_6_12_ES = [
  "Mi evidencia muestra…",
  "Mi enfoque cambió porque…",
  "Un patrón que noté fue…",
  "Necesito revisar…",
  "Esta evaluación formativa se conecta con la sumativa porque…",
];

const STARTERS_ADULT_ES = [
  "Idea clave:…",
  "Lo que me sorprendió fue…",
  "Implicación para mi trabajo:…",
  "Lo que haría diferente:…",
  "Pregunta abierta:…",
];

function startersFor(gradeBand: GradeBand, lang: "en" | "es"): string[] {
  const es = lang === "es";
  switch (gradeBand) {
    case "k-2":
      return es ? STARTERS_K2_ES : STARTERS_K2;
    case "3-5":
      return es ? STARTERS_3_5_ES : STARTERS_3_5;
    case "6-8":
    case "9-12":
      return es ? STARTERS_6_12_ES : STARTERS_6_12;
    case "higher-ed":
    case "adult":
    case "professional":
    default:
      return es ? STARTERS_ADULT_ES : STARTERS_ADULT;
  }
}

export function SentenceStarters({ gradeBand, lang = "en", onPick }: Props) {
  const starters = startersFor(gradeBand, lang);
  return (
    <div
      role="group"
      aria-label={t(lang, "sentence_starters_label")}
      className="flex flex-wrap gap-2"
    >
      {starters.map((s) => (
        <Button
          key={s}
          type="button"
          size="sm"
          variant="soft"
          className="rounded-full"
          onClick={() => onPick(s)}
        >
          {s}
        </Button>
      ))}
    </div>
  );
}

export default SentenceStarters;
