"use client";

import { ChevronLeft, ChevronRight, Search, UploadCloud, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState, ErrorState } from "@/components/shared/states";
import { TourButton } from "@/components/shared/tour-button";
import { buttonVariants, Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useCarpetasKb, useDocumentos, useEtiquetasKb } from "@/lib/api/queries";
import { fmtNum } from "@/lib/format";
import { armarArbol } from "@/lib/kb/arbol";
import type { DriveStep } from "@/lib/tour/driver";
import { cn } from "@/lib/utils";
import { ArbolDeCarpetas } from "./arbol-carpetas";
import { KbSubnav } from "./subnav";
import { TarjetaNota } from "./tarjeta-nota";
import { useKbFilters, type OrdenKb } from "./use-kb-filters";

const PASOS_TOUR: DriveStep[] = [
  {
    element: '[data-tour="buscar"]',
    popover: {
      title: "Buscar",
      description: "Busca en el título, el contenido y las etiquetas de todas las notas.",
    },
  },
  {
    element: '[data-tour="carpetas"]',
    popover: {
      title: "Carpetas",
      description:
        "Navega por la misma estructura de carpetas con la que se subieron los archivos .md.",
    },
  },
  {
    element: '[data-tour="subir"]',
    popover: {
      title: "Subir notas",
      description:
        "Sube un .zip o varios archivos .md de Obsidian. Queda registrado en Importaciones, incluso si algo falla.",
    },
  },
  {
    element: '[data-tour="resultados"]',
    popover: {
      title: "Resultados",
      description: "Haz clic en una nota para leerla con su formato y sus enlaces a otras notas.",
    },
  },
];

