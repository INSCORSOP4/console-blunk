"use client";

import { CheckCircle2, CircleAlert } from "lucide-react";
import Link from "next/link";
import { EmptyState, ErrorState } from "@/components/shared/states";
import { Skeleton } from "@/components/ui/skeleton";
import { useArchivosConfianza } from "@/lib/api/queries";
import { contarArchivos, ETIQUETA_ESTADO, requiereAtencion } from "@/lib/utilerias/archivos";
import { cn } from "@/lib/utils";

const TOP = 5;

/** Archivos de confianza (SIA/repbi/olap) que no llegaron actualizados hoy, para no entrar a Utilerías a revisar. */
export function ArchivosStatus() {
  const { data, error, isPending, refetch } = useArchivosConfianza();

  if (error) return <ErrorState error={error} onRetry={() => refetch()} />;
  if (isPending)
    return (
      <div className="space-y-2">
        {Array.from({ length: 3 }, (_, i) => (
          <Skeleton key={i} className="h-7 w-full" />
        ))}
      </div>
    );
  if (data.length === 0)
    return <EmptyState title="Sin archivos en el catálogo" hint="Configúralos en Utilerías." />;

  const problematicos = data.filter(requiereAtencion);
  const conteo = contarArchivos(data);

  return (
    <>
      <p
        className={cn(
          "mb-3 flex items-center gap-2 text-sm font-medium",
          conteo.atencion === 0 && conteo.sinRevisar === 0 ? "text-ok" : "text-foreground",
        )}
      >
        {conteo.atencion === 0 && conteo.sinRevisar === 0 ? (
          <CheckCircle2 className="size-4 shrink-0" aria-hidden />
        ) : (
          <CircleAlert className="text-danger size-4 shrink-0" aria-hidden />
        )}
        {conteo.atencion === 0 && conteo.sinRevisar === 0
          ? "Todo en orden"
          : `${problematicos.length} archivo${problematicos.length === 1 ? "" : "s"} con problemas`}
      </p>
      {problematicos.length > 0 && (
        <ul className="space-y-2">
          {problematicos.slice(0, TOP).map((a) => (
            <li key={a.archivoId} className="flex items-center justify-between gap-3 text-sm">
              <span className="truncate">{a.nombreArchivo}</span>
              <span
                className={cn(
                  "shrink-0 rounded-full px-2 py-0.5 text-xs font-medium",
                  a.estado === "Desactualizado"
                    ? "bg-warn-soft text-warn"
                    : "bg-danger-soft text-danger",
                )}
              >
                {ETIQUETA_ESTADO[a.estado]}
              </span>
            </li>
          ))}
          {problematicos.length > TOP && (
            <p className="text-muted-foreground text-xs">y {problematicos.length - TOP} más</p>
          )}
        </ul>
      )}
      <Link
        href="/utilerias/archivos"
        className="text-muted-foreground hover:text-foreground mt-3 inline-block font-mono text-xs"
      >
        Ver todos los archivos →
      </Link>
    </>
  );
}
