"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Check, Loader2, Pencil } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import type { EstadoChecklist, ItemChecklist } from "@/lib/api/bitacora-schemas";
import { requiereObservacion } from "@/lib/bitacora/checklist";
import { ErrorBitacora, guardarEstado } from "@/lib/bitacora/mutaciones";
import { fmtFecha } from "@/lib/format";
import { cn } from "@/lib/utils";
import { ESTILO_ESTADO, EstadoPicker } from "./estado-picker";

export function FilaChecklist({
  item,
  fecha,
  grupo,
}: {
  item: ItemChecklist;
  fecha: string;
  grupo: string;
}) {
  const queryClient = useQueryClient();
  const [observacion, setObservacion] = useState(item.observacion ?? "");
  const [editando, setEditando] = useState<EstadoChecklist | null>(null); // estado que pide observación y está en edición
  const [guardadoOk, setGuardadoOk] = useState(false);

  // Si llega una actualización del servidor (otra persona lo guardó) y no se está editando, se refleja el texto nuevo.
  const [previo, setPrevio] = useState(item.observacion);
  if (item.observacion !== previo && editando === null) {
    setPrevio(item.observacion);
    setObservacion(item.observacion ?? "");
  }

  const guardar = useMutation({
    mutationFn: (vars: { estado: EstadoChecklist; observacion: string }) =>
      guardarEstado(item.actividadId, fecha, vars.estado, vars.observacion),
    onSuccess: async (actualizado) => {
      setEditando(null);
      setGuardadoOk(true);
      setTimeout(() => setGuardadoOk(false), 1500);
      queryClient.setQueryData(["bitacora", "checklist", grupo, fecha], (previo: unknown) => {
        if (!previo || typeof previo !== "object" || !("items" in previo)) return previo;
        const dia = previo as { items: ItemChecklist[] };
        return {
          ...dia,
          items: dia.items.map((i) =>
            i.actividadId === actualizado.actividadId ? actualizado : i,
          ),
        };
      });
      await queryClient.invalidateQueries({ queryKey: ["bitacora", "resumen"] });
    },
  });

  function elegir(estado: EstadoChecklist) {
    guardar.reset();
    if (requiereObservacion(estado)) {
      setEditando(estado);
      return;
    }
    if (item.estado === estado) return; // ya estaba así: no hay nada que guardar
    guardar.mutate({ estado, observacion: "" });
  }

  const puedeGuardarObservacion = editando !== null && observacion.trim().length > 0;

  return (
    <li
      id={`act-${item.actividadId}`}
      className={cn(
        "surface bg-card scroll-mt-20 rounded-xl border p-3.5",
        !item.actividadActiva && "opacity-70",
      )}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="truncate font-medium">{item.nombre}</p>
          {!item.actividadActiva && (
            <p className="text-muted-foreground text-xs">
              Esta actividad ya no está activa en el catálogo
            </p>
          )}
          {(item.actualizadoPor ?? item.revisadoPor) && (
            <p className="text-muted-foreground num mt-0.5 font-mono text-xs">
              {item.actualizadoPor ?? item.revisadoPor} ·{" "}
              {fmtFecha(item.actualizadoEn ?? item.revisadoEn, "d MMM, HH:mm")}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          {guardadoOk && <Check className="text-ok size-4" aria-hidden />}
          {guardar.isPending && (
            <Loader2 className="text-muted-foreground size-4 animate-spin" aria-hidden />
          )}
          <EstadoPicker
            seleccionado={item.estado}
            onElegir={elegir}
            disabled={guardar.isPending}
            nombreGrupo={item.nombre}
          />
        </div>
      </div>

      {item.observacion && editando === null && item.estado && requiereObservacion(item.estado) && (
        <ObservacionGuardada
          estado={item.estado}
          texto={item.observacion}
          onEditar={() => setEditando(item.estado!)}
        />
      )}

      {editando !== null && (
        <div className="mt-3 space-y-2 border-t pt-3">
          <label htmlFor={`obs-${item.actividadId}`} className="eyebrow block">
            Qué pasó (obligatorio para guardar como {editando === "Critico" ? "Crítico" : editando})
          </label>
          <textarea
            id={`obs-${item.actividadId}`}
            value={observacion}
            onChange={(e) => setObservacion(e.target.value)}
            maxLength={1000}
            rows={2}
            autoFocus
            className="bg-background w-full resize-y rounded-lg border px-3 py-2 text-sm"
            placeholder="Describe la incidencia…"
          />
          {guardar.error && (
            <p role="alert" className="bg-danger-soft text-danger rounded-md px-2.5 py-1.5 text-xs">
              {guardar.error instanceof ErrorBitacora
                ? guardar.error.message
                : "No se pudo guardar."}
            </p>
          )}
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                setEditando(null);
                setObservacion(item.observacion ?? "");
                guardar.reset();
              }}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              size="sm"
              disabled={!puedeGuardarObservacion || guardar.isPending}
              onClick={() => guardar.mutate({ estado: editando, observacion })}
            >
              {guardar.isPending ? <Loader2 className="animate-spin" /> : null} Guardar
            </Button>
          </div>
        </div>
      )}
    </li>
  );
}

const BORDE_ESTADO: Record<EstadoChecklist, string> = {
  Ok: "border-l-ok",
  Advertencia: "border-l-warn",
  Falla: "border-l-danger",
  Critico: "border-l-danger",
  NoAplica: "border-l-border",
};

/** Lo que el revisor escribió, visible sin tener que volver a abrir la edición. */
function ObservacionGuardada({
  estado,
  texto,
  onEditar,
}: {
  estado: EstadoChecklist;
  texto: string;
  onEditar: () => void;
}) {
  const { icono: Icono, clase } = ESTILO_ESTADO[estado];
  return (
    <div
      className={cn(
        "bg-muted/40 mt-3 flex items-start justify-between gap-3 rounded-lg border-l-2 px-3 py-2 text-sm",
        BORDE_ESTADO[estado],
      )}
    >
      <p className="flex min-w-0 items-start gap-2">
        <Icono className={cn("mt-0.5 size-4 shrink-0", clase.split(" ")[0])} aria-hidden />
        <span className="whitespace-pre-wrap">{texto}</span>
      </p>
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        onClick={onEditar}
        aria-label="Editar observación"
      >
        <Pencil />
      </Button>
    </div>
  );
}
