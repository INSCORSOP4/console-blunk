"use client";

import { AlertTriangle, ShieldCheck } from "lucide-react";
import { useMemo, useState } from "react";
import type { ArchivoInforme, EstadoArchivo } from "@/lib/api/kb-schemas";
import { fmtNum } from "@/lib/format";
import { cn } from "@/lib/utils";

const ESTADOS: Record<EstadoArchivo, { etiqueta: string; clase: string }> = {
  Nueva: { etiqueta: "Nueva", clase: "bg-ok-soft text-ok" },
  Actualizada: { etiqueta: "Actualizada", clase: "bg-info-soft text-info" },
  SinCambios: { etiqueta: "Sin cambios", clase: "bg-muted text-muted-foreground" },
  Omitida: { etiqueta: "Omitida", clase: "bg-warn-soft text-warn" },
  Error: { etiqueta: "Error", clase: "bg-danger-soft text-danger" },
};

export function contarInforme(archivos: ArchivoInforme[]) {
  const c = (e: EstadoArchivo) => archivos.filter((a) => a.estado === e).length;
  return {
    total: archivos.length,
    nuevas: c("Nueva"),
    actualizadas: c("Actualizada"),
    sinCambios: c("SinCambios"),
    omitidas: c("Omitida"),
    errores: c("Error"),
    conSecretos: archivos.filter((a) => a.secretosEnmascarados > 0).length,
    secretos: archivos.reduce((s, a) => s + a.secretosEnmascarados, 0),
    enlacesRotos: archivos.reduce((s, a) => s + a.enlacesRotos, 0),
  };
}

/** Requiere que una persona lo mire: errores, secretos ocultos, enlaces rotos o advertencias. */
const requiereAtencion = (a: ArchivoInforme) =>
  a.estado === "Error" || a.secretosEnmascarados > 0 || a.advertencias.length > 0;

const lineas = (a: ArchivoInforme) =>
  a.lineasConSecretos.length === 0
    ? ""
    : `línea${a.lineasConSecretos.length === 1 ? "" : "s"} ${a.lineasConSecretos.slice(0, 12).join(", ")}${a.lineasConSecretos.length > 12 ? "…" : ""}`;

export function InformeImportacion({ archivos }: { archivos: ArchivoInforme[] }) {
  const [verTodo, setVerTodo] = useState(false);
  const c = useMemo(() => contarInforme(archivos), [archivos]);
  const atencion = useMemo(() => archivos.filter(requiereAtencion), [archivos]);
  const resto = useMemo(() => archivos.filter((a) => !requiereAtencion(a)), [archivos]);

  const kpis: [string, number, string][] = [
    ["Nuevas", c.nuevas, "text-ok"],
    ["Actualizadas", c.actualizadas, "text-info"],
    ["Sin cambios", c.sinCambios, "text-muted-foreground"],
    ["Omitidas", c.omitidas, "text-warn"],
    ["Con error", c.errores, c.errores > 0 ? "text-danger" : "text-muted-foreground"],
  ];

  return (
    <div className="space-y-5">
      <dl className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        {kpis.map(([nombre, valor, color]) => (
          <div key={nombre} className="surface bg-card rounded-xl border p-3">
            <dt className="eyebrow">{nombre}</dt>
            <dd className={cn("num font-display mt-1 text-3xl font-semibold", color)}>
              {fmtNum(valor)}
            </dd>
          </div>
        ))}
      </dl>

      {c.conSecretos > 0 && (
        <div
          role="note"
          className="bg-info-soft text-info flex items-start gap-3 rounded-lg px-4 py-3 text-sm"
        >
          <ShieldCheck className="mt-0.5 size-5 shrink-0" aria-hidden />
          <p>
            Se ocultaron <strong>{fmtNum(c.secretos)}</strong> valor{c.secretos === 1 ? "" : "es"}{" "}
            sensible{c.secretos === 1 ? "" : "s"} en <strong>{fmtNum(c.conSecretos)}</strong> nota
            {c.conSecretos === 1 ? "" : "s"}. Revisa las líneas indicadas: la detección es
            automática y <strong>no encuentra secretos escritos en prosa</strong> (por ejemplo “la
            clave de root es…”).
          </p>
        </div>
      )}
      {c.enlacesRotos > 0 && (
        <p className="text-muted-foreground text-sm">
          {fmtNum(c.enlacesRotos)} enlace{c.enlacesRotos === 1 ? "" : "s"} entre notas apuntan a
          notas que todavía no están en la base; se activarán solos cuando las subas.
        </p>
      )}

      {atencion.length > 0 && (
        <section aria-labelledby="atencion">
          <h3 id="atencion" className="eyebrow mb-2 flex items-center gap-1.5">
            <AlertTriangle className="size-3.5" aria-hidden /> Requieren tu atención (
            {atencion.length})
          </h3>
          <TablaArchivos archivos={atencion} />
        </section>
      )}

      {resto.length > 0 && (
        <section aria-labelledby="resto">
          <h3 id="resto" className="eyebrow mb-2">
            {atencion.length > 0 ? "El resto" : "Archivos"} ({resto.length})
          </h3>
          {verTodo || resto.length <= 8 ? (
            <TablaArchivos archivos={resto} />
          ) : (
            <>
              <TablaArchivos archivos={resto.slice(0, 8)} />
              <button
                type="button"
                onClick={() => setVerTodo(true)}
                className="text-signal mt-2 text-sm hover:underline"
              >
                Ver los {resto.length - 8} restantes
              </button>
            </>
          )}
        </section>
      )}
    </div>
  );
}

function TablaArchivos({ archivos }: { archivos: ArchivoInforme[] }) {
  return (
    <div className="surface bg-card overflow-x-auto rounded-xl border">
      <table className="w-full text-sm">
        <caption className="sr-only">Resultado por archivo</caption>
        <thead>
          <tr className="text-left">
            <th scope="col" className="eyebrow px-3 py-2.5">
              Estado
            </th>
            <th scope="col" className="eyebrow px-3 py-2.5">
              Archivo
            </th>
            <th scope="col" className="eyebrow px-3 py-2.5">
              Detalle
            </th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {archivos.map((a, i) => {
            const e = ESTADOS[a.estado];
            const detalle = [
              a.motivo,
              a.secretosEnmascarados > 0
                ? `${a.secretosEnmascarados} oculto${a.secretosEnmascarados === 1 ? "" : "s"} (${lineas(a)})`
                : null,
              a.enlacesRotos > 0
                ? `${a.enlacesRotos} enlace${a.enlacesRotos === 1 ? "" : "s"} sin destino`
                : null,
              ...a.advertencias,
            ].filter(Boolean);
            return (
              <tr key={`${a.ruta}-${i}`}>
                <td className="px-3 py-2.5 align-top">
                  <span
                    className={cn(
                      "inline-block rounded-full px-2.5 py-0.5 text-xs font-medium whitespace-nowrap",
                      e.clase,
                    )}
                  >
                    {e.etiqueta}
                  </span>
                </td>
                <td className="max-w-[22rem] px-3 py-2.5 align-top">
                  <span className="block truncate font-mono text-xs" title={a.ruta}>
                    {a.ruta}
                  </span>
                  {a.titulo && (
                    <span className="text-muted-foreground block truncate text-xs">{a.titulo}</span>
                  )}
                </td>
                <td className="text-muted-foreground px-3 py-2.5 align-top text-xs">
                  {detalle.length ? detalle.join(" · ") : "—"}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
