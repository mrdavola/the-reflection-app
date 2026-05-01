// Student-facing strings used across reflection flows.
// Keep keys identical between languages so `t()` can fall back to English safely.

export const STRINGS = {
  en: {
    greeting_welcome: "Welcome — ready to reflect?",
    generating_feedback: "Generating your feedback…",
    reflect_again: "Reflect again",
    continue: "Continue",
    next: "Next",
    done: "Done",
    transcript_label: "Transcript / your answer",
    sentence_starters_label: "Sentence starters",
    recharge_take_breath: "Take a breath",
    recharge_save_takeaway: "Save one takeaway",
    recharge_stretch: "Stretch 30s",
    recharge_one_sentence: "Write one sentence",
    thank_you: "Thank you — your reflection has been sent to your teacher.",
  },
  es: {
    greeting_welcome: "Bienvenido — ¿listo para reflexionar?",
    generating_feedback: "Generando tus comentarios…",
    reflect_again: "Reflexionar de nuevo",
    continue: "Continuar",
    next: "Siguiente",
    done: "Hecho",
    transcript_label: "Transcripción / tu respuesta",
    sentence_starters_label: "Iniciadores de oraciones",
    recharge_take_breath: "Toma un respiro",
    recharge_save_takeaway: "Guarda una idea clave",
    recharge_stretch: "Estírate 30 s",
    recharge_one_sentence: "Escribe una oración",
    thank_you: "Gracias — tu reflexión se envió a tu maestro.",
  },
} as const;

export type Lang = keyof typeof STRINGS;
export type StringKey = keyof typeof STRINGS["en"];

/**
 * Translate a key into the requested language.
 * Falls back to English if the language is unrecognized OR if the key is
 * missing from that language's dictionary.
 */
export function t(lang: Lang | string, key: StringKey): string {
  const normalized: Lang =
    lang === "es" || (typeof lang === "string" && lang.toLowerCase().startsWith("es"))
      ? "es"
      : "en";
  const dict = STRINGS[normalized] as Record<string, string> | undefined;
  if (dict && typeof dict[key] === "string") return dict[key];
  return STRINGS.en[key];
}
