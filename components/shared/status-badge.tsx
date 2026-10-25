import { cn } from "@/lib/utils";

// IDs de StatusDefinition en ServiceDesk: 1 Open, 2 Onhold, 3 Closed, 4 Resolved, 5 Assigned, 6 In Progress.
const ESTADOS: Record<number, { etiqueta: string; clase: string }> = {
  1: { etiqueta: "Abierto", clase: "bg-signal-soft text-signal" },
  2: { etiqueta: "En espera", clase: "bg-warn-soft text-warn" },
  3: { etiqueta: "Cerrado", clase: "bg-muted text-muted-foreground" },
  4: { etiqueta: "Resuelto", clase: "bg-ok-soft text-ok" },
  5: { etiqueta: "Asignado", clase: "bg-info-soft text-info" },
  6: { etiqueta: "En curso", clase: "bg-info-soft text-info" },
};

export const nombreEstado = (id: number, fallback: string) => ESTADOS[id]?.etiqueta ?? fallback;

export function StatusBadge({
  estadoId,
  estado,
  className,
}: {
  estadoId: number;
  estado: string;
  className?: string;
}) {
  const def = ESTADOS[estadoId];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium whitespace-nowrap",
        def?.clase ?? "bg-muted text-muted-foreground",
        className,
      )}
    >
      <span className="size-1.5 rounded-full bg-current" />
      {def?.etiqueta ?? estado}
    </span>
  );
}
