"use client";

import {
  AlertTriangle,
  CalendarClock,
  CheckCircle2,
  ChevronDown,
  CircleSlash,
  Loader2,
  PauseCircle,
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
import { useJobs } from "@/lib/api/queries";
import type { EstadoJob, JobResumen } from "@/lib/api/utilerias-schemas";
import { fmtNum } from "@/lib/format";
import type { DriveStep } from "@/lib/tour/driver";
import {
  contarJobs,
  ETIQUETA_ESTADO,
  filtrarJobs,
  fmtDuracion,
  fmtFechaServidor,
  requiereAtencion,
  type FiltroEstado,
} from "@/lib/utilerias/jobs";
import { cn } from "@/lib/utils";

const REFRESCO_MS = 60_000;

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
    element: '[data-tour="alcance"]',
    popover: {
      title: "Vigilados / Todos",
      description:
        "'Vigilados' son los jobs que el área decidió monitorear de cerca. 'Todos los jobs' muestra el resto del servidor también.",
    },
  },
  {
    element: '[data-tour="lista"]',
    popover: {
      title: "Jobs",
      description:
        "Haz clic en un job para ver el detalle de cada uno de sus pasos y el mensaje de error si falló. Solo lectura: nada aquí ejecuta ni detiene un job.",
    },
  },
];

const ESTILO: Record<EstadoJob, { clase: string; icono: typeof CheckCircle2 }> = {
  Exitoso: { clase: "bg-ok-soft text-ok", icono: CheckCircle2 },
  Fallido: { clase: "bg-danger-soft text-danger", icono: XCircle },
  Reintento: { clase: "bg-warn-soft text-warn", icono: AlertTriangle },
  Cancelado: { clase: "bg-warn-soft text-warn", icono: CircleSlash },
  EnEjecucion: { clase: "bg-info-soft text-info", icono: Loader2 },
  SinHistorial: { clase: "bg-muted text-muted-foreground", icono: CircleSlash },
};

