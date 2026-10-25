"use client";

import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";
import { useMemo, useState } from "react";
import { EmptyState, ErrorState } from "@/components/shared/states";
import { Skeleton } from "@/components/ui/skeleton";
import type { Productividad } from "@/lib/api/schemas";
import { useProductividadEquipo, type Rango } from "@/lib/api/queries";
import { fmtHoras, fmtNum, fmtPct } from "@/lib/format";
import {
  ordenarProductividad,
  requiereAtencion,
  type ColumnaComparativa,
  type DireccionOrden,
} from "@/lib/tecnicos/comparativa";
import { cn } from "@/lib/utils";

const COLUMNAS: { id: ColumnaComparativa; label: string; alinearDerecha?: boolean }[] = [
  { id: "tecnico", label: "Técnico" },
  { id: "asignados", label: "Asignados", alinearDerecha: true },
  { id: "cerrados", label: "Cerrados", alinearDerecha: true },
  { id: "vencidos", label: "Vencidos", alinearDerecha: true },
  { id: "cumplimientoSlaPct", label: "SLA", alinearDerecha: true },
  { id: "promedioHorasPrimeraRespuesta", label: "1ª respuesta", alinearDerecha: true },
  { id: "promedioHorasResolucion", label: "Resolución", alinearDerecha: true },
];

export function ComparativaEquipo({
  rango,
  onSeleccionar,
}: {
  rango: Rango;
  onSeleccionar: (tecnicoId: number) => void;
}) {
  const q = useProductividadEquipo(rango);
  const [columna, setColumna] = useState<ColumnaComparativa>("cumplimientoSlaPct");
  const [direccion, setDireccion] = useState<DireccionOrden>("asc"); // asc: lo que necesita atención primero

  const ordenada = useMemo(
    () => ordenarProductividad(q.data ?? [], columna, direccion),
    [q.data, columna, direccion],
  );

  function alternarOrden(c: ColumnaComparativa) {
    if (c === columna) {
      setDireccion((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setColumna(c);
      setDireccion(c === "tecnico" ? "asc" : "desc");
    }
  }

  if (q.error) return <ErrorState error={q.error} onRetry={() => q.refetch()} />;
  if (q.isPending) return <Skeleton className="h-96 w-full" />;
  if (q.data.length === 0) return <EmptyState title="Sin técnicos con tickets en este periodo" />;

  return (
    <div className="surface bg-card overflow-x-auto rounded-xl border">
      <table className="w-full text-sm">
        <caption className="sr-only">Productividad de todo el equipo en el periodo elegido</caption>
        <thead>
          <tr className="border-b text-left">
            {COLUMNAS.map((c) => (
              <th
                key={c.id}
                scope="col"
                aria-sort={
                  columna === c.id ? (direccion === "asc" ? "ascending" : "descending") : "none"
                }
                className={cn("px-3 py-2.5", c.alinearDerecha && "text-right")}
              >
                <button
                  type="button"
                  onClick={() => alternarOrden(c.id)}
                  className={cn(
                    "eyebrow hover:text-foreground inline-flex items-center gap-1",
                    c.alinearDerecha && "flex-row-reverse",
                  )}
                >
                  {c.label}
                  {columna === c.id ? (
                    direccion === "asc" ? (
                      <ArrowUp className="size-3" aria-hidden />
                    ) : (
                      <ArrowDown className="size-3" aria-hidden />
                    )
                  ) : (
                    <ArrowUpDown className="size-3 opacity-40" aria-hidden />
                  )}
                </button>
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y">
          {ordenada.map((t) => (
            <FilaTecnico key={t.tecnicoId} t={t} onClick={() => onSeleccionar(t.tecnicoId)} />
          ))}
        </tbody>
      </table>
    </div>
  );
}

function FilaTecnico({ t, onClick }: { t: Productividad; onClick: () => void }) {
  const atencion = requiereAtencion(t);
  return (
    <tr
      onClick={onClick}
      className={cn("hover:bg-accent/50 cursor-pointer", atencion && "bg-danger-soft/40")}
    >
      <td className="max-w-[14rem] truncate px-3 py-2 font-medium" title={t.tecnico}>
        {t.tecnico}
      </td>
      <td className="num px-3 py-2 text-right font-mono">{fmtNum(t.asignados)}</td>
      <td className="num px-3 py-2 text-right font-mono">{fmtNum(t.cerrados)}</td>
      <td className={cn("num px-3 py-2 text-right font-mono", t.vencidos > 0 && "text-danger")}>
        {fmtNum(t.vencidos)}
      </td>
      <td
        className={cn("num px-3 py-2 text-right font-mono", atencion ? "text-danger" : "text-ok")}
      >
        {fmtPct(t.cumplimientoSlaPct, 0)}
      </td>
      <td className="num px-3 py-2 text-right font-mono">
        {fmtHoras(t.promedioHorasPrimeraRespuesta)}
      </td>
      <td className="num px-3 py-2 text-right font-mono">{fmtHoras(t.promedioHorasResolucion)}</td>
    </tr>
  );
}
