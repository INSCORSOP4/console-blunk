"use client";

import {
  AlertTriangle,
  CheckCircle2,
  CircleSlash,
  FolderOpen,
  RefreshCw,
  Search,
  XCircle,
} from "lucide-react";
import { useMemo, useState } from "react";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState, ErrorState } from "@/components/shared/states";
import { TourButton } from "@/components/shared/tour-button";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useArchivosConfianza } from "@/lib/api/queries";
import type { ArchivoRevisado, EstadoArchivo } from "@/lib/api/utilerias-schemas";
import { fmtFecha, fmtNum } from "@/lib/format";
import type { DriveStep } from "@/lib/tour/driver";
import {
  agruparPorRuta,
  contarArchivos,
  ETIQUETA_ESTADO,
  filtrarArchivos,
  tonoEstado,
  type FiltroEstado,
} from "@/lib/utilerias/archivos";
import { cn } from "@/lib/utils";

const ICONO_ESTADO: Record<EstadoArchivo, typeof CheckCircle2> = {
  Actualizado: CheckCircle2,
  Desactualizado: AlertTriangle,
  Faltante: XCircle,
  Error: XCircle,
  SinRevisar: CircleSlash,
};

const CLASE_TONO: Record<ReturnType<typeof tonoEstado>, string> = {
  ok: "bg-ok-soft text-ok",
  warn: "bg-warn-soft text-warn",
  danger: "bg-danger-soft text-danger",
  neutral: "bg-muted text-muted-foreground",
};

const PASOS_TOUR: DriveStep[] = [
  {
    element: '[data-tour="resumen"]',
    popover: {
      title: "Resumen",
      description:
        "Haz clic en una tarjeta para filtrar la lista por ese estado (otra vez para quitar el filtro).",
    },
  },
  {
    element: '[data-tour="lista"]',
    popover: {
      title: "Archivos",
      description:
        "Agrupados por carpeta de red. Un script en el 10.0.3.8 revisa estas rutas cada madrugada y guarda el resultado aquí; esta pantalla solo lo muestra.",
    },
  },
];

export function ArchivosView() {
  const q = useArchivosConfianza();
  const [filtro, setFiltro] = useState<FiltroEstado>("todos");
  const [buscar, setBuscar] = useState("");

  const archivos = useMemo(() => q.data ?? [], [q.data]);
  const conteo = useMemo(() => contarArchivos(archivos), [archivos]);
  const visibles = useMemo(
    () => filtrarArchivos(archivos, filtro, buscar),
    [archivos, filtro, buscar],
  );
  const grupos = useMemo(() => agruparPorRuta(visibles), [visibles]);

  const tarjetas: { id: FiltroEstado; nombre: string; valor: number; color: string }[] = [
    { id: "todos", nombre: "Archivos", valor: conteo.total, color: "" },
    {
      id: "atencion",
      nombre: "Requieren atención",
      valor: conteo.atencion,
      color: conteo.atencion > 0 ? "text-danger" : "text-muted-foreground",
    },
    { id: "actualizado", nombre: "Actualizados", valor: conteo.actualizado, color: "text-ok" },
    {
      id: "sinRevisar",
      nombre: "Sin revisar",
      valor: conteo.sinRevisar,
      color: conteo.sinRevisar > 0 ? "text-warn" : "text-muted-foreground",
    },
  ];

  return (
    <>
      <PageHeader
        eyebrow="Utilerías"
        title="Archivos de confianza"
        description="Archivos que otros sistemas dejan en carpetas de red (SIA, repbi, olap) y que SQL Server consume. Reemplaza al correo que mandaba notify.py: aquí se ve si llegaron actualizados hoy."
        actions={
          <>
            <Button variant="outline" onClick={() => q.refetch()} disabled={q.isFetching}>
              <RefreshCw className={cn(q.isFetching && "animate-spin")} /> Actualizar
            </Button>
            <TourButton pasos={PASOS_TOUR} />
          </>
        }
      />

      {q.error && !q.data ? (
        <ErrorState error={q.error} onRetry={() => q.refetch()} />
      ) : q.isPending ? (
        <div className="space-y-3">
          <Skeleton className="h-24 w-full" />
          {Array.from({ length: 5 }, (_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      ) : (
        <div className="space-y-6">
          <dl data-tour="resumen" className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {tarjetas.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setFiltro(t.id === filtro ? "todos" : t.id)}
                aria-pressed={filtro === t.id}
                className={cn(
                  "surface bg-card touch-target rounded-xl border p-3 text-left transition-colors",
                  filtro === t.id && "border-signal",
                )}
              >
                <dt className="eyebrow">{t.nombre}</dt>
                <dd className={cn("num font-display mt-1 text-3xl font-semibold", t.color)}>
                  {fmtNum(t.valor)}
                </dd>
              </button>
            ))}
          </dl>

          <label className="relative block w-full max-w-xs">
            <span className="sr-only">Buscar archivo</span>
            <Search
              className="text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2"
              aria-hidden
            />
            <Input
              type="search"
              value={buscar}
              onChange={(e) => setBuscar(e.target.value)}
              placeholder="Buscar por nombre o carpeta…"
              maxLength={200}
              className="pl-8"
            />
          </label>

          <div data-tour="lista">
            {visibles.length === 0 ? (
              <EmptyState
                title={
                  archivos.length === 0
                    ? "No hay archivos en el catálogo"
                    : "Ningún archivo coincide"
                }
                hint={archivos.length === 0 ? undefined : "Quita el filtro o cambia la búsqueda."}
              />
            ) : (
              <div className="space-y-5">
                {[...grupos.entries()].map(([ruta, items]) => (
                  <section key={ruta} aria-label={ruta}>
                    <h2 className="text-muted-foreground mb-2 flex items-center gap-1.5 font-mono text-xs">
                      <FolderOpen className="size-3.5" aria-hidden /> {ruta}
                    </h2>
                    <ul className="space-y-2">
                      {items.map((a) => (
                        <FilaArchivo key={a.archivoId} archivo={a} />
                      ))}
                    </ul>
                  </section>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}

function FilaArchivo({ archivo: a }: { archivo: ArchivoRevisado }) {
  const Icono = ICONO_ESTADO[a.estado];
  const tono = tonoEstado(a.estado);

  return (
    <li className="surface bg-card flex flex-wrap items-center gap-x-4 gap-y-2 rounded-xl border p-3.5">
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium">{a.nombreArchivo}</p>
        <p className="text-muted-foreground num mt-0.5 font-mono text-xs">
          {a.ultimaModificacion
            ? `Modificado ${fmtFecha(a.ultimaModificacion, "d MMM yyyy, HH:mm")}`
            : "Sin fecha de modificación"}
          {a.revisadoEn && ` · Revisado ${fmtFecha(a.revisadoEn, "d MMM, HH:mm")}`}
        </p>
        {a.detalle && <p className="text-danger mt-1 text-xs">{a.detalle}</p>}
      </div>
      <span
        className={cn(
          "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium whitespace-nowrap",
          CLASE_TONO[tono],
        )}
      >
        <Icono className="size-3.5" aria-hidden />
        {ETIQUETA_ESTADO[a.estado]}
      </span>
    </li>
  );
}
