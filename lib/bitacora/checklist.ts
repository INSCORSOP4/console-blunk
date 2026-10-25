import type { EstadoChecklist, ItemChecklist, ResumenDia } from "@/lib/api/bitacora-schemas";

export const ESTADOS: EstadoChecklist[] = ["Ok", "Advertencia", "Falla", "Critico", "NoAplica"];

export const ETIQUETA_ESTADO: Record<EstadoChecklist, string> = {
  Ok: "Ok",
  Advertencia: "Advertencia",
  Falla: "Falla",
  Critico: "Crítico",
  NoAplica: "No aplica",
};

/** Estos estados exigen una observación explicando qué pasó (la API lo vuelve a exigir). */
export const requiereObservacion = (estado: EstadoChecklist) =>
  estado === "Advertencia" || estado === "Falla" || estado === "Critico";

export type ConteoChecklist = {
  ok: number;
  advertencia: number;
  falla: number;
  critico: number;
  noAplica: number;
  pendiente: number;
  total: number;
};

export function contarChecklist(items: ItemChecklist[]): ConteoChecklist {
  const c: ConteoChecklist = {
    ok: 0,
    advertencia: 0,
    falla: 0,
    critico: 0,
    noAplica: 0,
    pendiente: 0,
    total: items.length,
  };
  for (const item of items) {
    if (item.estado === null) c.pendiente++;
    else if (item.estado === "Ok") c.ok++;
    else if (item.estado === "Advertencia") c.advertencia++;
    else if (item.estado === "Falla") c.falla++;
    else if (item.estado === "Critico") c.critico++;
    else c.noAplica++;
  }
  return c;
}

/** El checklist del día está completo cuando ninguna actividad quedó sin revisar. */
export const estaCompleto = (items: ItemChecklist[]) =>
  items.length > 0 && items.every((i) => i.estado !== null);

/** Quiénes revisaron el día (de los items ya guardados), sin repetir y en el orden en que aparecen. */
export function revisoresDelDia(items: ItemChecklist[]): string[] {
  const vistos = new Set<string>();
  const nombres: string[] = [];
  for (const item of items) {
    const quien = item.actualizadoPor ?? item.revisadoPor;
    if (quien && !vistos.has(quien)) {
      vistos.add(quien);
      nombres.push(quien);
    }
  }
  return nombres;
}

/** El estado "peor" de un conjunto, para resumir un día en un solo color (Crítico > Falla > Advertencia > ...). */
const PRIORIDAD: Record<keyof Omit<ConteoChecklist, "total">, number> = {
  critico: 0,
  falla: 1,
  advertencia: 2,
  pendiente: 3,
  ok: 4,
  noAplica: 5,
};

/** Las actividades del día que quedaron con Advertencia, Falla o Crítico (lo que hay que leer). */
export function incidenciasDelDia(items: ItemChecklist[]): ItemChecklist[] {
  return items.filter(
    (i) => i.estado === "Advertencia" || i.estado === "Falla" || i.estado === "Critico",
  );
}

export function peorEstadoDia(r: ResumenDia): keyof Omit<ConteoChecklist, "total"> | "vacio" {
  if (r.total === 0) return "vacio";
  const entradas = (Object.keys(PRIORIDAD) as (keyof typeof PRIORIDAD)[]).filter((k) => r[k] > 0);
  if (entradas.length === 0) return "vacio";
  return entradas.reduce((peor, actual) => (PRIORIDAD[actual] < PRIORIDAD[peor] ? actual : peor));
}
