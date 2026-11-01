"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { AlertTriangle, ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useMemo } from "react";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState, ErrorState } from "@/components/shared/states";
import { TourButton } from "@/components/shared/tour-button";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useChecklist } from "@/lib/api/queries";
import {
  contarChecklist,
  estaCompleto,
  ETIQUETA_ESTADO,
  incidenciasDelDia,
  revisoresDelDia,
} from "@/lib/bitacora/checklist";
import {
  avanzar,
  esFechaActual,
  fechaActual,
  fechaDesdeEntrada,
  valorDeEntrada,
} from "@/lib/bitacora/fecha";
import { articuloPlural, type ConfigBitacora } from "@/lib/bitacora/grupos";
import { fmtFecha, fmtNum } from "@/lib/format";
import type { DriveStep } from "@/lib/tour/driver";
import { cn } from "@/lib/utils";
import { FilaChecklist } from "./fila-checklist";
import { BitacoraSubnav } from "./subnav";

const PASOS_TOUR: DriveStep[] = [
  {
    element: '[data-tour="fecha"]',
    popover: {
      title: "Fecha",
      description:
        "Cambia de día (o de mes, según la bitácora) para revisar o corregir un registro anterior. Nunca se borra: cada guardado se corrige, no se elimina.",
    },
  },
  {
    element: '[data-tour="resumen"]',
    popover: { title: "Resumen", description: "Cuántas actividades están en cada estado ese día." },
  },
  {
    element: '[data-tour="checklist"]',
    popover: {
      title: "Actividades",
      description:
        "Marca el estado de cada una y, si no es 'Ok', escribe qué pasó. Queda registrado quién y cuándo lo guardó.",
    },
  },
];

