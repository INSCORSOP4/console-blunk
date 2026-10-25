"use client";

import { ArrowDown, ArrowUp, ChevronsUpDown } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { flexRender, getCoreRowModel, useReactTable, type ColumnDef } from "@tanstack/react-table";
import { useMemo } from "react";
import { StatusBadge } from "@/components/shared/status-badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { TicketResumen } from "@/lib/api/schemas";
import { fmtFecha } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Orden } from "./use-ticket-filters";

// Columnas ordenables en servidor y los dos sentidos que la API soporta para cada una.
const SORTS: Record<string, { asc: Orden; desc: Orden }> = {
  id: { asc: "IdDesc", desc: "IdDesc" },
  creado: { asc: "CreadoAsc", desc: "CreadoDesc" },
  vence: { asc: "VenceAsc", desc: "VenceAsc" },
};

function ariaSort(columnId: string, orden: Orden): "ascending" | "descending" | "none" | undefined {
  const s = SORTS[columnId];
  if (!s) return undefined;
  // "id" solo ordena de mayor a menor y "vence" solo de más próximo a más lejano.
  if (s.asc === s.desc)
    return orden === s.desc ? (columnId === "id" ? "descending" : "ascending") : "none";
  if (orden === s.desc) return "descending";
  if (orden === s.asc) return "ascending";
  return "none";
}

function SortHeader({
  label,
  column,
  orden,
  onOrden,
}: {
  label: string;
  column: keyof typeof SORTS;
  orden: Orden;
  onOrden: (o: Orden) => void;
}) {
  const s = SORTS[column];
  const activoDesc = orden === s.desc;
  const activoAsc = orden === s.asc && s.asc !== s.desc;
  const activo = activoDesc || activoAsc;
  const siguiente = activo && activoDesc && s.asc !== s.desc ? s.asc : s.desc;
  const Icon = !activo ? ChevronsUpDown : activoAsc ? ArrowUp : ArrowDown;
  return (
    <button
      type="button"
      onClick={() => onOrden(siguiente)}
      className={cn(
        "hover:text-foreground -ml-1 inline-flex items-center gap-1 rounded px-1",
        activo && "text-foreground",
      )}
      aria-label={`Ordenar por ${label}`}
    >
      {label} <Icon className="size-3" />
    </button>
  );
}

export function TicketsTable({
  data,
  orden,
  onOrden,
  loading,
}: {
  data: TicketResumen[];
  orden: Orden;
  onOrden: (o: Orden) => void;
  loading?: boolean;
}) {
  const router = useRouter();

  const columns = useMemo<ColumnDef<TicketResumen>[]>(
    () => [
      {
        id: "id",
        header: () => <SortHeader label="N.º" column="id" orden={orden} onOrden={onOrden} />,
        cell: ({ row }) => (
          <Link
            href={`/tickets/${row.original.id}`}
            onClick={(e) => e.stopPropagation()}
            className="text-signal font-mono text-xs font-medium hover:underline"
          >
            #{row.original.id}
          </Link>
        ),
      },
      {
        id: "titulo",
        header: "Asunto",
        cell: ({ row }) => (
          <div className="max-w-[26rem] min-w-[14rem]">
            <p className="truncate font-medium" title={row.original.titulo}>
              {row.original.titulo || "(sin título)"}
            </p>
            <p className="text-muted-foreground truncate text-xs">
              {row.original.solicitante ?? "Sin solicitante"}
            </p>
          </div>
        ),
      },
      {
        id: "estado",
        header: "Estado",
        cell: ({ row }) => (
          <span className="flex flex-wrap items-center gap-1.5">
            <StatusBadge estadoId={row.original.estadoId} estado={row.original.estado} />
            {row.original.vencido && (
              <span className="bg-danger-soft text-danger border-danger/30 rounded border px-1.5 py-0.5 font-mono text-xs font-semibold tracking-wider uppercase">
                Vencido
              </span>
            )}
          </span>
        ),
      },
      {
        id: "tecnico",
        header: "Técnico",
        cell: ({ row }) =>
          row.original.tecnico ?? <span className="text-muted-foreground italic">Sin asignar</span>,
      },
      {
        id: "categoria",
        header: "Categoría",
        cell: ({ row }) =>
          row.original.categoria ?? <span className="text-muted-foreground">—</span>,
      },
      {
        id: "creado",
        header: () => <SortHeader label="Creado" column="creado" orden={orden} onOrden={onOrden} />,
        cell: ({ row }) => (
          <span className="num font-mono text-xs whitespace-nowrap">
            {fmtFecha(row.original.creado)}
          </span>
        ),
      },
      {
        id: "vence",
        header: () => <SortHeader label="Vence" column="vence" orden={orden} onOrden={onOrden} />,
        cell: ({ row }) => (
          <span className="num font-mono text-xs whitespace-nowrap">
            {fmtFecha(row.original.vence)}
          </span>
        ),
      },
    ],
    [orden, onOrden],
  );

  // TanStack Table devuelve funciones no memoizables: React Compiler omite memoizar este componente, sin otro efecto.
  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    manualSorting: true,
    manualPagination: true,
  });

  return (
    <div
      className={cn(
        "bg-card overflow-x-auto rounded-xl border transition-opacity",
        loading && "opacity-60",
      )}
      aria-busy={loading}
    >
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((hg) => (
            <TableRow key={hg.id} className="hover:bg-transparent">
              {hg.headers.map((h) => (
                <TableHead
                  key={h.id}
                  aria-sort={ariaSort(h.column.id, orden)}
                  className="eyebrow h-10 whitespace-nowrap"
                >
                  {flexRender(h.column.columnDef.header, h.getContext())}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows.map((row) => (
            <TableRow
              key={row.id}
              tabIndex={0}
              onClick={() => router.push(`/tickets/${row.original.id}`)}
              onKeyDown={(e) => e.key === "Enter" && router.push(`/tickets/${row.original.id}`)}
              className="focus-visible:bg-accent cursor-pointer focus-visible:outline-none"
            >
              {row.getVisibleCells().map((cell) => (
                <TableCell key={cell.id} className="py-3">
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
