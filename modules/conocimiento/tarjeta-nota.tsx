import { ShieldCheck } from "lucide-react";
import Link from "next/link";
import type { DocumentoResumen } from "@/lib/api/kb-schemas";
import { fmtFecha } from "@/lib/format";
import { resaltar } from "@/lib/kb/markdown";

/** Texto con las palabras buscadas marcadas (sin distinguir acentos ni mayúsculas). */
export function TextoResaltado({ texto, buscar }: { texto: string; buscar: string }) {
  return (
    <>
      {resaltar(texto, buscar).map((t, i) =>
        t.resaltado ? (
          <mark key={i} className="coincidencia">
            {t.texto}
          </mark>
        ) : (
          <span key={i}>{t.texto}</span>
        ),
      )}
    </>
  );
}

export function TarjetaNota({
  nota,
  buscar,
  onEtiqueta,
}: {
  nota: DocumentoResumen;
  buscar: string;
  onEtiqueta: (etiqueta: string) => void;
}) {
  // Con búsqueda se muestra el fragmento donde apareció; sin ella, el resumen de la nota.
  const extracto = buscar && nota.fragmento ? `…${nota.fragmento.trim()}…` : nota.resumen;

  return (
    <li className="surface bg-card relative rounded-xl border p-4 transition-colors hover:border-[color-mix(in_srgb,var(--signal)_45%,var(--border))]">
      <p className="text-muted-foreground mb-1 truncate font-mono text-xs" title={nota.ruta}>
        {nota.carpeta || "Raíz"}
      </p>

      <h2 className="font-display text-lg leading-snug font-semibold">
        {/* El enlace cubre toda la tarjeta (área táctil grande) sin envolver los botones de etiquetas. */}
        <Link
          href={`/conocimiento/${nota.id}`}
          className="after:absolute after:inset-0 after:rounded-xl focus-visible:outline-none"
        >
          <TextoResaltado texto={nota.titulo} buscar={buscar} />
        </Link>
      </h2>

      {extracto && (
        <p className="text-muted-foreground mt-1.5 line-clamp-3 text-sm leading-relaxed">
          <TextoResaltado texto={extracto} buscar={buscar} />
        </p>
      )}

      <div className="relative z-10 mt-3 flex flex-wrap items-center gap-x-3 gap-y-2">
        {nota.etiquetas.slice(0, 5).map((e) => (
          <button
            key={e}
            type="button"
            onClick={() => onEtiqueta(e)}
            className="bg-signal-soft text-signal rounded-full px-2.5 py-0.5 font-mono text-xs hover:underline"
          >
            #{e}
          </button>
        ))}
        {nota.etiquetas.length > 5 && (
          <span className="text-muted-foreground text-xs">+{nota.etiquetas.length - 5}</span>
        )}

        <span className="text-muted-foreground ml-auto flex flex-wrap items-center gap-x-3 text-xs">
          {nota.estado && <span className="bg-muted rounded px-1.5 py-0.5">{nota.estado}</span>}
          {nota.secretosEnmascarados > 0 && (
            <span
              className="text-info flex items-center gap-1"
              title={`${nota.secretosEnmascarados} valor(es) sensible(s) se ocultaron al importar esta nota`}
            >
              <ShieldCheck className="size-3.5" aria-hidden />
              {nota.secretosEnmascarados} oculto{nota.secretosEnmascarados === 1 ? "" : "s"}
            </span>
          )}
          <span className="num font-mono">
            {fmtFecha(nota.actualizadoEn, "d MMM yyyy")} · {nota.actualizadoPor}
          </span>
        </span>
      </div>
    </li>
  );
}
