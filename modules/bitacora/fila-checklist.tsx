"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Check, Clock, Loader2, Pencil, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
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
  const [editando, setEditando] = useState<EstadoChecklist | null>(null);
  const [guardadoOk, setGuardadoOk] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const filaRef = useRef<HTMLLIElement>(null);

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
      setTimeout(() => textareaRef.current?.focus(), 50);
      return;
    }
    if (item.estado === estado) return;
    guardar.mutate({ estado, observacion: "" });
  }

  // Keyboard shortcuts
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLInputElement) return;

      const key = e.key.toLowerCase();
      const shortcuts: Record<string, () => void> = {
        o: () => elegir("Ok"),
        a: () => elegir("Advertencia"),
        f: () => elegir("Falla"),
        c: () => elegir("Critico"),
        n: () => elegir("NoAplica"),
      };

      if (shortcuts[key] && !guardar.isPending) {
        e.preventDefault();
        shortcuts[key]();
      }

      // Flechas para navegar entre filas
      if (e.key === "ArrowDown" || e.key === "ArrowUp") {
        e.preventDefault();
        const filas = Array.from(document.querySelectorAll('[data-fila-checklist]'));
        const idx = filas.indexOf(filaRef.current!);
        const siguiente = filas[idx + (e.key === "ArrowDown" ? 1 : -1)] as HTMLElement;
        siguiente?.focus();
      }
    },
    [guardar.isPending],
  );

  // Auto-save cuando se escribe observación
  const [autoSaveTimer, setAutoSaveTimer] = useState<NodeJS.Timeout | null>(null);
  useEffect(() => {
    if (editando && observacion.trim().length > 0 && observacion !== item.observacion) {
      if (autoSaveTimer) clearTimeout(autoSaveTimer);
      const timer = setTimeout(() => {
        if (observacion.trim()) {
          guardar.mutate({ estado: editando, observacion });
        }
      }, 2000);
      setAutoSaveTimer(timer);
    }
    return () => {
      if (autoSaveTimer) clearTimeout(autoSaveTimer);
    };
  }, [observacion, editando]);

  const puedeGuardarObservacion = editando !== null && observacion.trim().length > 0;

  return (
    <li
      ref={filaRef}
      id={`act-${item.actividadId}`}
      data-fila-checklist
      tabIndex={0}
      onKeyDown={handleKeyDown}
      className={cn(
        "surface bg-card scroll-mt-20 rounded-xl border p-3.5",
        !item.actividadActiva && "opacity-70",
        item.estado === "Ok" && "border-l-ok border-l-2",
        item.estado === "Advertencia" && "border-l-warn border-l-2",
        (item.estado === "Falla" || item.estado === "Critico") && "border-l-danger border-l-2",
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
            <p className="text-muted-foreground num mt-0.5 flex items-center gap-1 font-mono text-xs">
              <Clock className="size-3" />
              {item.actualizadoPor ?? item.revisadoPor} ·{" "}
              {fmtFecha(item.actualizadoEn ?? item.revisadoEn, "d MMM, HH:mm")}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          {guardadoOk && (
            <span className="flex items-center gap-1 text-xs text-ok">
              <Check className="size-3.5" /> Guardado
            </span>
          )}
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
          onEditar={() => {
            setEditando(item.estado!);
            setTimeout(() => textareaRef.current?.focus(), 50);
          }}
        />
      )}

      {editando !== null && (
        <div className="mt-3 space-y-2 border-t pt-3">
          <label htmlFor={`obs-${item.actividadId}`} className="eyebrow flex items-center gap-2 block">
            <span>Qué pasó (obligatorio para </span>
            <span className="font-medium text-warn">{editando === "Critico" ? "Crítico" : editando}</span>
            <span>)</span>
            {autoSaveTimer && observacion.trim() && (
              <span className="text-muted-foreground text-xs flex items-center gap-1">
                <Loader2 className="size-3 animate-spin" /> Guardando en 2s...
              </span>
            )}
          </label>
          <textarea
            ref={textareaRef}
            id={`obs-${item.actividadId}`}
            value={observacion}
            onChange={(e) => setObservacion(e.target.value)}
            maxLength={1000}
            rows={3}
            className="bg-background w-full resize-y rounded-lg border px-3 py-2 text-sm focus:ring-2 focus:ring-primary/50"
            placeholder="Describe la incidencia… (Enter para guardar automáticamente)"
            onKeyDown={(e) => {
              if (e.key === "Enter" && e.ctrlKey && puedeGuardarObservacion) {
                guardar.mutate({ estado: editando, observacion });
              }
              if (e.key === "Escape") {
                setEditando(null);
                setObservacion(item.observacion ?? "");
                guardar.reset();
              }
            }}
          />
          {guardar.error && (
            <p role="alert" className="bg-danger-soft text-danger rounded-md px-2.5 py-1.5 text-xs">
              {guardar.error instanceof ErrorBitacora
                ? guardar.error.message
                : "No se pudo guardar."}
            </p>
          )}
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground text-xs">
              Ctrl+Enter para guardar rápido · Esc para cancelar
            </span>
            <div className="flex gap-2">
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
                <X className="size-4" /> Cancelar
              </Button>
              <Button
                type="button"
                size="sm"
                disabled={!puedeGuardarObservacion || guardar.isPending}
                onClick={() => guardar.mutate({ estado: editando, observacion })}
              >
                {guardar.isPending ? <Loader2 className="animate-spin" /> : <Check className="size-4" />} 
                Guardar
              </Button>
            </div>
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
