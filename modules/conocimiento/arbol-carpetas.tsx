"use client";

import { ChevronRight, Folder, FolderOpen, Library } from "lucide-react";
import { useState } from "react";
import { ancestros, type ArbolCarpetas, type NodoCarpeta } from "@/lib/kb/arbol";
import { fmtNum } from "@/lib/format";
import { cn } from "@/lib/utils";

type Props = {
  arbol: ArbolCarpetas;
  seleccionada: string;
  onSeleccionar: (ruta: string) => void;
};

/** Árbol de carpetas. Elegir una carpeta incluye sus subcarpetas (así lo hace la API). */
export function ArbolDeCarpetas({ arbol, seleccionada, onSeleccionar }: Props) {
  // Las carpetas del camino de la selección se mantienen abiertas; el resto, según lo que abra la persona.
  const [abiertas, setAbiertas] = useState<Set<string>>(() => new Set(ancestros(seleccionada)));
  const alternar = (ruta: string) =>
    setAbiertas((previas) => {
      const nuevas = new Set(previas);
      if (!nuevas.delete(ruta)) nuevas.add(ruta);
      return nuevas;
    });

  return (
    <nav aria-label="Carpetas">
      <ul className="space-y-0.5">
        <li>
          <Fila activa={seleccionada === ""} onClick={() => onSeleccionar("")} cuenta={arbol.total}>
            <Library className="size-4 shrink-0" aria-hidden />
            <span className="truncate">Todas las notas</span>
          </Fila>
        </li>
        {arbol.nodos.map((nodo) => (
          <Nodo
            key={nodo.ruta}
            nodo={nodo}
            nivel={0}
            seleccionada={seleccionada}
            abiertas={abiertas}
            alternar={alternar}
            onSeleccionar={onSeleccionar}
          />
        ))}
      </ul>
    </nav>
  );
}

type NodoProps = {
  nodo: NodoCarpeta;
  nivel: number;
  seleccionada: string;
  abiertas: Set<string>;
  alternar: (ruta: string) => void;
  onSeleccionar: (ruta: string) => void;
};

function Nodo({ nodo, nivel, seleccionada, abiertas, alternar, onSeleccionar }: NodoProps) {
  const tieneHijos = nodo.hijos.length > 0;
  const abierta = abiertas.has(nodo.ruta) || ancestros(seleccionada).includes(nodo.ruta);
  const Icono = abierta ? FolderOpen : Folder;

  return (
    <li>
      <div className="flex items-center" style={{ paddingLeft: `${nivel * 0.9}rem` }}>
        {tieneHijos ? (
          <button
            type="button"
            onClick={() => alternar(nodo.ruta)}
            aria-expanded={abierta}
            aria-label={`${abierta ? "Contraer" : "Expandir"} ${nodo.nombre}`}
            className="text-muted-foreground hover:text-foreground touch-target grid size-7 shrink-0 place-items-center rounded-md"
          >
            <ChevronRight
              className={cn("size-3.5 transition-transform", abierta && "rotate-90")}
              aria-hidden
            />
          </button>
        ) : (
          <span className="size-7 shrink-0" aria-hidden />
        )}
        <Fila
          activa={seleccionada === nodo.ruta}
          onClick={() => onSeleccionar(nodo.ruta)}
          cuenta={nodo.total}
        >
          <Icono className="size-4 shrink-0" aria-hidden />
          <span className="truncate" title={nodo.ruta}>
            {nodo.nombre}
          </span>
        </Fila>
      </div>
      {tieneHijos && abierta && (
        <ul className="space-y-0.5">
          {nodo.hijos.map((hijo) => (
            <Nodo
              key={hijo.ruta}
              nodo={hijo}
              nivel={nivel + 1}
              seleccionada={seleccionada}
              abiertas={abiertas}
              alternar={alternar}
              onSeleccionar={onSeleccionar}
            />
          ))}
        </ul>
      )}
    </li>
  );
}

function Fila({
  activa,
  onClick,
  cuenta,
  children,
}: {
  activa: boolean;
  onClick: () => void;
  cuenta: number;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-current={activa ? "true" : undefined}
      className={cn(
        "touch-target flex min-h-8 min-w-0 flex-1 items-center gap-2 rounded-md px-2 py-1 text-left text-sm transition-colors",
        activa
          ? "bg-accent text-foreground font-medium"
          : "text-muted-foreground hover:bg-accent/60 hover:text-foreground",
      )}
    >
      {children}
      <span className="num ml-auto shrink-0 font-mono text-xs">{fmtNum(cuenta)}</span>
    </button>
  );
}
