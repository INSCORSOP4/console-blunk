"use client";

import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState, ErrorState } from "@/components/shared/states";
import { useCargaTecnicos } from "@/lib/api/queries";
import { fmtNum } from "@/lib/format";

const TOP = 8;

export function TechnicianLoad() {
  const { data, error, isPending, refetch } = useCargaTecnicos();

  if (error) return <ErrorState error={error} onRetry={() => refetch()} />;
  if (isPending)
    return (
      <div className="space-y-3">
        {Array.from({ length: 6 }, (_, i) => (
          <Skeleton key={i} className="h-8 w-full" />
        ))}
      </div>
    );

  const activos = data.filter((t) => t.abiertos > 0).slice(0, TOP);
  if (activos.length === 0) return <EmptyState title="Nadie tiene tickets abiertos" />;
  const max = Math.max(...activos.map((t) => t.abiertos));

  return (
    <>
      <ul className="space-y-3">
        {activos.map((t) => (
          <li key={t.tecnicoId}>
            <Link
              href={`/tickets?tecnicoId=${t.tecnicoId}`}
              className="group focus-visible:ring-ring block rounded-md focus-visible:ring-2 focus-visible:outline-none"
            >
              <div className="flex items-baseline justify-between gap-2 text-sm">
                <span className="truncate group-hover:underline">{t.tecnico}</span>
                <span className="num font-mono text-xs">
                  {fmtNum(t.abiertos)}
                  {t.vencidos > 0 && (
                    <span className="text-danger ml-2">{fmtNum(t.vencidos)} venc.</span>
                  )}
                </span>
              </div>
              <span className="bg-muted mt-1 block h-1.5 overflow-hidden rounded-full">
                <span
                  className="bg-chart-4 block h-full rounded-full"
                  style={{ width: `${(t.abiertos / max) * 100}%` }}
                />
              </span>
            </Link>
          </li>
        ))}
      </ul>
      <Link
        href="/tecnicos"
        className="text-muted-foreground hover:text-foreground mt-5 inline-block font-mono text-xs"
      >
        Ver todos los técnicos →
      </Link>
    </>
  );
}
