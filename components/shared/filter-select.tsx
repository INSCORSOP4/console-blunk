"use client";

import { useId } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const TODOS = "__todos__";

export type Option = { value: string; label: string };

/** Select de filtro con opción "Todos"; el valor vacío ("") significa sin filtrar. */
export function FilterSelect({
  label,
  value,
  onChange,
  options,
  allLabel = "Todos",
  loading,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: Option[];
  allLabel?: string;
  loading?: boolean;
}) {
  const labelId = useId();
  const items = [{ value: TODOS, label: allLabel }, ...options];
  return (
    // div + aria-labelledby (no <label>): un <label> reenvía los clics al control y choca con el popup del Select.
    <div className="flex min-w-0 flex-col gap-1.5">
      <span id={labelId} className="eyebrow">
        {label}
      </span>
      <Select
        items={items}
        value={value || TODOS}
        onValueChange={(v) => onChange(!v || v === TODOS ? "" : String(v))}
        disabled={loading}
      >
        <SelectTrigger className="w-full" aria-labelledby={labelId}>
          <SelectValue placeholder={loading ? "Cargando…" : allLabel} />
        </SelectTrigger>
        <SelectContent>
          {items.map((o) => (
            <SelectItem key={o.value} value={o.value}>
              {o.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
