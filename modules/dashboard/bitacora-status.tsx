"use client";

import { CheckCircle2, CircleAlert } from "lucide-react";
import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";
import { useChecklist } from "@/lib/api/queries";
import { GRUPO_ACTIVIDADES_SOFT } from "@/lib/api/bitacora-schemas";
import { contarChecklist, incidenciasDelDia } from "@/lib/bitacora/checklist";
import { GRUPO_CAMARAS, GRUPO_RESPALDOS, obtenerConfigBitacora } from "@/lib/bitacora/grupos";
import { fmtNum, hoyMx } from "@/lib/format";
import { cn } from "@/lib/utils";

// Las bitácoras diarias de hoy: Depuración de respaldos es mensual, no aplica aquí.
const GRUPOS_DIARIOS = [GRUPO_ACTIVIDADES_SOFT, GRUPO_RESPALDOS, GRUPO_CAMARAS] as const;

/** Resumen de las bitácoras diarias de hoy: cuánto falta y si alguna trae una incidencia. */
export function BitacoraStatus() {
  const hoy = hoyMx();
  // Son siempre las mismas 3 bitácoras diarias: llamar el hook una vez por cada una es seguro aquí.
  const actividades = useChecklist(GRUPOS_DIARIOS[0], hoy);
  const respaldos = useChecklist(GRUPOS_DIARIOS[1], hoy);
  const camaras = useChecklist(GRUPOS_DIARIOS[2], hoy);
  const filas = [actividades, respaldos, camaras].map((q, i) => ({
    config: obtenerConfigBitacora(GRUPOS_DIARIOS[i]),
    q,
  }));

  if (filas.every((f) => f.q.isPending)) {
    return (
      <div className="space-y-2">
        {filas.map((f) => (
          <Skeleton key={f.config.grupo} className="h-7 w-full" />
        ))}
      </div>
    );
  }

  const cargadas = filas.filter((f) => f.q.data);
  const totalPendientes = cargadas.reduce(
    (s, f) => s + contarChecklist(f.q.data!.items).pendiente,
    0,
  );
  const totalIncidencias = cargadas.reduce(
    (s, f) => s + incidenciasDelDia(f.q.data!.items).length,
    0,
  );
  const todoAlDia =
    cargadas.length === filas.length && totalPendientes === 0 && totalIncidencias === 0;

  return (
    <>
      <p
        className={cn(
          "mb-3 flex items-center gap-2 text-sm font-medium",
          todoAlDia ? "text-ok" : "text-foreground",
        )}
      >
        {todoAlDia ? (
          <CheckCircle2 className="size-4 shrink-0" aria-hidden />
        ) : (
          <CircleAlert className="text-warn size-4 shrink-0" aria-hidden />
        )}
        {todoAlDia
          ? "Todo al día"
          : `${fmtNum(totalPendientes)} pendiente${totalPendientes === 1 ? "" : "s"}${totalIncidencias > 0 ? ` · ${fmtNum(totalIncidencias)} con nota` : ""}`}
      </p>
      <ul className="space-y-2">
        {filas.map(({ config, q }) => {
          const conteo = q.data ? contarChecklist(q.data.items) : null;
          const incidencias = q.data ? incidenciasDelDia(q.data.items).length : 0;
          return (
            <li key={config.grupo}>
              <Link
                href={config.rutaBase}
                className="hover:bg-accent/50 flex items-center justify-between gap-3 rounded-md px-1.5 py-1 text-sm transition-colors"
              >
                <span className="truncate">{config.titulo}</span>
                {q.error ? (
                  <span className="text-muted-foreground font-mono text-xs">—</span>
                ) : !conteo ? (
                  <Skeleton className="h-4 w-16" />
                ) : (
                  <span className="num flex shrink-0 items-center gap-2 font-mono text-xs">
                    {incidencias > 0 && (
                      <span className="text-warn">
                        {incidencias} nota{incidencias === 1 ? "" : "s"}
                      </span>
                    )}
                    <span className={conteo.pendiente > 0 ? "text-info" : "text-muted-foreground"}>
                      {conteo.pendiente > 0 ? `${fmtNum(conteo.pendiente)} pend.` : "Completo"}
                    </span>
                  </span>
                )}
              </Link>
            </li>
          );
        })}
      </ul>
    </>
  );
}
