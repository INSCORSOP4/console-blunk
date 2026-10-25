import type { Productividad } from "@/lib/api/schemas";

export type ColumnaComparativa =
  | "tecnico"
  | "asignados"
  | "cerrados"
  | "vencidos"
  | "cumplimientoSlaPct"
  | "promedioHorasPrimeraRespuesta"
  | "promedioHorasResolucion";

export type DireccionOrden = "asc" | "desc";

/** Umbral bajo el cual el cumplimiento de SLA se resalta como algo que revisar. */
export const UMBRAL_SLA_ATENCION = 90;

export const requiereAtencion = (p: Productividad) => p.cumplimientoSlaPct < UMBRAL_SLA_ATENCION;

/**
 * Ordena la tabla comparativa. Los valores nulos (promedios sin datos suficientes) siempre quedan al final,
 * sin importar la dirección, para no mezclarlos con ceros reales.
 */
export function ordenarProductividad(
  lista: Productividad[],
  columna: ColumnaComparativa,
  direccion: DireccionOrden,
): Productividad[] {
  const signo = direccion === "asc" ? 1 : -1;
  return [...lista].sort((a, b) => {
    const va = a[columna];
    const vb = b[columna];
    if (va === null) return vb === null ? 0 : 1;
    if (vb === null) return -1;
    if (typeof va === "string" || typeof vb === "string") {
      return signo * String(va).localeCompare(String(vb), "es", { sensitivity: "base" });
    }
    return signo * (va - vb);
  });
}
