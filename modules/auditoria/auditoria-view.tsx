"use client";

import { BookOpen, ClipboardList, Search, UserCog } from "lucide-react";
import { useMemo, useState } from "react";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState, ErrorState } from "@/components/shared/states";
import { TourButton } from "@/components/shared/tour-button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuditoria } from "@/lib/api/queries";
import type { EventoAuditoria, ModuloAuditoria } from "@/lib/api/auditoria-schemas";
import {
  contarPorModulo,
  ETIQUETA_MODULO,
  filtrarEventos,
  tonoResultado,
  type FiltroModulo,
} from "@/lib/auditoria/auditoria";
import { fmtFecha, fmtNum } from "@/lib/format";
import type { DriveStep } from "@/lib/tour/driver";
import { cn } from "@/lib/utils";

const ICONO_MODULO: Record<ModuloAuditoria, typeof BookOpen> = {
  Conocimiento: BookOpen,
  Microsip: UserCog,
  Bitacora: ClipboardList,
};

const CLASE_MODULO: Record<ModuloAuditoria, string> = {
  Conocimiento: "bg-signal-soft text-signal",
  Microsip: "bg-info-soft text-info",
  Bitacora: "bg-ok-soft text-ok",
};

const CLASE_TONO: Record<ReturnType<typeof tonoResultado>, string> = {
  ok: "bg-ok-soft text-ok",
  warn: "bg-warn-soft text-warn",
  danger: "bg-danger-soft text-danger",
  info: "bg-info-soft text-info",
  neutral: "bg-muted text-muted-foreground",
};

const PASOS_TOUR: DriveStep[] = [
  {
    element: '[data-tour="buscar"]',
    popover: {
      title: "Buscar",
      description:
        "Busca por texto en la acción, el detalle o el usuario, sin importar mayúsculas ni acentos.",
    },
  },
  {
    element: '[data-tour="filtro-modulo"]',
    popover: {
      title: "Módulo",
      description:
        "Filtra solo por Conocimiento, MICROSIP o Bitácora. El número junto a cada uno es cuántos eventos tiene.",
    },
  },
  {
    element: '[data-tour="linea-tiempo"]',
    popover: {
      title: "Línea de tiempo",
      description:
        "Cada evento junta su módulo, quién lo hizo, cuándo y el resultado, aunque cada fuente guarde su hora en una zona distinta por dentro.",
    },
  },
];

export function AuditoriaView() {
  const q = useAuditoria(150);
  const [modulo, setModulo] = useState<FiltroModulo>("todos");
  const [buscar, setBuscar] = useState("");

  const eventos = useMemo(() => q.data ?? [], [q.data]);
  const conteo = useMemo(() => contarPorModulo(eventos), [eventos]);
  const visibles = useMemo(
    () => filtrarEventos(eventos, modulo, buscar),
    [eventos, modulo, buscar],
  );

  const modulos: ModuloAuditoria[] = ["Conocimiento", "Microsip", "Bitacora"];

  return (
    <>
      <PageHeader
        eyebrow="Soporte"
        title="Auditoría"
        description="Quién hizo qué en el sistema: subidas a Conocimiento, cambios en MICROSIP y guardados de la Bitácora, en una sola línea de tiempo."
        actions={<TourButton pasos={PASOS_TOUR} />}
      />

      {q.error && !q.data ? (
        <ErrorState error={q.error} onRetry={() => q.refetch()} />
      ) : q.isPending ? (
        <div className="space-y-2">
          {Array.from({ length: 8 }, (_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      ) : (
        <>
          <div className="mb-5 flex flex-wrap items-center gap-3">
            <label data-tour="buscar" className="relative block w-full max-w-sm">
              <span className="sr-only">Buscar</span>
              <Search
                className="text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2"
                aria-hidden
              />
              <Input
                type="search"
                value={buscar}
                onChange={(e) => setBuscar(e.target.value)}
                placeholder="Acción, detalle o usuario…"
                maxLength={200}
                className="pl-8"
              />
            </label>
            <div
              data-tour="filtro-modulo"
              role="group"
              aria-label="Módulo"
              className="flex flex-wrap rounded-lg border p-0.5 text-sm"
            >
              <button
                type="button"
                aria-pressed={modulo === "todos"}
                onClick={() => setModulo("todos")}
                className={cn(
                  "touch-target rounded-md px-3 py-1.5 transition-colors",
                  modulo === "todos"
                    ? "bg-accent text-foreground font-medium"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                Todos <span className="num opacity-70">{fmtNum(eventos.length)}</span>
              </button>
              {modulos.map((m) => (
                <button
                  key={m}
                  type="button"
                  aria-pressed={modulo === m}
                  onClick={() => setModulo(modulo === m ? "todos" : m)}
                  className={cn(
                    "touch-target rounded-md px-3 py-1.5 transition-colors",
                    modulo === m
                      ? "bg-accent text-foreground font-medium"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {ETIQUETA_MODULO[m]} <span className="num opacity-70">{fmtNum(conteo[m])}</span>
                </button>
              ))}
            </div>
          </div>

          <div data-tour="linea-tiempo">
            {visibles.length === 0 ? (
              <EmptyState title="Nada que coincida" hint="Cambia el filtro o la búsqueda." />
            ) : (
              <ul className="space-y-2">
                {visibles.map((e, i) => (
                  <FilaEvento key={`${e.fecha}-${i}`} evento={e} />
                ))}
              </ul>
            )}
          </div>
        </>
      )}
    </>
  );
}

function FilaEvento({ evento }: { evento: EventoAuditoria }) {
  const Icono = ICONO_MODULO[evento.modulo];
  const tono = tonoResultado(evento.resultado);

  return (
    <li className="surface bg-card rounded-xl border p-3.5">
      <div className="flex items-start gap-3">
        <span
          className={cn(
            "mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full",
            CLASE_MODULO[evento.modulo],
          )}
        >
          <Icono className="size-4" aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="truncate font-medium">{evento.accion}</span>
            {evento.resultado && (
              <span
                className={cn("rounded-full px-2 py-0.5 text-xs font-medium", CLASE_TONO[tono])}
              >
                {evento.resultado}
              </span>
            )}
          </div>
          {evento.detalle && (
            <p className="text-muted-foreground mt-0.5 text-sm break-words">{evento.detalle}</p>
          )}
          <p className="text-muted-foreground num mt-1.5 font-mono text-xs">
            {ETIQUETA_MODULO[evento.modulo]} · {evento.usuarioNombre} ·{" "}
            {fmtFecha(evento.fecha, "d MMM yyyy, HH:mm")}
          </p>
        </div>
      </div>
    </li>
  );
}
