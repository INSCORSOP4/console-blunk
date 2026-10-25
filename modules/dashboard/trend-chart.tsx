"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Skeleton } from "@/components/ui/skeleton";
import type { TendenciaPunto } from "@/lib/api/schemas";
import { fmtNum, fmtPeriodo } from "@/lib/format";
import type { Agrupacion } from "@/lib/rangos";
import { useReducedMotion } from "@/lib/use-reduced-motion";

export function TrendChart({
  data,
  agrupacion,
}: {
  data?: TendenciaPunto[];
  agrupacion: Agrupacion;
}) {
  const reducedMotion = useReducedMotion();
  if (!data) return <Skeleton className="h-72 w-full" />;

  const filas = data.map((p) => ({ ...p, etiqueta: fmtPeriodo(p.periodo, agrupacion) }));

  return (
    <>
      <div
        className="h-72 w-full"
        role="img"
        aria-label={`Tickets creados y cerrados por ${agrupacion === "Dia" ? "día" : agrupacion === "Semana" ? "semana" : "mes"}`}
      >
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={filas} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
            <defs>
              <linearGradient id="g-creados" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--chart-1)" stopOpacity={0.45} />
                <stop offset="100%" stopColor="var(--chart-1)" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="g-cerrados" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--chart-2)" stopOpacity={0.35} />
                <stop offset="100%" stopColor="var(--chart-2)" stopOpacity={0} />
              </linearGradient>
            </defs>
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
            />
            <Tooltip
              cursor={{ stroke: "var(--muted-foreground)", strokeDasharray: "3 3" }}
              contentStyle={{
                background: "var(--popover)",
                border: "1px solid var(--border)",
                borderRadius: 8,
                fontSize: 12,
                color: "var(--popover-foreground)",
              }}
              labelStyle={{ fontFamily: "var(--font-mono-stack)", marginBottom: 4 }}
            />
            <Area
              type="monotone"
              name="Creados"
              dataKey="creados"
              stroke="var(--chart-1)"
              strokeWidth={2.25}
              fill="url(#g-creados)"
              activeDot={{ r: 4 }}
              isAnimationActive={!reducedMotion}
            />
            <Area
              type="monotone"
              name="Cerrados"
              dataKey="cerrados"
              stroke="var(--chart-2)"
              strokeWidth={2.25}
              strokeDasharray="6 4"
              isAnimationActive={!reducedMotion}
              fill="url(#g-cerrados)"
              activeDot={{ r: 4 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      {/* Alternativa accesible: los lectores de pantalla no pueden leer la gráfica */}
      <table className="sr-only">
        <caption>Tickets creados y cerrados por periodo</caption>
        <thead>
          <tr>
            <th scope="col">Periodo</th>
            <th scope="col">Creados</th>
            <th scope="col">Cerrados</th>
          </tr>
        </thead>
        <tbody>
          {filas.map((f) => (
            <tr key={f.periodo}>
              <th scope="row">{f.etiqueta}</th>
              <td>{fmtNum(f.creados)}</td>
              <td>{fmtNum(f.cerrados)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}

export function TrendLegend() {
  return (
    <div className="text-muted-foreground flex gap-4 font-mono text-xs">
      <span className="flex items-center gap-1.5">
        <span className="bg-chart-1 h-0.5 w-4 rounded" /> Creados
      </span>
      <span className="flex items-center gap-1.5">
        <span className="border-chart-2 h-0 w-4 border-t-2 border-dashed" /> Cerrados
      </span>
    </div>
  );
}