export function ConocimientoView() {
  const { filters, setFilters, reset, activos, paramsApi } = useKbFilters();
  const docs = useDocumentos(paramsApi);
  const carpetas = useCarpetasKb();
  const etiquetas = useEtiquetasKb();
  const arbol = useMemo(() => armarArbol(carpetas.data ?? []), [carpetas.data]);

  // El texto se escribe en local y se aplica a la URL tras una pausa para no consultar en cada tecla.
  const [texto, setTexto] = useState(filters.buscar);
  const [previo, setPrevio] = useState(filters.buscar);
  if (filters.buscar !== previo) {
    setPrevio(filters.buscar);
    setTexto(filters.buscar);
  }
  useEffect(() => {
    if (texto === filters.buscar) return;
    const t = setTimeout(() => setFilters({ buscar: texto.trim() }), 350);
    return () => clearTimeout(t);
  }, [texto, filters.buscar, setFilters]);

  const sinNotas = !docs.isPending && !docs.error && docs.data?.totalCount === 0 && activos === 0;

  return (
    <>
      <PageHeader
        eyebrow="Base de conocimiento"
        title="Conocimiento"
        description="La documentación del equipo en un solo lugar: busca, navega por carpetas y sigue los enlaces entre notas."
        actions={
          <>
            <Link data-tour="subir" href="/conocimiento/subir" className={cn(buttonVariants())}>
              <UploadCloud /> Subir notas
            </Link>
            <TourButton pasos={PASOS_TOUR} />
          </>
        }
      />
      <KbSubnav />

      <div className="grid gap-6 lg:grid-cols-[17rem_minmax(0,1fr)]">
        {/* ----------------------------------------------------------- filtros */}
        <aside className="space-y-6 lg:sticky lg:top-6 lg:self-start" aria-label="Filtros">
          <label data-tour="buscar" className="block">
            <span className="eyebrow mb-1.5 block">Buscar</span>
            <span className="relative block">
              <Search
                className="text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2"
                aria-hidden
              />
              <Input
                type="search"
                value={texto}
                onChange={(e) => setTexto(e.target.value)}
                placeholder="Título, contenido, etiqueta…"
                maxLength={200}
                className="pl-8"
              />
            </span>
          </label>

          <section data-tour="carpetas" aria-labelledby="titulo-carpetas">
            <h2 id="titulo-carpetas" className="eyebrow mb-2">
              Carpetas
            </h2>
            {carpetas.isPending ? (
              <div className="space-y-1.5">
                {Array.from({ length: 5 }, (_, i) => (
                  <Skeleton key={i} className="h-8 w-full" />
                ))}
              </div>
            ) : (
              <ArbolDeCarpetas
                arbol={arbol}
                seleccionada={filters.carpeta}
                onSeleccionar={(carpeta) => setFilters({ carpeta })}
              />
            )}
          </section>

          {(etiquetas.data?.length ?? 0) > 0 && (
            <section aria-labelledby="titulo-etiquetas">
              <h2 id="titulo-etiquetas" className="eyebrow mb-2">
                Etiquetas
              </h2>
              <ul className="flex flex-wrap gap-1.5">
                {etiquetas.data!.slice(0, 24).map((e) => {
                  const activa = filters.etiqueta === e.nombre;
                  return (
                    <li key={e.nombre}>
                      <button
                        type="button"
                        aria-pressed={activa}
                        onClick={() => setFilters({ etiqueta: activa ? "" : e.nombre })}
                        className={cn(
                          "touch-target rounded-full border px-2.5 py-1 font-mono text-xs transition-colors",
                          activa
                            ? "border-signal bg-signal-soft text-signal"
                            : "text-muted-foreground hover:text-foreground",
                        )}
                      >
                        #{e.nombre} <span className="num opacity-70">{e.documentos}</span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </section>
          )}
        </aside>

        {/* ----------------------------------------------------------- resultados */}
        <section
          data-tour="resultados"
          aria-label="Resultados"
          aria-live="polite"
          className="min-w-0"
        >
          {docs.error && !docs.data ? (
            <ErrorState error={docs.error} onRetry={() => docs.refetch()} />
          ) : docs.isPending ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }, (_, i) => (
                <Skeleton key={i} className="h-28 w-full" />
              ))}
            </div>
          ) : sinNotas ? (
            <div className="space-y-4">
              <EmptyState
                title="Todavía no hay notas"
                hint="Sube tus archivos .md de Obsidian para empezar la base de conocimiento."
              />
              <div className="flex justify-center">
                <Link href="/conocimiento/subir" className={cn(buttonVariants())}>
                  <UploadCloud /> Subir notas
                </Link>
              </div>
            </div>
          ) : (
            <>
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <p className="num text-muted-foreground font-mono text-sm">
                  {fmtNum(docs.data.totalCount)} {docs.data.totalCount === 1 ? "nota" : "notas"}
                  {filters.carpeta && (
                    <>
                      {" "}
                      en <span className="text-foreground">{filters.carpeta}</span>
                    </>
                  )}
                  {filters.etiqueta && (
                    <>
                      {" "}
                      con <span className="text-foreground">#{filters.etiqueta}</span>
                    </>
                  )}
                </p>
                <div className="flex items-center gap-2">
                  {activos > 0 && (
                    <Button variant="ghost" size="sm" onClick={reset}>
                      <X /> Limpiar
                    </Button>
                  )}
                  <label className="flex items-center gap-2 text-sm">
                    <span className="text-muted-foreground">Orden</span>
                    <select
                      value={filters.orden}
                      onChange={(e) => setFilters({ orden: e.target.value as OrdenKb })}
                      className="bg-background h-8 rounded-lg border px-2 text-sm"
                    >
                      <option value="Recientes">Más recientes</option>
                      <option value="Titulo">Título (A–Z)</option>
                    </select>
                  </label>
                </div>
              </div>

              {docs.data.items.length === 0 ? (
                <EmptyState
                  title="Ninguna nota coincide"
                  hint="Prueba con otras palabras o quita algún filtro."
                />
              ) : (
                <ul
                  className={cn(
                    "space-y-3 transition-opacity",
                    docs.isPlaceholderData && "opacity-60",
                  )}
                  aria-busy={docs.isPlaceholderData}
                >
                  {docs.data.items.map((nota) => (
                    <TarjetaNota
                      key={nota.id}
                      nota={nota}
                      buscar={filters.buscar}
                      onEtiqueta={(etiqueta) => setFilters({ etiqueta })}
                    />
                  ))}
                </ul>
              )}

              {docs.data.totalPages > 1 && (
                <nav
                  aria-label="Paginación"
                  className="mt-5 flex items-center justify-between gap-3"
                >
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={docs.data.page <= 1}
                    onClick={() => setFilters({ page: docs.data.page - 1 })}
                  >
                    <ChevronLeft /> Anterior
                  </Button>
                  <span className="num font-mono text-xs">
                    {docs.data.page} / {fmtNum(docs.data.totalPages)}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={docs.data.page >= docs.data.totalPages}
                    onClick={() => setFilters({ page: docs.data.page + 1 })}
                  >
                    Siguiente <ChevronRight />
                  </Button>
                </nav>
              )}
            </>
          )}
        </section>
      </div>
    </>
  );
}