export function JobsView() {
  const [soloVigilados, setSoloVigilados] = useState(true);
  const [auto, setAuto] = useState(true);
  const [estado, setEstado] = useState<FiltroEstado>("todos");
  const [buscar, setBuscar] = useState("");
  const [abierto, setAbierto] = useState<string | null>(null);

  const q = useJobs(soloVigilados, auto ? REFRESCO_MS : false);
  const jobs = useMemo(() => q.data?.jobs ?? [], [q.data]);
  const conteo = useMemo(() => contarJobs(jobs), [jobs]);
  const visibles = useMemo(() => filtrarJobs(jobs, estado, buscar), [jobs, estado, buscar]);

  const tarjetas: { id: FiltroEstado; nombre: string; valor: number; color: string }[] = [
    { id: "todos", nombre: "Jobs", valor: conteo.total, color: "" },
    {
      id: "atencion",
      nombre: "Requieren atención",
      valor: conteo.atencion,
      color: conteo.atencion > 0 ? "text-danger" : "text-muted-foreground",
    },
    { id: "ejecutando", nombre: "En ejecución", valor: conteo.ejecutando, color: "text-info" },
    { id: "ok", nombre: "Sin novedades", valor: conteo.ok, color: "text-ok" },
    {
      id: "deshabilitados",
      nombre: "Deshabilitados",
      valor: conteo.deshabilitados,
      color: "text-muted-foreground",
    },
  ];

  return (
    <>
      <PageHeader
        eyebrow="Utilerías"
        title="Jobs de SQL Server"
        description="Resultado de la última ejecución de cada job y de cada uno de sus pasos. Solo lectura: aquí no se ejecuta ni se detiene nada."
        actions={
          <>
            <label className="text-muted-foreground flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={auto}
                onChange={(e) => setAuto(e.target.checked)}
                className="size-4"
              />
              Actualizar cada minuto
            </label>
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
          <dl data-tour="resumen" className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {tarjetas.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setEstado(t.id === estado ? "todos" : t.id)}
                aria-pressed={estado === t.id}
                className={cn(
                  "surface bg-card touch-target rounded-xl border p-3 text-left transition-colors",
                  estado === t.id && "border-signal",
                )}
              >
                <dt className="eyebrow">{t.nombre}</dt>
                <dd className={cn("num font-display mt-1 text-3xl font-semibold", t.color)}>
                  {fmtNum(t.valor)}
                </dd>
              </button>
            ))}
          </dl>

          {q.error && (
            <p role="alert" className="bg-warn-soft text-warn rounded-md px-3 py-2 text-sm">
              No se pudo actualizar; se muestra la última lectura. Reintentando…
            </p>
          )}

          {q.data.noEncontrados.length > 0 && (
            <p
              role="note"
              className="bg-warn-soft text-warn flex items-start gap-2 rounded-md px-3 py-2.5 text-sm"
            >
              <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden />
              <span>
                No existen en el servidor (¿se renombraron?):{" "}
                <span className="font-mono">{q.data.noEncontrados.join(", ")}</span>
              </span>
            </p>
          )}

          <div className="flex flex-wrap items-center gap-3">
            <label className="relative block w-full max-w-xs">
              <span className="sr-only">Buscar job</span>
              <Search
                className="text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2"
                aria-hidden
              />
              <Input
                type="search"
                value={buscar}
                onChange={(e) => setBuscar(e.target.value)}
                placeholder="Buscar por nombre…"
                maxLength={100}
                className="pl-8"
              />
            </label>
            <div
              data-tour="alcance"
              role="group"
              aria-label="Alcance"
              className="flex rounded-lg border p-0.5 text-sm"
            >
              {[
                [true, "Vigilados"],
                [false, "Todos los jobs"],
              ].map(([valor, texto]) => (
                <button
                  key={String(valor)}
                  type="button"
                  aria-pressed={soloVigilados === valor}
                  onClick={() => {
                    setSoloVigilados(valor as boolean);
                    setAbierto(null);
                  }}
                  className={cn(
                    "touch-target rounded-md px-3 py-1.5 transition-colors",
                    soloVigilados === valor
                      ? "bg-accent text-foreground font-medium"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {texto as string}
                </button>
              ))}
            </div>
            <p className="text-muted-foreground num ml-auto font-mono text-xs">
              Consultado {fmtFechaServidor(q.data.consultadoEn, "HH:mm:ss")}
            </p>
          </div>

          <div data-tour="lista">
            {visibles.length === 0 ? (
              <EmptyState
                title={jobs.length === 0 ? "No hay jobs para mostrar" : "Ningún job coincide"}
                hint={
                  jobs.length === 0
                    ? "Revisa la lista de jobs vigilados en la configuración de la API."
                    : "Quita el filtro o cambia la búsqueda."
                }
              />
            ) : (
              <ul className="space-y-2">
                {visibles.map((j) => (
                  <FilaJob
                    key={j.nombre}
                    job={j}
                    consultadoEn={q.data.consultadoEn}
                    abierto={abierto === j.nombre}
                    onAlternar={() => setAbierto(abierto === j.nombre ? null : j.nombre)}
                  />
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </>
  );
}

function Estado({ estado, deshabilitado }: { estado: EstadoJob; deshabilitado?: boolean }) {
  const { clase, icono: Icono } = ESTILO[estado];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium whitespace-nowrap",
        clase,
        deshabilitado && "opacity-60",
      )}
    >
      <Icono className={cn("size-3.5", estado === "EnEjecucion" && "animate-spin")} aria-hidden />
      {ETIQUETA_ESTADO[estado]}
    </span>
  );
}

function FilaJob({
  job,
  consultadoEn,
  abierto,
  onAlternar,
}: {
  job: JobResumen;
  consultadoEn: string;
  abierto: boolean;
  onAlternar: () => void;
}) {
  const panel = `pasos-${job.nombre.replace(/\W+/g, "-")}`;
  const pasosFallidos = job.pasos.filter((p) => p.estado === "Fallido").length;
  const atencion = requiereAtencion(job);

  return (
    <li
      className={cn(
        "surface bg-card rounded-xl border",
        atencion && "border-l-danger border-l-4",
        !job.habilitado && "opacity-75",
      )}
    >
      <button
        type="button"
        aria-expanded={abierto}
        aria-controls={panel}
        onClick={onAlternar}
        className="touch-target flex w-full flex-wrap items-center gap-x-4 gap-y-2 p-4 text-left"
      >
        <span className="min-w-0 flex-1">
          <span className="flex flex-wrap items-center gap-2">
            <span className="font-display truncate text-base font-semibold">{job.nombre}</span>
            {!job.habilitado && (
              <span className="bg-muted text-muted-foreground inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-xs">
                <PauseCircle className="size-3" aria-hidden /> Deshabilitado
              </span>
            )}
          </span>
          <span className="text-muted-foreground num mt-0.5 block font-mono text-xs">
            Última: {fmtFechaServidor(job.ultimaEjecucion)}
            {job.duracionSegundos !== null && ` · ${fmtDuracion(job.duracionSegundos)}`}
            {job.estado === "EnEjecucion" && job.pasoEnEjecucion
              ? ` · paso ${job.pasoEnEjecucion}`
              : ""}
          </span>
        </span>

        <span className="flex flex-wrap items-center gap-x-4 gap-y-1.5">
          {job.siguienteEjecucion && (
            <span
              className={cn(
                "num flex items-center gap-1 font-mono text-xs",
                job.siguienteEjecucion < consultadoEn ? "text-warn" : "text-muted-foreground",
              )}
              title={
                job.siguienteEjecucion < consultadoEn
                  ? "La próxima ejecución programada ya pasó; revisa la programación del job."
                  : "Próxima ejecución"
              }
            >
              <CalendarClock className="size-3.5" aria-hidden />{" "}
              {fmtFechaServidor(job.siguienteEjecucion)}
              {job.siguienteEjecucion < consultadoEn && " (vencida)"}
            </span>
          )}
          {pasosFallidos > 0 && job.estado !== "Fallido" && (
            <span className="text-danger text-xs">
              {pasosFallidos} paso{pasosFallidos === 1 ? "" : "s"} con error
            </span>
          )}
          <Estado estado={job.estado} deshabilitado={!job.habilitado} />
          <ChevronDown
            className={cn("size-4 transition-transform", abierto && "rotate-180")}
            aria-hidden
          />
        </span>
      </button>

      {abierto && (
        <div id={panel} className="border-t p-4">
          {job.pasos.length === 0 ? (
            <p className="text-muted-foreground text-sm">Este job no tiene pasos.</p>
          ) : (
            <ol className="space-y-3">
              {job.pasos.map((p) => (
                <li
                  key={p.id}
                  className="grid gap-1 sm:grid-cols-[2rem_minmax(0,1fr)_auto] sm:gap-x-3"
                >
                  <span className="text-muted-foreground num font-mono text-xs sm:pt-1">
                    {p.id}
                  </span>
                  <span className="min-w-0">
                    <span className="block text-sm font-medium break-words">{p.nombre}</span>
                    <span className="text-muted-foreground num block font-mono text-xs">
                      {p.ultimaEjecucion
                        ? fmtFechaServidor(p.ultimaEjecucion, "d MMM yyyy, HH:mm:ss")
                        : "Sin ejecuciones"}
                      {p.duracionSegundos !== null && ` · ${fmtDuracion(p.duracionSegundos)}`}
                    </span>
                    {p.mensaje && (
                      <pre
                        className={cn(
                          "mt-2 max-h-48 overflow-auto rounded-md border p-2.5 font-mono text-xs break-words whitespace-pre-wrap",
                          p.estado === "Fallido"
                            ? "bg-danger-soft text-danger"
                            : "bg-muted/50 text-muted-foreground",
                        )}
                      >
                        {p.mensaje}
                      </pre>
                    )}
                  </span>
                  <span className="sm:justify-self-end">
                    <Estado estado={p.estado} />
                  </span>
                </li>
              ))}
            </ol>
          )}
        </div>
      )}
    </li>
  );
}
