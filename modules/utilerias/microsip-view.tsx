"use client";

import { CheckCircle2, CircleAlert, Pencil, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState, ErrorState } from "@/components/shared/states";
import { TourButton } from "@/components/shared/tour-button";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useCambiosMicrosip, useUsuariosMicrosip } from "@/lib/api/queries";
import type { CambioMicrosip, UsuarioMicrosip } from "@/lib/api/utilerias-schemas";
import { fmtFecha, fmtNum } from "@/lib/format";
import type { DriveStep } from "@/lib/tour/driver";
import { contarUsuarios, filtrarUsuarios, type FiltroUsuarios } from "@/lib/utilerias/microsip";
import { cn } from "@/lib/utils";
import { EditorMicrosip } from "./microsip-editor";

const FILTROS: { id: FiltroUsuarios; texto: string }[] = [
  { id: "activos", texto: "Activos" },
  { id: "sinClave", texto: "Sin clave" },
  { id: "baja", texto: "Baja" },
  { id: "todos", texto: "Todos" },
];

const PASOS_TOUR: DriveStep[] = [
  {
    element: '[data-tour="pestanas"]',
    popover: {
      title: "Vistas",
      description:
        "Cambia entre la lista de usuarios y la bitácora de cambios (quién modificó qué y cuándo).",
    },
  },
  {
    element: '[data-tour="resumen"]',
    popover: {
      title: "Resumen",
      description: "Cuántos usuarios de MICROSIP tienen clave de FORTIA asignada.",
    },
  },
  {
    element: '[data-tour="lista"]',
    popover: {
      title: "Usuarios",
      description:
        "Asigna o edita la clave de FORTIA de un usuario. Nombre, empresa y puesto se traen automáticamente de FORTIA al guardar.",
    },
  },
];

