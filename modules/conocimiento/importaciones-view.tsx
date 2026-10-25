"use client";

import { ChevronDown } from "lucide-react";
import { useState } from "react";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState, ErrorState } from "@/components/shared/states";
import { Skeleton } from "@/components/ui/skeleton";
import { useImportacion, useImportaciones } from "@/lib/api/queries";
import { fmtFecha } from "@/lib/format";
import { cn } from "@/lib/utils";
import { InformeImportacion } from "./informe-importacion";
import { KbSubnav } from "./subnav";

export function ImportacionesView() {
  const lista = useImportaciones(50);
  const [abierta, setAbierta] = useState<number | null>(null);

  return (
    <>
      <PageHeader
        eyebrow="Base de conocimiento"
        title="Bitácora de subidas"
        description="Quién subió notas, cuándo y qué pasó con cada archivo."
      />
      <KbSubnav />

      {lista.error && !lista.data ? (
        <ErrorState error={lista.error} onRetry={() => lista.refetch()} />
      ) : lista.isPending ? (
        <div className="space-y-2">
          {Array.from({ length: 4 }, (_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      ) : lista.data.length === 0 ? (
        <EmptyState title="Aún no hay subidas" hint="Cuando alguien suba notas, aparecerá aquí." />
      ) : (
        <ul className="space-y-2">
          {lista.data.map((i) => {
            const abiertaAhora = abierta === i.importacionId;
            const panel = `detalle-${i.importacionId}`;
            return (
              <li key={i.importacionId} className="surface bg-card rounded-xl border">
                <button
                  type="button"
                  aria-expanded={abiertaAhora}
                  aria-controls={panel}
                  onClick={() => setAbierta(abiertaAhora ? null : i.importacionId)}
                  className="touch-target flex w-full flex-wrap items-center gap-x-4 gap-y-1 p-4 text-left"
                >
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-medium">{i.usuarioNombre}</span>
                    <span className="text-muted-foreground num block font-mono text-xs">
                      {fmtFecha(i.iniciadaEn, "d MMM yyyy, HH:mm")} · {i.origen}
                    </span>
                  </span>
                  <span className="num flex flex-wrap items-center gap-x-3 font-mono text-xs">
                    <span>{i.archivos} arch.</span>
                    <span className="text-ok">{i.nuevos} nuevas</span>
                    <span className="text-info">{i.actualizados} act.</span>
                    {i.conSecretos > 0 && (
                      <span className="text-info">{i.conSecretos} con ocultos</span>
                    )}
                    {i.errores > 0 && <span className="text-danger">{i.errores} errores</span>}
                    <span
                      className={cn(
                        "rounded-full px-2 py-0.5",
                        i.estado === "Fallida"
                          ? "bg-danger-soft text-danger"
                          : "bg-muted text-muted-foreground",
                      )}
                    >
                      {i.estado}
                    </span>
                  </span>
                  <ChevronDown
                    className={cn("size-4 transition-transform", abiertaAhora && "rotate-180")}
                    aria-hidden
                  />
                </button>
                {abiertaAhora && (
                  <div id={panel} className="border-t p-4">
                    <Detalle id={i.importacionId} />
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}

function Detalle({ id }: { id: number }) {
  const { data, error, isPending, refetch } = useImportacion(id);
  if (error) return <ErrorState error={error} onRetry={() => refetch()} />;
  if (isPending) return <Skeleton className="h-40 w-full" />;
  if (!data.informe)
    return (
      <p className="text-muted-foreground text-sm">Esta subida no guardó el detalle por archivo.</p>
    );
  return <InformeImportacion archivos={data.informe} />;
}
