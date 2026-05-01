import type { AccessType } from "./types";

export const ACCESS_TYPES: { id: AccessType; label: string; description: string }[] = [
  {
    id: "full",
    label: "Full access",
    description: "Participants log in and see scores, feedback, and trends.",
  },
  {
    id: "limited",
    label: "Limited view",
    description: "Participants see a short summary, no numeric scores.",
  },
  {
    id: "name-only",
    label: "Name only — no login",
    description: "Best for K–8: students enter just a first name to participate.",
  },
  {
    id: "anonymous",
    label: "Anonymous",
    description: "No name required. Teacher can't attribute reflections.",
  },
];
