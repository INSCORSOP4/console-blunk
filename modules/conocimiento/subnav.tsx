"use client";

import { BookOpen, History, UploadCloud } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const ITEMS = [
  { href: "/conocimiento", label: "Explorar", icon: BookOpen, exacta: false },
  { href: "/conocimiento/subir", label: "Subir notas", icon: UploadCloud, exacta: true },
  { href: "/conocimiento/importaciones", label: "Bitácora", icon: History, exacta: true },
] as const;

/** Navegación interna de la sección Conocimiento. "Explorar" también cubre el lector de cada nota. */
export function KbSubnav() {
  const pathname = usePathname();
  const activa = (href: string, exacta: boolean) =>
    exacta
      ? pathname === href
      : pathname === href ||
        (pathname.startsWith(`${href}/`) &&
          !pathname.startsWith("/conocimiento/subir") &&
          !pathname.startsWith("/conocimiento/importaciones"));

  return (
    <nav aria-label="Conocimiento" className="mb-6 flex gap-1 overflow-x-auto border-b">
      {ITEMS.map(({ href, label, icon: Icon, exacta }) => (
        <Link
          key={href}
          href={href}
          aria-current={activa(href, exacta) ? "page" : undefined}
          className={cn(
            "-mb-px flex min-h-11 items-center gap-2 border-b-2 border-transparent px-3 text-sm font-medium whitespace-nowrap transition-colors",
            activa(href, exacta)
              ? "border-signal text-foreground"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          <Icon className="size-4" aria-hidden />
          {label}
        </Link>
      ))}
    </nav>
  );
}
