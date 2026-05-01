"use client";

import { Plus, Trash2 } from "lucide-react";
import { nanoid } from "nanoid";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import type { Rubric, RubricCriterion } from "@/lib/types";

interface Props {
  value: Rubric;
  onChange: (next: Rubric) => void;
}

const DEFAULT_CRITERIA: { label: string; description: string }[] = [
  { label: "Uses evidence", description: "Backs claims with specific examples or details." },
  { label: "Explains reasoning", description: "Shows the thinking behind a conclusion." },
  { label: "Identifies a next step", description: "Names a concrete action to try next." },
];

export function RubricEditor({ value, onChange }: Props) {
  function setEnabled(enabled: boolean) {
    if (enabled && value.criteria.length === 0) {
      // First-time enable seeds three starter criteria.
      onChange({
        enabled: true,
        criteria: DEFAULT_CRITERIA.map((c) => ({
          id: nanoid(8),
          label: c.label,
          description: c.description,
        })),
      });
      return;
    }
    onChange({ ...value, enabled });
  }

  function updateCriterion(id: string, patch: Partial<RubricCriterion>) {
    onChange({
      ...value,
      criteria: value.criteria.map((c) => (c.id === id ? { ...c, ...patch } : c)),
    });
  }

  function removeCriterion(id: string) {
    onChange({
      ...value,
      criteria: value.criteria.filter((c) => c.id !== id),
    });
  }

  function addCriterion() {
    onChange({
      ...value,
      criteria: [
        ...value.criteria,
        { id: nanoid(8), label: "", description: "" },
      ],
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <Label className="text-sm font-medium">Enable rubric</Label>
          <p className="mt-0.5 text-xs text-muted-foreground">
            When enabled, AI feedback will rate each criterion on a 1–4 scale
            (Beginning → Strong) with a short evidence quote.
          </p>
        </div>
        <Switch checked={value.enabled} onCheckedChange={setEnabled} />
      </div>

      {value.enabled && (
        <div className="space-y-3">
          {value.criteria.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border bg-card p-6 text-center text-sm text-muted-foreground">
              No criteria yet. Add 3–6 things you want to evaluate.
            </div>
          ) : (
            <ul className="space-y-2">
              {value.criteria.map((c, idx) => (
                <li
                  key={c.id}
                  className="rounded-2xl border border-border/70 bg-card p-3"
                >
                  <div className="flex items-start gap-3">
                    <span className="mt-2 inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-accent px-1.5 text-xs font-semibold text-accent-foreground">
                      {idx + 1}
                    </span>
                    <div className="flex flex-1 flex-col gap-2">
                      <Input
                        value={c.label}
                        onChange={(e) =>
                          updateCriterion(c.id, { label: e.target.value })
                        }
                        placeholder="Criterion (e.g. Uses evidence)"
                      />
                      <Input
                        value={c.description ?? ""}
                        onChange={(e) =>
                          updateCriterion(c.id, { description: e.target.value })
                        }
                        placeholder="Optional one-line description"
                        className="text-sm"
                      />
                    </div>
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      aria-label="Remove criterion"
                      onClick={() => removeCriterion(c.id)}
                      className="text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
          <Button
            type="button"
            variant="ghost"
            onClick={addCriterion}
            disabled={value.criteria.length >= 8}
          >
            <Plus className="h-4 w-4" />
            Add criterion
          </Button>
        </div>
      )}
    </div>
  );
}
