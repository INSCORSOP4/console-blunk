import { Archive, ArrowRight, ClipboardList, DatabaseBackup, Video } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/shared/page-header";
import { BITACORAS } from "@/lib/bitacora/grupos";

export const metadata: Metadata = { title: "Bitácora" };

const ICONOS: Record<string, typeof ClipboardList> = {
  "actividades-soft": ClipboardList,
  respaldos: DatabaseBackup,
  camaras: Video,
  "depuracion-respaldos": Archive,
};

export default function BitacoraPage() {
  return (
    <>
      <PageHeader
        eyebrow="Soporte"
        title="Bitácora"
        description="Lo que antes se llevaba en Excel: checklists diarios con historial, por tipo."
      />
      <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {BITACORAS.map((b) => {
          const Icono = ICONOS[b.grupo] ?? ClipboardList;
          return (
            <li
              key={b.grupo}
              className="surface bg-card relative rounded-xl border p-5 transition-colors hover:border-[color-mix(in_srgb,var(--signal)_45%,var(--border))]"
            >
              <Icono className="text-signal size-7" aria-hidden />
              <h2 className="font-display mt-3 text-lg font-semibold">
                <Link
                  href={b.rutaBase}
                  className="after:absolute after:inset-0 after:rounded-xl focus-visible:outline-none"
                >
                  {b.titulo}
                </Link>
              </h2>
              <p className="text-muted-foreground mt-1.5 text-sm">{b.descripcion}</p>
              <span className="text-signal mt-4 inline-flex items-center gap-1 text-sm">
                Abrir <ArrowRight className="size-4" aria-hidden />
              </span>
            </li>
          );
        })}
      </ul>
    </>
  );
}
