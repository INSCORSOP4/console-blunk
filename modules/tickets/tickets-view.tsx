"use client";

import { ChevronLeft, ChevronRight, Download } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState, ErrorState } from "@/components/shared/states";
import { TourButton } from "@/components/shared/tour-button";
import { exportUrl } from "@/lib/api/client";
import { useTickets } from "@/lib/api/queries";
import { fmtNum } from "@/lib/format";
import type { DriveStep } from "@/lib/tour/driver";
import { cn } from "@/lib/utils";
import { FilterBar } from "./filter-bar";
import { TicketsTable } from "./tickets-table";
import { PAGE_SIZE, useTicketFilters } from "./use-ticket-filters";

const PASOS_TOUR: DriveStep[] = [
  {
    element: '[data-tour="filtros"]',
    popover: {
      title: "Filtros",
      description:
        "Combina estado, técnico, grupo, categoría, prioridad, fechas y búsqueda de texto. Los filtros activos se pueden quitar de uno en uno o todos con 'Limpiar'.",
    },
  },
  {
    element: '[data-tour="exportar"]',
    popover: {
      title: "Exportar Excel",
      description:
        "Descarga hasta 10,000 tickets con los filtros que tengas puestos en ese momento.",
    },
  },
  {
    element: '[data-tour="tabla"]',
    popover: {
      title: "Tabla",
      description:
        "Haz clic en los encabezados para ordenar. Cada fila lleva al detalle del ticket.",
    },
  },
];

export function TicketsView() {
  const { filters, setFilters, reset, activos, filtrosApi } = useTicketFilters();
  const { data, error, isPending, isPlaceholderData, refetch } = useTickets({
    ...filtrosApi,
    orden: filters.orden,
    page: filters.page,
    pageSize: PAGE_SIZE,
  });

  const desdeFila = data ? (data.page - 1) * data.pageSize + 1 : 0;
  const hastaFila = data ? desdeFila + data.items.length - 1 : 0;

  return (
    <>
      <PageHeader
        eyebrow="Gestión de solicitudes"
        title="Tickets"
        description="Consulta, filtra y exporta las solicitudes registradas en ServiceDesk Plus."
        actions={
          <>
            <a
              data-tour="exportar"
              href={exportUrl(filtrosApi)}
              download
              className={cn(buttonVariants({ variant: "outline" }))}
              title="Exporta hasta 10,000 tickets con los filtros actuales"
            >
              <Download /> Exportar Excel
            </a>
            <TourButton pasos={PASOS_TOUR} />
          </>
        }
      />

      <div data-tour="filtros">
        <FilterBar filters={filters} activos={activos} onChange={setFilters} onReset={reset} />
      </div>

      {error && !data ? (
        <ErrorState error={error} onRetry={() => refetch()} />
      ) : isPending ? (
        <div className="bg-card space-y-2 rounded-xl border p-4">
          {Array.from({ length: 8 }, (_, i) => (
            <Skeleton key={i} className="h-11 w-full" />
          ))}
        </div>
      ) : data.items.length === 0 ? (
        <EmptyState
          title="Ningún ticket coincide con los filtros"
          hint="Prueba quitando algún filtro o ampliando las fechas."
        />
      ) : (
        <>
          <div data-tour="tabla">
            <TicketsTable
              data={data.items}
              orden={filters.orden}
              onOrden={(orden) => setFilters({ orden })}
              loading={isPlaceholderData}
            />
          </div>

          <nav
            aria-label="Paginación"
            className="mt-4 flex flex-wrap items-center justify-between gap-3"
          >
            <p className="num text-muted-foreground font-mono text-xs">
              {fmtNum(desdeFila)}–{fmtNum(hastaFila)} de {fmtNum(data.totalCount)}
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={data.page <= 1}
                onClick={() => setFilters({ page: data.page - 1 })}
              >
                <ChevronLeft /> Anterior
              </Button>
              <span className="num font-mono text-xs">
                {data.page} / {fmtNum(data.totalPages)}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={data.page >= data.totalPages}
                onClick={() => setFilters({ page: data.page + 1 })}
              >
                Siguiente <ChevronRight />
              </Button>
            </div>
          </nav>
        </>
      )}
    </>
  );
}
