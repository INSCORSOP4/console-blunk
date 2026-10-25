"use client";

import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { KpiCard } from "@/components/shared/kpi-card";
import { PageHeader } from "@/components/shared/page-header";
import { RangePicker } from "@/components/shared/range-picker";
import { EmptyState, ErrorState } from "@/components/shared/states";
import { TourButton } from "@/components/shared/tour-button";
import { useCargaTecnicos, useProductividad, useTendenciaProductividad } from "@/lib/api/queries";
import { fmtHoras, fmtNum, fmtPct } from "@/lib/format";
import { agrupacionDe, rangoDe, type PresetId } from "@/lib/rangos";
import type { DriveStep } from "@/lib/tour/driver";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { ComparativaEquipo } from "./comparativa-equipo";
import { ProductividadTrend, ProductividadTrendLegend } from "./productividad-trend";

const PASOS_TOUR: DriveStep[] = [
  {
    element: '[data-tour="carga"]',
    popover: {
      title: "Carga de trabajo",
      description:
        "Todos los técnicos con sus tickets abiertos ahora mismo. Haz clic en uno para ver su productividad a la derecha.",
    },
  },
  {
    element: '[data-tour="productividad"]',
    popover: {
      title: "Productividad",
      description:
        "Del técnico seleccionado, en el periodo elegido arriba. La primera respuesta se mide desde que se le asignó el ticket, no desde que se creó.",
    },
  },
  {
    element: '[data-tour="comparativa"]',
    popover: {
      title: "Comparativa del equipo",
      description:
        "Mismo periodo, todos los técnicos juntos. Ordena por columna; en rojo, quienes están por debajo de 90% de SLA.",
    },
  },
];

