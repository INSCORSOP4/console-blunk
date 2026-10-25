"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, ArrowRight, Loader2, Search, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ApiError } from "@/lib/api/client";
import { useTrabajadorFortia } from "@/lib/api/queries";
import type { UsuarioMicrosip } from "@/lib/api/utilerias-schemas";
import {
  compararConFortia,
  ErrorGuardado,
  excedeLimites,
  guardarClaveFortia,
  parsearClave,
  usuariosConClave,
} from "@/lib/utilerias/microsip";
import { cn } from "@/lib/utils";

type Props = {
  usuario: UsuarioMicrosip;
  todos: UsuarioMicrosip[];
  onCerrar: () => void;
};

/**
 * Editor de la clave de FORTIA de un usuario de MICROSIP. Flujo: escribir la clave → "Buscar" (consulta FORTIA) →
 * revisar lo que cambiaría → "Guardar en MICROSIP". Lo que se guarda lo toma el servidor de FORTIA, no esta pantalla.
 */
export function EditorMicrosip({ usuario, todos, onCerrar }: Props) {
  const queryClient = useQueryClient();
  const dialogo = useRef<HTMLDialogElement>(null);
  const [texto, setTexto] = useState(usuario.claveFortia ?? "");
  const [buscada, setBuscada] = useState<number | null>(null);
  const claveEscrita = parsearClave(texto);

  const trabajador = useTrabajadorFortia(buscada);
  const hayPrevia = trabajador.data && buscada === claveEscrita; // la vista previa corresponde a lo que está escrito

  useEffect(() => {
    const d = dialogo.current;
    if (d && !d.open) d.showModal();
  }, []);

  const guardar = useMutation({
    mutationFn: () => guardarClaveFortia(usuario.usuarioId, buscada!),
    onSuccess: async () => {
      toast.success(`Datos de ${usuario.nombre} guardados en MICROSIP.`);
      await queryClient.invalidateQueries({ queryKey: ["utilerias", "microsip"] });
      onCerrar();
    },
  });

  const cambios = useMemo(
    () => (hayPrevia ? compararConFortia(usuario, trabajador.data!) : []),
    [hayPrevia, usuario, trabajador.data],
  );
  const repetidos = useMemo(
    () => (hayPrevia ? usuariosConClave(todos, trabajador.data!.clave, usuario.usuarioId) : []),
    [hayPrevia, todos, trabajador.data, usuario.usuarioId],
  );
  const largos = hayPrevia ? excedeLimites(trabajador.data!) : [];
  const sinCambios = hayPrevia && usuario.tieneDatosAdicionales && cambios.every((c) => !c.cambia);
  const noExiste =
    trabajador.error instanceof ApiError &&
    trabajador.error.status === 404 &&
    buscada === claveEscrita;
  const puedeGuardar =
    Boolean(hayPrevia) && largos.length === 0 && !sinCambios && !guardar.isPending;

  const errorGuardar = guardar.error
    ? guardar.error instanceof ErrorGuardado
      ? guardar.error.message
      : "No se pudo guardar."
    : null;

  return (
    <dialog
      ref={dialogo}
      onClose={onCerrar}
      onCancel={(e) => guardar.isPending && e.preventDefault()}
      aria-labelledby="editor-titulo"
      className="bg-card text-card-foreground m-auto w-[min(40rem,calc(100vw-2rem))] rounded-2xl border p-0 shadow-2xl backdrop:bg-black/60"
    >
      <form
        method="dialog"
        onSubmit={(e) => {
          e.preventDefault();
          if (claveEscrita !== null) setBuscada(claveEscrita);
        }}
        className="max-h-[calc(100dvh-2rem)] overflow-y-auto p-6"
      >
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="eyebrow mb-1">Usuario MICROSIP</p>
            <h2 id="editor-titulo" className="font-display text-xl font-semibold break-words">
              {usuario.nombre}
            </h2>
            <p className="text-muted-foreground mt-1 text-sm">
              {usuario.activo ? "Activo" : "Dado de baja"}
              {usuario.tieneDatosAdicionales ? "" : " · sin datos adicionales todavía"}
            </p>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label="Cerrar"
            onClick={() => dialogo.current?.close()}
            disabled={guardar.isPending}
          >
            <X />
          </Button>
        </div>

        <div className="mt-6">
          <label htmlFor="clave-fortia" className="eyebrow mb-1.5 block">
            Clave de FORTIA
          </label>
          <div className="flex gap-2">
            <Input
              id="clave-fortia"
              inputMode="numeric"
              autoComplete="off"
              autoFocus
              maxLength={9}
              value={texto}
              onChange={(e) => {
                setTexto(e.target.value.replace(/\s/g, ""));
                guardar.reset();
              }}
              aria-invalid={texto.trim() !== "" && claveEscrita === null}
              aria-describedby="clave-ayuda"
              disabled={guardar.isPending}
              className="font-mono"
            />
            <Button
              type="submit"
              variant="outline"
              disabled={claveEscrita === null || trabajador.isFetching || guardar.isPending}
            >
              {trabajador.isFetching ? <Loader2 className="animate-spin" /> : <Search />} Buscar
            </Button>
          </div>
          <p
            id="clave-ayuda"
            className={cn(
              "mt-1.5 text-xs",
              texto.trim() !== "" && claveEscrita === null
                ? "text-danger"
                : "text-muted-foreground",
            )}
          >
            {texto.trim() !== "" && claveEscrita === null
              ? "Solo números, hasta 9 dígitos."
              : "Busca al trabajador en FORTIA y revisa los datos antes de guardar."}
          </p>
        </div>

        <div aria-live="polite" className="mt-5 space-y-4">
          {noExiste && (
            <p role="alert" className="bg-warn-soft text-warn rounded-md px-3 py-2.5 text-sm">
              No existe ningún trabajador con la clave {buscada} en FORTIA.
            </p>
          )}
          {trabajador.error && !noExiste && (
            <p role="alert" className="bg-danger-soft text-danger rounded-md px-3 py-2.5 text-sm">
              {trabajador.error instanceof Error
                ? trabajador.error.message
                : "No se pudo consultar FORTIA."}
            </p>
          )}

          {hayPrevia && (
            <section aria-label="Lo que se guardará">
              <h3 className="eyebrow mb-2">Lo que se guardará en MICROSIP</h3>
              <dl className="divide-y rounded-xl border text-sm">
                {cambios.map((c) => (
                  <div
                    key={c.campo}
                    className="grid gap-1 px-3 py-2.5 sm:grid-cols-[8rem_minmax(0,1fr)] sm:gap-3"
                  >
                    <dt className="text-muted-foreground">{c.campo}</dt>
                    <dd className="min-w-0 break-words">
                      {c.cambia ? (
                        <span className="flex flex-wrap items-center gap-x-2">
                          {c.antes && (
                            <>
                              <span className="text-muted-foreground line-through">{c.antes}</span>
                              <ArrowRight className="text-muted-foreground size-3.5" aria-hidden />
                            </>
                          )}
                          <span className="text-ok font-medium">{c.despues || "(vacío)"}</span>
                        </span>
                      ) : (
                        <span>{c.despues || "(vacío)"}</span>
                      )}
                    </dd>
                  </div>
                ))}
              </dl>
              {sinCambios && (
                <p className="text-muted-foreground mt-2 text-sm">
                  Ya está igual que en FORTIA: no hay nada que guardar.
                </p>
              )}
            </section>
          )}

          {repetidos.length > 0 && (
            <p
              role="note"
              className="bg-warn-soft text-warn flex items-start gap-2 rounded-md px-3 py-2.5 text-sm"
            >
              <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden />
              <span>
                Esta clave ya la tiene{repetidos.length === 1 ? "" : "n"}:{" "}
                <strong>{repetidos.map((r) => r.nombre).join(", ")}</strong>. Puedes guardarla
                igualmente si es correcto.
              </span>
            </p>
          )}
          {!usuario.activo && hayPrevia && (
            <p role="note" className="bg-warn-soft text-warn rounded-md px-3 py-2.5 text-sm">
              Este usuario está dado de baja en MICROSIP.
            </p>
          )}
          {largos.length > 0 && (
            <p role="alert" className="bg-danger-soft text-danger rounded-md px-3 py-2.5 text-sm">
              {largos.join(", ")} de FORTIA supera{largos.length === 1 ? "" : "n"} el largo que
              admite MICROSIP; no se puede guardar.
            </p>
          )}
          {errorGuardar && (
            <p role="alert" className="bg-danger-soft text-danger rounded-md px-3 py-2.5 text-sm">
              {errorGuardar}
            </p>
          )}
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-end gap-2">
          <Button
            type="button"
            variant="ghost"
            onClick={() => dialogo.current?.close()}
            disabled={guardar.isPending}
          >
            Cancelar
          </Button>
          <Button type="button" onClick={() => guardar.mutate()} disabled={!puedeGuardar}>
            {guardar.isPending ? (
              <>
                <Loader2 className="animate-spin" /> Guardando…
              </>
            ) : (
              "Guardar en MICROSIP"
            )}
          </Button>
        </div>
      </form>
    </dialog>
  );
}
