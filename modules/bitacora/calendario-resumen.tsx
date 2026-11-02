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

const DIAS = ["L", "M", "M", "J", "V", "S", "D"];
const ANCHO_SEMANA = 20;

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
  const desde = restarDias(hasta, 364);
  const resumen = useResumenBitacora(config.grupo, desde, hasta);
  const resumenPorFecha = useMemo(
    () => new Map(resumen.data?.map((dia) => [dia.fecha, dia])),
    [resumen.data],
  );
  const celdas = useMemo(
    () => [
      ...Array<null>((getDay(parseISO(desde)) + 6) % 7).fill(null),
      ...Array.from({ length: 365 }, (_, indice) => restarDias(hasta, 364 - indice)),
    ],
    [desde, hasta],
  );
  const semanas = Math.ceil(celdas.length / 7);
  const meses = useMemo(
    () =>
      celdas.reduce<{ etiqueta: string; columna: number }[]>((resultado, fecha, indice) => {
        if (!fecha) return resultado;

        const etiqueta = format(parseISO(fecha), "MMM", { locale: es });
        const ultimo = resultado[resultado.length - 1];
        if (ultimo?.etiqueta !== etiqueta) {
          resultado.push({ etiqueta, columna: Math.floor(indice / 7) });
        }
        return resultado;
      }, []),
    [celdas],
  );
  const estadisticas = useMemo(() => {
    const dias = resumen.data ?? [];
    return {
      completos: dias.filter((dia) => estadoDelDia(dia).etiqueta === "Completo").length,
      advertencias: dias.filter((dia) => dia.advertencia > 0).length,
      fallas: dias.filter((dia) => dia.falla > 0 || dia.critico > 0).length,
    };
  }, [resumen.data]);

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
            Último año
          </h2>
        </div>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
          <span className="text-ok">{estadisticas.completos} completos</span>
          <span className="text-warn">{estadisticas.advertencias} alertas</span>
          <span className="text-danger">{estadisticas.fallas} fallas</span>
        </div>
      </div>

      <div className="overflow-x-auto pb-1">
        <div className="flex w-max gap-2">
          <div
            aria-hidden="true"
            className="text-muted-foreground grid grid-rows-7 gap-1 pt-5 text-[10px] leading-4"
          >
            {DIAS.map((dia, indice) => (
              <span key={`${dia}-${indice}`} className={cn(indice % 2 === 0 ? "" : "invisible")}>
                {dia}
              </span>
            ))}
          </div>
          <div>
            <div
              aria-hidden="true"
              className="text-muted-foreground relative mb-1 h-3 text-[10px] leading-3 capitalize"
              style={{ width: `${semanas * ANCHO_SEMANA}px` }}
            >
              {meses.map(({ etiqueta, columna }) => (
                <span
                  key={`${etiqueta}-${columna}`}
                  className="absolute top-0 whitespace-nowrap"
                  style={{ left: `${columna * ANCHO_SEMANA}px` }}
                >
                  {etiqueta}
                </span>
              ))}
            </div>
            <div
              aria-label="Historial de revisiones del último año"
              className="grid grid-flow-col grid-rows-7 gap-1"
            >
              {celdas.map((fecha, indice) => {
                if (!fecha) {
                  return <span key={`vacio-${indice}`} aria-hidden="true" className="size-4" />;
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
                      "focus-visible:outline-ring size-4 rounded-[3px] transition-transform hover:scale-125 focus-visible:z-10 focus-visible:outline-2 focus-visible:outline-offset-2",
                      estado.clase,
                      seleccionado && "ring-foreground ring-offset-card ring-2 ring-offset-2",
                    )}
                  />
                );
              })}
            </div>
          </div>
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
