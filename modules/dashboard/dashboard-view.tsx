"use client";

import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BeamCard } from "@/components/shared/beam-card";
import { KpiCard } from "@/components/shared/kpi-card";
import { PageHeader } from "@/components/shared/page-header";
import { RangePicker } from "@/components/shared/range-picker";
import { ErrorState } from "@/components/shared/states";
import { TourButton } from "@/components/shared/tour-button";
import { useResumen, useSla, useTendencia } from "@/lib/api/queries";
import { fmtHoras, fmtNum, fmtPct, hoyMx } from "@/lib/format";
import { agrupacionDe, rangoDe, type PresetId } from "@/lib/rangos";
import type { DriveStep } from "@/lib/tour/driver";
import { ArchivosStatus } from "./archivos-status";
import { BitacoraStatus } from "./bitacora-status";
import { DistributionPanel } from "./distribution-panel";
import { JobsStatus } from "./jobs-status";
import { SinResponder } from "./sin-responder";
import { SlaRing } from "./sla-ring";
import { TechnicianLoad } from "./technician-load";
import { TrendChart, TrendLegend } from "./trend-chart";

const INICIO_DATOS = "2021-07-01";

const PASOS_TOUR: DriveStep[] = [
  {
    element: '[data-tour="rango"]',
    popover: {
      title: "Periodo",
      description:
        "Cambia el rango de fechas. Afecta los indicadores de volumen, la tendencia y la distribución; no afecta Bitácora, Jobs ni 'Sin primera respuesta', que siempre muestran el estado actual.",
    },
  },
  {
    element: '[data-tour="bitacora-hoy"]',
    popover: {
      title: "Bitácora de hoy",
      description:
        "Resumen del checklist diario (actividades, respaldos, cámaras) para el día de hoy en hora de México.",
    },
  },
  {
    element: '[data-tour="archivos"]',
    popover: {
      title: "Archivos de confianza",
      description:
        "Archivos que otros sistemas dejan en carpetas de red (SIA, repbi, olap) para que SQL Server los consuma. Un script revisa cada madrugada si llegaron actualizados.",
    },
  },
  {
    element: '[data-tour="jobs"]',
    popover: {
      title: "Jobs",
      description:
        "Estado de los jobs de SQL Server Agent que se vigilan. Un job puede verse 'con problemas' aunque su resultado final sea exitoso, si alguno de sus pasos falló.",
    },
  },
  {
    element: '[data-tour="indicadores"]',
    popover: {
      title: "Indicadores",
      description:
        "Totales del periodo elegido arriba: abiertos, vencidos, cumplimiento de SLA y tiempos promedio de resolución.",
    },
  },
  {
    element: '[data-tour="tendencia"]',
    popover: {
      title: "Creados vs. cerrados",
      description:
        "Evolución del volumen de tickets en el periodo elegido, agrupada por día o por mes según qué tan amplio sea el rango.",
    },
  },
  {
    element: '[data-tour="sla"]',
    popover: {
      title: "Cumplimiento de SLA",
      description:
        "Porcentaje de tickets resueltos dentro de su tiempo de vencimiento, en el periodo elegido.",
    },
  },
  {
    element: '[data-tour="distribucion"]',
    popover: {
      title: "Distribución",
      description:
        "Cómo se reparten los tickets del periodo por categoría, prioridad y modo de entrada.",
    },
  },
  {
    element: '[data-tour="carga-tecnico"]',
    popover: {
      title: "Carga por técnico",
      description:
        "Cuántos tickets abiertos tiene cada técnico ahora mismo, sin importar el periodo elegido.",
    },
  },
  {
    element: '[data-tour="sin-respuesta"]',
    popover: {
      title: "Sin primera respuesta",
      description:
        "Tickets abiertos que nadie ha respondido todavía, el más antiguo primero. Tampoco depende del periodo.",
    },
  },
];

