import { AlertTriangle, Clock, TicketCheck } from "lucide-react";
import Image from "next/image";
import type { CSSProperties } from "react";
import { cn } from "@/lib/utils";

/**
 * Panel decorativo del login (solo visible en pantallas grandes). Todo el contenido es
 * estático / de ejemplo — no llama a la API — pensado para transmitir qué hace el sistema.
 */
export function LoginShowcase() {
  return (
    <div className="relative isolate hidden h-full overflow-hidden lg:flex lg:flex-col lg:justify-center lg:px-16 lg:py-10 xl:px-20">
      <div aria-hidden className="absolute inset-0 -z-10 overflow-hidden">
        <div className="showcase-glow-a" />
        <div className="showcase-glow-b" />
        <div className="showcase-grid" />
      </div>

      <span className="bg-ok-soft text-ok inline-flex w-fit items-center gap-2 rounded-full px-3 py-1 text-xs font-medium">
        <span className="bg-ok size-1.5 rounded-full" aria-hidden />
        Bitácora de hoy · en orden
      </span>

      <h2 className="font-display mt-6 max-w-sm text-4xl leading-[1.1] font-semibold tracking-tight">
        Todo tu soporte, en un solo lugar.
      </h2>
      <p className="text-muted-foreground mt-3 max-w-sm text-sm">
        Tickets, bitácora, jobs y archivos de confianza — sin perseguir nada por separado.
      </p>

      <div
        className="surface bg-card rise mt-10 w-full max-w-sm rounded-xl border p-5 shadow-[var(--sombra-card)]"
        style={{ "--i": 1 } as CSSProperties}
      >
        <div className="flex items-center justify-between">
          <p className="eyebrow">Tablero</p>
          <span className="text-muted-foreground flex items-center gap-1.5 text-xs">
            <span className="bg-ok size-1.5 animate-pulse rounded-full" aria-hidden />
            En vivo
          </span>
        </div>

        <div className="mt-4 grid grid-cols-3 gap-3">
          <Kpi label="Abiertos" value="42" tone="signal" />
          <Kpi label="Vencidos" value="3" tone="danger" />
          <Kpi label="SLA" value="96%" tone="ok" />
        </div>

        <ul className="mt-5 space-y-2.5 border-t pt-4">
          <TicketRow
            icono={AlertTriangle}
            tono="warn"
            texto="Sin acceso a facturación"
            meta="Vence en 2 h"
          />
          <TicketRow
            icono={TicketCheck}
            tono="ok"
            texto="Reinicio de servicio OLAP"
            meta="Resuelto"
          />
        </ul>
      </div>

      <div
        className="rise pointer-events-none absolute right-6 bottom-0 hidden w-32 xl:block"
        style={{ "--i": 2 } as CSSProperties}
      >
        <Image
          src="/mascota/linki-hola.svg"
          alt=""
          aria-hidden
          width={291}
          height={429}
          priority
          unoptimized
          className="linki-flotar w-full"
        />
      </div>
    </div>
  );
}

function Kpi({ label, value, tone }: { label: string; value: string; tone: "signal" | "danger" | "ok" }) {
  const color = { signal: "text-signal", danger: "text-danger", ok: "text-ok" }[tone];
  return (
    <div>
      <p className="text-muted-foreground text-[0.65rem] tracking-wide uppercase">{label}</p>
      <p className={cn("num font-display mt-0.5 text-xl font-semibold", color)}>{value}</p>
    </div>
  );
}

function TicketRow({
  icono: Icono,
  tono,
  texto,
  meta,
}: {
  icono: typeof AlertTriangle;
  tono: "warn" | "ok";
  texto: string;
  meta: string;
}) {
  const color = tono === "warn" ? "text-warn" : "text-ok";
  return (
    <li className="flex items-center gap-2.5 text-sm">
      <Icono className={cn("size-4 shrink-0", color)} aria-hidden />
      <span className="flex-1 truncate">{texto}</span>
      <span className="text-muted-foreground flex items-center gap-1 text-xs whitespace-nowrap">
        <Clock className="size-3" aria-hidden />
        {meta}
      </span>
    </li>
  );
}
