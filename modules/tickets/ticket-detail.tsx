"use client";

import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { HtmlFrame } from "@/components/shared/html-frame";
import { EmptyState, ErrorState } from "@/components/shared/states";
import { StatusBadge } from "@/components/shared/status-badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ApiError } from "@/lib/api/client";
import { useTicket, useTicketHistorial, useTicketTiempos } from "@/lib/api/queries";
import type { TicketDetalle } from "@/lib/api/schemas";
import { fmtFecha } from "@/lib/format";

export function TicketDetail({ id }: { id: number }) {
  const { data, error, isPending, refetch } = useTicket(id);
  const [tab, setTab] = useState("descripcion");

  const volver = (
    <Link
      href="/tickets"
      className="text-muted-foreground hover:text-foreground mb-6 inline-flex items-center gap-1.5 font-mono text-xs"
    >
      <ArrowLeft className="size-3.5" /> Volver a tickets
    </Link>
  );

  if (error) {
    const noExiste = error instanceof ApiError && error.status === 404;
    return (
      <>
        {volver}
        {noExiste ? (
          <EmptyState
            title={`El ticket #${id} no existe`}
            hint="Revisa el número e inténtalo de nuevo."
          />
        ) : (
          <ErrorState error={error} onRetry={() => refetch()} />
        )}
      </>
    );
  }

  if (isPending) {
    return (
      <>
        {volver}
        <Skeleton className="mb-3 h-5 w-32" />
        <Skeleton className="mb-8 h-10 w-2/3" />
        <Skeleton className="h-64 w-full" />
      </>
    );
  }

  const t = data.resumen;

  return (
    <>
      {volver}
      <header className="rise mb-8 border-b pb-6">
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <span className="text-signal font-mono text-sm">#{t.id}</span>
          <StatusBadge estadoId={t.estadoId} estado={t.estado} />
          {t.vencido && (
            <span className="bg-danger-soft text-danger border-danger/30 rounded border px-1.5 py-0.5 font-mono text-xs font-semibold tracking-wider uppercase">
              Vencido
            </span>
          )}
          {data.reabierto && (
            <span className="bg-warn-soft text-warn rounded px-1.5 py-0.5 font-mono text-xs tracking-wider uppercase">
              Reabierto
            </span>
          )}
        </div>
        <h1 className="title-gradient max-w-4xl text-2xl font-semibold text-balance sm:text-4xl">
          {t.titulo || "(sin título)"}
        </h1>
      </header>

      <div className="grid gap-8 lg:grid-cols-[1fr_20rem]">
        <section className="rise min-w-0" style={{ "--i": 1 } as React.CSSProperties}>
          <Tabs value={tab} onValueChange={(v) => setTab(String(v))}>
            <TabsList>
              <TabsTrigger value="descripcion">Descripción</TabsTrigger>
              <TabsTrigger value="resolucion">Resolución</TabsTrigger>
              <TabsTrigger value="historial">Historial</TabsTrigger>
              <TabsTrigger value="tiempos">Tiempos</TabsTrigger>
            </TabsList>

            <TabsContent value="descripcion" className="mt-4">
              {data.descripcion?.trim() ? (
                <HtmlFrame html={data.descripcion} title={`Descripción del ticket ${t.id}`} />
              ) : (
                <EmptyState title="Sin descripción" />
              )}
            </TabsContent>
            <TabsContent value="resolucion" className="mt-4">
              {data.resolucion?.trim() ? (
                <HtmlFrame html={data.resolucion} title={`Resolución del ticket ${t.id}`} />
              ) : (
                <EmptyState title="Aún no tiene resolución" />
              )}
            </TabsContent>
            <TabsContent value="historial" className="mt-4">
              <Historial id={id} activo={tab === "historial"} />
            </TabsContent>
            <TabsContent value="tiempos" className="mt-4">
              <Tiempos id={id} activo={tab === "tiempos"} />
            </TabsContent>
          </Tabs>
        </section>

        <aside className="rise space-y-6" style={{ "--i": 2 } as React.CSSProperties}>
          <Ficha data={data} />
        </aside>
      </div>
    </>
  );
}

