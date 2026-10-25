"use client";

import { useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState, ErrorState } from "@/components/shared/states";
import { useDistribucion, type Rango } from "@/lib/api/queries";
import { fmtNum } from "@/lib/format";
import { cn } from "@/lib/utils";

const DIMENSIONES = [
  { id: "categoria", etiqueta: "Categoría" },
  { id: "grupo", etiqueta: "Grupo" },
  { id: "modo", etiqueta: "Modo" },
  { id: "prioridad", etiqueta: "Prioridad" },
  { id: "tipo-solicitud", etiqueta: "Tipo" },
  { id: "tecnico", etiqueta: "Técnico" },
] as const;

const MAX_FILAS = 8;

export function DistributionPanel({ rango }: { rango: Rango }) {
  const [dimension, setDimension] = useState<(typeof DIMENSIONES)[number]["id"]>("categoria");
  const { data, error, isPending, refetch } = useDistribucion(dimension, rango);

  const filas = data?.slice(0, MAX_FILAS) ?? [];
  const resto = (data?.slice(MAX_FILAS) ?? []).reduce((acc, f) => acc + f.total, 0);
  const max = Math.max(1, ...filas.map((f) => f.total), resto);
  const total = (data ?? []).reduce((acc, f) => acc + f.total, 0);

  return (
    <div>
      <div role="tablist" aria-label="Agrupar por" className="mb-5 flex flex-wrap gap-1">
        {DIMENSIONES.map((d) => (
          <button
            key={d.id}
            role="tab"
            aria-selected={dimension === d.id}
            onClick={() => setDimension(d.id)}
            className={cn(
              "touch-target rounded-md px-2.5 py-1 font-mono text-xs transition-colors",
              dimension === d.id
                ? "bg-foreground text-background"
                : "text-muted-foreground hover:bg-accent",
            )}
          >
            {d.etiqueta}
          </button>
        ))}
      </div>

      {error ? (
        <ErrorState error={error} onRetry={() => refetch()} />
      ) : isPending ? (
        <div className="space-y-3">
          {Array.from({ length: 6 }, (_, i) => (
            <Skeleton key={i} className="h-7 w-full" />
          ))}
        </div>
      ) : filas.length === 0 ? (
        <EmptyState title="Sin datos en este periodo" />
      ) : (
        <ul className="space-y-2.5">
          {filas.map((f, i) => (
            <Fila
              key={`${f.id}-${f.nombre}`}
              nombre={f.nombre}
              total={f.total}
              max={max}
              suma={total}
              tono={i === 0 && f.nombre !== "Sin dato"}
            />
          ))}
          {resto > 0 && <Fila nombre="Otros" total={resto} max={max} suma={total} tenue />}
        </ul>
      )}
    </div>
  );
}

function Fila({
  nombre,
  total,
  max,
  suma,
  tono,
  tenue,
}: {
  nombre: string;
  total: number;
  max: number;
  suma: number;
  tono?: boolean;
  tenue?: boolean;
}) {
  const pct = suma ? (total / suma) * 100 : 0;
  return (
    <li className="grid grid-cols-[minmax(0,9rem)_1fr_auto] items-center gap-3 text-sm sm:grid-cols-[minmax(0,12rem)_1fr_auto]">
      <span className="truncate" title={nombre}>
        {nombre}
      </span>
      <span className="bg-muted h-2.5 overflow-hidden rounded-full">
        <span
          className={cn(
            "block h-full rounded-full",
            tono ? "bg-signal" : tenue ? "bg-foreground/20" : "bg-foreground/55",
          )}
          style={{ width: `${(total / max) * 100}%` }}
        />
      </span>
      <span className="num w-24 text-right font-mono text-xs">
        {fmtNum(total)} <span className="text-muted-foreground">· {pct.toFixed(0)}%</span>
      </span>
    </li>
  );
}
