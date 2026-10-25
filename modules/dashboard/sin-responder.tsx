"use client";

import Link from "next/link";
import { EmptyState, ErrorState } from "@/components/shared/states";
import { Skeleton } from "@/components/ui/skeleton";
import { useTickets } from "@/lib/api/queries";
import { fmtHoras, fmtNum, horasDesde } from "@/lib/format";
import { cn } from "@/lib/utils";

const TOP = 8;

/** Tickets abiertos sin primera respuesta, el más antiguo primero. No depende del periodo elegido: es "ahora mismo". */
export function SinResponder() {
  const { data, error, isPending, refetch } = useTickets({
    sinResponder: true,
    orden: "CreadoAsc",
    pageSize: TOP,
  });

  if (error) return <ErrorState error={error} onRetry={() => refetch()} />;
  if (isPending)
    return (
      <div className="space-y-3">
        {Array.from({ length: 5 }, (_, i) => (
          <Skeleton key={i} className="h-8 w-full" />
        ))}
      </div>
    );
  if (data.items.length === 0) return <EmptyState title="Todo tiene al menos una respuesta" />;

  return (
    <>
      <ul className="space-y-3">
        {data.items.map((t) => {
          const horas = t.creado ? horasDesde(t.creado) : null;
          const urgente = horas !== null && horas >= 24;
          return (
            <li key={t.id}>
              <Link
                href={`/tickets/${t.id}`}
                className="group focus-visible:ring-ring flex items-baseline justify-between gap-3 rounded-md focus-visible:ring-2 focus-visible:outline-none"
              >
                <span className="min-w-0 flex-1 truncate text-sm group-hover:underline">
                  <span className="num text-muted-foreground mr-1.5 font-mono text-xs">
                    #{t.id}
                  </span>
                  {t.titulo || "(sin título)"}
                </span>
                <span
                  className={cn(
                    "num shrink-0 font-mono text-xs",
                    urgente ? "text-danger" : "text-muted-foreground",
                  )}
                >
                  {horas === null ? "—" : fmtHoras(horas)}
                </span>
              </Link>
              {t.tecnico && (
                <p className="text-muted-foreground truncate pl-[3.25rem] text-xs">{t.tecnico}</p>
              )}
            </li>
          );
        })}
      </ul>
      <Link
        href="/tickets?sinResponder=true&orden=CreadoAsc"
        className="text-muted-foreground hover:text-foreground mt-5 inline-block font-mono text-xs"
      >
        {data.totalCount > TOP
          ? `Ver los ${fmtNum(data.totalCount)} sin responder →`
          : "Ver sin responder →"}
      </Link>
    </>
  );
}
