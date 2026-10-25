"use client";

import {
  ArrowLeft,
  ChevronRight,
  History,
  Link2,
  ListTree,
  ShieldCheck,
  Unlink,
} from "lucide-react";
import Link from "next/link";
import { useMemo } from "react";
import { Markdown } from "@/components/shared/markdown";
import { EmptyState, ErrorState } from "@/components/shared/states";
import { Skeleton } from "@/components/ui/skeleton";
import { ApiError } from "@/lib/api/client";
import { useDocumento } from "@/lib/api/queries";
import { fmtFecha } from "@/lib/format";
import { convertirWikilinks, extraerToc } from "@/lib/kb/markdown";
import { KbSubnav } from "./subnav";

export function DocumentoView({ id }: { id: number }) {
  const { data: nota, error, isPending, refetch } = useDocumento(id);

  // Los [[wikilinks]] se convierten con lo que la API ya resolvió; el índice se calcula sobre el Markdown convertido
  // para que los ids de los encabezados coincidan con los del documento renderizado.
  const markdown = useMemo(
    () => (nota ? convertirWikilinks(nota.contenidoMd, nota.enlaces) : ""),
    [nota],
  );
  const toc = useMemo(() => extraerToc(markdown), [markdown]);
  const rotos = useMemo(() => nota?.enlaces.filter((e) => !e.resuelto) ?? [], [nota]);

  const volver = (
    <Link
      href="/conocimiento"
      className="text-muted-foreground hover:text-foreground mb-6 inline-flex items-center gap-1.5 font-mono text-xs"
    >
      <ArrowLeft className="size-3.5" aria-hidden /> Volver a Conocimiento
    </Link>
  );

  if (error) {
    const noExiste = error instanceof ApiError && error.status === 404;
    return (
      <>
        <KbSubnav />
        {volver}
        {noExiste ? (
          <EmptyState
            title="Esta nota no existe"
            hint="Pudo haberse eliminado o el enlace es incorrecto."
          />
        ) : (
          <ErrorState error={error} onRetry={() => refetch()} />
        )}
      </>
    );
  }

  if (isPending) {
    return (
      <>
        <KbSubnav />
        <Skeleton className="mb-3 h-4 w-48" />
        <Skeleton className="mb-8 h-10 w-2/3" />
        <Skeleton className="h-96 w-full" />
      </>
    );
  }

  const partes = nota.carpeta.split("/").filter(Boolean);

  return (
    <>
      <KbSubnav />

      <nav
        aria-label="Ubicación"
        className="text-muted-foreground mb-4 flex flex-wrap items-center gap-1 font-mono text-xs"
      >
        <Link href="/conocimiento" className="hover:text-foreground">
          Conocimiento
        </Link>
        {partes.map((parte, i) => (
          <span key={i} className="flex items-center gap-1">
            <ChevronRight className="size-3" aria-hidden />
            <Link
              href={`/conocimiento?carpeta=${encodeURIComponent(partes.slice(0, i + 1).join("/"))}`}
              className="hover:text-foreground"
            >
              {parte}
            </Link>
          </span>
        ))}
      </nav>

      <header className="rise mb-8 border-b pb-6">
        <h1 className="title-gradient max-w-4xl text-3xl font-semibold text-balance sm:text-4xl">
          {nota.titulo}
        </h1>

        <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
          {nota.estado && (
            <span className="bg-muted rounded px-2 py-0.5 text-xs">{nota.estado}</span>
          )}
          {nota.etiquetas.map((e) => (
            <Link
              key={e}
              href={`/conocimiento?etiqueta=${encodeURIComponent(e)}`}
              className="bg-signal-soft text-signal rounded-full px-2.5 py-0.5 font-mono text-xs hover:underline"
            >
              #{e}
            </Link>
          ))}
          <span className="text-muted-foreground num font-mono text-xs">
            v{nota.version} · actualizada {fmtFecha(nota.actualizadoEn, "d MMM yyyy, HH:mm")} por{" "}
            {nota.actualizadoPor}
          </span>
        </div>

        {nota.alias.length > 0 && (
          <p className="text-muted-foreground mt-3 text-sm">
            También conocida como: {nota.alias.join(", ")}
          </p>
        )}

        {nota.secretosEnmascarados > 0 && (
          <p
            className="bg-info-soft text-info mt-4 flex items-start gap-2 rounded-md px-3 py-2.5 text-sm"
            role="note"
          >
            <ShieldCheck className="mt-0.5 size-4 shrink-0" aria-hidden />
            Al importar esta nota se ocultaron {nota.secretosEnmascarados} valor
            {nota.secretosEnmascarados === 1 ? "" : "es"} sensible
            {nota.secretosEnmascarados === 1 ? "" : "s"} (contraseñas, tokens…). Si los necesitas,
            consúltalos en el sistema correspondiente.
          </p>
        )}
      </header>

      <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_17rem]">
        <article className="rise max-w-3xl min-w-0" style={{ "--i": 1 } as React.CSSProperties}>
          {markdown.trim() ? (
            <Markdown>{markdown}</Markdown>
          ) : (
            <EmptyState title="Esta nota no tiene contenido" />
          )}
        </article>

        <aside
          className="rise space-y-6 xl:sticky xl:top-6 xl:self-start"
          style={{ "--i": 2 } as React.CSSProperties}
          aria-label="Información de la nota"
        >
          {toc.length > 1 && (
            <Bloque icono={<ListTree className="size-3.5" />} titulo="En esta nota">
              <ul className="space-y-1 text-sm">
                {toc.map((item) => (
                  <li key={item.id} style={{ paddingLeft: item.nivel === 3 ? "0.9rem" : 0 }}>
                    <a
                      href={`#${item.id}`}
                      className="text-muted-foreground hover:text-foreground block truncate py-0.5"
                      title={item.texto}
                    >
                      {item.texto}
                    </a>
                  </li>
                ))}
              </ul>
            </Bloque>
          )}

          {nota.enlazadoDesde.length > 0 && (
            <Bloque
              icono={<Link2 className="size-3.5" />}
              titulo={`Enlazada desde (${nota.enlazadoDesde.length})`}
            >
              <ul className="space-y-1.5 text-sm">
                {nota.enlazadoDesde.map((o) => (
                  <li key={o.id}>
                    <Link
                      href={`/conocimiento/${o.id}`}
                      className="hover:text-signal block truncate hover:underline"
                      title={o.ruta}
                    >
                      {o.titulo}
                    </Link>
                    <span className="text-muted-foreground block truncate font-mono text-xs">
                      {o.carpeta || "Raíz"}
                    </span>
                  </li>
                ))}
              </ul>
            </Bloque>
          )}

          {rotos.length > 0 && (
            <Bloque
              icono={<Unlink className="size-3.5" />}
              titulo={`Enlaces sin destino (${rotos.length})`}
            >
              <p className="text-muted-foreground mb-2 text-xs">
                Estas notas aún no están en la base; el enlace se activará solo cuando las subas.
              </p>
              <ul className="text-danger space-y-1 font-mono text-xs">
                {[...new Set(rotos.map((r) => r.destino))].map((d) => (
                  <li key={d} className="truncate" title={d}>
                    {d}
                  </li>
                ))}
              </ul>
            </Bloque>
          )}

          <Bloque icono={<History className="size-3.5" />} titulo="Historial">
            <ol className="space-y-1.5 text-xs">
              {nota.versiones.slice(0, 6).map((v) => (
                <li key={v.version} className="flex justify-between gap-2">
                  <span className="text-muted-foreground truncate">
                    v{v.version} · {v.usuario}
                  </span>
                  <span className="num shrink-0 font-mono">{fmtFecha(v.fecha, "d MMM yy")}</span>
                </li>
              ))}
            </ol>
            {nota.versiones.length > 6 && (
              <p className="text-muted-foreground mt-2 text-xs">
                y {nota.versiones.length - 6} más antiguas
              </p>
            )}
            <p className="text-muted-foreground mt-3 truncate font-mono text-xs" title={nota.ruta}>
              {nota.ruta}
            </p>
          </Bloque>
        </aside>
      </div>
    </>
  );
}

function Bloque({
  icono,
  titulo,
  children,
}: {
  icono: React.ReactNode;
  titulo: string;
  children: React.ReactNode;
}) {
  return (
    <section className="surface bg-card rounded-xl border p-4">
      <h2 className="eyebrow mb-3 flex items-center gap-1.5">
        {icono}
        {titulo}
      </h2>
      {children}
    </section>
  );
}
