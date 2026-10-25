"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowDown, ArrowUp, Loader2, Pencil, Plus, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState, ErrorState } from "@/components/shared/states";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import type { ActividadBitacora } from "@/lib/api/bitacora-schemas";
import { useActividadesBitacora } from "@/lib/api/queries";
import { actualizarActividad, crearActividad, ErrorBitacora } from "@/lib/bitacora/mutaciones";
import { articuloSingular, preposicionSingular, type ConfigBitacora } from "@/lib/bitacora/grupos";
import { cn } from "@/lib/utils";
import { BitacoraSubnav } from "./subnav";

export function CatalogoView({ config }: { config: ConfigBitacora }) {
  const queryClient = useQueryClient();
  const q = useActividadesBitacora(config.grupo, true);
  const lista = q.data ?? [];

  const invalidar = () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: ["bitacora", "actividades"] }),
      queryClient.invalidateQueries({ queryKey: ["bitacora", "checklist"] }),
    ]);

  const crear = useMutation({
    mutationFn: (nombre: string) => crearActividad(config.grupo, nombre),
    onSuccess: async (creada) => {
      toast.success(`Se agregó: ${creada.nombre}.`);
      await invalidar();
    },
  });

  const actualizar = useMutation({
    mutationFn: (vars: { id: number; cambios: Parameters<typeof actualizarActividad>[1] }) =>
      actualizarActividad(vars.id, vars.cambios),
    onSuccess: async () => invalidar(),
    onError: (error) =>
      toast.error(error instanceof ErrorBitacora ? error.message : "No se pudo guardar el cambio."),
  });

  function mover(actividad: ActividadBitacora, direccion: -1 | 1) {
    const ordenada = [...lista].sort(
      (a, b) => a.orden - b.orden || a.nombre.localeCompare(b.nombre, "es"),
    );
    const i = ordenada.findIndex((a) => a.actividadId === actividad.actividadId);
    const vecino = ordenada[i + direccion];
    if (!vecino) return;
    actualizar.mutate({ id: actividad.actividadId, cambios: { orden: vecino.orden } });
    actualizar.mutate({ id: vecino.actividadId, cambios: { orden: actividad.orden } });
  }

  return (
    <>
      <PageHeader
        eyebrow="Bitácora"
        title={`Catálogo de ${config.nombrePlural}`}
        description={`Lo que se revisa cada día en el checklist de ${config.titulo.toLowerCase()}. Agrega, renombra, desactiva o reordena sin tocar código.`}
      />
      <BitacoraSubnav rutaBase={config.rutaBase} nombrePlural={config.nombrePlural} />

      <FormularioNuevaActividad
        config={config}
        onCrear={(nombre) => crear.mutate(nombre)}
        pendiente={crear.isPending}
        error={crear.error instanceof ErrorBitacora ? crear.error.message : null}
      />

      {q.error && !q.data ? (
        <ErrorState error={q.error} onRetry={() => q.refetch()} />
      ) : q.isPending ? (
        <div className="mt-4 space-y-2">
          {Array.from({ length: 6 }, (_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      ) : lista.length === 0 ? (
        <EmptyState
          title={`Todavía no hay ${config.nombrePlural}`}
          hint={`Agrega ${articuloSingular(config) === "la" ? "la primera" : "el primero"} con el formulario de arriba.`}
        />
      ) : (
        <ul className="mt-4 space-y-1.5">
          {[...lista]
            .sort((a, b) => a.orden - b.orden || a.nombre.localeCompare(b.nombre, "es"))
            .map((actividad, i, arr) => (
              <FilaActividad
                key={actividad.actividadId}
                actividad={actividad}
                esPrimera={i === 0}
                esUltima={i === arr.length - 1}
                onMover={(dir) => mover(actividad, dir)}
                onGuardar={(cambios) => actualizar.mutate({ id: actividad.actividadId, cambios })}
                guardando={
                  actualizar.isPending && actualizar.variables?.id === actividad.actividadId
                }
              />
            ))}
        </ul>
      )}
    </>
  );
}

function FormularioNuevaActividad({
  config,
  onCrear,
  pendiente,
  error,
}: {
  config: ConfigBitacora;
  onCrear: (nombre: string) => void;
  pendiente: boolean;
  error: string | null;
}) {
  const [nombre, setNombre] = useState("");
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const limpio = nombre.trim();
        if (limpio) {
          onCrear(limpio);
          setNombre("");
        }
      }}
      className="surface bg-card flex flex-wrap items-end gap-2 rounded-xl border p-3"
    >
      <label className="min-w-[14rem] flex-1">
        <span className="eyebrow mb-1 block">Agregar {config.nombreSingular}</span>
        <Input
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          maxLength={200}
          placeholder={`Nombre ${preposicionSingular(config)} ${config.nombreSingular}…`}
        />
      </label>
      <Button type="submit" disabled={!nombre.trim() || pendiente}>
        {pendiente ? <Loader2 className="animate-spin" /> : <Plus />} Agregar
      </Button>
      {error && (
        <p role="alert" className="text-danger basis-full text-sm">
          {error}
        </p>
      )}
    </form>
  );
}

function FilaActividad({
  actividad,
  esPrimera,
  esUltima,
  onMover,
  onGuardar,
  guardando,
}: {
  actividad: ActividadBitacora;
  esPrimera: boolean;
  esUltima: boolean;
  onMover: (direccion: -1 | 1) => void;
  onGuardar: (cambios: { nombre?: string; activa?: boolean }) => void;
  guardando: boolean;
}) {
  const [editando, setEditando] = useState(false);
  const [nombre, setNombre] = useState(actividad.nombre);

  return (
    <li
      className={cn(
        "surface bg-card flex items-center gap-2 rounded-xl border p-2.5",
        !actividad.activa && "opacity-60",
      )}
    >
      <div className="flex flex-col">
        <button
          type="button"
          onClick={() => onMover(-1)}
          disabled={esPrimera || guardando}
          aria-label="Subir"
          className="text-muted-foreground hover:text-foreground disabled:opacity-30"
        >
          <ArrowUp className="size-3.5" />
        </button>
        <button
          type="button"
          onClick={() => onMover(1)}
          disabled={esUltima || guardando}
          aria-label="Bajar"
          className="text-muted-foreground hover:text-foreground disabled:opacity-30"
        >
          <ArrowDown className="size-3.5" />
        </button>
      </div>

      {editando ? (
        <form
          className="flex flex-1 items-center gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            const limpio = nombre.trim();
            if (limpio && limpio !== actividad.nombre) onGuardar({ nombre: limpio });
            setEditando(false);
          }}
        >
          <Input
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            maxLength={200}
            autoFocus
            className="h-8 flex-1"
          />
          <Button type="submit" size="sm" disabled={!nombre.trim()}>
            Guardar
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={() => {
              setNombre(actividad.nombre);
              setEditando(false);
            }}
            aria-label="Cancelar"
          >
            <X />
          </Button>
        </form>
      ) : (
        <>
          <span className="flex-1 truncate text-sm">{actividad.nombre}</span>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={() => setEditando(true)}
            aria-label={`Renombrar ${actividad.nombre}`}
          >
            <Pencil />
          </Button>
          <label className="flex items-center gap-1.5 text-xs">
            <input
              type="checkbox"
              checked={actividad.activa}
              disabled={guardando}
              onChange={(e) => onGuardar({ activa: e.target.checked })}
              className="size-4"
            />
            <span className="text-muted-foreground">Activa</span>
          </label>
        </>
      )}
    </li>
  );
}
