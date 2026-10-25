import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import type { EstadoJob, JobResumen } from "@/lib/api/utilerias-schemas";

export type FiltroEstado = "todos" | "atencion" | "ejecutando" | "ok" | "deshabilitados";

export const ETIQUETA_ESTADO: Record<EstadoJob, string> = {
  Exitoso: "Exitoso",
  Fallido: "Fallido",
  Reintento: "Reintento",
  Cancelado: "Cancelado",
  EnEjecucion: "En ejecución",
  SinHistorial: "Sin historial",
};

/** El job (o alguno de sus pasos) necesita que alguien lo mire. */
export const requiereAtencion = (j: JobResumen) =>
  j.habilitado &&
  (j.estado === "Fallido" ||
    j.estado === "Cancelado" ||
    j.estado === "Reintento" ||
    j.pasos.some((p) => p.estado === "Fallido"));

export type ConteoJobs = {
  total: number;
  atencion: number;
  ejecutando: number;
  ok: number;
  deshabilitados: number;
};

export function contarJobs(jobs: JobResumen[]): ConteoJobs {
  const habilitados = jobs.filter((j) => j.habilitado);
  return {
    total: jobs.length,
    atencion: habilitados.filter(requiereAtencion).length,
    ejecutando: habilitados.filter((j) => j.estado === "EnEjecucion").length,
    ok: habilitados.filter((j) => !requiereAtencion(j) && j.estado !== "EnEjecucion").length,
    deshabilitados: jobs.length - habilitados.length,
  };
}

const sinAcentos = (s: string) => s.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase();

export function filtrarJobs(
  jobs: JobResumen[],
  estado: FiltroEstado,
  buscar: string,
): JobResumen[] {
  const texto = sinAcentos(buscar.trim());
  return jobs.filter((j) => {
    if (texto && !sinAcentos(j.nombre).includes(texto)) return false;
    switch (estado) {
      case "atencion":
        return requiereAtencion(j);
      case "ejecutando":
        return j.habilitado && j.estado === "EnEjecucion";
      case "ok":
        return j.habilitado && !requiereAtencion(j) && j.estado !== "EnEjecucion";
      case "deshabilitados":
        return !j.habilitado;
      default:
        return true;
    }
  });
}

/** 45 → "45 s", 125 → "2 min 5 s", 5445 → "1 h 30 min". */
export function fmtDuracion(segundos: number | null | undefined): string {
  if (segundos === null || segundos === undefined) return "—";
  if (segundos < 60) return `${segundos} s`;
  const h = Math.floor(segundos / 3600);
  const m = Math.floor((segundos % 3600) / 60);
  const s = segundos % 60;
  if (h > 0) return m > 0 ? `${h} h ${m} min` : `${h} h`;
  return s > 0 ? `${m} min ${s} s` : `${m} min`;
}

/**
 * Las fechas de msdb son la hora local del servidor, sin zona. Se muestran tal cual, sin convertirlas a ninguna otra
 * (convertirlas con la zona del navegador las movería de hora).
 */
export function fmtFechaServidor(iso: string | null | undefined, patron = "d MMM, HH:mm"): string {
  if (!iso) return "—";
  return format(parseISO(iso), patron, { locale: es });
}
