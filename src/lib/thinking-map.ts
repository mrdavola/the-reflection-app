import type { ClassThinkingMap } from "./types";

type ReflectionForMap = {
  studentId: string;
  steps: Array<{
    label: string;
    transcription: string;
  }>;
};

const STOP_WORDS = new Set([
  "about",
  "again",
  "also",
  "are",
  "because",
  "could",
  "from",
  "have",
  "how",
  "into",
  "see",
  "like",
  "many",
  "might",
  "that",
  "their",
  "there",
  "they",
  "think",
  "this",
  "what",
  "when",
  "where",
  "with",
  "would",
  "wonder",
]);

const STEP_KEYS = {
  See: "see",
  Think: "think",
  Wonder: "wonder",
} as const;

export function buildThinkingMap(reflections: ReflectionForMap[]): ClassThinkingMap {
  const map: ClassThinkingMap = { see: [], think: [], wonder: [] };

  for (const reflection of reflections) {
    for (const step of reflection.steps) {
      const key = STEP_KEYS[step.label as keyof typeof STEP_KEYS];
      if (!key) continue;
      const clusterLabel = extractClusterLabel(step.transcription);
      const existing = map[key].find((cluster) => cluster.label === clusterLabel);

      if (existing) {
        existing.studentIds.push(reflection.studentId);
        if (existing.representativeQuotes.length < 3) {
          existing.representativeQuotes.push(step.transcription);
        }
        existing.summary = `${existing.studentIds.length} students mentioned ${clusterLabel.toLowerCase()}.`;
      } else {
        map[key].push({
          label: clusterLabel,
          summary: `1 student mentioned ${clusterLabel.toLowerCase()}.`,
          studentIds: [reflection.studentId],
          representativeQuotes: [step.transcription],
        });
      }
    }
  }

  for (const key of ["see", "think", "wonder"] as const) {
    map[key].sort((a, b) => b.studentIds.length - a.studentIds.length);
  }

  return map;
}

function extractClusterLabel(transcript: string) {
  const words = transcript
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .split(/\s+/)
    .filter((word) => word.length > 2 && !STOP_WORDS.has(word));

  const waiting = words.find((word) => word.startsWith("wait"));
  if (waiting) return "Waiting";

  const planning = words.find((word) => word.startsWith("plan") || word === "route");
  if (planning) return "Planning route";

  const weather = words.find((word) => word === "weather" || word === "rainy");
  if (weather) return "Weather";

  const map = words.find((word) => word === "map" || word === "notes");
  if (map) return "Map and notes";

  const line = words.find((word) => word === "line");
  if (line) return "Line";

  const [first = "Reflection", second] = words;
  return titleCase(second ? `${first} ${second}` : first);
}

function titleCase(value: string) {
  return value.replace(/\b\w/g, (letter) => letter.toUpperCase());
}