function Ficha({ data }: { data: TicketDetalle }) {
  const t = data.resumen;
  const filas: [string, React.ReactNode][] = [
    ["Solicitante", t.solicitante],
    ["Técnico", t.tecnico ?? <span className="text-muted-foreground italic">Sin asignar</span>],
    ["Grupo", t.grupo],
    ["Departamento", data.departamento],
    ["Categoría", t.categoria],
    ["Subcategoría", data.subcategoria],
    ["Ítem", data.item],
    ["Prioridad", t.prioridad],
    ["Urgencia", data.urgencia],
    ["Impacto", data.impacto],
    ["Nivel", data.nivel],
    ["Modo", data.modo],
    ["Tipo", data.tipoSolicitud],
  ];
  const fechas: [string, string | null][] = [
    ["Creado", t.creado],
    ["Primera respuesta", data.respondido],
    ["Vence", t.vence],
    ["Resuelto", data.resuelto],
    ["Cerrado", t.completado],
  ];

  return (
    <>
      <div className="bg-card rounded-xl border p-5">
        <h2 className="eyebrow mb-4">Detalles</h2>
        <dl className="space-y-3 text-sm">
          {filas.map(([k, v]) => (
            <div key={k} className="grid grid-cols-[6.5rem_1fr] gap-2">
              <dt className="text-muted-foreground">{k}</dt>
              <dd className="min-w-0 break-words">
                {v || <span className="text-muted-foreground">—</span>}
              </dd>
            </div>
          ))}
        </dl>
      </div>
      <div className="bg-card rounded-xl border p-5">
        <h2 className="eyebrow mb-4">Fechas</h2>
        <dl className="space-y-3 text-sm">
          {fechas.map(([k, v]) => (
            <div key={k} className="grid grid-cols-[6.5rem_1fr] gap-2">
              <dt className="text-muted-foreground">{k}</dt>
              <dd className="num font-mono text-xs">{fmtFecha(v)}</dd>
            </div>
          ))}
        </dl>
      </div>
    </>
  );
}

function Historial({ id, activo }: { id: number; activo: boolean }) {
  const { data, error, isPending, refetch } = useTicketHistorial(id, activo);
  if (error) return <ErrorState error={error} onRetry={() => refetch()} />;
  if (isPending) return <Skeleton className="h-48 w-full" />;
  if (data.length === 0) return <EmptyState title="Sin movimientos registrados" />;

  return (
    <ol className="relative space-y-5 border-l pl-6">
      {data.map((h) => (
        <li key={h.id} className="relative">
          <span className="border-background bg-signal absolute top-1.5 -left-[1.82rem] size-2.5 rounded-full border-2" />
          <p className="text-muted-foreground font-mono text-xs">{fmtFecha(h.fecha)}</p>
          <p className="mt-0.5 text-sm">
            <span className="font-medium">{h.usuario ?? "Sistema"}</span>{" "}
            <span className="bg-muted rounded px-1.5 py-0.5 font-mono text-xs">
              {h.operacion ?? "—"}
            </span>
          </p>
          {h.descripcion && (
            <p className="text-muted-foreground mt-1 text-sm break-words">{h.descripcion}</p>
          )}
        </li>
      ))}
    </ol>
  );
}

function Tiempos({ id, activo }: { id: number; activo: boolean }) {
  const { data, error, isPending, refetch } = useTicketTiempos(id, activo);
  if (error) return <ErrorState error={error} onRetry={() => refetch()} />;
  if (isPending) return <Skeleton className="h-48 w-full" />;

  const bloques = [
    {
      titulo: "Por estado",
      filas: data.porEstado.map((x) => ({ k: x.estado, fin: x.fin, v: x.tiempoRegistrado })),
    },
    {
      titulo: "Por técnico",
      filas: data.porTecnico.map((x) => ({
        k: x.tecnico ?? "Sin asignar",
        fin: x.fin,
        v: x.tiempoRegistrado,
      })),
    },
    {
      titulo: "Por grupo",
      filas: data.porGrupo.map((x) => ({
        k: x.grupo ?? "Sin grupo",
        fin: x.fin,
        v: x.tiempoRegistrado,
      })),
    },
  ];
  if (bloques.every((b) => b.filas.length === 0))
    return <EmptyState title="Sin tiempos registrados" />;

  return (
    <div className="space-y-6">
      {bloques.map((b) => (
        <div key={b.titulo}>
          <h3 className="eyebrow mb-2">{b.titulo}</h3>
          {b.filas.length === 0 ? (
            <p className="text-muted-foreground text-sm">Sin datos.</p>
          ) : (
            <ul className="bg-card divide-y rounded-lg border text-sm">
              {b.filas.map((f, i) => (
                <li key={i} className="flex items-center justify-between gap-3 px-4 py-2.5">
                  <span className="min-w-0 truncate">{f.k}</span>
                  <span className="num text-muted-foreground shrink-0 font-mono text-xs">
                    hasta {fmtFecha(f.fin, "d MMM, HH:mm")} · {f.v}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      ))}
      <p className="text-muted-foreground text-xs">
        El valor numérico es el tiempo tal como lo registra ServiceDesk; su unidad aún no está
        confirmada.
      </p>
    </div>
  );
}
