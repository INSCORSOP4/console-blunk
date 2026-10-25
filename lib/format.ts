import { addDays, addMonths, format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { formatInTimeZone } from "date-fns-tz";

export const ZONA = "America/Mexico_City";

const nf = new Intl.NumberFormat("es-MX");

export const fmtNum = (n: number) => nf.format(n);

export function fmtPct(n: number, digits = 1) {
  return `${n.toFixed(digits)}%`;
}

/** Horas decimales a texto corto: 45 min, 8.2 h, 3.4 d. */
export function fmtHoras(horas: number | null | undefined) {
  if (horas === null || horas === undefined) return "—";
  if (horas < 1) return `${Math.max(1, Math.round(horas * 60))} min`;
  if (horas < 48) return `${horas.toFixed(1)} h`;
  return `${(horas / 24).toFixed(1)} d`;
}

/** Horas transcurridas entre una fecha ISO y ahora (negativo si la fecha es futura). */
export function horasDesde(iso: string, ahora: Date = new Date()): number {
  return (ahora.getTime() - parseISO(iso).getTime()) / 3_600_000;
}

export function fmtFecha(iso: string | null | undefined, patron = "d MMM yyyy, HH:mm") {
  if (!iso) return "—";
  return formatInTimeZone(parseISO(iso), ZONA, patron, { locale: es });
}

/** Etiqueta del eje de tendencia a partir de 'yyyy-MM-dd'. */
export function fmtPeriodo(periodo: string, agrupacion: "Dia" | "Semana" | "Mes") {
  const d = parseISO(periodo);
  if (agrupacion === "Mes") return format(d, "MMM yy", { locale: es });
  return format(d, "d MMM", { locale: es });
}

/** Fecha 'yyyy-MM-dd' de hoy en hora de México. */
export function hoyMx() {
  return formatInTimeZone(new Date(), ZONA, "yyyy-MM-dd");
}

export function restarDias(fecha: string, dias: number) {
  return format(addDays(parseISO(fecha), -dias), "yyyy-MM-dd");
}

export function restarMeses(fecha: string, meses: number) {
  return format(addMonths(parseISO(fecha), -meses), "yyyy-MM-dd");
}
