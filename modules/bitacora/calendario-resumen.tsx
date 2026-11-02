"use client";

import { format, getDay, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { useMemo } from "react";
import type { ResumenDia } from "@/lib/api/bitacora-schemas";
import { useResumenBitacora } from "@/lib/api/queries";
import { fechaActual } from "@/lib/bitacora/fecha";
import type { ConfigBitacora } from "@/lib/bitacora/grupos";
import { restarDias } from "@/lib/format";
import { cn } from "@/lib/utils";

type CalendarioResumenProps = {
  config: ConfigBitacora;
  fechaSeleccionada: string;
  onSeleccionar: (fecha: string) => void;
};

const DIAS = ["D", "L", "M", "M", "J", "V", "S"];

function estadoDelDia(resumen: ResumenDia | undefined) {
  if (!resumen || resumen.total === 0) {
    return { clase: "bg-muted", etiqueta: "Sin revisiones" };
  }

  if (resumen.critico > 0 || resumen.falla > 0) {
    return { clase: "bg-danger", etiqueta: "Con falla" };
  }

  if (resumen.advertencia > 0) {
    return { clase: "bg-warn", etiqueta: "Con advertencia" };
  }

  if (resumen.pendiente > 0) {
    return { clase: "bg-info", etiqueta: "Pendiente" };
  }

  return { clase: "bg-ok", etiqueta: "Completo" };
}

export function CalendarioResumen({
  config,
  fechaSeleccionada,
  onSeleccionar,
}: CalendarioResumenProps) {
  const hasta = fechaActual(config);
  const desde = restarDias(hasta, 89);
  const resumen = useResumenBitacora(config.grupo, desde, hasta);
  const resumenPorFecha = useMemo(
    () => new Map(resumen.data?.map((dia) => [dia.fecha, dia])),
    [resumen.data],
  );
  const celdas = useMemo(
    () => [
      ...Array<null>(getDay(parseISO(desde))).fill(null),
      ...Array.from({ length: 90 }, (_, indice) => restarDias(hasta, 89 - indice)),
    ],
    [desde, hasta],
  );

  if (resumen.isPending) {
    return (
      <div
        className="bg-card mb-5 h-32 animate-pulse rounded-xl border"
        aria-label="Cargando historial"
      />
    );
  }

  if (resumen.isError) return null;

  return (
    <section
      aria-labelledby="historial-bitacora"
      className="surface bg-card mb-5 rounded-xl border p-4"
    >
      <div className="mb-4 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <div>
          <p className="eyebrow">Historial</p>
          <h2 id="historial-bitacora" className="mt-1 text-sm font-semibold">
            Últimos 90 días
          </h2>
        </div>
        <p className="text-muted-foreground text-xs">Elige un día para abrir su checklist.</p>
      </div>

      <div className="flex gap-2">
        <div
          aria-hidden="true"
          className="text-muted-foreground grid grid-rows-7 gap-1 pt-0.5 text-[10px] leading-3"
        >
          {DIAS.map((dia, indice) => (
            <span key={`${dia}-${indice}`} className={cn(indice % 2 === 0 ? "" : "invisible")}>
              {dia}
            </span>
          ))}
        </div>
        <div
          aria-label="Historial de revisiones de los últimos 90 días"
          className="grid grid-flow-col grid-rows-7 gap-1"
        >
          {celdas.map((fecha, indice) => {
            if (!fecha) {
              return (
                <span key={`vacio-${indice}`} aria-hidden="true" className="size-3.5 sm:size-4" />
              );
            }

            const estado = estadoDelDia(resumenPorFecha.get(fecha));
            const etiquetaFecha = format(parseISO(fecha), "d 'de' MMMM", { locale: es });
            const seleccionado = fecha === fechaSeleccionada;

            return (
              <button
                key={fecha}
                type="button"
                aria-label={`${etiquetaFecha}: ${estado.etiqueta}`}
                aria-pressed={seleccionado}
                title={`${etiquetaFecha}: ${estado.etiqueta}`}
                onClick={() => onSeleccionar(fecha)}
                className={cn(
                  "focus-visible:outline-ring size-3.5 rounded-[3px] transition-transform hover:scale-125 focus-visible:z-10 focus-visible:outline-2 focus-visible:outline-offset-2 sm:size-4",
                  estado.clase,
                  seleccionado && "ring-foreground ring-offset-card ring-2 ring-offset-2",
                )}
              />
            );
          })}
        </div>
      </div>

      <ul
        className="text-muted-foreground mt-4 flex flex-wrap gap-x-3 gap-y-1 text-xs"
        aria-label="Estados"
      >
        {[
          ["bg-ok", "Completo"],
          ["bg-warn", "Advertencia"],
          ["bg-danger", "Falla"],
          ["bg-info", "Pendiente"],
        ].map(([clase, etiqueta]) => (
          <li key={etiqueta} className="flex items-center gap-1.5">
            <span aria-hidden="true" className={cn("size-2.5 rounded-[2px]", clase)} />
            {etiqueta}
          </li>
        ))}
      </ul>
    </section>
  );
}