export function TecnicosView() {
  const [preset, setPreset] = useState<PresetId>("90d");
  const [seleccion, setSeleccion] = useState<number | null>(null);
  const rango = useMemo(() => rangoDe(preset), [preset]);
  const carga = useCargaTecnicos();

  // Por defecto se muestra el técnico con más tickets abiertos (la API ya los ordena así).
  const activoId = seleccion ?? carga.data?.[0]?.tecnicoId ?? null;
  const productividad = useProductividad(activoId, rango);
  const agrupacion = agrupacionDe(preset);
  const tendencia = useTendenciaProductividad(activoId, rango, agrupacion);

  return (
    <>
      <PageHeader
        eyebrow="Equipo"
        title="Técnicos"
        description="Carga de trabajo actual y productividad por técnico en el periodo elegido."
        actions={
          <>
            <RangePicker value={preset} onChange={setPreset} />
            <TourButton pasos={PASOS_TOUR} />
          </>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,26rem)_1fr]">
        <Card data-tour="carga" className="rise" style={{ "--i": 1 } as React.CSSProperties}>
          <CardHeader>
            <CardTitle className="font-display text-lg">Carga de trabajo</CardTitle>
            <p className="text-muted-foreground text-xs">
              Selecciona un técnico para ver su productividad.
            </p>
          </CardHeader>
          <CardContent>
            {carga.error ? (
              <ErrorState error={carga.error} onRetry={() => carga.refetch()} />
            ) : carga.isPending ? (
              <div className="space-y-2">
                {Array.from({ length: 8 }, (_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : carga.data.length === 0 ? (
              <EmptyState title="No hay técnicos con tickets" />
            ) : (
              <ul className="-mx-2 max-h-[34rem] space-y-0.5 overflow-y-auto pr-1">
                {carga.data.map((t) => (
                  <li key={t.tecnicoId}>
                    <button
                      type="button"
                      aria-pressed={activoId === t.tecnicoId}
                      onClick={() => setSeleccion(t.tecnicoId)}
                      className={cn(
                        "hover:bg-accent flex w-full items-center justify-between gap-3 rounded-md px-2 py-2 text-left text-sm transition-colors",
                        activoId === t.tecnicoId && "bg-accent",
                      )}
                    >
                      <span className="min-w-0 truncate">{t.tecnico}</span>
                      <span className="num flex shrink-0 items-center gap-3 font-mono text-xs">
                        {t.vencidos > 0 && (
                          <span className="text-danger">{fmtNum(t.vencidos)} venc.</span>
                        )}
                        <span title="Abiertos">{fmtNum(t.abiertos)}</span>
                        <span
                          className="text-muted-foreground w-12 text-right"
                          title="Total histórico"
                        >
                          {fmtNum(t.total)}
                        </span>
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
            <p className="text-muted-foreground mt-3 flex justify-end gap-3 border-t pt-3 font-mono text-xs tracking-wider uppercase">
              <span>abiertos</span>
              <span>total</span>
            </p>
          </CardContent>
        </Card>

        <section data-tour="productividad" aria-label="Productividad" className="space-y-4">
          {productividad.error ? (
            <ErrorState error={productividad.error} onRetry={() => productividad.refetch()} />
          ) : (
            <>
              <div className="rise" style={{ "--i": 2 } as React.CSSProperties}>
                <p className="eyebrow">Productividad</p>
                <h2 className="font-display mt-1 min-h-9 text-2xl font-semibold">
                  {productividad.data?.tecnico ?? <Skeleton className="h-8 w-56" />}
                </h2>
              </div>
              <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
                <KpiCard
                  index={3}
                  label="Asignados"
                  value={fmtNum(productividad.data?.asignados ?? 0)}
                  loading={!productividad.data}
                />
                <KpiCard
                  index={4}
                  tone="ok"
                  label="Cerrados"
                  value={fmtNum(productividad.data?.cerrados ?? 0)}
                  loading={!productividad.data}
                  hint={
                    productividad.data && productividad.data.asignados > 0
                      ? `${fmtPct((productividad.data.cerrados / productividad.data.asignados) * 100, 0)} de los asignados`
                      : undefined
                  }
                />
                <KpiCard
                  index={5}
                  tone="warn"
                  label="Vencidos"
                  value={fmtNum(productividad.data?.vencidos ?? 0)}
                  loading={!productividad.data}
                />
                <KpiCard
                  index={6}
                  tone={
                    productividad.data && productividad.data.cumplimientoSlaPct < 90
                      ? "danger"
                      : "ok"
                  }
                  label="Cumplimiento SLA"
                  value={
                    productividad.data ? fmtPct(productividad.data.cumplimientoSlaPct, 0) : "—"
                  }
                  loading={!productividad.data}
                  hint="De los asignados en el periodo"
                />
                <KpiCard
                  index={7}
                  label="1ª respuesta"
                  value={fmtHoras(productividad.data?.promedioHorasPrimeraRespuesta)}
                  loading={!productividad.data}
                  hint="Promedio desde que se asignó al técnico"
                />
                <KpiCard
                  index={8}
                  label="Resolución"
                  value={fmtHoras(productividad.data?.promedioHorasResolucion)}
                  loading={!productividad.data}
                  hint="Promedio de los cerrados, desde la creación"
                />
              </div>

              {productividad.data && productividad.data.asignados > 0 && (
                <Card className="rise" style={{ "--i": 9 } as React.CSSProperties}>
                  <CardHeader className="flex-row items-center justify-between gap-4">
                    <CardTitle className="font-display text-lg">Tendencia</CardTitle>
                    <ProductividadTrendLegend />
                  </CardHeader>
                  <CardContent>
                    {tendencia.error ? (
                      <ErrorState error={tendencia.error} onRetry={() => tendencia.refetch()} />
                    ) : (
                      <ProductividadTrend data={tendencia.data} agrupacion={agrupacion} />
                    )}
                  </CardContent>
                </Card>
              )}

              {activoId && (
                <Link
                  href={`/tickets?tecnicoId=${activoId}`}
                  className="text-muted-foreground hover:text-foreground inline-block font-mono text-xs"
                >
                  Ver sus tickets →
                </Link>
              )}
              {productividad.data?.asignados === 0 && (
                <EmptyState
                  title="Sin tickets en este periodo"
                  hint="Prueba con un periodo más amplio."
                />
              )}
            </>
          )}
        </section>
      </div>

      <section
        data-tour="comparativa"
        aria-label="Comparativa del equipo"
        className="rise mt-8"
        style={{ "--i": 10 } as React.CSSProperties}
      >
        <div className="mb-3">
          <p className="eyebrow">Comparativa del equipo</p>
          <p className="text-muted-foreground mt-1 text-sm">
            Mismo periodo elegido arriba. Ordena por columna; las filas en rojo tienen SLA por
            debajo de 90%. Clic en un técnico para ver su detalle.
          </p>
        </div>
        <ComparativaEquipo rango={rango} onSeleccionar={setSeleccion} />
      </section>
    </>
  );
}
