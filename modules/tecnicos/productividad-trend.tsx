"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { EmptyState } from "@/components/shared/states";
import { Skeleton } from "@/components/ui/skeleton";
import type { ProductividadPunto } from "@/lib/api/schemas";
import { fmtNum, fmtPeriodo } from "@/lib/format";
import type { Agrupacion } from "@/lib/rangos";
import { useReducedMotion } from "@/lib/use-reduced-motion";

/** Evolución semanal/mensual de los tiempos promedio de un técnico, para ver si mejora o empeora. */
export function ProductividadTrend({
  data,
  agrupacion,
}: {
  data?: ProductividadPunto[];
  agrupacion: Agrupacion;
}) {
  const reducedMotion = useReducedMotion();
  if (!data) return <Skeleton className="h-64 w-full" />;

  const conDatos = data.filter((p) => p.asignados > 0);
  if (conDatos.length < 2)
    return <EmptyState title="No hay suficientes periodos con tickets para ver una tendencia" />;

  const filas = data.map((p) => ({
    ...p,
    etiqueta: fmtPeriodo(p.periodo, agrupacion),
    primeraRespuesta:
      p.promedioHorasPrimeraRespuesta === null
        ? null
        : Math.round(p.promedioHorasPrimeraRespuesta * 10) / 10,
    resolucion:
      p.promedioHorasResolucion === null ? null : Math.round(p.promedioHorasResolucion * 10) / 10,
  }));

  return (
    <>
      <div
        className="h-64 w-full"
        role="img"
        aria-label="Horas promedio de primera respuesta y resolución por periodo"
      >
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={filas} margin={{ top: 8, right: 8, left: -18, bottom: 0 }} barGap={4}>
            <CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="3 4" />
            <XAxis
              dataKey="etiqueta"
              tickLine={false}
              axisLine={false}
              interval="preserveStartEnd"
              minTickGap={24}
              tick={{
                fill: "var(--muted-foreground)",
                fontSize: 12,
                fontFamily: "var(--font-mono-stack)",
              }}
            />
            <YAxis
              allowDecimals={false}
              tickLine={false}
              axisLine={false}
              tick={{
                fill: "var(--muted-foreground)",
                fontSize: 12,
                fontFamily: "var(--font-mono-stack)",
              }}
              label={{
                value: "horas",
                angle: -90,
                position: "insideLeft",
                fill: "var(--muted-foreground)",
                fontSize: 11,
              }}
            />
            <Tooltip
              cursor={{ fill: "var(--muted)", opacity: 0.5 }}
              contentStyle={{
                background: "var(--popover)",
                border: "1px solid var(--border)",
                borderRadius: 8,
                fontSize: 12,
                color: "var(--popover-foreground)",
              }}
              labelStyle={{ fontFamily: "var(--font-mono-stack)", marginBottom: 4 }}
            />
            <Bar
              name="1ª respuesta (h)"
              dataKey="primeraRespuesta"
              fill="var(--chart-1)"
              radius={[3, 3, 0, 0]}
              isAnimationActive={!reducedMotion}
            />
            <Bar
              name="Resolución (h)"
              dataKey="resolucion"
              fill="var(--chart-2)"
              radius={[3, 3, 0, 0]}
              isAnimationActive={!reducedMotion}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <table className="sr-only">
        <caption>Horas promedio de primera respuesta y resolución por periodo</caption>
        <thead>
          <tr>
            <th scope="col">Periodo</th>
            <th scope="col">Asignados</th>
            <th scope="col">1ª respuesta (h)</th>
            <th scope="col">Resolución (h)</th>
          </tr>
        </thead>
        <tbody>
          {filas.map((f) => (
            <tr key={f.periodo}>
              <th scope="row">{f.etiqueta}</th>
              <td>{fmtNum(f.asignados)}</td>
              <td>{f.primeraRespuesta ?? "—"}</td>
              <td>{f.resolucion ?? "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}

export function ProductividadTrendLegend() {
  return (
    <div className="text-muted-foreground flex gap-4 font-mono text-xs">
      <span className="flex items-center gap-1.5">
        <span className="bg-chart-1 size-2.5 rounded-sm" /> 1ª respuesta
      </span>
      <span className="flex items-center gap-1.5">
        <span className="bg-chart-2 size-2.5 rounded-sm" /> Resolución
      </span>
    </div>
  );
}
