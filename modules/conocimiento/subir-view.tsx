"use client";

import { useQueryClient } from "@tanstack/react-query";
import {
  AlertCircle,
  FileText,
  FolderUp,
  Loader2,
  ShieldCheck,
  Trash2,
  UploadCloud,
} from "lucide-react";
import Link from "next/link";
import { useMemo, useRef, useState } from "react";
import { PageHeader } from "@/components/shared/page-header";
import { Button, buttonVariants } from "@/components/ui/button";
import type { InformeImportacion } from "@/lib/api/kb-schemas";
import {
  construirFormData,
  entradasDeDrop,
  esNota,
  esZip,
  filtrarEntradas,
  formatearBytes,
  MAX_ARCHIVOS,
  MAX_BYTES_ARCHIVO,
  MAX_BYTES_PETICION,
  quitarRaiz,
  raizComun,
  rutaDe,
  tamanoTotal,
  type EntradaSubida,
} from "@/lib/kb/upload";
import { ErrorDeSubida, subirNotas, type SubidaEnCurso } from "@/lib/kb/subir";
import { cn } from "@/lib/utils";
import { InformeImportacion as VistaInforme } from "./informe-importacion";
import { KbSubnav } from "./subnav";

export function SubirView() {
  const queryClient = useQueryClient();
  const entradaArchivos = useRef<HTMLInputElement>(null);
  const entradaCarpeta = useRef<HTMLInputElement>(null);
  const subida = useRef<SubidaEnCurso | null>(null);

  const [entradas, setEntradas] = useState<EntradaSubida[]>([]);
  const [ignoradas, setIgnoradas] = useState(0);
  const [conservarRaiz, setConservarRaiz] = useState(false);
  const [arrastrando, setArrastrando] = useState(false);
  const [progreso, setProgreso] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [informe, setInforme] = useState<InformeImportacion | null>(null);

  const subiendo = progreso !== null;
  const raiz = useMemo(() => raizComun(entradas), [entradas]);
  const finales = useMemo(
    () => (raiz && !conservarRaiz ? quitarRaiz(entradas, raiz) : entradas),
    [entradas, raiz, conservarRaiz],
  );

  const notas = finales.filter((e) => esNota(e.ruta)).length;
  const zips = finales.filter((e) => esZip(e.ruta)).length;
  const bytes = tamanoTotal(finales);
  const grandes = finales.filter((e) => e.file.size > MAX_BYTES_ARCHIVO && !esZip(e.ruta)).length;
  const demasiado = bytes > MAX_BYTES_PETICION;
  const puedeSubir = finales.length > 0 && !demasiado && !subiendo;

  function agregar(nuevas: EntradaSubida[]) {
    const { aceptadas, ignoradas: descartadas } = filtrarEntradas(nuevas);
    setIgnoradas((n) => n + descartadas);
    setError(null);
    setInforme(null);
    setEntradas((previas) => {
      const porRuta = new Map(previas.map((e) => [e.ruta, e]));
      for (const e of aceptadas) porRuta.set(e.ruta, e); // si se repite una ruta gana la más reciente
      return [...porRuta.values()];
    });
  }

  function alElegir(input: HTMLInputElement | null) {
    if (!input?.files) return;
    agregar([...input.files].map((file) => ({ file, ruta: rutaDe(file) })));
    input.value = ""; // permite volver a elegir lo mismo
  }

  async function alSoltar(e: React.DragEvent) {
    e.preventDefault();
    setArrastrando(false);
    if (subiendo) return;
    try {
      agregar(await entradasDeDrop(e.dataTransfer));
    } catch {
      setError(
        "No se pudieron leer los archivos soltados. Prueba con los botones de elegir archivos o carpeta.",
      );
    }
  }

  function limpiar() {
    setEntradas([]);
    setIgnoradas(0);
    setConservarRaiz(false);
    setError(null);
  }

  async function enviar() {
    if (!puedeSubir) return;
    setError(null);
    setInforme(null);
    setProgreso(0);
    try {
      subida.current = subirNotas(construirFormData(finales), setProgreso);
      const resultado = await subida.current.resultado;
      setInforme(resultado);
      limpiar();
      // Lo que ya estaba cargado en pantalla (listados, carpetas, etiquetas) deja de ser válido.
      await queryClient.invalidateQueries({ queryKey: ["kb"] });
    } catch (e) {
      if (e instanceof ErrorDeSubida && e.status === 401) {
        // eslint-disable-next-line @next/next/no-location-assign-relative-destination
        window.location.assign(`/login?next=${encodeURIComponent("/conocimiento/subir")}`);
        return;
      }
      setError(e instanceof Error ? e.message : "No se pudo completar la subida.");
    } finally {
      subida.current = null;
      setProgreso(null);
    }
  }

  return (
    <>
      <PageHeader
        eyebrow="Base de conocimiento"
        title="Subir notas"
        description="Sube tus archivos .md de Obsidian (varios, una carpeta o un .zip). Antes de guardarlos se ocultan contraseñas y tokens."
      />
      <KbSubnav />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_19rem]">
        <section aria-label="Selección de archivos" className="min-w-0 space-y-4">
          {/* --------------------------------------------------------- zona de arrastre */}
          <div
            onDragOver={(e) => {
              e.preventDefault();
              if (!subiendo) setArrastrando(true);
            }}
            onDragLeave={() => setArrastrando(false)}
            onDrop={alSoltar}
            className={cn(
              "surface bg-card rounded-xl border-2 border-dashed p-8 text-center transition-colors",
              arrastrando ? "border-signal bg-signal-soft" : "border-border",
            )}
          >
            <UploadCloud
              className={cn(
                "mx-auto size-10",
                arrastrando ? "text-signal" : "text-muted-foreground",
              )}
              aria-hidden
            />
            <p className="font-display mt-3 text-lg font-semibold">
              Arrastra aquí tus notas o tu carpeta
            </p>
            <p className="text-muted-foreground mt-1 text-sm">
              Solo se suben archivos <span className="font-mono">.md</span> y{" "}
              <span className="font-mono">.zip</span>. La carpeta{" "}
              <span className="font-mono">.obsidian</span> se omite sola.
            </p>
            <div className="mt-5 flex flex-wrap justify-center gap-2">
              <Button
                variant="outline"
                onClick={() => entradaArchivos.current?.click()}
                disabled={subiendo}
              >
                <FileText /> Elegir archivos
              </Button>
              <Button
                variant="outline"
                onClick={() => entradaCarpeta.current?.click()}
                disabled={subiendo}
              >
                <FolderUp /> Elegir carpeta
              </Button>
            </div>
            <input
              ref={entradaArchivos}
              type="file"
              multiple
              accept=".md,.zip,text/markdown,application/zip"
              className="sr-only"
              tabIndex={-1}
              aria-hidden
              onChange={(e) => alElegir(e.currentTarget)}
            />
            <input
              ref={(el) => {
                entradaCarpeta.current = el;
                // Atributo no estándar (aún sin tipos en React): permite elegir una carpeta completa.
                el?.setAttribute("webkitdirectory", "");
                el?.setAttribute("directory", "");
              }}
              type="file"
              multiple
              className="sr-only"
              tabIndex={-1}
              aria-hidden
              onChange={(e) => alElegir(e.currentTarget)}
            />
          </div>

          {/* --------------------------------------------------------- selección */}
          {entradas.length > 0 && (
            <div className="surface bg-card rounded-xl border p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="num font-mono text-sm">
                  <strong>{notas}</strong> nota{notas === 1 ? "" : "s"}
                  {zips > 0 && (
                    <>
                      {" "}
                      · <strong>{zips}</strong> zip
                    </>
                  )}{" "}
                  · {formatearBytes(bytes)}
                </p>
                <Button variant="ghost" size="sm" onClick={limpiar} disabled={subiendo}>
                  <Trash2 /> Quitar todo
                </Button>
              </div>

              <ul className="text-muted-foreground mt-3 space-y-0.5 font-mono text-xs">
                {finales.slice(0, 8).map((e) => (
                  <li key={e.ruta} className="truncate" title={e.ruta}>
                    {e.ruta}
                  </li>
                ))}
                {finales.length > 8 && <li>… y {finales.length - 8} más</li>}
              </ul>

              {raiz && zips === 0 && (
                <label className="mt-4 flex items-start gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={conservarRaiz}
                    onChange={(e) => setConservarRaiz(e.target.checked)}
                    disabled={subiendo}
                    className="mt-1 size-4"
                  />
                  <span>
                    Conservar <span className="font-mono">{raiz}</span> como carpeta raíz de las
                    notas
                    <span className="text-muted-foreground block text-xs">
                      Apagado: las notas quedan directamente en sus carpetas (recomendado si
                      elegiste la carpeta de tu vault).
                    </span>
                  </span>
                </label>
              )}

              {(ignoradas > 0 || grandes > 0 || notas > MAX_ARCHIVOS || demasiado) && (
                <ul className="mt-4 space-y-1.5 text-sm">
                  {ignoradas > 0 && (
                    <Aviso>
                      {ignoradas} archivo{ignoradas === 1 ? "" : "s"} se ignoraron (no son .md ni
                      .zip, o están en .obsidian/.git).
                    </Aviso>
                  )}
                  {grandes > 0 && (
                    <Aviso>
                      {grandes} archivo{grandes === 1 ? "" : "s"} superan 1 MB y el servidor los
                      rechazará.
                    </Aviso>
                  )}
                  {notas > MAX_ARCHIVOS && (
                    <Aviso>
                      Solo se procesan {MAX_ARCHIVOS} notas por subida; sube el resto en otra.
                    </Aviso>
                  )}
                  {demasiado && (
                    <Aviso grave>
                      La selección pesa {formatearBytes(bytes)} y el máximo es{" "}
                      {formatearBytes(MAX_BYTES_PETICION)}. Quita archivos o sube por partes.
                    </Aviso>
                  )}
                </ul>
              )}
            </div>
          )}

          {error && (
            <p
              role="alert"
              className="bg-danger-soft text-danger border-danger/30 flex items-start gap-2 rounded-md border px-3 py-2.5 text-sm"
            >
              <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden />
              {error}
            </p>
          )}

          {/* --------------------------------------------------------- enviar */}
          <div className="flex flex-wrap items-center gap-3">
            <Button size="lg" onClick={enviar} disabled={!puedeSubir}>
              {subiendo ? (
                <>
                  <Loader2 className="animate-spin" aria-hidden /> Subiendo… {progreso}%
                </>
              ) : (
                <>
                  <UploadCloud /> Subir{" "}
                  {finales.length > 0
                    ? `${finales.length} archivo${finales.length === 1 ? "" : "s"}`
                    : "notas"}
                </>
              )}
            </Button>
            {subiendo && (
              <Button variant="ghost" onClick={() => subida.current?.cancelar()}>
                Cancelar
              </Button>
            )}
          </div>
          {subiendo && (
            <div
              role="progressbar"
              aria-label="Progreso de la subida"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={progreso ?? 0}
              className="bg-muted h-2 overflow-hidden rounded-full"
            >
              <div
                className="bg-signal h-full rounded-full transition-[width]"
                style={{ width: `${progreso}%` }}
              />
            </div>
          )}

          {/* --------------------------------------------------------- resultado */}
          {informe && (
            <section aria-labelledby="resultado" className="space-y-4 pt-4">
              <div className="flex flex-wrap items-end justify-between gap-3">
                <h2 id="resultado" className="font-display text-2xl font-semibold">
                  Resultado de la subida
                </h2>
                <Link href="/conocimiento" className={cn(buttonVariants({ variant: "outline" }))}>
                  Ver las notas
                </Link>
              </div>
              <VistaInforme archivos={informe.archivos} />
            </section>
          )}
        </section>

        {/* ------------------------------------------------------------- qué pasa al subir */}
        <aside
          className="surface bg-card h-fit rounded-xl border p-5 text-sm lg:sticky lg:top-6"
          aria-label="Qué pasa al subir"
        >
          <h2 className="eyebrow mb-3 flex items-center gap-1.5">
            <ShieldCheck className="size-3.5" aria-hidden /> Qué pasa al subir
          </h2>
          <ul className="text-muted-foreground list-disc space-y-2 pl-4">
            <li>
              Se <strong className="text-foreground">ocultan</strong> contraseñas, tokens y llaves
              antes de guardar; nunca se guardan en claro.
            </li>
            <li>
              Los comentarios de Obsidian (<span className="font-mono">%% … %%</span>) se descartan.
            </li>
            <li>
              Si un archivo no cambió, queda <em>sin cambios</em>; si cambió, se actualiza y se
              guarda la versión anterior.
            </li>
            <li>
              Los enlaces <span className="font-mono">[[así]]</span> se conectan con las demás
              notas.
            </li>
            <li>
              Queda registrado <strong className="text-foreground">quién</strong> subió cada lote,
              en la bitácora.
            </li>
            <li>Límites: 1 MB por archivo, 500 notas y 60 MB por subida.</li>
          </ul>
        </aside>
      </div>
    </>
  );
}

function Aviso({ children, grave }: { children: React.ReactNode; grave?: boolean }) {
  return (
    <li className={cn("flex items-start gap-2", grave ? "text-danger" : "text-warn")}>
      <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden />
      <span>{children}</span>
    </li>
  );
}
