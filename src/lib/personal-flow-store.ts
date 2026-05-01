"use client";

/**
 * Personal flow store
 *
 * A tiny in-memory + sessionStorage-backed store that hands state between the
 * three personal-reflection screens (entry → run → recharge → detail).
 *
 * Why not zustand? We don't need it. We use a singleton + a React hook built
 * on `useSyncExternalStore`, which keeps things SSR-safe and zero-dep.
 *
 * Why sessionStorage? So a mid-flow refresh doesn't wipe the user's progress.
 * It clears automatically when the tab closes.
 */

import { useSyncExternalStore } from "react";
import type { FocusId, PromptResponse, ReflectionAnalysis } from "./types";

export interface PersonalFlowState {
  objective: string;
  focus: FocusId | null;
  prompts: string[];
  responses: PromptResponse[];
  analysis: ReflectionAnalysis | null;
  takeaway: string;
}

const STORAGE_KEY = "refleckt:personal-flow";

const initial: PersonalFlowState = {
  objective: "",
  focus: null,
  prompts: [],
  responses: [],
  analysis: null,
  takeaway: "",
};

let state: PersonalFlowState = initial;
let hydrated = false;

const subscribers = new Set<() => void>();

function hydrate() {
  if (hydrated || typeof window === "undefined") return;
  hydrated = true;
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<PersonalFlowState>;
      state = { ...initial, ...parsed };
    }
  } catch {
    // ignore parse errors
  }
}

function persist() {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // ignore quota errors
  }
}

function emit() {
  for (const cb of subscribers) cb();
}

function subscribe(cb: () => void) {
  subscribers.add(cb);
  return () => {
    subscribers.delete(cb);
  };
}

function getSnapshot(): PersonalFlowState {
  hydrate();
  return state;
}

function getServerSnapshot(): PersonalFlowState {
  return initial;
}

export const personalFlow = {
  get(): PersonalFlowState {
    hydrate();
    return state;
  },
  set(patch: Partial<PersonalFlowState>) {
    hydrate();
    state = { ...state, ...patch };
    persist();
    emit();
  },
  reset() {
    state = initial;
    if (typeof window !== "undefined") {
      sessionStorage.removeItem(STORAGE_KEY);
    }
    emit();
  },
  appendResponse(response: PromptResponse) {
    hydrate();
    state = { ...state, responses: [...state.responses, response] };
    persist();
    emit();
  },
};

export function usePersonalFlow(): PersonalFlowState {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