export function DashboardView() {
  const [preset, setPreset] = useState<PresetId>("30d");
  const rango = useMemo(() => rangoDe(preset), [preset]);
  // Para "Todo" la tendencia necesita un inicio explícito (la API usa 12 meses por defecto).
  const rangoTendencia = useMemo(
    () => (preset === "todo" ? { desde: INICIO_DATOS, hasta: hoyMx() } : rango),
    [preset, rango],
  );

  const resumen = useResumen(rango);
  const sla = useSla(rango);
  const tendencia = useTendencia(rangoTendencia, agrupacionDe(preset));
  const r = resumen.data;

  return (
    <>
      <PageHeader
        eyebrow="Panorama operativo"
        title="Tablero de soporte"
        description="Estado actual del servicio y su evolución. Los indicadores de volumen respetan el periodo seleccionado; los de hoy y los abiertos reflejan el momento actual."
        actions={
          <>
            <span data-tour="rango">
              <RangePicker value={preset} onChange={setPreset} />
            </span>
            <TourButton pasos={PASOS_TOUR} />
          </>
        }
      />

      <section
        aria-label="Estado operativo"
        className="mb-6 grid gap-6 md:grid-cols-2 xl:grid-cols-3"
      >
        <BeamCard>
          <Card
            data-tour="bitacora-hoy"
            className="rise surface h-full"
            style={{ "--i": 0 } as React.CSSProperties}
          >
            <CardHeader>
              <CardTitle className="font-display text-lg">Bitácora de hoy</CardTitle>
            </CardHeader>
            <CardContent>
              <BitacoraStatus />
            </CardContent>
          </Card>
        </BeamCard>

        <BeamCard>
          <Card
            data-tour="jobs"
            className="rise surface h-full"
            style={{ "--i": 1 } as React.CSSProperties}
          >
            <CardHeader>
              <CardTitle className="font-display text-lg">Jobs</CardTitle>
            </CardHeader>
            <CardContent>
              <JobsStatus />
            </CardContent>
          </Card>
        </BeamCard>

        <BeamCard>
          <Card
            data-tour="archivos"
            className="rise surface h-full"
            style={{ "--i": 2 } as React.CSSProperties}
          >
            <CardHeader>
              <CardTitle className="font-display text-lg">Archivos de confianza</CardTitle>
            </CardHeader>
            <CardContent>
              <ArchivosStatus />
            </CardContent>
          </Card>
        </BeamCard>
      </section>

      {resumen.error ? (
        <ErrorState error={resumen.error} onRetry={() => resumen.refetch()} />
      ) : (
        <section
          data-tour="indicadores"
          aria-label="Indicadores"
          className="grid grid-cols-2 gap-3 md:grid-cols-4"
        >
          <KpiCard
            index={0}
            label="Tickets en el periodo"
            value={r && fmtNum(r.total)}
            loading={!r}
          />
          <KpiCard
            index={1}
            tone="signal"
            label="Abiertos"
            value={r && fmtNum(r.abiertos)}
            loading={!r}
            hint={r && `${fmtNum(r.sinAsignar)} sin asignar`}
          />
          <KpiCard
            index={2}
            tone="danger"
            label="Vencidos abiertos"
            value={r && fmtNum(r.vencidos)}
            loading={!r}
            beam={r && r.vencidos > 0 ? "always" : "hover"}
            beamVariant={r && r.vencidos > 0 ? "sunset" : "ocean"}
            hint="Abiertos fuera de SLA"
          />
          <KpiCard
            index={3}
            tone="ok"
            label="Cumplimiento SLA"
            value={sla.data && fmtPct(sla.data.porcentajeCumplimiento)}
            loading={!sla.data}
          />
          <KpiCard index={4} label="Creados hoy" value={r && fmtNum(r.creadosHoy)} loading={!r} />
          <KpiCard index={5} label="Cerrados hoy" value={r && fmtNum(r.cerradosHoy)} loading={!r} />
          <KpiCard
            index={6}
            label="Cerrados en el periodo"
            value={r && fmtNum(r.cerrados)}
            loading={!r}
          />
          <KpiCard
            index={7}
            label="Resolución promedio"
            value={r && fmtHoras(r.promedioHorasResolucion)}
            loading={!r}
            hint="Creación a cierre"
          />
        </section>
      )}

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <BeamCard className="lg:col-span-2">
          <Card
            data-tour="tendencia"
            className="rise surface h-full"
            style={{ "--i": 8 } as React.CSSProperties}
          >
            <CardHeader className="flex-row items-center justify-between gap-4">
              <CardTitle className="font-display text-lg">Creados vs. cerrados</CardTitle>
              <TrendLegend />
            </CardHeader>
            <CardContent>
              {tendencia.error ? (
                <ErrorState error={tendencia.error} onRetry={() => tendencia.refetch()} />
              ) : (
                <TrendChart data={tendencia.data} agrupacion={agrupacionDe(preset)} />
              )}
            </CardContent>
          </Card>
        </BeamCard>

        <BeamCard>
          <Card
            data-tour="sla"
            className="rise surface h-full"
            style={{ "--i": 9 } as React.CSSProperties}
          >
            <CardHeader>
              <CardTitle className="font-display text-lg">Cumplimiento de SLA</CardTitle>
            </CardHeader>
            <CardContent>
              {sla.error ? (
                <ErrorState error={sla.error} onRetry={() => sla.refetch()} />
              ) : (
                <SlaRing sla={sla.data} />
              )}
            </CardContent>
          </Card>
        </BeamCard>

        <BeamCard className="lg:col-span-2">
          <Card
            data-tour="distribucion"
            className="rise surface h-full"
            style={{ "--i": 10 } as React.CSSProperties}
          >
            <CardHeader>
              <CardTitle className="font-display text-lg">Distribución</CardTitle>
            </CardHeader>
            <CardContent>
              <DistributionPanel rango={rango} />
            </CardContent>
          </Card>
        </BeamCard>

        <BeamCard>
          <Card
            data-tour="carga-tecnico"
            className="rise surface h-full"
            style={{ "--i": 11 } as React.CSSProperties}
          >
            <CardHeader>
              <CardTitle className="font-display text-lg">Carga abierta por técnico</CardTitle>
            </CardHeader>
            <CardContent>
              <TechnicianLoad />
            </CardContent>
          </Card>
        </BeamCard>

        <BeamCard className="lg:col-span-3">
          <Card
            data-tour="sin-respuesta"
            className="rise surface h-full"
            style={{ "--i": 12 } as React.CSSProperties}
          >
            <CardHeader>
              <CardTitle className="font-display text-lg">Sin primera respuesta</CardTitle>
              <p className="text-muted-foreground text-xs">
                Tickets abiertos que nadie ha respondido todavía, el más antiguo primero. No depende
                del periodo elegido arriba.
              </p>
            </CardHeader>
            <CardContent>
              <SinResponder />
            </CardContent>
          </Card>
        </BeamCard>
      </div>
    </>
  );
}