export function MicrosipView() {
  const [vista, setVista] = useState<"usuarios" | "bitacora">("usuarios");
  const [filtro, setFiltro] = useState<FiltroUsuarios>("activos");
  const [buscar, setBuscar] = useState("");
  const [editando, setEditando] = useState<UsuarioMicrosip | null>(null);

  const usuarios = useUsuariosMicrosip();
  const lista = useMemo(() => usuarios.data ?? [], [usuarios.data]);
  const conteo = useMemo(() => contarUsuarios(lista), [lista]);
  const visibles = useMemo(() => filtrarUsuarios(lista, filtro, buscar), [lista, filtro, buscar]);

  return (
    <>
      <PageHeader
        eyebrow="Utilerías"
        title="Usuarios MICROSIP"
        description="Asigna a cada usuario de MICROSIP su clave de FORTIA. Nombre, empresa y puesto se toman de FORTIA al guardar, y cada cambio queda en la bitácora."
        actions={<TourButton pasos={PASOS_TOUR} />}
      />

      <div
        data-tour="pestanas"
        role="tablist"
        aria-label="Vista"
        className="mb-6 flex gap-1 border-b"
      >
        {(
          [
            ["usuarios", "Usuarios"],
            ["bitacora", "Bitácora de cambios"],
          ] as const
        ).map(([id, texto]) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={vista === id}
            onClick={() => setVista(id)}
            className={cn(
              "touch-target -mb-px border-b-2 border-transparent px-3 text-sm font-medium transition-colors",
              vista === id
                ? "border-signal text-foreground"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {texto}
          </button>
        ))}
      </div>

      {vista === "bitacora" ? (
        <Bitacora />
      ) : usuarios.error && !usuarios.data ? (
        <ErrorState error={usuarios.error} onRetry={() => usuarios.refetch()} />
      ) : usuarios.isPending ? (
        <div className="space-y-2">
          {Array.from({ length: 6 }, (_, i) => (
            <Skeleton key={i} className="h-14 w-full" />
          ))}
        </div>
      ) : (
        <div className="space-y-5">
          <dl data-tour="resumen" className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {[
              ["Activos", conteo.activos, ""],
              ["Con clave", conteo.conClave, "text-ok"],
              [
                "Sin clave",
                conteo.sinClave,
                conteo.sinClave > 0 ? "text-warn" : "text-muted-foreground",
              ],
              ["Baja", conteo.baja, "text-muted-foreground"],
            ].map(([nombre, valor, color]) => (
              <div key={nombre as string} className="surface bg-card rounded-xl border p-3">
                <dt className="eyebrow">{nombre}</dt>
                <dd className={cn("num font-display mt-1 text-3xl font-semibold", color as string)}>
                  {fmtNum(valor as number)}
                </dd>
              </div>
            ))}
          </dl>

          <div className="flex flex-wrap items-center gap-3">
            <label className="relative block w-full max-w-sm">
              <span className="sr-only">Buscar usuario</span>
              <Search
                className="text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2"
                aria-hidden
              />
              <Input
                type="search"
                value={buscar}
                onChange={(e) => setBuscar(e.target.value)}
                placeholder="Nombre, clave, empresa o puesto…"
                maxLength={100}
                className="pl-8"
              />
            </label>
            <div role="group" aria-label="Estado" className="flex rounded-lg border p-0.5 text-sm">
              {FILTROS.map((f) => (
                <button
                  key={f.id}
                  type="button"
                  aria-pressed={filtro === f.id}
                  onClick={() => setFiltro(f.id)}
                  className={cn(
                    "touch-target rounded-md px-3 py-1.5 transition-colors",
                    filtro === f.id
                      ? "bg-accent text-foreground font-medium"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {f.texto}
                </button>
              ))}
            </div>
            <p className="text-muted-foreground num ml-auto font-mono text-xs">
              {fmtNum(visibles.length)} usuarios
            </p>
          </div>

          <div data-tour="lista">
            {visibles.length === 0 ? (
              <EmptyState title="Ningún usuario coincide" hint="Cambia el filtro o la búsqueda." />
            ) : (
              <ul className="space-y-2">
                {visibles.map((u) => (
                  <FilaUsuario key={u.usuarioId} usuario={u} onEditar={() => setEditando(u)} />
                ))}
              </ul>
            )}
          </div>
        </div>
      )}

      {editando && (
        <EditorMicrosip
          key={editando.usuarioId}
          usuario={editando}
          todos={lista}
          onCerrar={() => setEditando(null)}
        />
      )}
    </>
  );
}

function FilaUsuario({ usuario: u, onEditar }: { usuario: UsuarioMicrosip; onEditar: () => void }) {
  return (
    <li
      className={cn(
        "surface bg-card grid items-center gap-x-4 gap-y-2 rounded-xl border p-3 sm:grid-cols-[minmax(0,1.2fr)_minmax(0,2fr)_auto]",
        !u.activo && "opacity-70",
      )}
    >
      <div className="min-w-0">
        <p className="truncate font-medium" title={u.nombre}>
          {u.nombre}
        </p>
        <p className="text-muted-foreground font-mono text-xs">{u.activo ? "Activo" : "Baja"}</p>
      </div>

      <div className="min-w-0 text-sm">
        {u.claveFortia ? (
          <>
            <p className="flex flex-wrap items-center gap-x-2">
              <CheckCircle2 className="text-ok size-4 shrink-0" aria-hidden />
              <span className="num font-mono">{u.claveFortia}</span>
              <span className="truncate">{u.nombreUsuario}</span>
            </p>
            <p className="text-muted-foreground truncate text-xs">
              {[u.empresa, u.puesto].filter(Boolean).join(" · ") || "—"}
            </p>
          </>
        ) : (
          <p
            className={cn(
              "flex items-center gap-2",
              u.activo ? "text-warn" : "text-muted-foreground",
            )}
          >
            <CircleAlert className="size-4 shrink-0" aria-hidden /> Sin clave de FORTIA
          </p>
        )}
      </div>

      <Button
        variant="outline"
        size="sm"
        onClick={onEditar}
        aria-label={`${u.claveFortia ? "Editar" : "Asignar"} clave de ${u.nombre}`}
      >
        <Pencil /> {u.claveFortia ? "Editar" : "Asignar"}
      </Button>
    </li>
  );
}

const ESTILO_RESULTADO: Record<CambioMicrosip["resultado"], string> = {
  Aplicado: "bg-ok-soft text-ok",
  Pendiente: "bg-info-soft text-info",
  NoVerificado: "bg-warn-soft text-warn",
  Fallido: "bg-danger-soft text-danger",
};

function Bitacora() {
  const q = useCambiosMicrosip(true);
  if (q.error && !q.data) return <ErrorState error={q.error} onRetry={() => q.refetch()} />;
  if (q.isPending) return <Skeleton className="h-48 w-full" />;
  if (q.data.length === 0)
    return (
      <EmptyState title="Aún no hay cambios" hint="Aquí aparecerá quién cambió qué en MICROSIP." />
    );

  return (
    <ul className="space-y-2">
      {q.data.map((c) => (
        <li key={c.id} className="surface bg-card rounded-xl border p-3 text-sm">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <span
              className={cn(
                "rounded-full px-2.5 py-0.5 text-xs font-medium",
                ESTILO_RESULTADO[c.resultado],
              )}
            >
              {c.resultado === "NoVerificado" ? "No verificado" : c.resultado}
            </span>
            <span className="font-medium">{c.microsipNombre}</span>
            <span className="text-muted-foreground">
              {c.accion === "Insertar" ? "alta de datos" : "actualización"}
            </span>
            <span className="text-muted-foreground num ml-auto font-mono text-xs">
              {fmtFecha(c.fecha, "d MMM yyyy, HH:mm")}
            </span>
          </div>
          <p className="text-muted-foreground mt-1 text-xs">
            Por {c.usuarioNombre} ({c.usuarioEmail})
          </p>
          <details className="mt-2">
            <summary className="text-signal cursor-pointer text-xs">Ver datos</summary>
            <div className="mt-2 grid gap-2 sm:grid-cols-2">
              <pre className="bg-muted/50 overflow-auto rounded-md border p-2 font-mono text-xs break-words whitespace-pre-wrap">
                Antes: {c.antes ?? "(sin datos)"}
              </pre>
              <pre className="bg-muted/50 overflow-auto rounded-md border p-2 font-mono text-xs break-words whitespace-pre-wrap">
                Después: {c.despues}
              </pre>
            </div>
            {c.error && <p className="text-danger mt-2 text-xs">{c.error}</p>}
          </details>
        </li>
      ))}
    </ul>
  );
}
