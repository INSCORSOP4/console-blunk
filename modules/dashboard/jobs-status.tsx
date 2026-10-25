"use client";

import { CheckCircle2, CircleAlert, Loader2 } from "lucide-react";
import Link from "next/link";
import { EmptyState, ErrorState } from "@/components/shared/states";
import { Skeleton } from "@/components/ui/skeleton";
import { useJobs } from "@/lib/api/queries";
import { ETIQUETA_ESTADO, contarJobs, requiereAtencion } from "@/lib/utilerias/jobs";
import { cn } from "@/lib/utils";
import type { JobResumen } from "@/lib/api/utilerias-schemas";

const TOP = 5;

/** Por qué un job requiere atención: su propio estado, o si no, un paso que falló aunque el job terminara bien. */
function motivo(j: JobResumen): { texto: string; tono: "danger" | "warn" } {
  if (j.estado === "Fallido") return { texto: "Falló", tono: "danger" };
  if (j.estado === "Cancelado" || j.estado === "Reintento")
    return { texto: ETIQUETA_ESTADO[j.estado], tono: "warn" };
  const fallidos = j.pasos.filter((p) => p.estado === "Fallido").length;
  return { texto: `${fallidos} paso${fallidos === 1 ? "" : "s"} con error`, tono: "warn" };
}

/** Jobs vigilados que fallaron o quedaron en advertencia, para no tener que entrar a Utilerías a revisar. */
export function JobsStatus() {
  const { data, error, isPending, refetch } = useJobs(true, false);

  if (error) return <ErrorState error={error} onRetry={() => refetch()} />;
  if (isPending)
    return (
      <div className="space-y-2">
        {Array.from({ length: 3 }, (_, i) => (
          <Skeleton key={i} className="h-7 w-full" />
        ))}
      </div>
    );
  if (data.jobs.length === 0)
    return <EmptyState title="Sin jobs vigilados" hint="Configúralos en Utilerías." />;

  const problematicos = data.jobs.filter(requiereAtencion);
  const conteo = contarJobs(data.jobs);

  return (
    <>
      <p
        className={cn(
          "mb-3 flex items-center gap-2 text-sm font-medium",
          conteo.atencion === 0 ? "text-ok" : "text-foreground",
        )}
      >
        {conteo.atencion === 0 ? (
          <CheckCircle2 className="size-4 shrink-0" aria-hidden />
        ) : (
          <CircleAlert className="text-danger size-4 shrink-0" aria-hidden />
        )}
        {conteo.atencion === 0
          ? "Todo en orden"
          : `${conteo.atencion} job${conteo.atencion === 1 ? "" : "s"} con problemas`}
        {conteo.ejecutando > 0 && (
          <span className="text-info ml-auto flex items-center gap-1 text-xs font-normal">
            <Loader2 className="size-3 animate-spin" aria-hidden /> {conteo.ejecutando} en ejecución
          </span>
        )}
      </p>
      {problematicos.length > 0 && (
        <ul className="space-y-2">
          {problematicos.slice(0, TOP).map((j) => {
            const { texto, tono } = motivo(j);
            return (
              <li key={j.nombre} className="flex items-center justify-between gap-3 text-sm">
                <span className="truncate">{j.nombre}</span>
                <span
                  className={cn(
                    "shrink-0 rounded-full px-2 py-0.5 text-xs font-medium",
                    tono === "danger" ? "bg-danger-soft text-danger" : "bg-warn-soft text-warn",
                  )}
                >
                  {texto}
                </span>
              </li>
            );
          })}
          {problematicos.length > TOP && (
            <p className="text-muted-foreground text-xs">y {problematicos.length - TOP} más</p>
          )}
        </ul>
      )}
      <Link
        href="/utilerias/jobs"
        className="text-muted-foreground hover:text-foreground mt-3 inline-block font-mono text-xs"
      >
        Ver todos los jobs →
      </Link>
    </>
  );
}
