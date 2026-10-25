import { AlertTriangle, CheckCircle2, CircleSlash, Flame, XCircle } from "lucide-react";
import type { EstadoChecklist } from "@/lib/api/bitacora-schemas";
import { cn } from "@/lib/utils";

export const ESTILO_ESTADO: Record<
  EstadoChecklist,
  { clase: string; claseActiva: string; icono: typeof CheckCircle2; texto: string }
> = {
  Ok: {
    clase: "text-ok hover:bg-ok-soft",
    claseActiva: "bg-ok-soft text-ok border-ok/40",
    icono: CheckCircle2,
    texto: "Ok",
  },
  Advertencia: {
    clase: "text-warn hover:bg-warn-soft",
    claseActiva: "bg-warn-soft text-warn border-warn/40",
    icono: AlertTriangle,
    texto: "Advertencia",
  },
  Falla: {
    clase: "text-danger hover:bg-danger-soft",
    claseActiva: "bg-danger-soft text-danger border-danger/40",
    icono: XCircle,
    texto: "Falla",
  },
  Critico: {
    clase: "text-danger hover:bg-danger-soft",
    claseActiva: "bg-danger-soft text-danger border-danger/40",
    icono: Flame,
    texto: "Crítico",
  },
  NoAplica: {
    clase: "text-muted-foreground hover:bg-muted",
    claseActiva: "bg-muted text-foreground border-border",
    icono: CircleSlash,
    texto: "No aplica",
  },
};

const ORDEN: EstadoChecklist[] = ["Ok", "Advertencia", "Falla", "Critico", "NoAplica"];

export function EstadoPicker({
  seleccionado,
  onElegir,
  disabled,
  nombreGrupo,
}: {
  seleccionado: EstadoChecklist | null;
  onElegir: (estado: EstadoChecklist) => void;
  disabled?: boolean;
  nombreGrupo: string;
}) {
  return (
    <div
      role="radiogroup"
      aria-label={`Estado de ${nombreGrupo}`}
      className="flex flex-wrap gap-1.5"
    >
      {ORDEN.map((estado) => {
        const { clase, claseActiva, icono: Icono, texto } = ESTILO_ESTADO[estado];
        const activo = seleccionado === estado;
        return (
          <button
            key={estado}
            type="button"
            role="radio"
            aria-checked={activo}
            disabled={disabled}
            onClick={() => onElegir(estado)}
            title={texto}
            className={cn(
              "touch-target flex items-center gap-1.5 rounded-full border border-transparent px-2.5 py-1 text-xs font-medium transition-colors disabled:opacity-50",
              activo ? claseActiva : clase,
            )}
          >
            <Icono className="size-3.5" aria-hidden />
            <span className="hidden sm:inline">{texto}</span>
          </button>
        );
      })}
    </div>
  );
}
