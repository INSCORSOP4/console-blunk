import { ArrowRight, DatabaseZap, FolderCheck, UserCog } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/shared/page-header";

export const metadata: Metadata = { title: "Utilerías" };

// Cada utilería nueva se agrega aquí con su ruta.
const UTILERIAS = [
  {
    href: "/utilerias/jobs",
    titulo: "Jobs de SQL Server",
    descripcion:
      "Último resultado de los jobs del Agent y de cada paso: qué falló, cuándo corrió y cuándo toca la siguiente.",
    icono: DatabaseZap,
  },
  {
    href: "/utilerias/microsip",
    titulo: "Usuarios MICROSIP",
    descripcion:
      "Asigna a cada usuario de MICROSIP su clave de FORTIA (nombre, empresa y puesto). Cada cambio queda registrado.",
    icono: UserCog,
  },
  {
    href: "/utilerias/archivos",
    titulo: "Archivos de confianza",
    descripcion:
      "Archivos que otros sistemas dejan en carpetas de red (SIA, repbi, olap) para que SQL Server los consuma. Revisa si llegaron actualizados hoy.",
    icono: FolderCheck,
  },
] as const;

export default function UtileriasPage() {
  return (
    <>
      <PageHeader
        eyebrow="Soporte"
        title="Utilerías"
        description="Herramientas de apoyo para el día a día del área."
      />
      <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {UTILERIAS.map(({ href, titulo, descripcion, icono: Icono }) => (
          <li
            key={href}
            className="surface bg-card relative rounded-xl border p-5 transition-colors hover:border-[color-mix(in_srgb,var(--signal)_45%,var(--border))]"
          >
            <Icono className="text-signal size-7" aria-hidden />
            <h2 className="font-display mt-3 text-lg font-semibold">
              <Link
                href={href}
                className="after:absolute after:inset-0 after:rounded-xl focus-visible:outline-none"
              >
                {titulo}
              </Link>
            </h2>
            <p className="text-muted-foreground mt-1.5 text-sm">{descripcion}</p>
            <span className="text-signal mt-4 inline-flex items-center gap-1 text-sm">
              Abrir <ArrowRight className="size-4" aria-hidden />
            </span>
          </li>
        ))}
      </ul>
    </>
  );
}