export function ChecklistView({ config }: { config: ConfigBitacora }) {
  const router = useRouter();
  const search = useSearchParams();
  const parametro = search.get("fecha") ?? "";
  const fecha = /^\d{4}-\d{2}-\d{2}$/.test(parametro) ? parametro : fechaActual(config);
  const esActual = esFechaActual(config, fecha);
  const etiquetaPeriodo = config.granularidad === "mes" ? "Mes" : "Día";

  const irA = (nuevaFecha: string) =>
    router.push(
      nuevaFecha === fechaActual(config)
        ? config.rutaBase
        : `${config.rutaBase}?fecha=${nuevaFecha}`,
    );

  // Keyboard shortcuts para navegación de fechas
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      
      if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
        e.preventDefault();
        irA(avanzar(config, fecha, e.key === "ArrowLeft" ? -1 : 1));
      }
      if (e.key === "t" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        irA(fechaActual(config));
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [config, fecha]);

  const q = useChecklist(config.grupo, fecha);
  const items = useMemo(() => q.data?.items ?? [], [q.data]);
  const conteo = useMemo(() => contarChecklist(items), [items]);
  const completo = estaCompleto(items);
  const revisores = useMemo(() => revisoresDelDia(items), [items]);
  const incidencias = useMemo(() => incidenciasDelDia(items), [items]);

  const kpis: [string, number, string][] = [
    ["Ok", conteo.ok, "text-ok"],
    [
      "Advertencia",
      conteo.advertencia,
      conteo.advertencia > 0 ? "text-warn" : "text-muted-foreground",
    ],
    ["Falla", conteo.falla, conteo.falla > 0 ? "text-danger" : "text-muted-foreground"],
    ["Crítico", conteo.critico, conteo.critico > 0 ? "text-danger" : "text-muted-foreground"],
    ["Pendiente", conteo.pendiente, conteo.pendiente > 0 ? "text-info" : "text-muted-foreground"],
  ];

  return (
    <>
      <PageHeader
        eyebrow="Bitácora"
        title={config.titulo}
        description={config.descripcion}
        actions={<TourButton pasos={PASOS_TOUR} />}
      />
      <BitacoraSubnav rutaBase={config.rutaBase} nombrePlural={config.nombrePlural} />

      <div className="mb-5 flex flex-wrap items-center gap-3">
        <nav data-tour="fecha" aria-label={etiquetaPeriodo} className="flex items-center gap-1">
          <Button
            variant="outline"
            size="icon"
            onClick={() => irA(avanzar(config, fecha, -1))}
            aria-label={`${etiquetaPeriodo} anterior`}
          >
            <ChevronLeft />
          </Button>
          <label className="relative">
            <span className="sr-only">{etiquetaPeriodo}</span>
            <input
              type={config.granularidad === "mes" ? "month" : "date"}
              value={valorDeEntrada(config, fecha)}
              max={valorDeEntrada(config, fechaActual(config))}
              min={config.granularidad === "mes" ? "2020-01" : "2020-01-01"}
              onChange={(e) => e.target.value && irA(fechaDesdeEntrada(config, e.target.value))}
              className="bg-background h-9 rounded-lg border px-2.5 font-mono text-sm"
            />
          </label>
          <Button
            variant="outline"
            size="icon"
            onClick={() => irA(avanzar(config, fecha, 1))}
            disabled={esActual}
            aria-label={`${etiquetaPeriodo} siguiente`}
          >
            <ChevronRight />
          </Button>
          {!esActual && (
            <Button variant="ghost" size="sm" onClick={() => irA(fechaActual(config))}>
              {config.granularidad === "mes" ? "Este mes" : "Hoy"}
            </Button>
          )}
        </nav>

        {items.length > 0 && (
          <span
            className={cn(
              "rounded-full px-2.5 py-1 text-xs font-medium",
              completo ? "bg-ok-soft text-ok" : "bg-info-soft text-info",
            )}
          >
            {completo
              ? "Completo"
              : `${conteo.pendiente} pendiente${conteo.pendiente === 1 ? "" : "s"}`}
          </span>
        )}
        {revisores.length > 0 && (
          <p className="text-muted-foreground text-sm">Revisó: {revisores.join(", ")}</p>
        )}
      </div>

      {q.error && !q.data ? (
        <ErrorState error={q.error} onRetry={() => q.refetch()} />
      ) : q.isPending ? (
        <div className="space-y-2">
          {Array.from({ length: 8 }, (_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <EmptyState
          title={`No hay ${config.nombrePlural} en el catálogo`}
          hint={`Agrega ${articuloPlural(config)} desde Catálogo de ${config.nombrePlural}.`}
        />
      ) : (
        <>
          {/* Barra de progreso del día */}
          <div className="mb-5 rounded-xl border bg-card p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Progreso del día</span>
              <span className="text-sm text-muted-foreground">
                {conteo.ok} de {items.length} completados
              </span>
            </div>
            <div className="h-3 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-ok transition-all duration-500"
                style={{ width: `${(conteo.ok / items.length) * 100}%` }}
              />
            </div>
            <div className="mt-2 flex justify-between text-xs text-muted-foreground">
              <span className="text-ok">{conteo.ok} OK</span>
              <span className="text-warn">{conteo.advertencia} Advertencia</span>
              <span className="text-danger">{conteo.falla + conteo.critico} Con incidencia</span>
              <span className="text-info">{conteo.pendiente} Pendientes</span>
            </div>
          </div>

          <dl data-tour="resumen" className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-5">
            {kpis.map(([nombre, valor, color]) => (
              <div key={nombre} className="surface bg-card rounded-xl border p-3">
                <dt className="eyebrow">{nombre}</dt>
                <dd className={cn("num font-display mt-1 text-2xl font-semibold", color)}>
                  {fmtNum(valor)}
                </dd>
              </div>
            ))}
          </dl>

          {incidencias.length > 0 && (
            <section
              aria-labelledby="incidencias-hoy"
              className="surface bg-card mb-5 rounded-xl border p-4"
            >
              <h2 id="incidencias-hoy" className="eyebrow mb-3 flex items-center gap-1.5">
                <AlertTriangle className="size-3.5" aria-hidden /> Lo que escribió quien revisó (
                {incidencias.length})
              </h2>
              <ul className="divide-y">
                {incidencias.map((item) => (
                  <li key={item.actividadId} className="py-2.5 first:pt-0 last:pb-0">
                    <a
                      href={`#act-${item.actividadId}`}
                      className="flex flex-wrap items-center gap-2 font-medium hover:underline"
                    >
                      {item.nombre}
                      <span
                        className={cn(
                          "rounded-full px-2 py-0.5 text-xs font-medium",
                          item.estado === "Advertencia"
                            ? "bg-warn-soft text-warn"
                            : "bg-danger-soft text-danger",
                        )}
                      >
                        {ETIQUETA_ESTADO[item.estado!]}
                      </span>
                    </a>
                    <p className="text-muted-foreground mt-1 text-sm whitespace-pre-wrap">
                      {item.observacion}
                    </p>
                    <p className="text-muted-foreground num mt-1 font-mono text-xs">
                      {item.actualizadoPor ?? item.revisadoPor} ·{" "}
                      {fmtFecha(item.actualizadoEn ?? item.revisadoEn, "d MMM, HH:mm")}
                    </p>
                  </li>
                ))}
              </ul>
            </section>
          )}

          <ul
            data-tour="checklist"
            className={cn("space-y-2 transition-opacity", q.isPlaceholderData && "opacity-60")}
          >
            {items.map((item) => (
              <FilaChecklist
                key={item.actividadId}
                item={item}
                fecha={fecha}
                grupo={config.grupo}
              />
            ))}
          </ul>
        </>
      )}
    </>
  );
}
