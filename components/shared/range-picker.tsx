"use client";

import { PRESETS, type PresetId } from "@/lib/rangos";
import { cn } from "@/lib/utils";

export function RangePicker({
  value,
  onChange,
}: {
  value: PresetId;
  onChange: (id: PresetId) => void;
}) {
  return (
    <div role="group" aria-label="Periodo" className="bg-card inline-flex rounded-lg border p-0.5">
      {PRESETS.map((p) => (
        <button
          key={p.id}
          type="button"
          aria-pressed={value === p.id}
          onClick={() => onChange(p.id)}
          className={cn(
            "touch-target rounded-md px-3 py-1.5 font-mono text-xs tracking-wide transition-colors",
            value === p.id
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          {p.etiqueta}
        </button>
      ))}
    </div>
  );
}
